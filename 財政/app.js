const DIRECTOR_STORAGE_KEY = "cram-school-director-v1";
const FINANCE_STORAGE_KEY = "cram-school-finance-v1";

const defaultFinanceState = {
  adjustments: {},
  ledger: [
    { id: "le-1", date: currentDate(), type: "income", title: "六月學費", amount: 96000, note: "示範收入" },
    { id: "le-2", date: currentDate(), type: "expense", title: "教材採購", amount: 8500, note: "示範支出" },
    { id: "le-3", date: currentDate(), type: "expense", title: "教師薪資預估", amount: 42660, note: "可依實發薪資調整" },
  ],
  calculatorHistory: [],
};

const fallbackDirectorState = {
  shifts: [
    { id: "sh-1", teacher: "william", date: currentDate(), start: "18:00", end: "21:00", payType: "hourly", payRate: 220 },
    { id: "sh-2", teacher: "carey", date: currentDate(), start: "14:00", end: "18:00", payType: "monthly", payRate: 42000 },
  ],
};

const pageInfo = {
  payroll: ["薪資結算", "接收主任排班估算，調整勞健保、全勤與其他扣補後產出實領薪資。"],
  ledger: ["收支記帳", "記錄收入與支出，快速查看本月利潤。"],
  calculator: ["小計算機", "支援 + - * / % 的財務試算工具。"],
};

const state = loadFinanceState();
let directorState = loadDirectorState();
let ledgerFilter = "all";
let calculatorExpression = "";

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  pages: {
    payroll: document.querySelector("#payrollPage"),
    ledger: document.querySelector("#ledgerPage"),
    calculator: document.querySelector("#calculatorPage"),
  },
  pageTitle: document.querySelector("#pageTitle"),
  pageDescription: document.querySelector("#pageDescription"),
  refreshDirectorData: document.querySelector("#refreshDirectorData"),
  directorSyncState: document.querySelector("#directorSyncState"),
  grossPayroll: document.querySelector("#grossPayroll"),
  netPayroll: document.querySelector("#netPayroll"),
  totalIncome: document.querySelector("#totalIncome"),
  profitTotal: document.querySelector("#profitTotal"),
  payrollBody: document.querySelector("#payrollBody"),
  ledgerIncome: document.querySelector("#ledgerIncome"),
  ledgerExpense: document.querySelector("#ledgerExpense"),
  ledgerProfit: document.querySelector("#ledgerProfit"),
  ledgerBody: document.querySelector("#ledgerBody"),
  ledgerSegments: document.querySelectorAll(".segment"),
  openLedgerDialog: document.querySelector("#openLedgerDialog"),
  ledgerDialog: document.querySelector("#ledgerDialog"),
  ledgerForm: document.querySelector("#ledgerForm"),
  ledgerDialogTitle: document.querySelector("#ledgerDialogTitle"),
  closeLedgerDialog: document.querySelector("#closeLedgerDialog"),
  cancelLedgerDialog: document.querySelector("#cancelLedgerDialog"),
  ledgerId: document.querySelector("#ledgerId"),
  ledgerDate: document.querySelector("#ledgerDate"),
  ledgerType: document.querySelector("#ledgerType"),
  ledgerTitle: document.querySelector("#ledgerTitle"),
  ledgerAmount: document.querySelector("#ledgerAmount"),
  ledgerNote: document.querySelector("#ledgerNote"),
  calculatorDisplay: document.querySelector("#calculatorDisplay"),
  calculatorButtons: document.querySelectorAll("[data-calc]"),
  calculatorHistory: document.querySelector("#calculatorHistory"),
  clearHistory: document.querySelector("#clearHistory"),
};

initialize();

function initialize() {
  elements.navItems.forEach((item) => item.addEventListener("click", () => switchPage(item.dataset.page)));
  elements.refreshDirectorData.addEventListener("click", () => {
    directorState = loadDirectorState();
    renderAll();
  });

  elements.ledgerSegments.forEach((button) => {
    button.addEventListener("click", () => {
      ledgerFilter = button.dataset.filter;
      elements.ledgerSegments.forEach((segment) => segment.classList.toggle("active", segment === button));
      renderLedger();
    });
  });

  elements.openLedgerDialog.addEventListener("click", () => openLedgerDialog());
  elements.closeLedgerDialog.addEventListener("click", () => elements.ledgerDialog.close());
  elements.cancelLedgerDialog.addEventListener("click", () => elements.ledgerDialog.close());
  elements.ledgerForm.addEventListener("submit", saveLedgerEntry);

  elements.calculatorButtons.forEach((button) => {
    button.addEventListener("click", () => handleCalculatorInput(button.dataset.calc));
  });
  elements.clearHistory.addEventListener("click", () => {
    state.calculatorHistory = [];
    saveFinanceState();
    renderCalculatorHistory();
  });

  renderAll();
}

