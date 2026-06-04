const STORAGE_KEY = "cram-school-file-center-v1";
const CURRENT_USER_KEY = "cram-school-current-user";
const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

const people = [
  { id: "mark", label: "mark（主任）" },
  { id: "carey", label: "carey（主任/財政）" },
  { id: "william", label: "william（教師/總務）" },
  { id: "主任", label: "主任群組" },
  { id: "教師", label: "教師群組" },
  { id: "總務", label: "總務群組" },
  { id: "財政", label: "財政群組" },
];

const state = {
  view: "inbox",
  viewer: localStorage.getItem(CURRENT_USER_KEY) || "william",
  selectedFile: null,
  messages: loadMessages(),
};

const elements = {
  tabs: document.querySelectorAll(".nav-item"),
  clearReadButton: document.querySelector("#clearReadButton"),
  sendForm: document.querySelector("#sendForm"),
  sender: document.querySelector("#sender"),
  recipient: document.querySelector("#recipient"),
  title: document.querySelector("#title"),
  message: document.querySelector("#message"),
  fileInput: document.querySelector("#fileInput"),
  filePreview: document.querySelector("#filePreview"),
  resetForm: document.querySelector("#resetForm"),
  viewer: document.querySelector("#viewer"),
  listTitle: document.querySelector("#listTitle"),
  listDescription: document.querySelector("#listDescription"),
  mailList: document.querySelector("#mailList"),
};

initialize();

function initialize() {
  renderPersonOptions();
  elements.sender.value = state.viewer;
  elements.viewer.value = state.viewer;

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      elements.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      renderMessages();
    });
  });

  elements.viewer.addEventListener("change", () => {
    state.viewer = elements.viewer.value;
    renderMessages();
  });

  elements.fileInput.addEventListener("change", readSelectedFile);
  elements.resetForm.addEventListener("click", resetForm);
  elements.sendForm.addEventListener("submit", sendMessage);
  elements.clearReadButton.addEventListener("click", clearReadMessages);

  renderMessages();
  loadCloudMessages();
}

function loadMessages() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
}

function canUseCloudData() {
  return Boolean(window.cloudStore?.isEnabled() && localStorage.getItem("cram-school-supabase-session"));
}

function messageFromCloud(row) {
  let payload = {};
  try {
    payload = JSON.parse(row.body || "{}");
  } catch {
    payload = { message: row.body || "" };
  }

  const attachment =
    payload.attachment ||
    (row.attachment_name
      ? {
          name: row.attachment_name,
          type: row.attachment_type || "text/plain",
          size: 0,
          content: row.attachment_url || "",
        }
      : null);

  return {
    id: row.id,
    sender: row.sender,
    recipient: row.recipient,
    title: payload.title || row.attachment_name || "(無標題)",
    message: payload.message || "",
    attachment,
    createdAt: row.created_at || new Date().toISOString(),
    readBy: Array.isArray(payload.readBy) ? payload.readBy : [],
  };
}

function messageToCloud(message) {
  const readBy = Array.isArray(message.readBy) ? message.readBy : [];

  return {
    id: message.id,
    sender: message.sender,
    recipient: message.recipient,
    body: JSON.stringify({
      title: message.title || "",
      message: message.message || "",
      attachment: message.attachment || null,
      readBy,
    }),
    attachment_name: message.attachment?.name || null,
    attachment_type: message.attachment?.type || null,
    attachment_url: message.attachment?.content || null,
    read_at: readBy.length ? new Date().toISOString() : null,
  };
}

