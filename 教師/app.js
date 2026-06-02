const STORAGE_KEY = "cram-school-teacher-v1";
const DIRECTOR_STORAGE_KEY = "cram-school-director-v1";
const CURRENT_USER_KEY = "cram-school-current-user";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const grades = Array.from({ length: 9 }, (_, index) => `${index + 1}年級`);
const currentTeacher = localStorage.getItem(CURRENT_USER_KEY) || "william";

const defaultData = {
  timelineTasks: [
    { id: "tl-1", day: "一", title: "國一數學小考檢討", note: "A 班，整理錯題", completed: false },
    { id: "tl-2", day: "三", title: "聯絡未交作業學生", note: "放學前完成", completed: false },
    { id: "tl-3", day: "五", title: "週末作業上傳", note: "確認題目版本", completed: true },
  ],
  todos: [
    { id: "td-1", title: "批改國二英文作業", note: "標記需補強單字", completed: false },
    { id: "td-2", title: "回報 A 教室投影機狀況", note: "畫面偶爾閃爍", completed: false },
  ],
  students: [
    { id: "st-1", name: "王小明", grade: "1年級", present: true, meal: true, absenceReason: "" },
    { id: "st-2", name: "李佳蓉", grade: "1年級", present: false, meal: false, absenceReason: "家長請假" },
    { id: "st-3", name: "陳柏宇", grade: "2年級", present: true, meal: true, absenceReason: "" },
    { id: "st-4", name: "林品妤", grade: "3年級", present: true, meal: false, absenceReason: "" },
  ],
  journal: {
    className: "國一數學 A 班",
    teachingStatus: "",
    studentStatus: "",
    incidentStatus: "",
    savedAt: "",
  },
  clockRecords: [],
};

const pageInfo = {
  timeline: ["時間軸", "查看本週每天的待辦事項與班務安排。"],
  journal: ["教室日誌", "記錄今日教學狀況、學生狀況、突發狀況與班級概況。"],
  todos: ["待辦事項", "接收主任指派事項，完成後勾選作為回報。"],
  attendance: ["學生出缺勤", "勾選到班學生，未到班需填寫原因，並統計訂餐人數。"],
  clock: ["打卡系統", "依電腦時間記錄上班、下班時間並計算工時。"],
};

const state = loadState();
state.students = state.students.map(normalizeStudent);
saveState();

let currentGradeFilter = "all";

const elements = {
  tabs: document.querySelectorAll(".nav-item"),
  pages: {
    timeline: document.querySelector("#timelinePage"),
    journal: document.querySelector("#journalPage"),
    todos: document.querySelector("#todosPage"),
    attendance: document.querySelector("#attendancePage"),
    clock: document.querySelector("#clockPage"),
  },
  pageTitle: document.querySelector("#pageTitle"),
  pageDescription: document.querySelector("#pageDescription"),
  todayText: document.querySelector("#todayText"),
  timelineGrid: document.querySelector("#timelineGrid"),
  addTimelineTask: document.querySelector("#addTimelineTask"),
  journalClass: document.querySelector("#journalClass"),
  teachingStatus: document.querySelector("#teachingStatus"),
  studentStatus: document.querySelector("#studentStatus"),
  incidentStatus: document.querySelector("#incidentStatus"),
  saveJournal: document.querySelector("#saveJournal"),
  journalSaveStatus: document.querySelector("#journalSaveStatus"),
  addTodo: document.querySelector("#addTodo"),
  todoList: document.querySelector("#todoList"),
  addStudent: document.querySelector("#addStudent"),
  gradeFilter: document.querySelector("#gradeFilter"),
  mealSummary: document.querySelector("#mealSummary"),
  attendanceList: document.querySelector("#attendanceList"),
  currentTime: document.querySelector("#currentTime"),
  clockIn: document.querySelector("#clockIn"),
  clockOut: document.querySelector("#clockOut"),
  clockLog: document.querySelector("#clockLog"),
  taskDialog: document.querySelector("#taskDialog"),
  taskForm: document.querySelector("#taskForm"),
  taskDialogTitle: document.querySelector("#taskDialogTitle"),
  closeTaskDialog: document.querySelector("#closeTaskDialog"),
  cancelTaskDialog: document.querySelector("#cancelTaskDialog"),
  taskId: document.querySelector("#taskId"),
  taskMode: document.querySelector("#taskMode"),
  taskTitle: document.querySelector("#taskTitle"),
  taskDay: document.querySelector("#taskDay"),
  taskDayField: document.querySelector("#taskDayField"),
  taskNote: document.querySelector("#taskNote"),
  studentDialog: document.querySelector("#studentDialog"),
  studentForm: document.querySelector("#studentForm"),
  studentDialogTitle: document.querySelector("#studentDialogTitle"),
  closeStudentDialog: document.querySelector("#closeStudentDialog"),
  cancelStudentDialog: document.querySelector("#cancelStudentDialog"),
  studentId: document.querySelector("#studentId"),
  studentName: document.querySelector("#studentName"),
  studentGrade: document.querySelector("#studentGrade"),
};