function switchPage(page) {
  const [title, description] = pageInfo[page];
  elements.pageTitle.textContent = title;
  elements.pageDescription.textContent = description;
  elements.navItems.forEach((item) => {
    const active = item.dataset.page === page;
    item.classList.toggle("active", active);
    item.toggleAttribute("aria-current", active);
  });
  Object.entries(elements.pages).forEach(([key, section]) => section.classList.toggle("active", key === page));
}

function loadDirectorState() {
  const raw = localStorage.getItem(DIRECTOR_STORAGE_KEY);
  if (!raw) {
    return structuredClone(fallbackDirectorState);
  }

  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(fallbackDirectorState), ...parsed };
  } catch {
    return structuredClone(fallbackDirectorState);
  }
}

function loadFinanceState() {
  const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
  if (!raw) return structuredClone(defaultFinanceState);

  try {
    return { ...structuredClone(defaultFinanceState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultFinanceState);
  }
}

function saveFinanceState() {
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  renderPayroll();
  renderLedger();
  renderCalculatorHistory();
}

function getPayrollRows() {
  const shifts = Array.isArray(directorState.shifts) ? directorState.shifts : [];
  const summary = shifts.reduce((rows, shift) => {
    const teacher = shift.teacher || "未命名";
    if (!rows[teacher]) rows[teacher] = { teacher, shifts: 0, gross: 0 };
    rows[teacher].shifts += 1;
    rows[teacher].gross += calculatePay(shift);
    return rows;
  }, {});

  return Object.values(summary).map((row) => {
    const adjustment = getAdjustment(row.teacher);
    const net = row.gross - adjustment.laborInsurance - adjustment.healthInsurance + adjustment.attendanceBonus - adjustment.otherDeduction;
    return { ...row, adjustment, net };
  });
}

function getAdjustment(teacher) {
  const saved = state.adjustments[teacher] || {};
  return {
    laborInsurance: Number(saved.laborInsurance ?? 0),
    healthInsurance: Number(saved.healthInsurance ?? 0),
    attendanceBonus: Number(saved.attendanceBonus ?? 1000),
    otherDeduction: Number(saved.otherDeduction ?? 0),
  };
}

function renderPayroll() {
  const rows = getPayrollRows();
  const gross = rows.reduce((sum, row) => sum + row.gross, 0);
  const net = rows.reduce((sum, row) => sum + row.net, 0);
  const rawDirectorData = localStorage.getItem(DIRECTOR_STORAGE_KEY);

  elements.directorSyncState.textContent = rawDirectorData ? `已讀取 ${rows.length} 位教師` : "使用示範排班";
  elements.grossPayroll.textContent = formatCurrency(gross);
  elements.netPayroll.textContent = formatCurrency(net);

  elements.payrollBody.innerHTML = "";
  if (rows.length === 0) {
    elements.payrollBody.innerHTML = `<tr><td colspan="8" class="muted">目前主任端尚未建立排班薪資資料。</td></tr>`;
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(row.teacher)}</strong></td>
      <td>${row.shifts}</td>
      <td>${formatCurrency(row.gross)}</td>
      <td><input class="money-input" type="number" min="0" step="1" value="${row.adjustment.laborInsurance}" data-teacher="${escapeHtml(row.teacher)}" data-field="laborInsurance" aria-label="${escapeHtml(row.teacher)} 勞保" /></td>
      <td><input class="money-input" type="number" min="0" step="1" value="${row.adjustment.healthInsurance}" data-teacher="${escapeHtml(row.teacher)}" data-field="healthInsurance" aria-label="${escapeHtml(row.teacher)} 健保" /></td>
      <td><input class="money-input" type="number" min="0" step="1" value="${row.adjustment.attendanceBonus}" data-teacher="${escapeHtml(row.teacher)}" data-field="attendanceBonus" aria-label="${escapeHtml(row.teacher)} 全勤" /></td>
      <td><input class="money-input" type="number" min="0" step="1" value="${row.adjustment.otherDeduction}" data-teacher="${escapeHtml(row.teacher)}" data-field="otherDeduction" aria-label="${escapeHtml(row.teacher)} 其他扣款" /></td>
      <td><strong>${formatCurrency(row.net)}</strong></td>
    `;
    elements.payrollBody.append(tr);
  });

  elements.payrollBody.querySelectorAll(".money-input").forEach((input) => {
    input.addEventListener("change", () => {
      const teacher = input.dataset.teacher;
      const field = input.dataset.field;
      state.adjustments[teacher] = getAdjustment(teacher);
      state.adjustments[teacher][field] = Math.max(0, Number(input.value || 0));
      saveFinanceState();
      renderPayroll();
    });
  });
}

function renderLedger() {
  const visibleEntries = state.ledger
    .filter((entry) => ledgerFilter === "all" || entry.type === ledgerFilter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const income = state.ledger.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expense = state.ledger.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const profit = income - expense;

  elements.totalIncome.textContent = formatCurrency(income);
  elements.profitTotal.textContent = formatCurrency(profit);
  elements.ledgerIncome.textContent = formatCurrency(income);
  elements.ledgerExpense.textContent = formatCurrency(expense);
  elements.ledgerProfit.textContent = formatCurrency(profit);

  elements.ledgerBody.innerHTML = "";
  if (visibleEntries.length === 0) {
    elements.ledgerBody.innerHTML = `<tr><td colspan="6" class="muted">目前沒有符合條件的收支紀錄。</td></tr>`;
    return;
  }

  visibleEntries.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entry.date)}</td>
      <td><span class="status ${entry.type}">${entry.type === "income" ? "收入" : "支出"}</span></td>
      <td><strong>${escapeHtml(entry.title)}</strong></td>
      <td>${formatCurrency(entry.amount)}</td>
      <td>${escapeHtml(entry.note || "無")}</td>
      <td>
        <div class="row-actions">
          <button class="small-button" type="button" data-action="edit" data-id="${entry.id}">編輯</button>
          <button class="small-button danger" type="button" data-action="delete" data-id="${entry.id}">刪除</button>
        </div>
      </td>
    `;
    elements.ledgerBody.append(tr);
  });

  elements.ledgerBody.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleLedgerAction(button.dataset.action, button.dataset.id));
  });
}

