"use client";

import { useEffect, useRef, useState } from "react";

// One deliberate action. The note is optional and dictatable — never a required
// form. Saving is instant and forgiving: no "are you sure", no modal.

type Status = "idle" | "noting" | "saving" | "saved";

export function SavePointButton({
  onSave,
}: {
  onSave: (note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [note, setNote] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (status === "noting") inputRef.current?.focus();
  }, [status]);

  async function commit() {
    setStatus("saving");
    try {
      await onSave(note);
      setStatus("saved");
      setNote("");
      setTimeout(() => setStatus("idle"), 2600);
    } catch {
      // Stay forgiving: drop back to idle so they can simply try again.
      setStatus("idle");
    }
  }

  function toggleDictation() {
    const SR =
      (typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec: SpeechRecognitionLike = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      const text = e.results[0][0].transcript;
      setNote((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  if (status === "saved") {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 rounded-lg bg-sage/10 px-5 py-4 text-center font-bold text-sage"
      >
        <span aria-hidden className="h-3 w-3 animate-marker-pulse rounded-full bg-marker" />
        Save point created. You can leave whenever you need to.
      </div>
    );
  }

  if (status === "noting") {
    return (
      <div className="rounded-lg border border-line bg-mist p-4">
        <label htmlFor="note" className="text-sm text-ink-soft">
          Add one thought (optional)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="note"
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="e.g. checking which source is more reliable"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-sage"
          />
          <DictationButton
            supported={dictationSupported()}
            listening={listening}
            onClick={toggleDictation}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={commit}
            className="flex-1 rounded-lg bg-sage px-5 py-3 font-bold text-paper hover:opacity-90 transition-opacity"
          >
            Save my place
          </button>
          <button
            onClick={commit}
            className="rounded-lg px-4 py-3 text-ink-soft hover:text-ink transition-colors"
          >
            Skip note
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => (status === "saving" ? null : setStatus("noting"))}
      disabled={status === "saving"}
      className="w-full rounded-lg bg-sage px-6 py-4 text-lg font-bold text-paper shadow-card hover:opacity-90 disabled:opacity-70 transition-opacity"
    >
      {status === "saving" ? "Saving…" : "Save where my brain is"}
    </button>
  );
}

function DictationButton({
  supported,
  listening,
  onClick,
}: {
  supported: boolean;
  listening: boolean;
  onClick: () => void;
}) {
  if (!supported) return null;
  return (
    <button
      onClick={onClick}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictation" : "Dictate a note"}
      className={`rounded-md border px-3 py-2 transition-colors ${
        listening
          ? "border-sage bg-sage/10 text-sage"
          : "border-line bg-paper text-ink-soft hover:text-ink"
      }`}
    >
      {listening ? "● Listening" : "🎤 Speak"}
    </button>
  );
}

function dictationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

// Minimal typings for the Web Speech API (not in default DOM lib types).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionEventLike) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventLike {
  results: Array<{ 0: { transcript: string } }>;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}