async function loadCloudMessages() {
  if (!canUseCloudData()) return;

  try {
    const rows = await window.cloudStore.list("messages", "select=*&order=created_at.desc");
    if (!Array.isArray(rows)) return;
    state.messages = rows.map(messageFromCloud);
    saveMessages();
    renderMessages();
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function syncMessageToCloud(message) {
  if (!canUseCloudData() || !isUuid(message.id)) return;

  try {
    await window.cloudStore.upsert("messages", messageToCloud(message));
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function updateCloudMessage(message) {
  if (!canUseCloudData() || !isUuid(message.id)) return;

  try {
    await window.cloudStore.update("messages", message.id, messageToCloud(message));
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function deleteCloudMessage(id) {
  if (!canUseCloudData() || !isUuid(id)) return;

  try {
    await window.cloudStore.remove("messages", id);
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

function renderPersonOptions() {
  const options = people.map((person) => `<option value="${person.id}">${person.label}</option>`).join("");
  elements.sender.innerHTML = options;
  elements.recipient.innerHTML = options;
  elements.viewer.innerHTML = options;
}

function readSelectedFile() {
  const file = elements.fileInput.files[0];
  state.selectedFile = null;
  elements.filePreview.className = "file-preview";
  elements.filePreview.innerHTML = "";

  if (!file) return;

  if (!file.type.startsWith("image/") && !file.type.startsWith("text/")) {
    elements.filePreview.className = "file-preview active";
    elements.filePreview.textContent = "目前僅支援文字檔與圖片檔。";
    elements.fileInput.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    elements.filePreview.className = "file-preview active";
    elements.filePreview.textContent = "檔案超過 1.5MB，請改用較小的文字或圖片檔。";
    elements.fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.selectedFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      content: reader.result,
    };
    renderFilePreview();
  };

  if (file.type.startsWith("image/")) reader.readAsDataURL(file);
  else reader.readAsText(file);
}

function renderFilePreview() {
  const file = state.selectedFile;
  if (!file) return;

  elements.filePreview.className = "file-preview active";
  const size = `${Math.round(file.size / 1024)} KB`;

  if (file.type.startsWith("image/")) {
    elements.filePreview.innerHTML = `
      <p class="muted">${escapeHtml(file.name)} / ${size}</p>
      <img src="${file.content}" alt="${escapeHtml(file.name)} 預覽" />
    `;
    return;
  }

  elements.filePreview.innerHTML = `
    <p class="muted">${escapeHtml(file.name)} / ${size}</p>
    <pre>${escapeHtml(String(file.content).slice(0, 800))}</pre>
  `;
}

function sendMessage(event) {
  event.preventDefault();

  const messageText = elements.message.value.trim();
  if (!messageText && !state.selectedFile) {
    alert("請輸入文字內容，或附加文字/圖片檔。");
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    sender: elements.sender.value,
    recipient: elements.recipient.value,
    title: elements.title.value.trim(),
    message: messageText,
    attachment: state.selectedFile,
    createdAt: new Date().toISOString(),
    readBy: [],
  };

  state.messages.unshift(entry);
  saveMessages();
  syncMessageToCloud(entry);
  state.viewer = entry.sender;
  elements.viewer.value = state.viewer;
  resetForm();
  state.view = "sent";
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === "sent"));
  renderMessages();
}

function resetForm() {
  elements.sendForm.reset();
  elements.sender.value = state.viewer;
  state.selectedFile = null;
  elements.filePreview.className = "file-preview";
  elements.filePreview.innerHTML = "";
}

function renderMessages() {
  const visible = getVisibleMessages();
  elements.mailList.innerHTML = "";
  updateListHeader();

  if (visible.length === 0) {
    elements.mailList.innerHTML = `<p class="muted">目前沒有符合條件的傳送紀錄。</p>`;
    return;
  }

  visible.forEach((message) => {
    const unread = isIncoming(message) && !message.readBy.includes(state.viewer);
    const card = document.createElement("article");
    card.className = `mail-card${unread ? " unread" : ""}`;
    card.innerHTML = `
      <div class="mail-header">
        <div>
          <h3>${escapeHtml(message.title)}</h3>
          <p class="muted">從 ${escapeHtml(labelFor(message.sender))} 傳給 ${escapeHtml(labelFor(message.recipient))} / ${formatDateTime(message.createdAt)}</p>
        </div>
        <span class="tag ${unread ? "unread" : ""}">${unread ? "未讀" : "已讀/紀錄"}</span>
      </div>
      ${message.message ? `<p class="mail-body">${escapeHtml(message.message)}</p>` : ""}
      ${renderAttachment(message.attachment)}
      <div class="mail-actions">
        <span class="muted">${message.attachment ? escapeHtml(message.attachment.name) : "無附件"}</span>
        <div>
          ${unread ? `<button class="small-button" type="button" data-action="read" data-id="${message.id}">標為已讀</button>` : ""}
          <button class="small-button danger" type="button" data-action="delete" data-id="${message.id}">刪除</button>
        </div>
      </div>
    `;
    elements.mailList.append(card);
  });

  elements.mailList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleMessageAction(button));
  });
}

function getVisibleMessages() {
  if (state.view === "all") return state.messages;
  if (state.view === "sent") return state.messages.filter((message) => message.sender === state.viewer);
  return state.messages.filter(isIncoming);
}

function isIncoming(message) {
  return message.recipient === state.viewer || message.recipient === roleForPerson(state.viewer);
}

function updateListHeader() {
  const headers = {
    inbox: ["收件匣", `顯示 ${labelFor(state.viewer)} 收到的檔案與文字。`],
    sent: ["寄件備份", `顯示 ${labelFor(state.viewer)} 送出的紀錄。`],
    all: ["全部紀錄", "顯示所有人物間的傳送紀錄。"],
  };
  const [title, description] = headers[state.view];
  elements.listTitle.textContent = title;
  elements.listDescription.textContent = description;
}

function renderAttachment(attachment) {
  if (!attachment) return "";

  if (attachment.type.startsWith("image/")) {
    return `
      <div class="mail-attachment">
        <p class="muted">${escapeHtml(attachment.name)}</p>
        <img src="${attachment.content}" alt="${escapeHtml(attachment.name)}" />
      </div>
    `;
  }

  return `
    <div class="mail-attachment">
      <p class="muted">${escapeHtml(attachment.name)}</p>
      <pre>${escapeHtml(String(attachment.content))}</pre>
    </div>
  `;
}

function handleMessageAction(button) {
  const message = state.messages.find((entry) => entry.id === button.dataset.id);
  if (!message) return;

  if (button.dataset.action === "read") {
    if (!message.readBy.includes(state.viewer)) message.readBy.push(state.viewer);
    updateCloudMessage(message);
  }

  if (button.dataset.action === "delete") {
    const shouldDelete = confirm(`確定刪除「${message.title}」嗎？`);
    if (!shouldDelete) return;
    state.messages = state.messages.filter((entry) => entry.id !== message.id);
    deleteCloudMessage(message.id);
  }

  saveMessages();
  renderMessages();
}

function clearReadMessages() {
  const before = state.messages.length;
  const removed = [];
  state.messages = state.messages.filter((message) => {
    const readIncoming = isIncoming(message) && message.readBy.includes(state.viewer);
    if (readIncoming) removed.push(message.id);
    return !readIncoming;
  });

  if (before === state.messages.length) {
    alert("目前沒有可清除的已讀收件。");
  }

  saveMessages();
  removed.forEach(deleteCloudMessage);
  renderMessages();
}

function roleForPerson(person) {
  const map = {
    mark: "主任",
    carey: "主任",
    william: "教師",
  };
  return map[person] || person;
}

function labelFor(id) {
  return people.find((person) => person.id === id)?.label || id;
}

function formatDateTime(value) {
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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