initialize();

function initialize() {
  elements.todayText.textContent = new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date());

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchPage(tab.dataset.page));
  });

  elements.addTimelineTask.addEventListener("click", () => openTaskDialog("timeline"));
  elements.addTodo.addEventListener("click", () => openTaskDialog("todo"));
  elements.addStudent.addEventListener("click", () => openStudentDialog());
  elements.saveJournal.addEventListener("click", saveJournal);
  elements.clockIn.addEventListener("click", () => addClockRecord("in"));
  elements.clockOut.addEventListener("click", () => addClockRecord("out"));
  elements.closeTaskDialog.addEventListener("click", () => elements.taskDialog.close());
  elements.cancelTaskDialog.addEventListener("click", () => elements.taskDialog.close());
  elements.taskForm.addEventListener("submit", saveTaskFromDialog);
  elements.closeStudentDialog.addEventListener("click", () => elements.studentDialog.close());
  elements.cancelStudentDialog.addEventListener("click", () => elements.studentDialog.close());
  elements.studentForm.addEventListener("submit", saveStudentFromDialog);
  window.addEventListener("storage", handleSharedStateChange);

  renderGradeOptions();
  renderGradeFilter();
  loadJournalIntoForm();
  tickClock();
  setInterval(tickClock, 1000);
  renderAll();
}

