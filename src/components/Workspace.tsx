"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SavePoint, SavePointCapture, ReconstructOutcome, AuthUser } from "@/lib/types";
import {
  buildWorkspaceCapture,
  createSavePoint,
  listSavePoints,
  restoreSavePoint,
  loadDraft,
  saveDraft,
  markDocSaved,
  logout,
} from "@/lib/client";
import { SavePointButton } from "./SavePointButton";
import { RestoreOffer } from "./RestoreOffer";
import { RestoreCard } from "./RestoreCard";
import { SavePointList } from "./SavePointList";
import { AccessibilityBar } from "./AccessibilityBar";
import { PendingCaptureCard } from "./PendingCaptureCard";

// What the mobile bookmarklet (see /docs) packs into ?capture= — the same
// scope as the extension's activeContext, nothing more.
type BookmarkletCapture = {
  title?: string;
  url?: string;
  selectedText?: string;
  visibleTextSnippet?: string;
};

type View =
  | { mode: "writing" }
  | { mode: "restoring"; savePoint: SavePoint }
  | { mode: "restored"; savePoint: SavePoint; outcome: ReconstructOutcome };

export function Workspace({ user }: { user: AuthUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savePoints, setSavePoints] = useState<SavePoint[]>([]);
  const [offer, setOffer] = useState<SavePoint | null>(null);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [view, setView] = useState<View>({ mode: "writing" });
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<BookmarkletCapture | null>(null);

  // Load draft + past save points on mount. The unrestored one becomes the offer.
  useEffect(() => {
    const draft = loadDraft();
    setTitle(draft.title);
    setContent(draft.content);
    listSavePoints()
      .then(({ savePoints, latestUnrestored }) => {
        setSavePoints(savePoints);
        if (latestUnrestored) setOffer(latestUnrestored);
      })
      .catch(() => {
        /* offline / not configured — workspace still usable */
      });
  }, []);

  // Persist the draft as they type so the workspace itself survives a reload.
  useEffect(() => {
    const t = setTimeout(() => saveDraft(title, content), 400);
    return () => clearTimeout(t);
  }, [title, content]);

  // The mobile bookmarklet fallback (see /docs) lands here with ?capture=,
  // since it has no way to authenticate directly the way the extension does
  // (a bookmarklet runs on a third-party page and can't read this site's
  // httpOnly session cookie). It hands off the captured context instead, and
  // this workspace — already signed in — turns it into a real save point.
  useEffect(() => {
    const raw = searchParams.get("capture");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BookmarkletCapture;
      setPendingCapture(parsed);
    } catch {
      /* malformed or tampered-with param — best-effort, fail silently */
    }
    router.replace("/workspace");
  }, [searchParams, router]);

  const handleSaveCapture = useCallback(
    async (note: string) => {
      if (!pendingCapture) return;
      const capture: SavePointCapture = {
        source: "extension",
        userNote: note.trim() || undefined,
        activeContext: {
          title: pendingCapture.title,
          url: pendingCapture.url,
          selectedText: pendingCapture.selectedText,
          visibleTextSnippet: pendingCapture.visibleTextSnippet,
        },
        openTabs: [],
        workspaceContext: {},
      };
      const sp = await createSavePoint(capture);
      setSavePoints((prev) => [sp, ...prev]);
      setPendingCapture(null);
    },
    [pendingCapture]
  );

  const handleSave = useCallback(
    async (note: string) => {
      const capture = buildWorkspaceCapture(title, content, note);
      const sp = await createSavePoint(capture);
      markDocSaved(content);
      setSavePoints((prev) => [sp, ...prev]);
      setOffer(null);
    },
    [title, content]
  );

  const openRestore = useCallback(async (sp: SavePoint, force = false) => {
    setView({ mode: "restoring", savePoint: sp });
    setOffer(null);
    // restoreSavePoint never throws — it always resolves to a ReconstructOutcome,
    // so a real failure renders its own honest card instead of silently
    // bouncing back to the writing view.
    const outcome = await restoreSavePoint(sp.id, force);
    setView({ mode: "restored", savePoint: sp, outcome });
    if (outcome.ok) {
      setSavePoints((prev) =>
        prev.map((p) => (p.id === sp.id ? { ...p, restored: true } : p))
      );
    }
  }, []);

  // A failed reconstruction is never cached, so retrying just re-runs the
  // same restore — no special "force" flag needed for that case, but
  // passing force=true also lets someone deliberately ask for a fresh take
  // on an already-restored point (e.g. after adding more context).
  const retryRestore = useCallback(
    (sp: SavePoint) => openRestore(sp, true),
    [openRestore]
  );

  const backToWriting = useCallback(() => setView({ mode: "writing" }), []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <div className="wrap py-8 sm:py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 font-mono text-base font-bold text-ink">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
          Save&nbsp;Point
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-soft">
            Signed in as <span className="font-bold text-ink">{user.username}</span>
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[280px_1fr]">
        {/* LEFT RAIL */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <button
            onClick={backToWriting}
            className="w-full rounded-lg border border-line bg-mist px-4 py-3 text-left font-bold text-ink transition-colors hover:border-sage"
          >
            ＋ New save point
          </button>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
              Your save points
            </h2>
            <SavePointList savePoints={savePoints} onOpen={openRestore} />
          </div>

          <AccessibilityBar variant="inline" />

          <div className="rounded-card border border-line bg-mist p-4 text-sm text-ink-soft">
            <p className="font-bold text-ink-soft">Using the desktop extension?</p>
            <p className="mt-1.5">
              Install it, open it, and sign in with the same username — it links
              automatically. No codes to copy.
            </p>
            <a
              href="/docs#extension"
              className="mt-2 inline-block text-sage underline underline-offset-2"
            >
              Load the extension
            </a>
          </div>
        </aside>

        {/* MAIN PANE */}
        <main className="min-w-0">
          {/* Landing spot for the mobile bookmarklet fallback */}
          {pendingCapture && view.mode === "writing" && (
            <div className="mb-6">
              <PendingCaptureCard
                capture={pendingCapture}
                onSave={handleSaveCapture}
                onDiscard={() => setPendingCapture(null)}
              />
            </div>
          )}

          {/* On-load restore offer — a quiet banner, not a takeover */}
          {offer && !offerDismissed && view.mode === "writing" && (
            <div className="mb-6">
              <RestoreOffer
                savePoint={offer}
                onRestore={() => openRestore(offer)}
                onDismiss={() => setOfferDismissed(true)}
              />
            </div>
          )}

          {view.mode === "restoring" && (
            <div
              role="status"
              className="rounded-card bg-mist p-10 text-center text-ink-soft shadow-card"
            >
              Picking up your thread…
            </div>
          )}

          {view.mode === "restored" && (
            <div className="space-y-4">
              <RestoreCard
                savePoint={view.savePoint}
                outcome={view.outcome}
                onRetry={() => retryRestore(view.savePoint)}
              />
              <button
                onClick={backToWriting}
                className="text-ink-soft transition-colors hover:text-ink"
              >
                ← Back to writing
              </button>
            </div>
          )}

          {view.mode === "writing" && (
            <section className="rounded-card bg-mist p-6 shadow-card sm:p-8">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on? (e.g. Biology report)"
                aria-label="Document title"
                className="w-full bg-transparent text-lg font-bold text-ink placeholder:text-ink-soft/60 focus:outline-none"
              />
              <div className="my-4 h-px bg-line" />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write, research, think here. When you need to step away, save your place below — I'll hold the thread so you don't have to."
                aria-label="Your work"
                rows={16}
                className="w-full resize-none bg-transparent text-ink placeholder:text-ink-soft/50 focus:outline-none"
              />
              <div className="mt-6">
                <SavePointButton onSave={handleSave} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
