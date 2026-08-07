"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Real, working accessibility controls — not a listed feature. Each maps to a
// class on <html> that globals.css responds to. Prefs persist across sessions
// and are re-applied pre-paint by the inline script in layout.tsx.
//
// Two placements share one implementation: "floating" is the small corner
// control mounted globally in layout.tsx (auto-hidden on /workspace, which
// renders its own "inline" copy inside the dashboard rail instead — one
// visible control per screen, never two).

type Prefs = {
  textSize: "base" | "lg" | "xl";
  spacing: "normal" | "relaxed";
  dyslexia: boolean;
  motionOff: boolean;
};

const DEFAULTS: Prefs = {
  textSize: "base",
  spacing: "normal",
  dyslexia: false,
  motionOff: false,
};

const KEY = "savepoint.prefs";

function apply(p: Prefs) {
  const c = document.documentElement.classList;
  c.toggle("text-lg-user", p.textSize === "lg");
  c.toggle("text-xl-user", p.textSize === "xl");
  c.toggle("spacing-relaxed", p.spacing === "relaxed");
  c.toggle("font-dyslexia", p.dyslexia);
  c.toggle("motion-off", p.motionOff);
}

export function AccessibilityBar({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  const pathname = usePathname();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let merged = DEFAULTS;
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
      merged = { ...DEFAULTS, ...stored };
    } catch {
      /* keep defaults */
    }
    setPrefs(merged);
    // The pre-paint script in layout.tsx already added these classes to <html>
    // before React hydrated, purely to avoid a flash of the default theme. But
    // React's hydration reconciliation then strips any DOM mutation it didn't
    // render itself, silently wiping them back off. Re-apply here, once
    // hydration has settled, so a saved preference actually sticks.
    apply(merged);
  }, []);

  // The workspace renders its own inline copy in the dashboard rail — the
  // floating corner copy would be redundant there.
  if (variant === "floating" && pathname?.startsWith("/workspace")) {
    return null;
  }

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    apply(next);
  }

  const panelId = `accessibility-panel-${variant}`;

  if (variant === "inline") {
    return (
      <div className="rounded-card border border-line bg-mist p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
          Reading settings
        </p>
        <AccessibilityControls prefs={prefs} update={update} panelId={panelId} />
      </div>
    );
  }

  return (
    <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Reading settings"
        className="rounded-md border border-line bg-mist px-3 py-1.5 text-sm text-ink-soft shadow-card hover:text-ink transition-colors"
      >
        Reading settings
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Reading settings"
          className="absolute right-0 z-10 mt-2 w-72 rounded-card border border-line bg-mist p-4 shadow-card"
        >
          <AccessibilityControls prefs={prefs} update={update} panelId={panelId} />
        </div>
      )}
    </div>
  );
}

function AccessibilityControls({
  prefs,
  update,
  panelId,
}: {
  prefs: Prefs;
  update: (patch: Partial<Prefs>) => void;
  panelId: string;
}) {
  return (
    <div id={`${panelId}-controls`}>
      <Group label="Text size">
        <Choice active={prefs.textSize === "base"} onClick={() => update({ textSize: "base" })}>
          A
        </Choice>
        <Choice active={prefs.textSize === "lg"} onClick={() => update({ textSize: "lg" })}>
          A+
        </Choice>
        <Choice active={prefs.textSize === "xl"} onClick={() => update({ textSize: "xl" })}>
          A++
        </Choice>
      </Group>

      <Group label="Line spacing">
        <Choice active={prefs.spacing === "normal"} onClick={() => update({ spacing: "normal" })}>
          Normal
        </Choice>
        <Choice active={prefs.spacing === "relaxed"} onClick={() => update({ spacing: "relaxed" })}>
          Relaxed
        </Choice>
      </Group>

      <Toggle
        label="Dyslexia-friendly font"
        on={prefs.dyslexia}
        onClick={() => update({ dyslexia: !prefs.dyslexia })}
      />
      <Toggle
        label="Reduce motion"
        on={prefs.motionOff}
        onClick={() => update({ motionOff: !prefs.motionOff })}
      />
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
        active ? "border-sage bg-sage/10 text-sage" : "border-line text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="mb-2 flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-ink hover:bg-paper transition-colors"
    >
      <span>{label}</span>
      <span
        className={`ml-3 h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-sage" : "bg-line"
        } relative`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-mist transition-all ${
            on ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
