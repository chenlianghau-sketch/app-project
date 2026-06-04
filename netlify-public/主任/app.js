const STORAGE_KEY = "cram-school-director-v1";
const TEACHER_STORAGE_KEY = "cram-school-teacher-v1";
const grades = Array.from({ length: 9 }, (_, index) => `${index + 1}年級`);
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

const pageInfo = {
  logs: ["日誌回饋", "檢視教師回報的教室日誌，掌握班內狀況。"],
  assignments: ["班務指派", "安排課表、分配班級與班務指派。"],
  attendance: ["出勤控制", "查看與調整學生到班、未到與訂餐狀態。"],
  schedule: ["排班薪資", "建立教師排班，依月薪或時薪估算薪資。"],
  employees: ["員工資料庫", "新增、編輯與刪除員工基本資料。"],
  classes: ["班級管理", "新增、編輯與刪除班級，並為班級指派老師。"],
};

const defaultState = {
  logs: [
    {
      id: "log-1",
      teacher: "william",
      className: "1年級數學 A 班",
      savedAt: new Date().toISOString(),
      teachingStatus: "分數加減概念已完成，三位學生需要補強進位。",
      studentStatus: "王小明作業未交，李佳蓉請假。",
      incidentStatus: "A 教室白板筆不足，已通知總務。",
      reviewed: false,
    },
    {
      id: "log-2",
      teacher: "sandy",
      className: "3年級英文 B 班",
      savedAt: new Date().toISOString(),
      teachingStatus: "完成閱讀測驗講解，下週安排單字複習。",
      studentStatus: "班級秩序穩定，兩位學生需提醒訂正。",
      incidentStatus: "無特殊狀況。",
      reviewed: true,
    },
  ],
  assignments: [
    { id: "as-1", type: "課表", teacher: "william", classId: "class-1", date: currentDate(), day: dayFromDate(currentDate()), title: "週三 1年級數學 A 班", note: "18:30-20:00", completed: false },
    { id: "as-2", type: "班務指派", teacher: "carey", classId: "", date: currentDate(), day: dayFromDate(currentDate()), title: "整理期中考成績表", note: "週五前交回主任", completed: false },
  ],
  students: [
    { id: "st-1", name: "王小明", grade: "1年級", present: true, meal: true, absenceReason: "" },
    { id: "st-2", name: "李佳蓉", grade: "1年級", present: false, meal: false, absenceReason: "家長請假" },
    { id: "st-3", name: "陳柏宇", grade: "2年級", present: true, meal: true, absenceReason: "" },
    { id: "st-4", name: "林品妤", grade: "3年級", present: true, meal: false, absenceReason: "" },
  ],
  shifts: [
    { id: "sh-1", teacher: "william", date: currentDate(), start: "18:00", end: "21:00", payType: "hourly", payRate: 220 },
    { id: "sh-2", teacher: "carey", date: currentDate(), start: "14:00", end: "18:00", payType: "monthly", payRate: 42000 },
  ],
  employees: [
    { id: "emp-1", name: "mark", role: "主任", phone: "", startDate: currentDate(), note: "負責班務管理與排班" },
    { id: "emp-2", name: "carey", role: "主任", phone: "", startDate: currentDate(), note: "兼任財政協作" },
    { id: "emp-3", name: "william", role: "教師", phone: "", startDate: currentDate(), note: "可排晚班" },
    { id: "emp-4", name: "sandy", role: "教師", phone: "", startDate: currentDate(), note: "英文課教師" },
  ],
  classes: [
    { id: "class-1", name: "1年級數學 A 班", grade: "1年級", teacher: "william", day: "三", time: "18:30-20:00", note: "基礎運算加強" },
    { id: "class-2", name: "3年級英文 B 班", grade: "3年級", teacher: "sandy", day: "五", time: "19:00-20:30", note: "閱讀測驗班" },
  ],
};

