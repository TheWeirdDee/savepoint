import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { reconstruct } from "@/lib/reconstruct";
import { rowToSavePoint } from "@/lib/map";
import { getUserId } from "@/lib/auth";
import type { ReconstructionMemory, SavePointCapture } from "@/lib/types";

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

  let body: {
    savePointId?: string;
    force?: boolean;
    additionalContext?: string;
    rememberContext?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { savePointId, force } = body;
  const additionalContext = body.additionalContext?.trim().slice(0, 1000);
  const rememberContext = body.rememberContext === true;
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
  if (row.reconstruction && !force && !additionalContext) {
    return NextResponse.json({ ok: true, state: row.reconstruction });
  }

  const capture: SavePointCapture = {
    source: row.source,
    userNote: [row.user_note, additionalContext ? `Student answered the orienting question: ${additionalContext}` : row.orienting_answer ? `Student answered the orienting question: ${row.orienting_answer}` : null]
      .filter(Boolean)
      .join("\n") || undefined,
    activeContext: row.active_context ?? {},
    openTabs: row.open_tabs ?? [],
    workspaceContext: row.workspace_context ?? {},
  };

  const { data: priorRows } = await supabase
    .from("save_points")
    .select("source, user_note, active_context, open_tabs, workspace_context")
    .eq("user_id", userId)
    .neq("id", savePointId)
    .order("created_at", { ascending: false })
    .limit(12);

  const currentTitle = capture.workspaceContext?.documentTitle?.trim().toLowerCase();
  const currentUrl = capture.activeContext?.url?.trim();
  const comparableRows = (priorRows ?? []).filter((prior) => {
    const workspace = (prior.workspace_context ?? {}) as SavePointCapture["workspaceContext"];
    const active = (prior.active_context ?? {}) as SavePointCapture["activeContext"];
    return (
      (currentTitle && workspace?.documentTitle?.trim().toLowerCase() === currentTitle) ||
      (currentUrl && active?.url === currentUrl)
    );
  });
  const comparable = comparableRows[0];

  const { data: memoryRows } = await supabase
    .from("user_memory")
    .select("text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const memory: ReconstructionMemory = {
    confirmedMemories: (memoryRows ?? []).map((item) => String(item.text)),
    previousCapture: comparable
      ? {
          source: comparable.source as SavePointCapture["source"],
          userNote: comparable.user_note ?? undefined,
          activeContext: comparable.active_context ?? {},
          openTabs: comparable.open_tabs ?? [],
          workspaceContext: comparable.workspace_context ?? {},
        }
      : undefined,
  };

  const outcome = await reconstruct(capture, memory);

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

  let recoveryMemoryId: string | null = null;
  if (additionalContext && rememberContext) {
    const { data: memoryRow, error: memoryError } = await supabase
      .from("user_memory")
      .insert({
        user_id: userId,
        text: additionalContext.slice(0, 500),
        origin_save_point_id: savePointId,
      })
      .select("id")
      .single();
    if (memoryError || !memoryRow) {
      return NextResponse.json(
        { error: "The thread was reconstructed, but that answer could not be remembered." },
        { status: 500 }
      );
    }
    recoveryMemoryId = String(memoryRow.id);
  }

  const { data: updated, error: updateError } = await supabase
    .from("save_points")
    .update({
      reconstruction: outcome.state,
      ...(additionalContext ? { orienting_answer: additionalContext } : {}),
      restored: true,
      restored_at: new Date().toISOString(),
    })
    .eq("id", savePointId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updated) {
    if (recoveryMemoryId) {
      await supabase.from("user_memory").delete().eq("id", recoveryMemoryId);
    }
    // The reconstruction still succeeded — hand it back even if caching failed.
    return NextResponse.json({ ok: true, state: outcome.state });
  }

  return NextResponse.json({
    ok: true,
    state: outcome.state,
    savePoint: rowToSavePoint(updated),
  });
}
