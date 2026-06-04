const PASSWORD = "A@12345678";

const users = {
  mark: {
    displayName: "mark",
    roles: ["主任"],
  },
  carey: {
    displayName: "carey",
    roles: ["主任", "財政"],
  },
  william: {
    displayName: "william",
    roles: ["教師", "總務"],
  },
};

const roleDetails = {
  主任: {
    status: "已可使用",
    description: "主任介面已提供教室日誌回饋、待辦指派、學生出勤控制與排班薪資估算。",
    features: ["教室日誌回饋", "指派待辦事項", "學生到班出勤控制", "排班與薪資計算"],
    launchUrl: "../主任/index.html",
  },
  教師: {
    status: "已可使用",
    description: "教師介面已提供時間軸、教室日誌、待辦勾選、學生出缺勤與打卡系統。",
    features: ["每週待辦時間軸", "教室日誌填寫", "待辦事項勾選", "學生出缺勤與訂餐", "上下班打卡"],
    launchUrl: "../教師/index.html",
  },
  總務: {
    status: "已可使用",
    description: "總務行政目前已完成備品清點、自由新增項目、低庫存提醒與門檻調整。",
    features: ["備品清點", "新增與編輯備品", "低於門檻自動提醒", "搜尋與狀態篩選"],
    launchUrl: "../總務/index.html",
  },
  財政: {
    status: "已可使用",
    description: "財政介面已提供主任排班薪資接收、勞健保與全勤調整、小計算機與收入支出記帳。",
    features: ["教師薪資接收", "勞健保與全勤調整", "小計算機", "收入支出與利潤合計"],
    launchUrl: "../財政/index.html",
  },
};

const elements = {
  loginPanel: document.querySelector("#loginPanel"),
  rolePanel: document.querySelector("#rolePanel"),
  loginForm: document.querySelector("#loginForm"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  errorMessage: document.querySelector("#errorMessage"),
  welcomeText: document.querySelector("#welcomeText"),
  roleTabs: document.querySelector("#roleTabs"),
  roleContent: document.querySelector("#roleContent"),
  logoutButton: document.querySelector("#logoutButton"),
  accountButtons: document.querySelectorAll("[data-account]"),
};

let currentUser = null;
let currentRole = null;

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await login(elements.username.value.trim(), elements.password.value);
});

elements.logoutButton.addEventListener("click", () => {
  currentUser = null;
  currentRole = null;
  localStorage.removeItem("cram-school-supabase-session");
  elements.rolePanel.classList.add("hidden");
  elements.loginPanel.classList.remove("hidden");
  elements.password.value = "";
  elements.errorMessage.textContent = "";
  elements.username.focus();
});

elements.accountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.username.value = button.dataset.account;
    elements.password.value = PASSWORD;
    elements.errorMessage.textContent = "";
  });
});

async function login(username, password) {
  if (window.cloudStore?.isEnabled()) {
    await loginWithSupabase(username, password);
    return;
  }

  const user = users[username.toLowerCase()];

  if (!user || password !== PASSWORD) {
    elements.errorMessage.textContent = "帳號或密碼錯誤，請確認測試帳號與共用密碼。";
    return;
  }

  currentUser = user;
  currentRole = user.roles[0];
  localStorage.setItem("cram-school-current-user", user.displayName);
  elements.loginPanel.classList.add("hidden");
  elements.rolePanel.classList.remove("hidden");
  elements.welcomeText.textContent = `${user.displayName} 已登入，偵測到身分：${user.roles.join("、")}。`;
  renderRoleTabs();
  renderRoleContent();
}

async function loginWithSupabase(username, password) {
  elements.errorMessage.textContent = "登入中...";

  try {
    const email = normalizeLoginEmail(username);
    const session = await window.cloudStore.signIn(email, password);
    const profile = await window.cloudStore.getProfile(session.access_token, session.user.id);

    if (!profile) {
      elements.errorMessage.textContent = "登入成功，但尚未建立角色資料，請檢查 profiles 表。";
      return;
    }

    const roleList = getProfileRoles(profile);
    currentUser = {
      displayName: profile.display_name || profile.username,
      roles: roleList,
    };
    currentRole = roleList[0];
    localStorage.setItem("cram-school-current-user", profile.username);
    localStorage.setItem("cram-school-current-role", currentRole);
    localStorage.setItem(
      "cram-school-supabase-session",
      JSON.stringify({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        userId: session.user.id,
        username: profile.username,
        displayName: profile.display_name,
        roles: roleList,
      })
    );
    elements.loginPanel.classList.add("hidden");
    elements.rolePanel.classList.remove("hidden");
    elements.errorMessage.textContent = "";
    elements.welcomeText.textContent = `${currentUser.displayName} 已登入雲端資料庫，偵測到身分：${roleList.join("、")}。`;
    renderRoleTabs();
    renderRoleContent();
  } catch (error) {
    elements.errorMessage.textContent = "雲端登入失敗，請確認 email、密碼與 Supabase 設定。";
  }
}

function normalizeLoginEmail(username) {
  return username.includes("@") ? username : `${username.toLowerCase()}@example.com`;
}

function getProfileRoles(profile) {
  const fallbackRoles = users[profile.username]?.roles;
  if (fallbackRoles?.length) return fallbackRoles;
  return [profile.role].filter(Boolean);
}

function renderRoleTabs() {
  elements.roleTabs.innerHTML = "";

  currentUser.roles.forEach((role) => {
    const button = document.createElement("button");
    button.className = `role-tab${role === currentRole ? " active" : ""}`;
    button.type = "button";
    button.role = "tab";
    button.textContent = role;
    button.setAttribute("aria-selected", role === currentRole ? "true" : "false");

    button.addEventListener("click", () => {
      currentRole = role;
      renderRoleTabs();
      renderRoleContent();
    });

    elements.roleTabs.append(button);
  });
}

function renderRoleContent() {
  const detail = roleDetails[currentRole];
  const features = detail.features.map((feature) => `<li>${feature}</li>`).join("");
  const action = detail.launchUrl
    ? `<a class="launch-button" href="${detail.launchUrl}">進入${currentRole}介面</a><a class="launch-button secondary-launch" href="../檔案中心/index.html">進入檔案中心</a>`
    : `<div class="pending-note">此角色功能尚未開發，後續可依需求逐步補上。</div>`;

  elements.roleContent.innerHTML = `
    <article class="role-card">
      <div>
        <h2>${currentRole}介面</h2>
        <p class="lead">${detail.description}</p>
        <ul class="feature-list">${features}</ul>
      </div>
      <aside class="role-status">
        <strong>狀態：${detail.status}</strong>
        <span>${detail.launchUrl ? "可直接開啟已完成模組。" : "目前為入口佔位。"}</span>
        ${action}
      </aside>
    </article>
  `;
}