function normalizeStudent(student) {
  const gradeMap = {
    國一: "1年級",
    國二: "2年級",
    國三: "3年級",
    小一: "1年級",
    小二: "2年級",
    小三: "3年級",
    小四: "4年級",
    小五: "5年級",
    小六: "6年級",
  };

  return {
    ...student,
    grade: gradeMap[student.grade] || (grades.includes(student.grade) ? student.grade : "1年級"),
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);

  try {
    return { ...structuredClone(defaultData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleSharedStateChange(event) {
  if (event.key !== DIRECTOR_STORAGE_KEY) return;
  const directorState = getDirectorState();
  if (!Array.isArray(directorState.students)) return;
  state.students = directorState.students.map(normalizeStudent);
  saveState();
  renderAll();
}

function syncStudentsToDirector() {
  const directorState = getDirectorState();
  directorState.students = state.students.map(normalizeStudent);
  localStorage.setItem(DIRECTOR_STORAGE_KEY, JSON.stringify(directorState));
}

function syncJournalToDirector() {
  const directorState = getDirectorState();
  const savedDate = state.journal.savedAt.slice(0, 10);
  const logId = `journal-${currentTeacher}-${savedDate}`;
  const existingLog = directorState.logs.find((log) => log.id === logId);
  const payload = {
    id: logId,
    teacher: currentTeacher,
    className: state.journal.className || "未填班級",
    savedAt: state.journal.savedAt,
    teachingStatus: state.journal.teachingStatus || "未填寫",
    studentStatus: state.journal.studentStatus || "未填寫",
    incidentStatus: state.journal.incidentStatus || "未填寫",
    reviewed: false,
  };

  if (existingLog) Object.assign(existingLog, payload);
  else directorState.logs.unshift(payload);

  localStorage.setItem(DIRECTOR_STORAGE_KEY, JSON.stringify(directorState));
}

function syncClockRecordToDirector(record) {
  if (!record.in || !record.out) return;

  const directorState = getDirectorState();
  const shiftId = `clock-${currentTeacher}-${record.date}`;
  const existingShift = directorState.shifts.find((shift) => shift.id === shiftId);
  const sameDayShift = directorState.shifts.find((shift) => shift.teacher === currentTeacher && shift.date === record.date);
  const payload = {
    id: shiftId,
    teacher: currentTeacher,
    date: record.date,
    start: formatTimeValue(record.in),
    end: formatTimeValue(record.out),
    payType: "hourly",
    payRate: Number(existingShift?.payRate ?? sameDayShift?.payRate ?? 220),
  };

  if (existingShift) Object.assign(existingShift, payload);
  else directorState.shifts.unshift(payload);

  localStorage.setItem(DIRECTOR_STORAGE_KEY, JSON.stringify(directorState));
}

function switchPage(page) {
  const [title, description] = pageInfo[page];
  elements.pageTitle.textContent = title;
  elements.pageDescription.textContent = description;

  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.page === page);
  });

  Object.entries(elements.pages).forEach(([key, section]) => {
    section.classList.toggle("active", key === page);
  });
}

function renderAll() {
  renderTimeline();
  renderTodos();
  renderAttendance();
  renderClockLog();
}

function renderTimeline() {
  elements.timelineGrid.innerHTML = "";
  const assignedTasks = getAssignedTasks();

  weekdays.forEach((day) => {
    const column = document.createElement("article");
    column.className = "day-column";
    column.innerHTML = `<h3>星期${day}</h3>`;

    const dayTasks = state.timelineTasks.filter((task) => task.day === day);
    const dayAssignedTasks = assignedTasks.filter((task) => task.day === day);
    if (dayTasks.length === 0 && dayAssignedTasks.length === 0) {
      column.insertAdjacentHTML("beforeend", `<p class="muted">尚無事項</p>`);
    }

    dayAssignedTasks.forEach((task) => {
      column.append(createAssignedTaskCard(task, "timeline"));
    });

    dayTasks.forEach((task) => {
      column.append(createTaskCard(task, "timeline"));
    });

    elements.timelineGrid.append(column);
  });
}

function renderTodos() {
  elements.todoList.innerHTML = "";
  const assignedTasks = getAssignedTasks();

  if (state.todos.length === 0 && assignedTasks.length === 0) {
    elements.todoList.innerHTML = `<p class="muted">目前沒有待辦事項。</p>`;
    return;
  }

  assignedTasks.forEach((assignment) => {
    const item = document.createElement("article");
    item.className = `todo-item assigned${assignment.completed ? " completed" : ""}`;
    item.innerHTML = `
      <label class="checkbox-line">
        <input type="checkbox" ${assignment.completed ? "checked" : ""} data-action="toggleAssigned" data-id="${assignment.id}" />
        <span>
          <span class="source-label">主任指派</span>
          <strong class="todo-title">${escapeHtml(assignment.title)}</strong>
          <span class="muted">${escapeHtml(assignment.type)} / ${assignment.date} 星期${assignment.day} / ${escapeHtml(assignment.note || "無備註")}</span>
        </span>
      </label>
      <div class="inline-actions">
        <span class="muted">由主任端指派</span>
      </div>
    `;
    elements.todoList.append(item);
  });

  state.todos.forEach((todo) => {
    const item = document.createElement("article");
    item.className = `todo-item${todo.completed ? " completed" : ""}`;
    item.innerHTML = `
      <label class="checkbox-line">
        <input type="checkbox" ${todo.completed ? "checked" : ""} data-action="toggleTodo" data-id="${todo.id}" />
        <span>
          <strong class="todo-title">${escapeHtml(todo.title)}</strong>
          <span class="muted">${escapeHtml(todo.note || "無備註")}</span>
        </span>
      </label>
      <div class="inline-actions">
        <button class="small-button" type="button" data-action="editTodo" data-id="${todo.id}">編輯</button>
        <button class="small-button" type="button" data-action="deleteTodo" data-id="${todo.id}">刪除</button>
      </div>
    `;
    elements.todoList.append(item);
  });

  bindTodoActions();
}

function createAssignedTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card assigned";
  card.innerHTML = `
    <span class="source-label">主任指派</span>
    <strong>${escapeHtml(task.title)}</strong>
    <p class="muted">${escapeHtml(task.type)} / ${task.date} 星期${task.day} / ${escapeHtml(task.note || "無備註")}</p>
    <label class="checkbox-line">
      <input type="checkbox" ${task.completed ? "checked" : ""} data-action="toggleAssigned" data-id="${task.id}" />
      完成
    </label>
  `;

  card.querySelector("[data-action='toggleAssigned']").addEventListener("change", (event) => {
    updateAssignedTask(task.id, event.target.checked);
  });

  return card;
}

