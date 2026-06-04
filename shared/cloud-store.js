(function () {
  const config = window.SUPABASE_CONFIG;

  function isEnabled() {
    return Boolean(config?.url && config?.anonKey && !config.url.includes("YOUR_PROJECT_ID"));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("cram-school-supabase-session") || "null");
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    if (!isEnabled()) {
      throw new Error("Supabase is not configured.");
    }

    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${getSession()?.accessToken || config.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed: ${response.status} ${detail}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function authRequest(path, body) {
    if (!isEnabled()) {
      throw new Error("Supabase is not configured.");
    }

    const response = await fetch(`${config.url}/auth/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase auth failed: ${response.status} ${detail}`);
    }

    return response.json();
  }

  async function authenticatedRequest(path, accessToken, options = {}) {
    if (!isEnabled()) {
      throw new Error("Supabase is not configured.");
    }

    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed: ${response.status} ${detail}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  window.cloudStore = {
    isEnabled,
    list(table, query = "select=*") {
      return request(`${table}?${query}`);
    },
    insert(table, row) {
      return request(table, {
        method: "POST",
        body: JSON.stringify(row),
      });
    },
    upsert(table, row, onConflict = "id") {
      return request(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
      });
    },
    update(table, id, row) {
      return request(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(row),
      });
    },
    remove(table, id) {
      return request(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    async signIn(email, password) {
      return authRequest("token?grant_type=password", {
        email,
        password,
      });
    },
    async getProfile(accessToken, userId) {
      const rows = await authenticatedRequest(`profiles?id=eq.${encodeURIComponent(userId)}&select=*`, accessToken);
      return rows[0] || null;
    },
  };
})();
