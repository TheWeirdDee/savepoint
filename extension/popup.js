// Thin sensor. Captures the same shared packet the workspace sends, then POSTs
// to /api/save-points with the signed-in user's token. No dashboard, no AI
// output here — restore lives in the calm workspace by design.

const DEFAULT_API_BASE = "https://savepoint-seven.vercel.app";
const LEGACY_API_BASE = "http://localhost:3000";

const show = (id) => {
  document.querySelectorAll("section").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

async function getConfig() {
  const { apiBase, token, user, lastSavePointId } =
    await chrome.storage.local.get(["apiBase", "token", "user", "lastSavePointId"]);
  const resolvedBase =
    !apiBase || apiBase.replace(/\/$/, "") === LEGACY_API_BASE
      ? DEFAULT_API_BASE
      : apiBase.replace(/\/$/, "");
  if (resolvedBase !== apiBase) {
    await chrome.storage.local.set({ apiBase: resolvedBase });
  }
  return {
    apiBase: resolvedBase,
    token: token || null,
    user: user || null,
    lastSavePointId: lastSavePointId || null,
  };
}

function showAccount(user) {
  const text = user?.username ? `Saving to account: ${user.username}` : "";
  document.getElementById("account-label").textContent = text;
  document.getElementById("saved-account-label").textContent = text;
}

async function refreshAccount(apiBase, token) {
  if (!token) return null;
  try {
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    await chrome.storage.local.set({ user: data.user });
    return data.user;
  } catch {
    return null;
  }
}

function showLoginError(message) {
  const el = document.getElementById("login-error");
  el.textContent = message;
  el.classList.remove("hidden");
}

async function login() {
  const { apiBase } = await getConfig();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  document.getElementById("login-error").classList.add("hidden");

  if (!username || !password) {
    showLoginError("Enter your username and password.");
    return;
  }

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      showLoginError(data.error || "Username or password is incorrect.");
      return;
    }
    await chrome.storage.local.set({ token: data.token, user: data.user });
    showAccount(data.user);
    document.getElementById("login-password").value = "";
    show("ready");
  } catch {
    showLoginError(
      "Couldn't reach your workspace. Check the workspace address in settings."
    );
  }
}

async function logout() {
  await chrome.storage.local.remove(["token", "user", "lastSavePointId"]);
  show("login");
}

// Runs in the page to grab selection, a short snippet, and the meta description.
function collectFromPage() {
  const selection = (window.getSelection && window.getSelection().toString()) || "";
  const meta =
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content ||
    "";
  const snippet = (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 1200);
  return { selection, meta, snippet };
}

async function captureActiveContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let page = { selection: "", meta: "", snippet: "" };
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectFromPage,
    });
    if (res?.result) page = res.result;
  } catch {
    // Some pages (chrome://, store) block scripting — degrade gracefully.
  }

  const windowTabs = await chrome.tabs.query({ currentWindow: true });
  const openTabs = windowTabs
    .filter((t) => t.url && !t.url.startsWith("chrome"))
    .map((t) => ({ title: t.title || "", url: t.url || "" }))
    .slice(0, 15);

  return {
    activeContext: {
      title: tab.title || "",
      url: tab.url || "",
      selectedText: page.selection || undefined,
      visibleTextSnippet: page.meta
        ? `${page.meta}\n${page.snippet}`
        : page.snippet || undefined,
    },
    openTabs,
  };
}

async function save() {
  const { apiBase, token } = await getConfig();
  if (!token) return show("login");

  show("saving");
  try {
    const { activeContext, openTabs } = await captureActiveContext();
    const note = document.getElementById("note").value.trim();

    const capture = {
      source: "extension",
      userNote: note || undefined,
      activeContext,
      openTabs,
      workspaceContext: {},
    };

    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/save-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ capture }),
    });

    if (res.status === 401) {
      // The session expired or was revoked — ask them to sign in again.
      await chrome.storage.local.remove("token");
      show("login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Workspace returned ${res.status}.`);
    }
    const savePointId = data.savePoint?.id || null;
    await chrome.storage.local.set({ lastSavePointId: savePointId });
    const { user } = await getConfig();
    showAccount(user);
    show("saved");
  } catch (error) {
    document.getElementById("error-text").textContent =
      error instanceof Error
        ? error.message
        : "Couldn't reach your workspace. Check settings, then try once more.";
    show("error");
  }
}

async function init() {
  const { apiBase, token, user } = await getConfig();
  let resolvedUser = user;
  if (token && !resolvedUser) {
    resolvedUser = await refreshAccount(apiBase, token);
  }
  showAccount(resolvedUser);
  show(token ? "ready" : "login");

  document.getElementById("login-submit").addEventListener("click", login);
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
  document
    .getElementById("open-workspace-signup")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const { apiBase } = await getConfig();
      chrome.tabs.create({ url: `${apiBase.replace(/\/$/, "")}/signup` });
    });
  document.getElementById("open-options-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("save").addEventListener("click", save);
  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
  document.getElementById("retry").addEventListener("click", save);
  document.getElementById("open-workspace").addEventListener("click", async () => {
    const { apiBase, lastSavePointId } = await getConfig();
    const target = lastSavePointId
      ? `${apiBase}/workspace?point=${encodeURIComponent(lastSavePointId)}`
      : `${apiBase}/workspace`;
    chrome.tabs.create({ url: target });
  });

  document.getElementById("note").addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  });
}

init();
