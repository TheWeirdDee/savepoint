"use client";

import { FormEvent, useEffect, useState } from "react";
import type { UserMemory } from "@/lib/types";
import {
  deleteUserMemory,
  listUserMemory,
  updateUserMemory,
} from "@/lib/client";

export function MemoryPanel() {
  const [open, setOpen] = useState(false);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => listUserMemory().then(setMemories).catch(() => {
      /* The panel remains quiet if the migration has not been applied yet. */
    });
    refresh();
    window.addEventListener("savepoint-memory-changed", refresh);
    return () => window.removeEventListener("savepoint-memory-changed", refresh);
  }, []);

  async function saveEdit(event: FormEvent, id: string) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusyId(id);
    setError("");
    try {
      const updated = await updateUserMemory(id, draft.trim());
      setMemories((items) => items.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that memory.");
    } finally {
      setBusyId(null);
    }
  }

  async function forget(id: string) {
    setBusyId(id);
    setError("");
    try {
      await deleteUserMemory(id);
      setMemories((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not forget that memory.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-card border border-line bg-mist p-4">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="user-memory-panel"
        className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wide text-ink-soft"
      >
        What Save Point remembers
        <span aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`}>
          ▸
        </span>
      </button>

      {open && (
        <div id="user-memory-panel" className="mt-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            Only words you explicitly confirmed or typed appear here. Edit or forget
            anything at any time.
          </p>
          {memories.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Nothing remembered yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {memories.map((memory) => (
                <li key={memory.id} className="rounded-lg bg-paper p-3 text-sm">
                  {editingId === memory.id ? (
                    <form onSubmit={(event) => saveEdit(event, memory.id)}>
                      <label htmlFor={`memory-${memory.id}`} className="sr-only">
                        Edit remembered fact
                      </label>
                      <textarea
                        id={`memory-${memory.id}`}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-line bg-mist p-2 text-ink focus:border-sage focus:outline-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={busyId === memory.id || !draft.trim()}
                          className="font-bold text-sage disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-ink-soft">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="text-ink">{memory.text}</p>
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => {
                            setEditingId(memory.id);
                            setDraft(memory.text);
                          }}
                          className="text-ink-soft underline underline-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => forget(memory.id)}
                          disabled={busyId === memory.id}
                          className="text-ask underline underline-offset-2 disabled:opacity-60"
                        >
                          {busyId === memory.id ? "Forgetting…" : "Forget"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-ask">{error}</p>}
        </div>
      )}
    </div>
  );
}