const state = loadState();
state.assignments = state.assignments.map(normalizeAssignment);
state.employees = Array.isArray(state.employees) ? state.employees : structuredClone(defaultState.employees);
state.classes = Array.isArray(state.classes) ? state.classes : structuredClone(defaultState.classes);
saveState();
let currentGradeFilter = "all";

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  pages: {
    logs: document.querySelector("#logsPage"),
    assignments: document.querySelector("#assignmentsPage"),
    attendance: document.querySelector("#attendancePage"),
    schedule: document.querySelector("#schedulePage"),
    employees: document.querySelector("#employeesPage"),
    classes: document.querySelector("#classesPage"),
  },
  pageTitle: document.querySelector("#pageTitle"),
  pageDescription: document.querySelector("#pageDescription"),
  todayAlerts: document.querySelector("#todayAlerts"),
  logList: document.querySelector("#logList"),
  addAssignment: document.querySelector("#addAssignment"),
  assignmentBoard: document.querySelector("#assignmentBoard"),
  gradeFilter: document.querySelector("#gradeFilter"),
  attendanceMetrics: document.querySelector("#attendanceMetrics"),
  attendanceBody: document.querySelector("#attendanceBody"),
  addShift: document.querySelector("#addShift"),
  salarySummary: document.querySelector("#salarySummary"),
  shiftList: document.querySelector("#shiftList"),
  addEmployee: document.querySelector("#addEmployee"),
  employeeList: document.querySelector("#employeeList"),
  addClass: document.querySelector("#addClass"),
  classList: document.querySelector("#classList"),
  assignmentDialog: document.querySelector("#assignmentDialog"),
  assignmentForm: document.querySelector("#assignmentForm"),
  assignmentDialogTitle: document.querySelector("#assignmentDialogTitle"),
  closeAssignmentDialog: document.querySelector("#closeAssignmentDialog"),
  cancelAssignmentDialog: document.querySelector("#cancelAssignmentDialog"),
  assignmentId: document.querySelector("#assignmentId"),
  assignmentType: document.querySelector("#assignmentType"),
  assignmentTeacher: document.querySelector("#assignmentTeacher"),
  assignmentClass: document.querySelector("#assignmentClass"),
  assignmentDate: document.querySelector("#assignmentDate"),
  assignmentDay: document.querySelector("#assignmentDay"),
  assignmentTitle: document.querySelector("#assignmentTitle"),
  assignmentNote: document.querySelector("#assignmentNote"),
  shiftDialog: document.querySelector("#shiftDialog"),
  shiftForm: document.querySelector("#shiftForm"),
  shiftDialogTitle: document.querySelector("#shiftDialogTitle"),
  closeShiftDialog: document.querySelector("#closeShiftDialog"),
  cancelShiftDialog: document.querySelector("#cancelShiftDialog"),
  shiftId: document.querySelector("#shiftId"),
  shiftTeacher: document.querySelector("#shiftTeacher"),
  shiftDate: document.querySelector("#shiftDate"),
  shiftStart: document.querySelector("#shiftStart"),
  shiftEnd: document.querySelector("#shiftEnd"),
  payType: document.querySelector("#payType"),
  payRate: document.querySelector("#payRate"),
  employeeDialog: document.querySelector("#employeeDialog"),
  employeeForm: document.querySelector("#employeeForm"),
  employeeDialogTitle: document.querySelector("#employeeDialogTitle"),
  closeEmployeeDialog: document.querySelector("#closeEmployeeDialog"),
  cancelEmployeeDialog: document.querySelector("#cancelEmployeeDialog"),
  employeeId: document.querySelector("#employeeId"),
  employeeName: document.querySelector("#employeeName"),
  employeeRole: document.querySelector("#employeeRole"),
  employeePhone: document.querySelector("#employeePhone"),
  employeeStartDate: document.querySelector("#employeeStartDate"),
  employeeNote: document.querySelector("#employeeNote"),
  classDialog: document.querySelector("#classDialog"),
  classForm: document.querySelector("#classForm"),
  classDialogTitle: document.querySelector("#classDialogTitle"),
  closeClassDialog: document.querySelector("#closeClassDialog"),
  cancelClassDialog: document.querySelector("#cancelClassDialog"),
  classId: document.querySelector("#classId"),
  className: document.querySelector("#className"),
  classGrade: document.querySelector("#classGrade"),
  classTeacher: document.querySelector("#classTeacher"),
  classDay: document.querySelector("#classDay"),
  classTime: document.querySelector("#classTime"),
  classNote: document.querySelector("#classNote"),
};

initialize();

function initialize() {
  elements.navItems.forEach((item) => item.addEventListener("click", () => switchPage(item.dataset.page)));
  elements.addAssignment.addEventListener("click", () => openAssignmentDialog());
  elements.assignmentForm.addEventListener("submit", saveAssignment);
  elements.assignmentDate.addEventListener("change", () => {
    setAssignmentDayFromDate();
  });
  elements.closeAssignmentDialog.addEventListener("click", () => elements.assignmentDialog.close());
  elements.cancelAssignmentDialog.addEventListener("click", () => elements.assignmentDialog.close());
  elements.addShift.addEventListener("click", () => openShiftDialog());
  elements.shiftForm.addEventListener("submit", saveShift);
  elements.closeShiftDialog.addEventListener("click", () => elements.shiftDialog.close());
  elements.cancelShiftDialog.addEventListener("click", () => elements.shiftDialog.close());
  elements.addEmployee.addEventListener("click", () => openEmployeeDialog());
  elements.employeeForm.addEventListener("submit", saveEmployee);
  elements.closeEmployeeDialog.addEventListener("click", () => elements.employeeDialog.close());
  elements.cancelEmployeeDialog.addEventListener("click", () => elements.employeeDialog.close());
  elements.addClass.addEventListener("click", () => openClassDialog());
  elements.classForm.addEventListener("submit", saveClass);
  elements.closeClassDialog.addEventListener("click", () => elements.classDialog.close());
  elements.cancelClassDialog.addEventListener("click", () => elements.classDialog.close());

  renderTeacherOptions();
  renderClassOptions();
  renderClassGradeOptions();
  renderGradeFilter();
  window.addEventListener("storage", handleSharedStateChange);
  renderAll();
  loadCloudStudents();
  loadCloudJournals();
  loadCloudAssignments();
  loadCloudShifts();
}

