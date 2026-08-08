const DEFAULT_API_BASE = "https://savepoint-seven.vercel.app";
const LEGACY_API_BASE = "http://localhost:3000";

async function load() {
  const { apiBase } = await chrome.storage.local.get(["apiBase"]);
  const resolvedBase =
    !apiBase || apiBase.replace(/\/$/, "") === LEGACY_API_BASE
      ? DEFAULT_API_BASE
      : apiBase.replace(/\/$/, "");
  if (resolvedBase !== apiBase) {
    await chrome.storage.local.set({ apiBase: resolvedBase });
  }
  document.getElementById("apiBase").value = resolvedBase;
}

async function save() {
  const raw = document.getElementById("apiBase").value.trim() || DEFAULT_API_BASE;
  const apiBase = raw.replace(/\/$/, "");
  try {
    const url = new URL(apiBase);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    const note = document.getElementById("savedNote");
    note.textContent = "Enter a complete http:// or https:// address.";
    note.classList.remove("hidden");
    return;
  }
  await chrome.storage.local.set({ apiBase });
  document.getElementById("apiBase").value = apiBase;
  const note = document.getElementById("savedNote");
  note.textContent = "Saved.";
  note.classList.remove("hidden");
  setTimeout(() => note.classList.add("hidden"), 2000);
}

document.getElementById("save").addEventListener("click", save);
load();
