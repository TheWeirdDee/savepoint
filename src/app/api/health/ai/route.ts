import { NextRequest, NextResponse } from "next/server";
import { checkReconstructionProviders } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Deliberately opt-in: each configured provider receives one tiny live call.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("check") !== "1") {
    return NextResponse.json({
      ok: null,
      message:
        "Pass ?check=1 to test configured AI providers (costs one small call per provider).",
    });
  }

  const providers = await checkReconstructionProviders();
  if (providers.groq.reachable) {
    return NextResponse.json({
      ok: true,
      primary: "groq",
      fallbackAvailable: providers.gemini.reachable,
      providers,
    });
  }
  if (providers.gemini.reachable) {
    return NextResponse.json({
      ok: true,
      primary: "gemini",
      note: "Groq unavailable; Gemini fallback is active.",
      providers,
    });
  }

  const kind = providers.groq.kind ?? providers.gemini.kind ?? "auth";
  return NextResponse.json(
    {
      ok: false,
      kind,
      message: "No configured reconstruction provider is reachable.",
      providers,
    },
    { status: 503 }
  );
}