function openLedgerDialog(entry = null) {
  elements.ledgerForm.reset();
  elements.ledgerDialogTitle.textContent = entry ? "編輯收支" : "新增收支";
  elements.ledgerId.value = entry?.id || "";
  elements.ledgerDate.value = entry?.date || currentDate();
  elements.ledgerType.value = entry?.type || "income";
  elements.ledgerTitle.value = entry?.title || "";
  elements.ledgerAmount.value = entry?.amount || "";
  elements.ledgerNote.value = entry?.note || "";
  elements.ledgerDialog.showModal();
  elements.ledgerTitle.focus();
}

function saveLedgerEntry(event) {
  event.preventDefault();
  const id = elements.ledgerId.value || crypto.randomUUID();
  const entry = {
    id,
    date: elements.ledgerDate.value,
    type: elements.ledgerType.value,
    title: elements.ledgerTitle.value.trim(),
    amount: Number(elements.ledgerAmount.value),
    note: elements.ledgerNote.value.trim(),
  };
  const existingIndex = state.ledger.findIndex((item) => item.id === id);
  if (existingIndex >= 0) state.ledger[existingIndex] = entry;
  else state.ledger.unshift(entry);
  saveFinanceState();
  elements.ledgerDialog.close();
  renderLedger();
}

function handleLedgerAction(action, id) {
  const entry = state.ledger.find((item) => item.id === id);
  if (!entry) return;

  if (action === "edit") {
    openLedgerDialog(entry);
    return;
  }

  if (action === "delete") {
    const shouldDelete = confirm(`確定刪除「${entry.title}」嗎？`);
    if (!shouldDelete) return;
    state.ledger = state.ledger.filter((item) => item.id !== id);
    saveFinanceState();
    renderLedger();
  }
}

function handleCalculatorInput(value) {
  if (value === "clear") {
    calculatorExpression = "";
    updateCalculatorDisplay();
    return;
  }

  if (value === "backspace") {
    calculatorExpression = calculatorExpression.slice(0, -1);
    updateCalculatorDisplay();
    return;
  }

  if (value === "equals") {
    evaluateCalculator();
    return;
  }

  calculatorExpression += value;
  updateCalculatorDisplay();
}

function updateCalculatorDisplay() {
  elements.calculatorDisplay.textContent = calculatorExpression || "0";
}

function evaluateCalculator() {
  if (!calculatorExpression) return;
  if (!/^[\d+\-*/%. ]+$/.test(calculatorExpression)) {
    elements.calculatorDisplay.textContent = "錯誤";
    calculatorExpression = "";
    return;
  }

  try {
    const result = Function(`"use strict"; return (${calculatorExpression})`)();
    if (!Number.isFinite(result)) throw new Error("Invalid result");
    const record = `${calculatorExpression} = ${formatNumber(result)}`;
    state.calculatorHistory.unshift(record);
    state.calculatorHistory = state.calculatorHistory.slice(0, 8);
    calculatorExpression = String(formatNumber(result));
    saveFinanceState();
    updateCalculatorDisplay();
    renderCalculatorHistory();
  } catch {
    elements.calculatorDisplay.textContent = "錯誤";
    calculatorExpression = "";
  }
}

function renderCalculatorHistory() {
  if (state.calculatorHistory.length === 0) {
    elements.calculatorHistory.innerHTML = `<p class="muted">尚無計算紀錄。</p>`;
    return;
  }

  elements.calculatorHistory.innerHTML = state.calculatorHistory.map((item) => `<div class="history-item">${escapeHtml(item)}</div>`).join("");
}

function calculatePay(shift) {
  if (shift.payType === "monthly") return Number(shift.payRate || 0);
  return calculateHours(shift) * Number(shift.payRate || 0);
}

function calculateHours(shift) {
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  return Math.max(0, end - start) / 60;
}

function toMinutes(value = "00:00") {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value.toFixed(4)).toString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
