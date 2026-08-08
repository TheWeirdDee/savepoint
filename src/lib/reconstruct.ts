import { ReconstructionModelError, runReconstructionModel } from "./llm";
import {
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { RECONSTRUCT_SYSTEM, buildReconstructUserMessage } from "./reconstruct-prompt";
import type {
  SavePointCapture,
  ReconstructedState,
  ReconstructOutcome,
  ReconstructFailureKind,
  Confidence,
  EvidenceSource,
  ReconstructionMemory,
} from "./types";

const TIERS: Confidence[] = ["high", "medium", "low"];
const tier = (v: unknown): Confidence =>
  TIERS.includes(v as Confidence) ? (v as Confidence) : "low";
const str = (v: unknown): string => (typeof v === "string" ? v : "");

// The student should never stare at a spinner for a doomed request.

export const FAILURE_MESSAGE: Record<ReconstructFailureKind, string> = {
  quota:
    "The free AI plan has hit its limit for now. Your save is safe — try restoring again later.",
  auth: "The AI provider keys are not set up correctly. Check GROQ_API_KEY or GOOGLE_API_KEY.",
  network: "Couldn't reach the AI just now. Your save is safe — try again in a moment.",
  parse: "The AI replied in a form I couldn't read. Try again.",
};

/**
 * Run reconstruction. Never throws — always resolves to a discriminated
 * outcome so the caller (and eventually the UI) can render a specific,
 * honest state instead of a generic error. `ok: false` must never be
 * persisted as if it were a real reconstruction — see the API route.
 */
export async function reconstruct(
  capture: SavePointCapture,
  memory?: ReconstructionMemory
): Promise<ReconstructOutcome> {
  let text: string;
  try {
    const result = await runReconstructionModel(
      RECONSTRUCT_SYSTEM,
      buildReconstructUserMessage(capture, memory)
    );
    text = result.text.trim();
  } catch (err) {
    const kind =
      err instanceof ReconstructionModelError ? err.kind : "network";
    return { ok: false, kind, message: FAILURE_MESSAGE[kind] };
  }

  let raw: Record<string, unknown>;
  try {
    raw = extractJson(text);
  } catch {
    return { ok: false, kind: "parse", message: FAILURE_MESSAGE.parse };
  }

  const state = normalize(raw, capture);
  if (!memory?.previousCapture) state.whatChanged = [];
  return { ok: true, state };
}

// Classifies a failed Gemini call using the SDK's typed error classes rather
// than parsing message strings — GoogleGenerativeAIFetchError carries a real
// HTTP status, which is far more reliable than pattern-matching text that
// could change between SDK versions.
export function classifyError(err: unknown): { kind: ReconstructFailureKind } {
  if (err instanceof GoogleGenerativeAIAbortError) {
    // Our own timeout, or an intentional cancellation — either way, this is
    // a reachability problem, not something wrong with the student's save.
    return { kind: "network" };
  }

  if (err instanceof GoogleGenerativeAIFetchError) {
    const status = err.status;
    const text = `${err.message} ${JSON.stringify(err.errorDetails ?? "")}`.toLowerCase();

    if (status === 429 || text.includes("resource_exhausted") || text.includes("quota")) {
      return { kind: "quota" };
    }
    // Google returns a bad-key error as HTTP 400 with this exact phrase, not
    // 401/403, so the status check alone isn't enough here.
    if (
      status === 401 ||
      status === 403 ||
      text.includes("api key not valid") ||
      text.includes("permission_denied")
    ) {
      return { kind: "auth" };
    }
    // Any other HTTP failure (5xx, unexpected 4xx) is a reachability problem.
    return { kind: "network" };
  }

  // Not a recognized SDK error class at all — DNS failure, connection
  // refused, or anything else that never got as far as an HTTP response.
  return { kind: "network" };
}

// Strip any accidental code fences and parse the first JSON object found.
function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalize(
  raw: Record<string, unknown>,
  capture: SavePointCapture
): ReconstructedState {
  const evidenceSources: EvidenceSource[] = [
    "note",
    "recent-writing",
    "selection",
    "active-page",
    "open-tab",
  ];
  const evidence = (v: unknown) =>
    Array.isArray(v)
      ? v.slice(0, 2).flatMap((item) => {
          const o = (item ?? {}) as Record<string, unknown>;
          const source = o.source as EvidenceSource;
          const excerpt = str(o.excerpt).trim();
          return evidenceSources.includes(source) && excerpt
            ? [{ source, excerpt: excerpt.slice(0, 140) }]
            : [];
        })
      : [];

  const field = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return {
      text: str(o.text),
      confidence: tier(o.confidence),
      evidence: evidence(o.evidence),
    };
  };

  const decisions = Array.isArray(raw.decisions)
    ? (raw.decisions as unknown[]).map((d) => {
        const o = (d ?? {}) as Record<string, unknown>;
        return {
          text: str(o.text),
          confidence: tier(o.confidence),
          needsConfirmation: o.needsConfirmation === true,
          evidence: evidence(o.evidence),
        };
      })
    : [];

  const openThreads = Array.isArray(raw.openThreads)
    ? (raw.openThreads as unknown[]).map((t) => {
        const o = (t ?? {}) as Record<string, unknown>;
        const rel = o.relevance;
        return {
          text: str(o.text),
          relevance:
            rel === "primary" || rel === "supporting" ? rel : "uncertain",
        } as ReconstructedState["openThreads"][number];
      })
    : [];

  const nextAction = field(raw.nextAction);
  const objective = field(raw.objective);

  // If the model gave us nothing usable, treat it as low-context honestly.
  const nothingUsable = !objective.text && !nextAction.text;
  const lowContext = raw.lowContext === true || nothingUsable;

  return {
    objective,
    stoppingPoint: field(raw.stoppingPoint),
    mainThread: field(raw.mainThread),
    decisions,
    openThreads,
    nextAction,
    whatChanged: Array.isArray(raw.whatChanged)
      ? raw.whatChanged.map(str).filter(Boolean).slice(0, 4)
      : [],
    lowContext,
    orientingQuestion: lowContext
      ? str(raw.orientingQuestion) || defaultQuestion(capture)
      : str(raw.orientingQuestion),
  };
}

function defaultQuestion(capture: SavePointCapture): string {
  const title =
    capture.activeContext?.title || capture.workspaceContext?.documentTitle;
  return title
    ? `You saved while on "${title}". What were you trying to figure out?`
    : `What were you working on when you saved this?`;
}
