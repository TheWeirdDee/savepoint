const DEFAULT_API_BASE = "http://localhost:3000";

async function load() {
  const { apiBase } = await chrome.storage.local.get(["apiBase"]);
  document.getElementById("apiBase").value = apiBase || DEFAULT_API_BASE;
}

async function save() {
  const apiBase =
    document.getElementById("apiBase").value.trim() || DEFAULT_API_BASE;
  await chrome.storage.local.set({ apiBase });
  const note = document.getElementById("savedNote");
  note.classList.remove("hidden");
  setTimeout(() => note.classList.add("hidden"), 2000);
}

document.getElementById("save").addEventListener("click", save);
load();
