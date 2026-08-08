"use client";

import { useState } from "react";
import type { SavePoint, ReconstructedState, ReconstructOutcome, ReconstructFailureKind } from "@/lib/types";
import { correctDecision } from "@/lib/client";
import { ConfidenceLine } from "./ConfidenceLine";
import { MoreContext } from "./MoreContext";

// The signature experience. Strict hierarchy:
//   1. Your next step   (the smallest doorway back — biggest thing on screen)
//   2. Where you were   (reconstructed thread, spoken gently by tier)
//   3. One thing I'm less sure about  (a decision that needs confirmation)
//   4. More context     (everything else, folded away)
//
// A thin vertical "thread" line ties the pieces together — the thread of
// thought the student is picking back up.
//
// Three distinct outcomes render three distinct cards, never merged:
//   - a real failure (outcome.ok === false)              -> FailureCard
//   - a genuine, successful, thin-signal result           -> LowContextCard
//   - a genuine, successful, well-populated result         -> the main card

export function RestoreCard({
  savePoint,
  outcome,
  onRetry,
  readOnly,
}: {
  savePoint: SavePoint;
  outcome: ReconstructOutcome;
  onRetry?: () => void;
  /** True only for the illustrative "example restore" — skips the network
   * call a real Yes/No correction would make, since there's no real save
   * point behind it. Never used for a genuine restore. */
  readOnly?: boolean;
}) {
  if (!outcome.ok) {
    return <FailureCard kind={outcome.kind} message={outcome.message} onRetry={onRetry} />;
  }

  const reconstruction = outcome.state;

  if (reconstruction.lowContext) {
    return <LowContextCard savePoint={savePoint} reconstruction={reconstruction} />;
  }

  // Pick one uncertain decision to gently confirm (the first flagged one).
  const toConfirmIndex = reconstruction.decisions.findIndex((d) => d.needsConfirmation);
  const toConfirm = toConfirmIndex >= 0 ? reconstruction.decisions[toConfirmIndex] : null;

  // The one other thing worth naming (Part D): at most one, and only if the
  // model marked it primary. Everything else stays in More context.
  const primaryThread = reconstruction.openThreads.find((t) => t.relevance === "primary") ?? null;

  return (
    <article className="animate-rise max-w-read rounded-card bg-mist shadow-card">
      <div className="relative p-8 sm:p-10">
        {/* the thread */}
        <span
          aria-hidden
          className="absolute left-8 top-10 bottom-10 w-px bg-line sm:left-10"
        />

        <div className="relative space-y-10 pl-6">
          {/* 1 — Your next step */}
          <section>
            <p className="text-sm font-bold uppercase tracking-wide text-sage">
              Your next step
            </p>
            <p className="mt-2 text-2xl font-bold leading-snug text-ink sm:text-3xl">
              {reconstruction.nextAction.text}
            </p>
          </section>

          {/* 2 — Where you were */}
          {(reconstruction.stoppingPoint.text ||
            reconstruction.mainThread.text ||
            primaryThread) && (
            <section className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                Where you were
              </p>
              <ConfidenceLine
                text={reconstruction.stoppingPoint.text}
                confidence={reconstruction.stoppingPoint.confidence}
              />
              <ConfidenceLine
                text={reconstruction.mainThread.text}
                confidence={reconstruction.mainThread.confidence}
              />
              {primaryThread && (
                <p className="text-sm text-ink-soft">
                  Also on your mind: {primaryThread.text}
                </p>
              )}
            </section>
          )}

          {/* 3 — One thing I'm less sure about */}
          {toConfirm && (
            <Confirm
              savePointId={savePoint.id}
              decisionIndex={toConfirmIndex}
              decisionText={toConfirm.text}
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

function Confirm({
  savePointId,
  decisionIndex,
  decisionText,
  readOnly,
}: {
  savePointId: string;
  decisionIndex: number;
  decisionText: string;
  readOnly?: boolean;
}) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  function respond(wasCorrect: boolean) {
    setAnswer(wasCorrect ? "yes" : "no");
    // The example restore has no real save point behind it — reflect the
    // tap locally only, never call the API for it.
    if (!readOnly) {
      correctDecision(savePointId, decisionIndex, wasCorrect);
    }
  }

  return (
    <section className="rounded-lg bg-paper p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-ask">
        One thing I&apos;m less sure about
      </p>
      <p className="mt-2 text-ink">{decisionText}</p>
      {answer === null ? (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => respond(true)}
            className="rounded-lg border border-line bg-mist px-5 py-2 font-bold text-ink hover:border-sage transition-colors"
          >
            Yes, that&apos;s right
          </button>
          <button
            onClick={() => respond(false)}
            className="rounded-lg border border-line bg-mist px-5 py-2 text-ink-soft hover:border-ask transition-colors"
          >
            No, not quite
          </button>
        </div>
      ) : (
        <p className="mt-4 text-ink-soft">
          {answer === "yes"
            ? "Good — carry on from there."
            : "No problem. Trust your own memory over mine here."}
        </p>
      )}
    </section>
  );
}

// The genuine, successful, thin-signal path — the model ran, it just didn't
// have much to work with. Unchanged from before this pass: an honest
// question, never a fabricated decision, never a retry button (there's
// nothing to retry — the call succeeded).
function LowContextCard({
  savePoint,
  reconstruction,
}: {
  savePoint: SavePoint;
  reconstruction: ReconstructedState;
}) {
  return (
    <article className="animate-rise max-w-read rounded-card bg-mist shadow-card p-8 sm:p-10">
      <p className="text-sm font-bold uppercase tracking-wide text-ask">
        I don&apos;t have much to go on
      </p>
      <p className="mt-3 text-xl font-bold leading-snug text-ink">
        {reconstruction.orientingQuestion}
      </p>
      <p className="mt-4 text-ink-soft">
        I&apos;d rather ask than guess wrong. Tell me in a sentence and I&apos;ll
        help you pick up the thread.
      </p>

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
  auth: "The AI isn't set up correctly",
  network: "Couldn't reach the AI",
  parse: "Got a response I couldn't read",
};

// A genuine failure — the call itself didn't work. Deliberately distinct
// from LowContextCard: no orienting question, no "small way back in," no
// pretense that this is a reconstruction at all. Just what happened and a
// way to try again, since nothing was cached and a retry genuinely re-runs.
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
    <article className="animate-rise max-w-read rounded-card border border-marker/30 bg-mist shadow-card p-8 sm:p-10">
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
