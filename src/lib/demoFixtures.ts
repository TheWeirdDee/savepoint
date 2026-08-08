import type { ReconstructedState, SavePoint } from "./types";

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

// Not a second demo fixture — just the SavePoint envelope RestoreCard needs
// around DEMO_RECONSTRUCTED_STATE to render (MoreContext reads userNote /
// workspaceContext / openTabs off it). The reconstruction content is the
// exact same fixture above, never duplicated. Used only by the "See an
// example restore" preview in the empty workspace (Workspace.tsx) — never
// written to the database, never returned by any API route.
export const EXAMPLE_SAVE_POINT: SavePoint = {
  id: "example",
  userId: "example",
  source: "workspace",
  userNote:
    "still weighing Source A vs Source B, also thinking about the counterargument from class",
  activeContext: {},
  openTabs: [],
  workspaceContext: {
    documentTitle: "Biology report",
  },
  reconstruction: DEMO_RECONSTRUCTED_STATE,
  restored: true,
  restoredAt: null,
  createdAt: new Date(0).toISOString(),
};
