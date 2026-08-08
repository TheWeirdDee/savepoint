import {
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { callGemini } from "./gemini";
import { callGroq } from "./providers/groq";
import type { ReconstructFailureKind } from "./types";

export type ReconstructionProvider = "groq" | "gemini";

type ProviderFailure = {
  provider: ReconstructionProvider;
  kind: ReconstructFailureKind;
  message: string;
};

export class ReconstructionModelError extends Error {
  readonly kind: ReconstructFailureKind;
  readonly failures: ProviderFailure[];

  constructor(failure: ProviderFailure, failures: ProviderFailure[]) {
    super(failure.message);
    this.name = "ReconstructionModelError";
    this.kind = failure.kind;
    this.failures = failures;
  }
}

export async function runReconstructionModel(
  system: string,
  user: string
): Promise<{ text: string; provider: ReconstructionProvider }> {
  const failures: ProviderFailure[] = [];

  if (process.env.GROQ_API_KEY) {
    try {
      const text = await callGroq(system, user, { timeoutMs: 15_000 });
      assertJsonObject(text, "groq");
      return { text, provider: "groq" };
    } catch (error) {
      failures.push(classifyGroqError(error));
    }
  }

  if (process.env.GOOGLE_API_KEY) {
    try {
      const text = await callGemini(system, user, { timeoutMs: 20_000 });
      assertJsonObject(text, "gemini");
      return { text, provider: "gemini" };
    } catch (error) {
      failures.push(classifyGeminiError(error));
    }
  }

  if (failures.length === 0) {
    failures.push({
      provider: "groq",
      kind: "auth",
      message: "Neither GROQ_API_KEY nor GOOGLE_API_KEY is configured.",
    });
  }

  const informative = [...failures].sort(
    (a, b) => failurePriority(b.kind) - failurePriority(a.kind)
  )[0];
  throw new ReconstructionModelError(informative, failures);
}

export async function checkReconstructionProviders(): Promise<{
  groq: ProviderProbe;
  gemini: ProviderProbe;
}> {
  const system = "Return exactly one JSON object and no other text.";
  const user = '{"status":"ok"}';
  const [groq, gemini] = await Promise.all([
    probe("groq", Boolean(process.env.GROQ_API_KEY), () =>
      callGroq(system, user, { timeoutMs: 8_000 })
    ),
    probe("gemini", Boolean(process.env.GOOGLE_API_KEY), () =>
      callGemini(system, user, { timeoutMs: 10_000 })
    ),
  ]);
  return { groq, gemini };
}

type ProviderProbe =
  | { configured: false; reachable: false; kind?: undefined }
  | {
      configured: true;
      reachable: boolean;
      kind?: ReconstructFailureKind;
    };

async function probe(
  provider: ReconstructionProvider,
  configured: boolean,
  call: () => Promise<string>
): Promise<ProviderProbe> {
  if (!configured) return { configured: false, reachable: false };
  try {
    assertJsonObject(await call(), provider);
    return { configured: true, reachable: true };
  } catch (error) {
    const failure =
      provider === "groq"
        ? classifyGroqError(error)
        : classifyGeminiError(error);
    return { configured: true, reachable: false, kind: failure.kind };
  }
}

function assertJsonObject(text: string, provider: ReconstructionProvider): void {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (!cleaned || start === -1 || end < start) {
    throw providerParseError(provider);
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw providerParseError(provider);
    }
  } catch (error) {
    if (error instanceof ReconstructionModelError) throw error;
    throw providerParseError(provider);
  }
}

function providerParseError(provider: ReconstructionProvider): ReconstructionModelError {
  const failure: ProviderFailure = {
    provider,
    kind: "parse",
    message: `${provider} returned an empty or unreadable JSON response.`,
  };
  return new ReconstructionModelError(failure, [failure]);
}

function classifyGroqError(error: unknown): ProviderFailure {
  if (error instanceof ReconstructionModelError) {
    return error.failures[0];
  }
  const record = error as { status?: number; name?: string; message?: string };
  const status = record?.status;
  const text = `${record?.name ?? ""} ${record?.message ?? ""}`.toLowerCase();
  if (status === 429 || text.includes("rate limit") || text.includes("quota")) {
    return { provider: "groq", kind: "quota", message: "Groq rate limit reached." };
  }
  if (status === 401 || status === 403 || text.includes("api key")) {
    return { provider: "groq", kind: "auth", message: "Groq authentication failed." };
  }
  if (text.includes("empty response")) {
    return { provider: "groq", kind: "parse", message: "Groq returned an empty response." };
  }
  return { provider: "groq", kind: "network", message: "Groq could not be reached." };
}

function classifyGeminiError(error: unknown): ProviderFailure {
  if (error instanceof ReconstructionModelError) {
    return error.failures[0];
  }
  if (error instanceof GoogleGenerativeAIAbortError) {
    return { provider: "gemini", kind: "network", message: "Gemini timed out." };
  }
  if (error instanceof GoogleGenerativeAIFetchError) {
    const status = error.status;
    const text = `${error.message} ${JSON.stringify(error.errorDetails ?? "")}`.toLowerCase();
    if (status === 429 || text.includes("resource_exhausted") || text.includes("quota")) {
      return { provider: "gemini", kind: "quota", message: "Gemini rate limit reached." };
    }
    if (
      status === 401 ||
      status === 403 ||
      text.includes("api key not valid") ||
      text.includes("permission_denied")
    ) {
      return { provider: "gemini", kind: "auth", message: "Gemini authentication failed." };
    }
    return { provider: "gemini", kind: "network", message: "Gemini could not be reached." };
  }
  const text = error instanceof Error ? error.message.toLowerCase() : "";
  if (text.includes("empty response")) {
    return { provider: "gemini", kind: "parse", message: "Gemini returned an empty response." };
  }
  return { provider: "gemini", kind: "network", message: "Gemini could not be reached." };
}

function failurePriority(kind: ReconstructFailureKind): number {
  return { auth: 4, quota: 3, parse: 2, network: 1 }[kind];
}
