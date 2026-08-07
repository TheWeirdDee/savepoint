"use client";

import { useState } from "react";

export type FaqItem = { question: string; answer: string };

// Shared, accessible accordion. Keyboard-operable (native <button>), each
// item independently expandable, pure-CSS grid-rows transition (see
// .accordion-content in globals.css) so it degrades to an instant show/hide
// under reduced motion with no extra logic here.

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What actually is a "save point"?',
    answer:
      "A snapshot of where your head is — your goal, what you'd decided, and what's next. Not your files (your browser already keeps those), but the reasoning that connected them. You make one in a tap when you have to step away.",
  },
  {
    question: "Is my screen being watched or recorded?",
    answer:
      "No. There's no background monitoring, no history scraping, no keylogging. Save Point only reads what's in front of you at the exact moment you choose to save — and nothing otherwise. That restraint is deliberate.",
  },
  {
    question: "Do I have to remember to save?",
    answer:
      "Saving is one deliberate tap, because a save made at a meaningful moment is worth far more than an automatic one made at random. When you reopen the workspace, it quietly offers to restore your last point — it never forces a wall of information on you.",
  },
  {
    question: "Does it work on my phone?",
    answer:
      "The workspace works in any browser, including mobile. The browser extension — the part that saves from across your open tabs — is desktop-only, because that's where the many-open-tabs problem actually lives.",
  },
  {
    question: "What if the AI gets it wrong?",
    answer:
      "It's built to hedge, not bluff. Each part of a restore is marked by how sure the AI is: certain things it states, unsure things it phrases as a question you answer with one tap. When it barely has anything to go on, it says so and asks — instead of writing a confident wrong story about your own mind.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. Save Point runs on a free AI model and free-tier hosting. No card, no subscription.",
  },
];

export function FaqAccordion({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[820px]">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `faq-panel-${i}`;
        return (
          <div key={item.question} className="border-t border-line last:border-b">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-5 py-5 text-left font-bold text-ink"
            >
              <span>{item.question}</span>
              <span
                aria-hidden
                className={`shrink-0 font-mono text-xl text-sage transition-transform ${
                  open ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div id={panelId} className="accordion-content" data-open={open}>
              <div>
                <p className="max-w-[64ch] pb-5 text-ink-soft">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
