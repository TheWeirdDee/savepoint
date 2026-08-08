"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerDot } from "./MarkerDot";

// The landing hero's restore-card mock, made to actually behave — a judge
// skimming the page should see the two things that make Save Point different
// (asks instead of guessing; you correct it in one tap) happen, not just read
// about them. Illustrative example data only — no network/AI/DB call, ever.
//
// Reveal sequence mimics the real save -> restore beat: the card starts
// collapsed to a "saving" pill, then grows as next-step / where-you-were /
// the uncertain decision / the side-thread line each arrive. Plays once when
// the card enters view. The confirm/correct chips are genuinely interactive,
// and a correction visibly propagates into "Your next step" — same as the
// real restore screen.

type Decision = "unresolved" | "confirmed" | "corrected";

// Delay before each successive block mounts, in order: next-step, where,
// uncertainty, aside. The first is the "saving" pause; the rest are a quick,
// calm stagger.
const STEP_DELAYS_MS = [800, 150, 150, 150];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const osReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appReduced = document.documentElement.classList.contains("motion-off");
  return osReduced || appReduced;
}

export function HeroRestoreCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [step, setStep] = useState(0); // 0 saving-only, 1 next-step, 2 +where, 3 +uncertainty, 4 +aside (done)
  const [hasPlayed, setHasPlayed] = useState(false);
  const [decision, setDecision] = useState<Decision>("unresolved");

  function clearTimers() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  function play() {
    clearTimers();
    if (prefersReducedMotion()) {
      setStep(4);
      return;
    }
    setStep(0);
    let elapsed = 0;
    STEP_DELAYS_MS.forEach((delay, i) => {
      elapsed += delay;
      timeouts.current.push(setTimeout(() => setStep(i + 1), elapsed));
    });
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !hasPlayed) {
          setHasPlayed(true);
          play();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPlayed]);

  function replay() {
    setDecision("unresolved");
    setHasPlayed(true);
    play();
  }

  const revealed = (threshold: number) => step >= threshold;

  const nextStepText =
    decision === "corrected"
      ? "Write two sentences on why Source A is more reliable."
      : "Write two sentences on why Source B is more reliable.";

  return (
    <div
      ref={containerRef}
      aria-label="Example restore card — not your real data. Shows the next step first, where you were, and a gentle confirmation question."
      className="animate-card-pulse relative rounded-card border border-line bg-mist p-6 shadow-hero sm:p-7"
    >
      <button
        type="button"
        onClick={replay}
        className="absolute right-4 top-4 rounded-md px-2 py-1 font-mono text-[11px] font-bold text-ink-soft transition-colors hover:text-ink"
        aria-label="Replay the restore example"
      >
        ↺ Replay
      </button>

      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-marker">
        <MarkerDot className={revealed(1) ? "animate-marker-pulse" : ""} />
        {revealed(1) ? "Restored" : "Saving your place…"}
      </div>

      {revealed(1) && (
        <div className="animate-rise">
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            Your next step
          </div>
          <div className="mt-1.5 text-xl font-bold leading-snug text-ink sm:text-[23px]">
            {nextStepText}
          </div>
        </div>
      )}

      {revealed(2) && (
        <div className="animate-rise">
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            Where you were
          </div>
          <p className="mt-1.5 text-[15.5px] text-ink-soft">
            Comparing the dates and authors of two sources for your biology report.
          </p>
        </div>
      )}

      {revealed(3) && (
        <div className="animate-rise mt-4 rounded-lg border border-line bg-paper-2 p-3.5">
          {decision === "unresolved" && (
            <>
              <p className="text-[15px] text-ask">
                One thing I&apos;m less sure about — it looks like you preferred
                Source B. Was that right?
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDecision("confirmed")}
                  className="rounded-full border-[1.5px] border-sage px-3 py-1.5 text-[13px] font-bold text-sage transition-colors hover:bg-sage/10"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("corrected")}
                  className="rounded-full border-[1.5px] border-line bg-mist px-3 py-1.5 text-[13px] font-bold text-ink transition-colors hover:border-sage"
                >
                  No, it was A
                </button>
              </div>
            </>
          )}
          {decision === "confirmed" && (
            <p className="text-[15px] font-bold text-sage">Great — locked in: Source B.</p>
          )}
          {decision === "corrected" && (
            <p className="text-[15px] font-bold text-sage">
              Updated — you preferred Source A.
            </p>
          )}
        </div>
      )}

      {revealed(4) && (
        <div className="animate-rise">
          <p className="mt-4 text-[13.5px] text-ink-soft">
            Also on your mind: whether to cite Source C.
          </p>
          <p className="mt-1.5 font-mono text-[13.5px] text-ink-soft">
            ▸ More context — 4 open threads · 6 tabs · your note
          </p>
        </div>
      )}
    </div>
  );
}
