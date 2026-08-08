import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-only, lazy client. Importing this module during a build never requires
// a key; a missing key matters only when Gemini is actually selected.
let client: GoogleGenerativeAI | null = null;

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export function getGemini(): GoogleGenerativeAI {
  if (client) return client;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

export async function callGemini(
  system: string,
  user: string,
  { timeoutMs }: { timeoutMs: number }
): Promise<string> {
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: system,
  });
  const result = await model.generateContent(user, { timeout: timeoutMs });
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
