import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToSavePoint } from "@/lib/map";
import { getUserId } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import type { SavePointCapture, SavePointPatch, ReconstructedState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The extension calls POST here cross-origin (chrome-extension://...).
export async function OPTIONS() {
  return corsPreflight();
}

// POST /api/save-points — create a save point (from workspace OR extension)
// for the signed-in user. Body: { capture: SavePointCapture }
export async function POST(req: NextRequest) {
  return withCors(await handlePost(req));
}

async function handlePost(req: NextRequest): Promise<NextResponse> {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { capture?: SavePointCapture };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { capture } = body;
  if (!capture || (capture.source !== "workspace" && capture.source !== "extension")) {
    return NextResponse.json(
      { error: "Missing or invalid capture packet." },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("save_points")
    .insert({
      user_id: userId,
      source: capture.source,
      user_note: capture.userNote?.trim() || null,
      active_context: capture.activeContext ?? {},
      open_tabs: capture.openTabs ?? [],
      workspace_context: capture.workspaceContext ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not save. Try once more." },
      { status: 500 }
    );
  }

  return NextResponse.json({ savePoint: rowToSavePoint(data) }, { status: 201 });
}

// GET /api/save-points — list the signed-in user's save points, newest first.
export async function GET(req: NextRequest) {
  return withCors(await handleGet(req));
}

async function handleGet(req: NextRequest): Promise<NextResponse> {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("save_points")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load save points." }, { status: 500 });
  }

  const savePoints = (data ?? []).map(rowToSavePoint);
  const latestUnrestored = savePoints.find((s) => !s.restored) ?? null;

  return NextResponse.json({ savePoints, latestUnrestored });
}

// PATCH /api/save-points — record a correction on a flagged decision, and/or
// mark a point restored. The student's own memory always wins over the model's.
export async function PATCH(req: NextRequest) {
  return withCors(await handlePatch(req));
}

async function handlePatch(req: NextRequest): Promise<NextResponse> {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: SavePointPatch;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { savePointId, correction, markRestored } = body;
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

  const update: Record<string, unknown> = {};

  if (correction && row.reconstruction) {
    const reconstruction = row.reconstruction as ReconstructedState;
    const decision = reconstruction.decisions[correction.decisionIndex];
    if (decision) {
      decision.needsConfirmation = false;
      decision.confidence = correction.wasCorrect ? "high" : "low";
      if (!correction.wasCorrect && correction.correctedText?.trim()) {
        decision.text = correction.correctedText.trim();
      }
      update.reconstruction = reconstruction;
    }
  }

  if (markRestored || correction) {
    update.restored = true;
    update.restored_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ savePoint: rowToSavePoint(row) });
  }

  const { data: updated, error: updateError } = await supabase
    .from("save_points")
    .update(update)
    .eq("id", savePointId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Could not save your correction." }, { status: 500 });
  }

  return NextResponse.json({ savePoint: rowToSavePoint(updated) });
}
