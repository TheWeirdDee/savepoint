import Groq from "groq-sdk";

// Server-only, lazy client. A Gemini-only deployment can import this module
// and build normally without GROQ_API_KEY.
let client: Groq | null = null;

export const GROQ_MODEL =
  process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export function getGroq(): Groq {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  client = new Groq({ apiKey, maxRetries: 0 });
  return client;
}

export async function callGroq(
  system: string,
  user: string,
  { timeoutMs }: { timeoutMs: number }
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const completion = await getGroq().chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      },
      { signal: controller.signal, timeout: timeoutMs }
    );
    const text = completion.choices[0]?.message.content?.trim() ?? "";
    if (!text) throw new Error("Groq returned an empty response");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
