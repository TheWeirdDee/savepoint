"use client";

import { FormEvent, useState } from "react";
import type {
  ReconstructionEvidence,
  ReconstructedField,
  ReconstructedState,
  ReconstructFailureKind,
  ReconstructOutcome,
  SavePoint,
} from "@/lib/types";
import { correctDecision } from "@/lib/client";
import { ConfidenceLine } from "./ConfidenceLine";
import { MoreContext } from "./MoreContext";

export function RestoreCard({
  savePoint,
  outcome,
  onRetry,
  onAddContext,
  onTakeBack,
  onSavePointUpdated,
  readOnly,
}: {
  savePoint: SavePoint;
  outcome: ReconstructOutcome;
  onRetry?: () => void;
  onAddContext?: (answer: string, remember: boolean) => Promise<void>;
  onTakeBack?: () => void;
  onSavePointUpdated?: (savePoint: SavePoint) => void;
  readOnly?: boolean;
}) {
  if (!outcome.ok) {
    return <FailureCard kind={outcome.kind} message={outcome.message} onRetry={onRetry} />;
  }

  const reconstruction = outcome.state;
  if (reconstruction.lowContext) {
    return (
      <LowContextCard
        savePoint={savePoint}
        reconstruction={reconstruction}
        onAddContext={onAddContext}
      />
    );
  }

  const toConfirmIndex = reconstruction.decisions.findIndex((d) => d.needsConfirmation);
  const toConfirm = toConfirmIndex >= 0 ? reconstruction.decisions[toConfirmIndex] : null;
  const primaryThread =
    reconstruction.openThreads.find((thread) => thread.relevance === "primary") ?? null;

  return (
    <article className="animate-rise max-w-read rounded-card bg-mist shadow-card">
      <div className="relative p-8 sm:p-10">
        <span
          aria-hidden
          className="absolute bottom-10 left-8 top-10 w-px bg-line sm:left-10"
        />

        <div className="relative space-y-10 pl-6">
          <section>
            <p className="text-sm font-bold uppercase tracking-wide text-sage">
              Your next step
            </p>
            <p className="mt-2 text-2xl font-bold leading-snug text-ink sm:text-3xl">
              {reconstruction.nextAction.text}
            </p>
            <EvidenceReceipt evidence={reconstruction.nextAction.evidence} />
            {onTakeBack && (
              <div className="mt-5">
                <button
                  onClick={onTakeBack}
                  className="rounded-lg bg-sage px-6 py-3 font-bold text-paper transition-opacity hover:opacity-90"
                >
                  Take me back
                </button>
                <p className="mt-2 text-xs text-ink-soft">
                  Opens the active page, copies this next step, and marks this save restored.
                </p>
              </div>
            )}
            {savePoint.openTabs.length > 0 && (
              <details className="mt-4 text-sm text-ink-soft">
                <summary className="cursor-pointer underline decoration-line underline-offset-4">
                  Open up to 3 related pages
                </summary>
                <ul className="mt-3 space-y-2">
                  {savePoint.openTabs.slice(0, 3).map((tab) => (
                    <li key={tab.url}>
                      <a
                        href={tab.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sage underline underline-offset-2"
                      >
                        {tab.title || tab.url}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Open only the pages you want. Save Point never launches every tab at once.
                </p>
              </details>
            )}
          </section>

          {(reconstruction.whatChanged?.length ?? 0) > 0 && (
            <details className="rounded-lg border border-line bg-paper p-5">
              <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-ink-soft">
                Since your last save
              </summary>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                {reconstruction.whatChanged.map((change) => (
                  <li key={change} className="flex gap-2">
                    <span aria-hidden className="text-sage">→</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {(reconstruction.stoppingPoint.text ||
            reconstruction.mainThread.text ||
            primaryThread) && (
            <section className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                Where you were
              </p>
              <FieldWithEvidence field={reconstruction.stoppingPoint} />
              <FieldWithEvidence field={reconstruction.mainThread} />
              {primaryThread && (
                <p className="text-sm text-ink-soft">
                  Also on your mind: {primaryThread.text}
                </p>
              )}
            </section>
          )}

          {toConfirm && (
            <ConfirmMemory
              savePointId={savePoint.id}
              decisionIndex={toConfirmIndex}
              decisionText={toConfirm.text}
              evidence={toConfirm.evidence}
              onSavePointUpdated={onSavePointUpdated}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>

      <div className="px-8 pb-8 sm:px-10">
        <MoreContext savePoint={savePoint} reconstruction={reconstruction} />
      </div>
    </article>
  );
}

function FieldWithEvidence({ field }: { field: ReconstructedField }) {
  if (!field.text) return null;
  return (
    <div>
      <ConfidenceLine text={field.text} confidence={field.confidence} />
      <EvidenceReceipt evidence={field.evidence} />
    </div>
  );
}

const EVIDENCE_LABEL: Record<ReconstructionEvidence["source"], string> = {
  note: "your note",
  "recent-writing": "your latest writing",
  selection: "selected text",
  "active-page": "the active page",
  "open-tab": "an open tab",
};

function EvidenceReceipt({ evidence }: { evidence?: ReconstructionEvidence[] }) {
  if (!evidence?.length) return null;
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-ink-soft underline decoration-line underline-offset-4">
        Why I think this
      </summary>
      <ul className="mt-3 space-y-2 border-l border-line pl-4 text-ink-soft">
        {evidence.map((item, index) => (
          <li key={`${item.source}-${index}`}>
            <span className="font-bold text-ink">{EVIDENCE_LABEL[item.source]}:</span>{" "}
            {item.excerpt}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">
        These are captured signals, not hidden reasoning. You can correct the memory below.
      </p>
    </details>
  );
}

function ConfirmMemory({
  savePointId,
  decisionIndex,
  decisionText,
  evidence,
  onSavePointUpdated,
  readOnly,
}: {
  savePointId: string;
  decisionIndex: number;
  decisionText: string;
  evidence: ReconstructionEvidence[];
  onSavePointUpdated?: (savePoint: SavePoint) => void;
  readOnly?: boolean;
}) {
  const [mode, setMode] = useState<"ask" | "correct" | "saved">("ask");
  const [correction, setCorrection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      if (!readOnly) {
        const updated = await correctDecision(savePointId, decisionIndex, true);
        onSavePointUpdated?.(updated);
      }
      setSavedMessage("Confirmed. I will keep this memory with this save.");
      setMode("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that confirmation.");
    } finally {
      setSaving(false);
    }
  }

  async function submitCorrection(event: FormEvent) {
    event.preventDefault();
    const value = correction.trim();
    if (!value) {
      setError("Tell me what was actually true.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (!readOnly) {
        const updated = await correctDecision(
          savePointId,
          decisionIndex,
          false,
          value
        );
        onSavePointUpdated?.(updated);
      }
      setSavedMessage("Thanks — I will remember that.");
      setMode("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that correction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg bg-paper p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-ask">
        One thing I am less sure about
      </p>
      <p className="mt-2 text-ink">{decisionText}</p>
      <EvidenceReceipt evidence={evidence} />

      {mode === "ask" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={confirm}
            disabled={saving}
            className="rounded-lg border border-line bg-mist px-5 py-2 font-bold text-ink transition-colors hover:border-sage disabled:opacity-60"
          >
            {saving ? "Saving…" : "Yes, that is right"}
          </button>
          <button
            onClick={() => setMode("correct")}
            disabled={saving}
            className="rounded-lg border border-line bg-mist px-5 py-2 text-ink-soft transition-colors hover:border-ask disabled:opacity-60"
          >
            No, not quite
          </button>
        </div>
      )}

      {mode === "correct" && (
        <form onSubmit={submitCorrection} className="mt-4">
          <label htmlFor={`correction-${savePointId}`} className="font-bold text-ink">
            What were you actually thinking?
          </label>
          <textarea
            id={`correction-${savePointId}`}
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            rows={2}
            autoFocus
            placeholder="I had not chosen a source yet."
            className="mt-2 w-full rounded-lg border border-line bg-mist p-3 text-ink focus:border-sage focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sage px-5 py-2 font-bold text-paper disabled:opacity-60"
            >
              {saving ? "Remembering…" : "Save my correction"}
            </button>
            <button
              type="button"
              onClick={() => setMode("ask")}
              disabled={saving}
              className="px-3 py-2 text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "saved" && (
        <p role="status" className="mt-4 font-bold text-sage">
          {savedMessage}
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-ask">{error}</p>}
    </section>
  );
}

function LowContextCard({
  savePoint,
  reconstruction,
  onAddContext,
}: {
  savePoint: SavePoint;
  reconstruction: ReconstructedState;
  onAddContext?: (answer: string, remember: boolean) => Promise<void>;
}) {
  const [answer, setAnswer] = useState(savePoint.orientingAnswer ?? "");
  const [working, setWorking] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = answer.trim();
    if (!value || !onAddContext) return;
    setWorking(true);
    setError("");
    try {
      await onAddContext(value, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that context.");
      setWorking(false);
    }
  }

  return (
    <article className="animate-rise max-w-read rounded-card bg-mist p-8 shadow-card sm:p-10">
      <p className="text-sm font-bold uppercase tracking-wide text-ask">
        I do not have much to go on
      </p>
      <p className="mt-3 text-xl font-bold leading-snug text-ink">
        {reconstruction.orientingQuestion}
      </p>
      <p className="mt-4 text-ink-soft">
        I would rather ask than guess wrong. One sentence is enough.
      </p>

      {onAddContext && (
        <form onSubmit={submit} className="mt-6 rounded-lg bg-paper p-5">
          <label htmlFor={`context-${savePoint.id}`} className="font-bold text-ink">
            I was trying to…
          </label>
          <textarea
            id={`context-${savePoint.id}`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={3}
            placeholder="figure out whether the evidence supports my hypothesis"
            className="mt-2 w-full rounded-lg border border-line bg-mist p-3 text-ink focus:border-sage focus:outline-none"
          />
          <label className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="mt-1"
            />
            <span>Remember my exact answer for related work. I can edit or forget it later.</span>
          </label>
          <button
            type="submit"
            disabled={working || !answer.trim()}
            className="mt-3 rounded-lg bg-sage px-6 py-3 font-bold text-paper disabled:opacity-60"
          >
            {working ? "Reconstructing…" : "Use this context"}
          </button>
          {error && <p role="alert" className="mt-3 text-sm text-ask">{error}</p>}
        </form>
      )}

      {reconstruction.nextAction.text && (
        <div className="mt-6 rounded-lg bg-paper p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">
            A small way back in
          </p>
          <p className="mt-2 text-ink">{reconstruction.nextAction.text}</p>
        </div>
      )}

      <MoreContext savePoint={savePoint} reconstruction={reconstruction} />
    </article>
  );
}

const FAILURE_LABEL: Record<ReconstructFailureKind, string> = {
  quota: "The free AI plan is at its limit",
  auth: "The AI is not set up correctly",
  network: "Could not reach the AI",
  parse: "Got a response I could not read",
};

function FailureCard({
  kind,
  message,
  onRetry,
}: {
  kind: ReconstructFailureKind;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <article className="animate-rise max-w-read rounded-card border border-marker/30 bg-mist p-8 shadow-card sm:p-10">
      <p className="text-sm font-bold uppercase tracking-wide text-marker">
        {FAILURE_LABEL[kind]}
      </p>
      <p className="mt-3 text-xl font-bold leading-snug text-ink">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg border border-line bg-paper px-5 py-2.5 font-bold text-ink transition-colors hover:border-sage"
        >
          Try again
        </button>
      )}
    </article>
  );
}