function createTaskCard(task, mode) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <strong>${escapeHtml(task.title)}</strong>
    <p class="muted">${escapeHtml(task.note || "無備註")}</p>
    <label class="checkbox-line">
      <input type="checkbox" ${task.completed ? "checked" : ""} data-action="toggleTimeline" data-id="${task.id}" />
      完成
    </label>
    <div class="inline-actions">
      <button class="small-button" type="button" data-action="editTimeline" data-id="${task.id}">編輯</button>
      <button class="small-button" type="button" data-action="deleteTimeline" data-id="${task.id}">刪除</button>
    </div>
  `;

  card.querySelectorAll("[data-action]").forEach((control) => {
    control.addEventListener("click", () => handleTaskAction(control.dataset.action, control.dataset.id, mode));
  });

  return card;
}

function bindTodoActions() {
  elements.todoList.querySelectorAll("[data-action]").forEach((control) => {
    const eventName = control.matches("input") ? "change" : "click";
    control.addEventListener(eventName, () => {
      if (control.dataset.action === "toggleAssigned") {
        updateAssignedTask(control.dataset.id, control.checked);
        return;
      }
      handleTaskAction(control.dataset.action, control.dataset.id, "todo");
    });
  });
}

function handleTaskAction(action, id) {
  if (action.includes("Timeline")) {
    const task = state.timelineTasks.find((entry) => entry.id === id);
    if (!task) return;
    if (action === "toggleTimeline") task.completed = !task.completed;
    if (action === "editTimeline") return openTaskDialog("timeline", task);
    if (action === "deleteTimeline") state.timelineTasks = state.timelineTasks.filter((entry) => entry.id !== id);
  }

  if (action.includes("Todo")) {
    const todo = state.todos.find((entry) => entry.id === id);
    if (!todo) return;
    if (action === "toggleTodo") todo.completed = !todo.completed;
    if (action === "editTodo") return openTaskDialog("todo", todo);
    if (action === "deleteTodo") state.todos = state.todos.filter((entry) => entry.id !== id);
  }

  saveState();
  renderAll();
}

function openTaskDialog(mode, task = null) {
  elements.taskForm.reset();
  elements.taskMode.value = mode;
  elements.taskId.value = task?.id || "";
  elements.taskTitle.value = task?.title || "";
  elements.taskNote.value = task?.note || "";
  elements.taskDay.value = task?.day || "一";
  elements.taskDayField.style.display = mode === "timeline" ? "grid" : "none";
  elements.taskDialogTitle.textContent = task ? "編輯事項" : mode === "timeline" ? "新增時間軸事項" : "新增待辦事項";
  elements.taskDialog.showModal();
  elements.taskTitle.focus();
}

function saveTaskFromDialog(event) {
  event.preventDefault();

  const mode = elements.taskMode.value;
  const id = elements.taskId.value || crypto.randomUUID();
  const item = {
    id,
    title: elements.taskTitle.value.trim(),
    note: elements.taskNote.value.trim(),
    completed: false,
  };

  const collection = mode === "timeline" ? state.timelineTasks : state.todos;
  const existing = collection.find((entry) => entry.id === id);

  if (mode === "timeline") item.day = elements.taskDay.value;

  if (existing) {
    Object.assign(existing, item, { completed: existing.completed });
  } else {
    collection.push(item);
  }

  saveState();
  elements.taskDialog.close();
  renderAll();
}

function getAssignedTasks() {
  const directorState = getDirectorState();
  return directorState.assignments
    .filter((assignment) => assignment.teacher === currentTeacher)
    .map(normalizeAssignment);
}

function getDirectorState() {
  const raw = localStorage.getItem(DIRECTOR_STORAGE_KEY);
  if (!raw) return { assignments: [], logs: [], students: [], shifts: [] };

  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    };
  } catch {
    return { assignments: [], logs: [], students: [], shifts: [] };
  }
}

function updateAssignedTask(id, completed) {
  const directorState = getDirectorState();
  const assignment = directorState.assignments.find((entry) => entry.id === id);
  if (!assignment) return;
  assignment.completed = completed;
  localStorage.setItem(DIRECTOR_STORAGE_KEY, JSON.stringify(directorState));
  renderAll();
}

function normalizeAssignment(assignment) {
  return {
    ...assignment,
    day: assignment.day || "一",
    date: assignment.date || "",
    type: assignment.type || "主任指派",
    completed: Boolean(assignment.completed),
  };
}

function loadJournalIntoForm() {
  elements.journalClass.value = state.journal.className;
  elements.teachingStatus.value = state.journal.teachingStatus;
  elements.studentStatus.value = state.journal.studentStatus;
  elements.incidentStatus.value = state.journal.incidentStatus;
  if (state.journal.savedAt) {
    elements.journalSaveStatus.textContent = `上次儲存：${formatDateTime(state.journal.savedAt)}`;
  }
}

function saveJournal() {
  state.journal = {
    className: elements.journalClass.value.trim(),
    teachingStatus: elements.teachingStatus.value.trim(),
    studentStatus: elements.studentStatus.value.trim(),
    incidentStatus: elements.incidentStatus.value.trim(),
    savedAt: new Date().toISOString(),
  };
  saveState();
  syncJournalToDirector();
  elements.journalSaveStatus.textContent = `已儲存：${formatDateTime(state.journal.savedAt)}`;
}

function renderAttendance() {
  const mealCounts = state.students.reduce((counts, student) => {
    if (!student.meal) return counts;
    counts[student.grade] = (counts[student.grade] || 0) + 1;
    return counts;
  }, {});

  const gradePills = grades
    .map((grade) => `<span class="meal-pill">${grade} 訂餐 ${mealCounts[grade] || 0} 人</span>`)
    .join("");

  elements.mealSummary.innerHTML = gradePills;
  elements.attendanceList.innerHTML = "";

  const visibleStudents =
    currentGradeFilter === "all"
      ? state.students
      : state.students.filter((student) => student.grade === currentGradeFilter);

  if (visibleStudents.length === 0) {
    elements.attendanceList.innerHTML = `<p class="muted">此年級目前沒有學生。</p>`;
    return;
  }

  visibleStudents.forEach((student) => {
    const card = document.createElement("article");
    card.className = "student-card";
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(student.name)}</h3>
        <p class="muted">${escapeHtml(student.grade)}</p>
        <span class="status-pill ${student.present ? "present" : "absent"}">${student.present ? "已到班" : "未到班"}</span>
      </div>
      <div class="student-controls">
        <label class="checkbox-line">
          <input type="checkbox" ${student.present ? "checked" : ""} data-action="present" data-id="${student.id}" />
          到班
        </label>
        <label class="checkbox-line">
          <input type="checkbox" ${student.meal ? "checked" : ""} data-action="meal" data-id="${student.id}" />
          訂餐
        </label>
        <input data-action="reason" data-id="${student.id}" value="${escapeHtml(student.absenceReason)}" placeholder="未到原因" ${student.present ? "disabled" : ""} />
        <div class="student-actions">
          <button class="small-button" type="button" data-action="editStudent" data-id="${student.id}">編輯</button>
          <button class="small-button" type="button" data-action="deleteStudent" data-id="${student.id}">刪除</button>
        </div>
      </div>
    `;
    elements.attendanceList.append(card);
  });

  elements.attendanceList.querySelectorAll("[data-action]").forEach((control) => {
    const eventName = control.dataset.action === "reason" ? "input" : control.matches("button") ? "click" : "change";
    control.addEventListener(eventName, () => updateStudent(control));
  });
}

