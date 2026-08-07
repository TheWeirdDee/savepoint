import type { ReconstructedState } from "./types";

// DEMO DATA — never real. Used only when demo mode is explicitly on
// (NEXT_PUBLIC_DEMO_MODE=1, or ?demo=1 on /workspace), so the save→restore
// experience can be shown even if the live Gemini key is down or quota'd.
// See isDemoMode() / restoreSavePoint() in src/lib/client.ts — that is the
// ONLY place this fixture is used, and it never touches the database, so it
// can never be mistaken for (or persisted as) a real reconstruction.
export const DEMO_RECONSTRUCTED_STATE: ReconstructedState = {
  objective: {
    text: "You're comparing sources for your biology report on cell division, deciding which one to cite as the stronger reference.",
    confidence: "high",
  },
  stoppingPoint: {
    text: "You'd just finished comparing the publication dates and peer-review status of Source A and Source B.",
    confidence: "high",
  },
  mainThread: {
    text: "Source B looks stronger because it's a recent, peer-reviewed journal article, but you hadn't checked the author's credentials yet.",
    confidence: "high",
  },
  decisions: [
    {
      text: "It looks like you'd leaned toward Source B as the more reliable choice.",
      confidence: "medium",
      needsConfirmation: true,
    },
  ],
  openThreads: [
    { text: "Whether to also cite Source C as a supporting example.", relevance: "primary" },
    { text: "The citation format your teacher asked for.", relevance: "supporting" },
  ],
  nextAction: {
    text: "Look up the author of Source A to check their credentials.",
    confidence: "high",
  },
  lowContext: false,
  orientingQuestion: "",
};