function handleSharedStateChange(event) {
  if (event.key !== STORAGE_KEY) return;
  Object.assign(state, loadState());
  state.assignments = state.assignments.map(normalizeAssignment);
  state.employees = Array.isArray(state.employees) ? state.employees : structuredClone(defaultState.employees);
  state.classes = Array.isArray(state.classes) ? state.classes : structuredClone(defaultState.classes);
  renderTeacherOptions();
  renderClassOptions();
  renderAll();
}

function normalizeAssignment(assignment) {
  const date = assignment.date || currentDate();
  return {
    ...assignment,
    date,
    day: assignment.day || dayFromDate(date),
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncStudentsToTeacher() {
  const raw = localStorage.getItem(TEACHER_STORAGE_KEY);
  let teacherState = {};

  try {
    teacherState = raw ? JSON.parse(raw) : {};
  } catch {
    teacherState = {};
  }

  teacherState.students = state.students;
  localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(teacherState));
  syncStudentsToCloud();
}

function canUseCloudStudents() {
  return Boolean(window.cloudStore?.isEnabled() && localStorage.getItem("cram-school-supabase-session"));
}

function studentFromCloud(row) {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    present: row.present,
    meal: row.meal,
    absenceReason: row.absence_reason || "",
  };
}

function studentToCloud(student) {
  return {
    id: student.id,
    name: student.name,
    grade: student.grade,
    present: Boolean(student.present),
    meal: Boolean(student.meal),
    absence_reason: student.absenceReason || "",
  };
}