function updateStudent(control) {
  const student = state.students.find((entry) => entry.id === control.dataset.id);
  if (!student) return;

  if (control.dataset.action === "editStudent") {
    openStudentDialog(student);
    return;
  }

  if (control.dataset.action === "deleteStudent") {
    const shouldDelete = confirm(`確定要刪除「${student.name}」嗎？`);
    if (!shouldDelete) return;
    state.students = state.students.filter((entry) => entry.id !== student.id);
    saveState();
    syncStudentsToDirector();
    renderAttendance();
    return;
  }

  if (control.dataset.action === "present") {
    student.present = control.checked;
    if (student.present) student.absenceReason = "";
  }
  if (control.dataset.action === "meal") student.meal = control.checked;
  if (control.dataset.action === "reason") student.absenceReason = control.value;

  saveState();
  syncStudentsToDirector();
  renderAttendance();
}

function renderGradeOptions() {
  elements.studentGrade.innerHTML = grades.map((grade) => `<option value="${grade}">${grade}</option>`).join("");
}

function renderGradeFilter() {
  const options = ["all", ...grades];
  elements.gradeFilter.innerHTML = "";

  options.forEach((grade) => {
    const button = document.createElement("button");
    button.className = `grade-chip${grade === currentGradeFilter ? " active" : ""}`;
    button.type = "button";
    button.textContent = grade === "all" ? "全部" : grade;
    button.addEventListener("click", () => {
      currentGradeFilter = grade;
      renderGradeFilter();
      renderAttendance();
    });
    elements.gradeFilter.append(button);
  });
}

