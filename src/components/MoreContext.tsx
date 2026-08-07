"use client";

import { useState } from "react";
import type { SavePoint, ReconstructedState } from "@/lib/types";

// Everything the student does NOT need in the first doorway back lives here,
// folded away. Progressive disclosure is the whole point: no wall of open tabs.

export function MoreContext({
  savePoint,
  reconstruction,
}: {
  savePoint: SavePoint;
  reconstruction: ReconstructedState;
}) {
  const [open, setOpen] = useState(false);

  const hasThreads = reconstruction.openThreads.length > 0;
  const hasTabs = savePoint.openTabs.length > 0;
  const hasNote = !!savePoint.userNote?.trim();

  return (
    <div className="mt-8 border-t border-line pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="more-context-panel"
        className="flex items-center gap-2 text-ink-soft hover:text-ink transition-colors"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        More context
      </button>

      {open && (
        <div id="more-context-panel" className="mt-4 space-y-6 text-ink-soft">
          {hasThreads && (
            <section>
              <h3 className="text-sm font-bold text-ink">Other open threads</h3>
              <ul className="mt-2 space-y-1">
                {reconstruction.openThreads.map((t, i) => (
                  <li key={i}>
                    {t.text}
                    {t.relevance !== "primary" && (
                      <span className="text-ink-soft"> · {t.relevance}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reconstruction.objective.text && (
            <section>
              <h3 className="text-sm font-bold text-ink">Your goal</h3>
              <p className="mt-2">{reconstruction.objective.text}</p>
            </section>
          )}

          {hasNote && (
            <section>
              <h3 className="text-sm font-bold text-ink">The note you left</h3>
              <p className="mt-2 italic">&ldquo;{savePoint.userNote}&rdquo;</p>
            </section>
          )}

          {hasTabs && (
            <section>
              <h3 className="text-sm font-bold text-ink">Pages that were open</h3>
              <ul className="mt-2 space-y-1">
                {savePoint.openTabs.map((tab, i) => (
                  <li key={i}>
                    <a
                      href={tab.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sage hover:opacity-80 underline underline-offset-2"
                    >
                      {tab.title || tab.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
