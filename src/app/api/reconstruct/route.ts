import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { reconstruct } from "@/lib/reconstruct";
import { rowToSavePoint } from "@/lib/map";
import { getUserId } from "@/lib/auth";
import type { SavePointCapture } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/reconstruct — load a save point owned by the signed-in user,
// reconstruct its cognitive state via Gemini, cache the result on the row,
// mark it restored, return it. Body: { savePointId: string, force?: boolean }
//
// Response is always { ok: true, state, savePoint? } or
// { ok: false, kind, message } — a failed attempt is NEVER written to the
// row and NEVER marks it restored, so the next attempt starts fresh instead
// of replaying a cached hiccup forever.
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { savePointId?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { savePointId, force } = body;
  if (!savePointId) {
    return NextResponse.json({ error: "Missing savePointId." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: row, error: loadError } = await supabase
    .from("save_points")
    .select("*")
    .eq("id", savePointId)
    .eq("user_id", userId)
    .single();

  if (loadError || !row) {
    return NextResponse.json({ error: "Save point not found." }, { status: 404 });
  }

  // Reconstruction is cached on first restore — reuse it unless explicitly forced.
  if (row.reconstruction && !force) {
    return NextResponse.json({ ok: true, state: row.reconstruction });
  }

  const capture: SavePointCapture = {
    source: row.source,
    userNote: row.user_note ?? undefined,
    activeContext: row.active_context ?? {},
    openTabs: row.open_tabs ?? [],
    workspaceContext: row.workspace_context ?? {},
  };

  const outcome = await reconstruct(capture);

  if (!outcome.ok) {
    // Logged server-side so a real diagnosis is possible without pretending
    // to the student that the failure was about their input.
    console.error(`Reconstruction failed (${outcome.kind}):`, outcome.message);
    const status = outcome.kind === "quota" || outcome.kind === "network" ? 503 : 500;
    return NextResponse.json(
      { ok: false, kind: outcome.kind, message: outcome.message },
      { status }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("save_points")
    .update({
      reconstruction: outcome.state,
      restored: true,
      restored_at: new Date().toISOString(),
    })
    .eq("id", savePointId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updated) {
    // The reconstruction still succeeded — hand it back even if caching failed.
    return NextResponse.json({ ok: true, state: outcome.state });
  }

  return NextResponse.json({
    ok: true,
    state: outcome.state,
    savePoint: rowToSavePoint(updated),
  });
}
