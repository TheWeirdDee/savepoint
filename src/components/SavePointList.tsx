"use client";

import { useState } from "react";
import type { SavePoint } from "@/lib/types";
import { savePointLabel } from "@/lib/client";

// Progressive disclosure applies to history too: showing the entire list by
// default made the rail grow taller with every save, shoving the reading
// settings and extension note further down the page each time. Show a
// short, fixed set up front; anything past that is one deliberate tap away.
const VISIBLE_COUNT = 5;

export function SavePointList({
  savePoints,
  onOpen,
  onDelete,
  onSeeExample,
}: {
  savePoints: SavePoint[];
  onOpen: (sp: SavePoint) => void;
  onDelete: (sp: SavePoint) => Promise<void>;
  onSeeExample?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(sp: SavePoint) {
    if (
      !window.confirm(
        `Delete “${savePointLabel(sp)}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(sp.id);
    setDeleteError("");
    try {
      await onDelete(sp);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete this save point."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (savePoints.length === 0) {
    return (
      <div>
        <p className="text-sm text-ink-soft">
          No save points yet. When you&apos;re deep in something and need to
          step away, save your place — I&apos;ll hold the thread.
        </p>
        {onSeeExample && (
          <p className="mt-2 text-sm text-ink-soft">
            New here?{" "}
            <button
              onClick={onSeeExample}
              className="font-bold text-sage underline underline-offset-2"
            >
              See an example restore
            </button>{" "}
            to watch it in action.
          </p>
        )}
      </div>
    );
  }

  const visible = showAll ? savePoints : savePoints.slice(0, VISIBLE_COUNT);
  const hiddenCount = savePoints.length - visible.length;

  return (
    <div>
      <ul
        className={`space-y-2 ${
          showAll ? "max-h-[46vh] overflow-y-auto pr-1 lg:max-h-[52vh]" : ""
        }`}
      >
        {visible.map((sp) => (
          <li
            key={sp.id}
            className="flex overflow-hidden rounded-lg border border-line bg-paper transition-colors hover:border-sage"
          >
            <button
              onClick={() => onOpen(sp)}
              className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-3 text-left"
            >
              <span className="line-clamp-2 text-sm text-ink">
                {savePointLabel(sp)}
              </span>
              <span className="text-xs text-ink-soft">
                {sp.restored ? "revisit" : "restore →"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(sp)}
              disabled={deletingId === sp.id}
              aria-label={`Delete ${savePointLabel(sp)}`}
              className="shrink-0 border-l border-line px-3 text-xs font-bold text-ink-soft transition-colors hover:bg-mist hover:text-ink disabled:opacity-50"
            >
              {deletingId === sp.id ? "Deleting…" : "Delete"}
            </button>
          </li>
        ))}
      </ul>

      {deleteError && (
        <p role="alert" className="mt-2 text-xs text-ask">
          {deleteError}
        </p>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden>▸</span>
          Show all {savePoints.length} save points
        </button>
      )}

      {showAll && savePoints.length > VISIBLE_COUNT && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden className="rotate-90 inline-block">▸</span>
          Show fewer
        </button>
      )}
    </div>
  );
}
