import { NextRequest, NextResponse } from "next/server";
import { getReconstructionModel } from "@/lib/gemini";
import { classifyError, FAILURE_MESSAGE } from "@/lib/reconstruct";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/health/ai — a minimal reachability check for the Gemini backend.
// This costs a real (tiny) token call, so it is NEVER invoked automatically
// anywhere in this app — only a human hitting ?check=1 explicitly triggers
// the live call. Without that flag it just explains itself and does nothing.
export async function GET(req: NextRequest) {
  const check = req.nextUrl.searchParams.get("check");
  if (check !== "1") {
    return NextResponse.json({
      ok: null,
      message: "Pass ?check=1 to run a live reachability check (costs one small AI call).",
    });
  }

  try {
    const model = getReconstructionModel();
    await model.generateContent("ping", { timeout: 10_000 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { kind } = classifyError(err);
    return NextResponse.json({ ok: false, kind, message: FAILURE_MESSAGE[kind] });
  }
}
