import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

// SERVER ONLY. Holds the Gemini API key. Lazily initialized so importing a
// route module during `next build` never throws when the key is absent — it
// only errors if actually called at runtime without configuration.

let client: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (client) return client;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY");
  }
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

// Free tier, fast, cheap enough to run per-restore. Override via env if needed.
// "gemini-2.0-flash" is a dated model string and can be retired off the free
// tier over time (confirmed via curl: 429 limit:0 on an otherwise-valid key,
// while "gemini-1.5-flash" 404s entirely). "gemini-flash-latest" is an alias
// Google keeps pointed at their current free-tier flash model, so it doesn't
// go stale the way a pinned version does.
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

export function getReconstructionModel(): GenerativeModel {
  return getGemini().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}
