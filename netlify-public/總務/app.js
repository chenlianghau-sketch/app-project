const STORAGE_KEY = "cram-school-general-affairs-v1";

const demoItems = [
  {
    id: crypto.randomUUID(),
    name: "白板筆",
    location: "A 教室",
    quantity: 8,
    threshold: 10,
    note: "黑色與藍色消耗最快",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "影印紙 A4",
    location: "辦公室櫃台",
    quantity: 12,
    threshold: 5,
    note: "每包 500 張",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "酒精噴瓶",
    location: "B 教室",
    quantity: 2,
    threshold: 3,
    note: "低於門檻請補充",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "訂書針",
    location: "行政抽屜",
    quantity: 6,
    threshold: 2,
    note: "與訂書機放同格",
    updatedAt: new Date().toISOString(),
  },
];

const state = {
  items: loadItems(),
  filter: "all",
  search: "",
};

const elements = {
  totalItems: document.querySelector("#totalItems"),
  lowItems: document.querySelector("#lowItems"),
  totalQuantity: document.querySelector("#totalQuantity"),
  lastUpdated: document.querySelector("#lastUpdated"),
  inventoryBody: document.querySelector("#inventoryBody"),
  alertStrip: document.querySelector("#alertStrip"),
  searchInput: document.querySelector("#searchInput"),
  segments: document.querySelectorAll(".segment"),
  dialog: document.querySelector("#itemDialog"),
  form: document.querySelector("#itemForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  itemId: document.querySelector("#itemId"),
  itemName: document.querySelector("#itemName"),
  itemLocation: document.querySelector("#itemLocation"),
  itemQuantity: document.querySelector("#itemQuantity"),
  itemThreshold: document.querySelector("#itemThreshold"),
  itemNote: document.querySelector("#itemNote"),
  openAddDialog: document.querySelector("#openAddDialog"),
  closeDialog: document.querySelector("#closeDialog"),
  cancelDialog: document.querySelector("#cancelDialog"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
};

render();

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  render();
});

elements.segments.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    elements.segments.forEach((segment) => segment.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});

elements.openAddDialog.addEventListener("click", () => openDialog());
elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.cancelDialog.addEventListener("click", () => elements.dialog.close());

elements.resetDemoButton.addEventListener("click", () => {
  const shouldReset = confirm("確定要重置為示範資料嗎？目前備品資料會被覆蓋。");
  if (!shouldReset) return;
  state.items = cloneDemoItems();
  saveItems();
  render();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const item = {
    id: elements.itemId.value || crypto.randomUUID(),
    name: elements.itemName.value.trim(),
    location: elements.itemLocation.value.trim(),
    quantity: Number(elements.itemQuantity.value),
    threshold: Number(elements.itemThreshold.value),
    note: elements.itemNote.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = state.items.findIndex((entry) => entry.id === item.id);
  if (existingIndex >= 0) {
    state.items[existingIndex] = item;
  } else {
    state.items.unshift(item);
  }

  saveItems();
  elements.dialog.close();
  render();
});

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDemoItems();

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : cloneDemoItems();
  } catch {
    return cloneDemoItems();
  }
}

function cloneDemoItems() {
  return demoItems.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  }));
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function render() {
  const lowItems = state.items.filter(isLowStock);
  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const latest = state.items
    .map((item) => item.updatedAt)
    .sort()
    .at(-1);

  elements.totalItems.textContent = state.items.length;
  elements.lowItems.textContent = lowItems.length;
  elements.totalQuantity.textContent = totalQuantity;
  elements.lastUpdated.textContent = latest ? formatTime(latest) : "--";

  renderAlert(lowItems);
  renderTable(getVisibleItems());
}

function renderAlert(lowItems) {
  if (lowItems.length === 0) {
    elements.alertStrip.className = "alert-strip";
    elements.alertStrip.textContent = "";
    return;
  }

  elements.alertStrip.className = "alert-strip active";
  elements.alertStrip.textContent = `補貨提醒：${lowItems.map((item) => item.name).join("、")} 已低於設定門檻。`;
}

function renderTable(items) {
  elements.inventoryBody.innerHTML = "";

  if (items.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7" class="muted">目前沒有符合條件的備品。</td>`;
    elements.inventoryBody.append(row);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");
    const statusClass = isLowStock(item) ? "low" : "ok";
    const statusText = isLowStock(item) ? "需補貨" : "庫存足夠";

    row.innerHTML = `
      <td>
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="muted">更新：${formatTime(item.updatedAt)}</div>
      </td>
      <td>${escapeHtml(item.location)}</td>
      <td>
        <div class="quantity-control" aria-label="${escapeHtml(item.name)} 數量調整">
          <button type="button" data-action="decrease" data-id="${item.id}" aria-label="減少 ${escapeHtml(item.name)} 數量">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${item.id}" aria-label="增加 ${escapeHtml(item.name)} 數量">＋</button>
        </div>
      </td>
      <td>${item.threshold}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td>${escapeHtml(item.note || "無")}</td>
      <td>
        <div class="row-actions">
          <button class="small-button" type="button" data-action="edit" data-id="${item.id}">編輯</button>
          <button class="small-button danger" type="button" data-action="delete" data-id="${item.id}">刪除</button>
        </div>
      </td>
    `;

    elements.inventoryBody.append(row);
  });

  elements.inventoryBody.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleRowAction(button.dataset.action, button.dataset.id));
  });
}

function getVisibleItems() {
  return state.items.filter((item) => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "low" && isLowStock(item)) ||
      (state.filter === "ok" && !isLowStock(item));

    const searchTarget = `${item.name} ${item.location} ${item.note}`.toLowerCase();
    const matchesSearch = !state.search || searchTarget.includes(state.search);

    return matchesFilter && matchesSearch;
  });
}

function handleRowAction(action, id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "increase" || action === "decrease") {
    const delta = action === "increase" ? 1 : -1;
    item.quantity = Math.max(0, item.quantity + delta);
    item.updatedAt = new Date().toISOString();
    saveItems();
    render();
    return;
  }

  if (action === "edit") {
    openDialog(item);
    return;
  }

  if (action === "delete") {
    const shouldDelete = confirm(`確定要刪除「${item.name}」嗎？`);
    if (!shouldDelete) return;
    state.items = state.items.filter((entry) => entry.id !== id);
    saveItems();
    render();
  }
}

function openDialog(item = null) {
  elements.form.reset();
  elements.dialogTitle.textContent = item ? "編輯備品" : "新增備品";
  elements.itemId.value = item?.id || "";
  elements.itemName.value = item?.name || "";
  elements.itemLocation.value = item?.location || "";
  elements.itemQuantity.value = item?.quantity ?? 0;
  elements.itemThreshold.value = item?.threshold ?? 1;
  elements.itemNote.value = item?.note || "";
  elements.dialog.showModal();
  elements.itemName.focus();
}

function isLowStock(item) {
  return item.quantity < item.threshold;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