async function loadCloudStudents() {
  if (!canUseCloudStudents()) return;

  try {
    const rows = await window.cloudStore.list("students", "select=*&order=created_at.asc");
    if (!Array.isArray(rows)) return;
    state.students = rows.map(studentFromCloud);
    saveState();
    syncStudentsToTeacher();
    renderAll();
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function syncStudentsToCloud() {
  if (!canUseCloudStudents()) return;

  try {
    await Promise.all(state.students.map((student) => window.cloudStore.upsert("students", studentToCloud(student))));
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

function canUseCloudJournals() {
  return Boolean(window.cloudStore?.isEnabled() && localStorage.getItem("cram-school-supabase-session"));
}

function logFromCloud(row) {
  return {
    id: row.id,
    teacher: row.teacher_name,
    className: row.class_name,
    savedAt: row.saved_at,
    teachingStatus: row.teaching_status,
    studentStatus: row.student_status,
    incidentStatus: row.incident_status,
    reviewed: Boolean(row.reviewed),
  };
}

async function loadCloudJournals() {
  if (!canUseCloudJournals()) return;

  try {
    const rows = await window.cloudStore.list("journals", "select=*&order=saved_at.desc");
    if (!Array.isArray(rows)) return;
    state.logs = rows.map(logFromCloud);
    saveState();
    renderAll();
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function updateCloudJournalReviewed(log) {
  if (!canUseCloudJournals()) return;

  try {
    await window.cloudStore.update("journals", log.id, {
      reviewed: Boolean(log.reviewed),
    });
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

function canUseCloudData() {
  return Boolean(window.cloudStore?.isEnabled() && localStorage.getItem("cram-school-supabase-session"));
}

function assignmentFromCloud(row) {
  return normalizeAssignment({
    id: row.id,
    type: row.type,
    teacher: row.teacher_name,
    classId: row.class_id || "",
    date: row.assigned_date,
    day: row.day,
    title: row.title,
    note: row.note || "",
    completed: Boolean(row.completed),
  });
}

function assignmentToCloud(assignment) {
  return {
    id: assignment.id,
    type: assignment.type,
    teacher_name: assignment.teacher,
    class_id: isUuid(assignment.classId) ? assignment.classId : null,
    assigned_date: assignment.date,
    day: assignment.day,
    title: assignment.title,
    note: assignment.note || "",
    completed: Boolean(assignment.completed),
  };
}

async function loadCloudAssignments() {
  if (!canUseCloudData()) return;

  try {
    const rows = await window.cloudStore.list("assignments", "select=*&order=assigned_date.desc");
    if (!Array.isArray(rows)) return;
    state.assignments = rows.map(assignmentFromCloud);
    saveState();
    renderAll();
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function syncAssignmentToCloud(assignment) {
  if (!canUseCloudData() || !isUuid(assignment.id)) return;

  try {
    await window.cloudStore.upsert("assignments", assignmentToCloud(assignment));
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function deleteCloudAssignment(id) {
  if (!canUseCloudData() || !isUuid(id)) return;

  try {
    await window.cloudStore.remove("assignments", id);
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

function shiftFromCloud(row) {
  return {
    id: row.id,
    teacher: row.teacher_name,
    date: row.shift_date,
    start: String(row.start_time).slice(0, 5),
    end: String(row.end_time).slice(0, 5),
    payType: row.pay_type,
    payRate: Number(row.pay_rate || 0),
  };
}

function shiftToCloud(shift, source = "director") {
  return {
    id: shift.id,
    teacher_name: shift.teacher,
    shift_date: shift.date,
    start_time: shift.start,
    end_time: shift.end,
    pay_type: shift.payType,
    pay_rate: Number(shift.payRate || 0),
    source,
  };
}

async function loadCloudShifts() {
  if (!canUseCloudData()) return;

  try {
    const rows = await window.cloudStore.list("shifts", "select=*&order=shift_date.desc");
    if (!Array.isArray(rows)) return;
    state.shifts = rows.map(shiftFromCloud);
    saveState();
    renderAll();
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function syncShiftToCloud(shift, source = "director") {
  if (!canUseCloudData() || !isUuid(shift.id)) return;

  try {
    await window.cloudStore.upsert("shifts", shiftToCloud(shift, source));
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

async function deleteCloudShift(id) {
  if (!canUseCloudData() || !isUuid(id)) return;

  try {
    await window.cloudStore.remove("shifts", id);
  } catch {
    // Keep localStorage data when cloud is temporarily unavailable.
  }
}

function renderAll() {
  renderAlerts();
  renderLogs();
  renderAssignments();
  renderAttendance();
  renderShifts();
  renderEmployees();
  renderClasses();
}

function switchPage(page) {
  const [title, description] = pageInfo[page];
  elements.pageTitle.textContent = title;
  elements.pageDescription.textContent = description;

  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  Object.entries(elements.pages).forEach(([key, section]) => section.classList.toggle("active", key === page));
}

function renderAlerts() {
  const unreviewedLogs = state.logs.filter((log) => !log.reviewed).length;
  const absentStudents = state.students.filter((student) => !student.present).length;
  elements.todayAlerts.textContent = unreviewedLogs + absentStudents;
}

function renderLogs() {
  elements.logList.innerHTML = "";

  state.logs.forEach((log) => {
    const card = document.createElement("article");
    card.className = "log-card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapeHtml(log.className)}</h3>
          <p class="muted">${escapeHtml(log.teacher)} / ${formatDateTime(log.savedAt)}</p>
        </div>
        <span class="tag ${log.reviewed ? "ok" : "warn"}">${log.reviewed ? "已讀" : "待回饋"}</span>
      </div>
      <div class="log-grid">
        <div class="log-box"><strong>教學狀況</strong><p>${escapeHtml(log.teachingStatus)}</p></div>
        <div class="log-box"><strong>學生狀況</strong><p>${escapeHtml(log.studentStatus)}</p></div>
        <div class="log-box"><strong>突發狀況</strong><p>${escapeHtml(log.incidentStatus)}</p></div>
      </div>
      <div class="card-actions">
        <span class="muted">供主任了解班內情形</span>
        <button class="small-button" type="button" data-action="reviewLog" data-id="${log.id}">${log.reviewed ? "標為未讀" : "標為已讀"}</button>
      </div>
    `;
    elements.logList.append(card);
  });

  elements.logList.querySelectorAll("[data-action='reviewLog']").forEach((button) => {
    button.addEventListener("click", () => {
      const log = state.logs.find((entry) => entry.id === button.dataset.id);
      if (!log) return;
      log.reviewed = !log.reviewed;
      saveState();
      updateCloudJournalReviewed(log);
      renderAll();
    });
  });
}

function renderAssignments() {
  elements.assignmentBoard.innerHTML = "";

  if (state.assignments.length === 0) {
    elements.assignmentBoard.innerHTML = `<p class="muted">目前沒有班務指派。</p>`;
    return;
  }

  state.assignments.forEach((assignment) => {
    const card = document.createElement("article");
    card.className = "assignment-card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapeHtml(assignment.title)}</h3>
          <p class="muted">${escapeHtml(assignment.type)} / 指派給 ${escapeHtml(assignment.teacher)} / ${assignment.date} 星期${assignment.day}</p>
          <p class="muted">班級：${escapeHtml(getClassName(assignment.classId))}</p>
        </div>
        <span class="tag ${assignment.completed ? "ok" : ""}">${assignment.completed ? "已完成" : "進行中"}</span>
      </div>
      <p>${escapeHtml(assignment.note || "無備註")}</p>
      <div class="card-actions">
        <label class="checkbox-line">
          <input type="checkbox" ${assignment.completed ? "checked" : ""} data-action="toggleAssignment" data-id="${assignment.id}" />
          完成
        </label>
        <div>
          <button class="small-button" type="button" data-action="editAssignment" data-id="${assignment.id}">編輯</button>
          <button class="small-button" type="button" data-action="deleteAssignment" data-id="${assignment.id}">刪除</button>
        </div>
      </div>
    `;
    elements.assignmentBoard.append(card);
  });

  elements.assignmentBoard.querySelectorAll("[data-action]").forEach((control) => {
    const eventName = control.matches("input") ? "change" : "click";
    control.addEventListener(eventName, () => handleAssignmentAction(control));
  });
}

function handleAssignmentAction(control) {
  const assignment = state.assignments.find((entry) => entry.id === control.dataset.id);
  if (!assignment) return;

  if (control.dataset.action === "toggleAssignment") assignment.completed = control.checked;
  if (control.dataset.action === "editAssignment") return openAssignmentDialog(assignment);
  if (control.dataset.action === "deleteAssignment") {
    const shouldDelete = confirm(`確定刪除「${assignment.title}」嗎？`);
    if (!shouldDelete) return;
    state.assignments = state.assignments.filter((entry) => entry.id !== assignment.id);
    deleteCloudAssignment(assignment.id);
    saveState();
    renderAll();
    return;
  }

  saveState();
  syncAssignmentToCloud(assignment);
  renderAll();
}

function openAssignmentDialog(assignment = null) {
  elements.assignmentForm.reset();
  elements.assignmentDialogTitle.textContent = assignment ? "編輯指派" : "新增指派";
  elements.assignmentId.value = assignment?.id || "";
  elements.assignmentType.value = assignment?.type || "班務指派";
  elements.assignmentTeacher.value = assignment?.teacher || getAssignableEmployees()[0]?.name || "";
  elements.assignmentClass.value = assignment?.classId || "";
  elements.assignmentDate.value = assignment?.date || currentDate();
  setAssignmentDayFromDate();
  elements.assignmentTitle.value = assignment?.title || "";
  elements.assignmentNote.value = assignment?.note || "";
  elements.assignmentDialog.showModal();
  elements.assignmentTitle.focus();
}

function saveAssignment(event) {
  event.preventDefault();
  const id = elements.assignmentId.value || crypto.randomUUID();
  const existing = state.assignments.find((entry) => entry.id === id);
  const payload = {
    id,
    type: elements.assignmentType.value,
    teacher: elements.assignmentTeacher.value,
    classId: elements.assignmentClass.value,
    date: elements.assignmentDate.value,
    day: dayFromDate(elements.assignmentDate.value),
    title: elements.assignmentTitle.value.trim(),
    note: elements.assignmentNote.value.trim(),
    completed: existing?.completed ?? false,
  };

  if (existing) Object.assign(existing, payload);
  else state.assignments.unshift(payload);

  saveState();
  syncAssignmentToCloud(payload);
  elements.assignmentDialog.close();
  renderAll();
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

function renderAttendance() {
  const visibleStudents =
    currentGradeFilter === "all"
      ? state.students
      : state.students.filter((student) => student.grade === currentGradeFilter);

  const present = visibleStudents.filter((student) => student.present).length;
  const absent = visibleStudents.length - present;
  const meals = visibleStudents.filter((student) => student.meal).length;

  elements.attendanceMetrics.innerHTML = `
    <span class="metric-pill">學生 ${visibleStudents.length} 人</span>
    <span class="metric-pill">到班 ${present} 人</span>
    <span class="metric-pill">未到 ${absent} 人</span>
    <span class="metric-pill">訂餐 ${meals} 人</span>
  `;

  elements.attendanceBody.innerHTML = "";
  if (visibleStudents.length === 0) {
    elements.attendanceBody.innerHTML = `<tr><td colspan="5" class="muted">此年級目前沒有學生。</td></tr>`;
    return;
  }

  visibleStudents.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(student.name)}</strong></td>
      <td>${escapeHtml(student.grade)}</td>
      <td>
        <label class="checkbox-line">
          <input type="checkbox" ${student.present ? "checked" : ""} data-action="present" data-id="${student.id}" />
          ${student.present ? "已到" : "未到"}
        </label>
      </td>
      <td>
        <label class="checkbox-line">
          <input type="checkbox" ${student.meal ? "checked" : ""} data-action="meal" data-id="${student.id}" />
          訂餐
        </label>
      </td>
      <td>${escapeHtml(student.absenceReason || "-")}</td>
    `;
    elements.attendanceBody.append(row);
  });

  elements.attendanceBody.querySelectorAll("[data-action]").forEach((control) => {
    control.addEventListener("change", () => {
      const student = state.students.find((entry) => entry.id === control.dataset.id);
      if (!student) return;
      if (control.dataset.action === "present") {
        student.present = control.checked;
        if (student.present) student.absenceReason = "";
        if (!student.present && !student.absenceReason) student.absenceReason = "主任標記未到";
      }
      if (control.dataset.action === "meal") student.meal = control.checked;
      saveState();
      syncStudentsToTeacher();
      renderAll();
    });
  });
}

function renderShifts() {
  const salaryByTeacher = state.shifts.reduce((summary, shift) => {
    summary[shift.teacher] = (summary[shift.teacher] || 0) + calculatePay(shift);
    return summary;
  }, {});

  elements.salarySummary.innerHTML = Object.entries(salaryByTeacher)
    .map(([teacher, salary]) => `<span class="metric-pill">${escapeHtml(teacher)}：${formatCurrency(salary)}</span>`)
    .join("");

  elements.shiftList.innerHTML = "";
  state.shifts.forEach((shift) => {
    const card = document.createElement("article");
    card.className = "shift-card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapeHtml(shift.teacher)} / ${shift.date}</h3>
          <p class="muted">${shift.payType === "hourly" ? "時薪" : "月薪"}制</p>
        </div>
        <span class="tag">${formatCurrency(calculatePay(shift))}</span>
      </div>
      <div class="shift-detail">
        <div class="detail-box"><strong>${shift.start}</strong><span>開始</span></div>
        <div class="detail-box"><strong>${shift.end}</strong><span>結束</span></div>
        <div class="detail-box"><strong>${calculateHours(shift).toFixed(2)}</strong><span>時數</span></div>
        <div class="detail-box"><strong>${formatCurrency(Number(shift.payRate))}</strong><span>薪資參數</span></div>
      </div>
      <div class="card-actions">
        <span class="muted">可回傳財政進行正式薪資結算</span>
        <div>
          <button class="small-button" type="button" data-action="editShift" data-id="${shift.id}">編輯</button>
          <button class="small-button" type="button" data-action="deleteShift" data-id="${shift.id}">刪除</button>
        </div>
      </div>
    `;
    elements.shiftList.append(card);
  });

  elements.shiftList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleShiftAction(button));
  });
}

function handleShiftAction(button) {
  const shift = state.shifts.find((entry) => entry.id === button.dataset.id);
  if (!shift) return;
  if (button.dataset.action === "editShift") return openShiftDialog(shift);
  if (button.dataset.action === "deleteShift") {
    const shouldDelete = confirm(`確定刪除 ${shift.teacher} 的排班嗎？`);
    if (!shouldDelete) return;
    state.shifts = state.shifts.filter((entry) => entry.id !== shift.id);
    deleteCloudShift(shift.id);
    saveState();
    renderAll();
  }
}

function openShiftDialog(shift = null) {
  elements.shiftForm.reset();
  elements.shiftDialogTitle.textContent = shift ? "編輯排班" : "新增排班";
  elements.shiftId.value = shift?.id || "";
  elements.shiftTeacher.value = shift?.teacher || getAssignableEmployees()[0]?.name || "";
  elements.shiftDate.value = shift?.date || currentDate();
  elements.shiftStart.value = shift?.start || "18:00";
  elements.shiftEnd.value = shift?.end || "21:00";
  elements.payType.value = shift?.payType || "hourly";
  elements.payRate.value = shift?.payRate || 220;
  elements.shiftDialog.showModal();
  elements.shiftTeacher.focus();
}

function saveShift(event) {
  event.preventDefault();
  const id = elements.shiftId.value || crypto.randomUUID();
  const existing = state.shifts.find((entry) => entry.id === id);
  const payload = {
    id,
    teacher: elements.shiftTeacher.value,
    date: elements.shiftDate.value,
    start: elements.shiftStart.value,
    end: elements.shiftEnd.value,
    payType: elements.payType.value,
    payRate: Number(elements.payRate.value),
  };

  if (existing) Object.assign(existing, payload);
  else state.shifts.unshift(payload);

  saveState();
  syncShiftToCloud(payload);
  elements.shiftDialog.close();
  renderAll();
}

function renderTeacherOptions() {
  const options = getAssignableEmployees().map((employee) => `<option value="${escapeHtml(employee.name)}">${escapeHtml(employee.name)}（${escapeHtml(employee.role)}）</option>`).join("");
  elements.assignmentTeacher.innerHTML = options;
  elements.shiftTeacher.innerHTML = options;
  elements.classTeacher.innerHTML = options;
}

function getAssignableEmployees() {
  const employees = state.employees.filter((employee) => ["主任", "教師"].includes(employee.role));
  return employees.length ? employees : structuredClone(defaultState.employees);
}

function renderEmployees() {
  elements.employeeList.innerHTML = "";

  if (state.employees.length === 0) {
    elements.employeeList.innerHTML = `<p class="muted">目前沒有員工資料。</p>`;
    return;
  }

  state.employees.forEach((employee) => {
    const card = document.createElement("article");
    card.className = "employee-card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapeHtml(employee.name)}</h3>
          <p class="muted">${escapeHtml(employee.note || "無備註")}</p>
        </div>
        <span class="tag">${escapeHtml(employee.role)}</span>
      </div>
      <div class="employee-detail">
        <div class="detail-box"><strong>${escapeHtml(employee.phone || "-")}</strong><span>聯絡電話</span></div>
        <div class="detail-box"><strong>${escapeHtml(employee.startDate || "-")}</strong><span>到職日期</span></div>
        <div class="detail-box"><strong>${relatedWorkCount(employee.name)}</strong><span>相關指派/排班</span></div>
      </div>
      <div class="card-actions">
        <span class="muted">員工資料會提供給班務指派與排班選單使用</span>
        <div>
          <button class="small-button" type="button" data-action="editEmployee" data-id="${employee.id}">編輯</button>
          <button class="small-button" type="button" data-action="deleteEmployee" data-id="${employee.id}">刪除</button>
        </div>
      </div>
    `;
    elements.employeeList.append(card);
  });

  elements.employeeList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleEmployeeAction(button));
  });
}

function renderClasses() {
  elements.classList.innerHTML = "";

  if (state.classes.length === 0) {
    elements.classList.innerHTML = `<p class="muted">目前沒有班級資料。</p>`;
    return;
  }

  state.classes.forEach((classItem) => {
    const card = document.createElement("article");
    card.className = "class-card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapeHtml(classItem.name)}</h3>
          <p class="muted">${escapeHtml(classItem.note || "無備註")}</p>
        </div>
        <span class="tag">${escapeHtml(classItem.grade)}</span>
      </div>
      <div class="class-detail">
        <div class="detail-box"><strong>${escapeHtml(classItem.teacher || "-")}</strong><span>指派老師</span></div>
        <div class="detail-box"><strong>星期${escapeHtml(classItem.day || "-")}</strong><span>上課日</span></div>
        <div class="detail-box"><strong>${escapeHtml(classItem.time || "-")}</strong><span>時段</span></div>
      </div>
      <div class="card-actions">
        <span class="muted">相關指派：${relatedClassAssignmentCount(classItem.id)} 筆</span>
        <div>
          <button class="small-button" type="button" data-action="editClass" data-id="${classItem.id}">編輯</button>
          <button class="small-button" type="button" data-action="deleteClass" data-id="${classItem.id}">刪除</button>
        </div>
      </div>
    `;
    elements.classList.append(card);
  });

  elements.classList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleClassAction(button));
  });
}

function handleClassAction(button) {
  const classItem = state.classes.find((entry) => entry.id === button.dataset.id);
  if (!classItem) return;

  if (button.dataset.action === "editClass") {
    openClassDialog(classItem);
    return;
  }

  if (button.dataset.action === "deleteClass") {
    const count = relatedClassAssignmentCount(classItem.id);
    const warning = count > 0 ? `此班級仍有 ${count} 筆相關指派，刪除後這些指派會改為未關聯班級。` : "";
    const shouldDelete = confirm(`確定刪除「${classItem.name}」嗎？${warning}`);
    if (!shouldDelete) return;
    state.classes = state.classes.filter((entry) => entry.id !== classItem.id);
    state.assignments.forEach((assignment) => {
      if (assignment.classId === classItem.id) assignment.classId = "";
    });
    saveState();
    renderClassOptions();
    renderAll();
  }
}

function openClassDialog(classItem = null) {
  elements.classForm.reset();
  elements.classDialogTitle.textContent = classItem ? "編輯班級" : "新增班級";
  elements.classId.value = classItem?.id || "";
  elements.className.value = classItem?.name || "";
  elements.classGrade.value = classItem?.grade || "1年級";
  elements.classTeacher.value = classItem?.teacher || getAssignableEmployees()[0]?.name || "";
  elements.classDay.value = classItem?.day || "一";
  elements.classTime.value = classItem?.time || "";
  elements.classNote.value = classItem?.note || "";
  elements.classDialog.showModal();
  elements.className.focus();
}

function saveClass(event) {
  event.preventDefault();
  const id = elements.classId.value || crypto.randomUUID();
  const existing = state.classes.find((entry) => entry.id === id);
  const payload = {
    id,
    name: elements.className.value.trim(),
    grade: elements.classGrade.value,
    teacher: elements.classTeacher.value,
    day: elements.classDay.value,
    time: elements.classTime.value.trim(),
    note: elements.classNote.value.trim(),
  };

  if (existing) Object.assign(existing, payload);
  else state.classes.push(payload);

  saveState();
  elements.classDialog.close();
  renderClassOptions();
  renderAll();
}

function renderClassOptions() {
  const options = [`<option value="">未關聯班級</option>`]
    .concat(state.classes.map((classItem) => `<option value="${classItem.id}">${escapeHtml(classItem.name)}（${escapeHtml(classItem.teacher || "未指派")}）</option>`))
    .join("");
  elements.assignmentClass.innerHTML = options;
}

function renderClassGradeOptions() {
  elements.classGrade.innerHTML = grades.map((grade) => `<option value="${grade}">${grade}</option>`).join("");
}

function relatedClassAssignmentCount(classId) {
  return state.assignments.filter((assignment) => assignment.classId === classId).length;
}

function getClassName(classId) {
  if (!classId) return "未關聯班級";
  return state.classes.find((classItem) => classItem.id === classId)?.name || "班級已刪除";
}

function handleEmployeeAction(button) {
  const employee = state.employees.find((entry) => entry.id === button.dataset.id);
  if (!employee) return;

  if (button.dataset.action === "editEmployee") {
    openEmployeeDialog(employee);
    return;
  }

  if (button.dataset.action === "deleteEmployee") {
    const count = relatedWorkCount(employee.name);
    const warning = count > 0 ? `此員工仍有 ${count} 筆相關指派/排班，刪除後既有紀錄會保留姓名但不再出現在新選單。` : "";
    const shouldDelete = confirm(`確定刪除「${employee.name}」嗎？${warning}`);
    if (!shouldDelete) return;
    state.employees = state.employees.filter((entry) => entry.id !== employee.id);
    saveState();
    renderTeacherOptions();
    renderAll();
  }
}

function openEmployeeDialog(employee = null) {
  elements.employeeForm.reset();
  elements.employeeDialogTitle.textContent = employee ? "編輯員工" : "新增員工";
  elements.employeeId.value = employee?.id || "";
  elements.employeeName.value = employee?.name || "";
  elements.employeeRole.value = employee?.role || "教師";
  elements.employeePhone.value = employee?.phone || "";
  elements.employeeStartDate.value = employee?.startDate || currentDate();
  elements.employeeNote.value = employee?.note || "";
  elements.employeeDialog.showModal();
  elements.employeeName.focus();
}

function saveEmployee(event) {
  event.preventDefault();
  const id = elements.employeeId.value || crypto.randomUUID();
  const existing = state.employees.find((entry) => entry.id === id);
  const oldName = existing?.name;
  const payload = {
    id,
    name: elements.employeeName.value.trim(),
    role: elements.employeeRole.value,
    phone: elements.employeePhone.value.trim(),
    startDate: elements.employeeStartDate.value,
    note: elements.employeeNote.value.trim(),
  };

  if (existing) {
    Object.assign(existing, payload);
    if (oldName && oldName !== payload.name) updateRelatedEmployeeNames(oldName, payload.name);
  } else {
    state.employees.push(payload);
  }

  saveState();
  elements.employeeDialog.close();
  renderTeacherOptions();
  renderAll();
}

function relatedWorkCount(employeeName) {
  return (
    state.assignments.filter((assignment) => assignment.teacher === employeeName).length +
    state.shifts.filter((shift) => shift.teacher === employeeName).length
  );
}

function updateRelatedEmployeeNames(oldName, newName) {
  state.assignments.forEach((assignment) => {
    if (assignment.teacher === oldName) assignment.teacher = newName;
  });
  state.shifts.forEach((shift) => {
    if (shift.teacher === oldName) shift.teacher = newName;
  });
  state.classes.forEach((classItem) => {
    if (classItem.teacher === oldName) classItem.teacher = newName;
  });
}

function calculateHours(shift) {
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  return Math.max(0, end - start) / 60;
}

function calculatePay(shift) {
  if (shift.payType === "monthly") return Number(shift.payRate);
  return calculateHours(shift) * Number(shift.payRate);
}

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function dayFromDate(value) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return dayNames[date.getDay()];
}

function setAssignmentDayFromDate() {
  elements.assignmentDay.value = `星期${dayFromDate(elements.assignmentDate.value)}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
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