function openStudentDialog(student = null) {
  elements.studentForm.reset();
  elements.studentDialogTitle.textContent = student ? "編輯學生" : "新增學生";
  elements.studentId.value = student?.id || "";
  elements.studentName.value = student?.name || "";
  elements.studentGrade.value = student?.grade || (currentGradeFilter === "all" ? "1年級" : currentGradeFilter);
  elements.studentDialog.showModal();
  elements.studentName.focus();
}

function saveStudentFromDialog(event) {
  event.preventDefault();

  const id = elements.studentId.value || crypto.randomUUID();
  const student = state.students.find((entry) => entry.id === id);
  const payload = {
    id,
    name: elements.studentName.value.trim(),
    grade: elements.studentGrade.value,
    present: student?.present ?? true,
    meal: student?.meal ?? false,
    absenceReason: student?.absenceReason ?? "",
  };

  if (student) {
    Object.assign(student, payload);
  } else {
    state.students.push(payload);
    currentGradeFilter = payload.grade;
    renderGradeFilter();
  }

  saveState();
  syncStudentsToDirector();
  elements.studentDialog.close();
  renderAttendance();
}

function tickClock() {
  elements.currentTime.textContent = new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function addClockRecord(type) {
  const today = new Date().toISOString().slice(0, 10);
  let record = state.clockRecords.find((entry) => entry.date === today);

  if (!record) {
    record = { date: today, in: "", out: "" };
    state.clockRecords.unshift(record);
  }

  record[type] = new Date().toISOString();
  saveState();
  syncClockRecordToDirector(record);
  renderClockLog();
}

function renderClockLog() {
  elements.clockLog.innerHTML = "";

  if (state.clockRecords.length === 0) {
    elements.clockLog.innerHTML = `<p class="muted">尚無打卡紀錄。</p>`;
    return;
  }

  state.clockRecords.forEach((record) => {
    const entry = document.createElement("article");
    entry.className = "clock-entry";
    entry.innerHTML = `
      <div><strong>${record.date}</strong><p class="muted">日期</p></div>
      <div><strong>${record.in ? formatTime(record.in) : "--"}</strong><p class="muted">上班</p></div>
      <div><strong>${record.out ? `${formatTime(record.out)} / ${calculateHours(record)}` : "--"}</strong><p class="muted">下班 / 工時</p></div>
    `;
    elements.clockLog.append(entry);
  });
}

function calculateHours(record) {
  if (!record.in || !record.out) return "--";
  const ms = new Date(record.out) - new Date(record.in);
  const hours = Math.max(0, ms / 1000 / 60 / 60);
  return `${hours.toFixed(2)} 小時`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTimeValue(value) {
  return new Date(value).toTimeString().slice(0, 5);
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
