import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toMemory(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    text: String(row.text),
    originSavePointId: row.origin_save_point_id
      ? String(row.origin_save_point_id)
      : null,
    createdAt: String(row.created_at),
  };
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("user_memory")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Could not load remembered facts." }, { status: 500 });
  }
  return NextResponse.json({ memories: (data ?? []).map(toMemory) });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { text?: string; originSavePointId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = body.text?.trim().slice(0, 500);
  if (!text) return NextResponse.json({ error: "Memory text is required." }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("user_memory")
    .insert({
      user_id: userId,
      text,
      origin_save_point_id: body.originSavePointId || null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not save that memory." }, { status: 500 });
  }
  return NextResponse.json({ memory: toMemory(data) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { id?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = body.text?.trim().slice(0, 500);
  if (!body.id || !text) {
    return NextResponse.json({ error: "Memory id and text are required." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("user_memory")
    .update({ text })
    .eq("id", body.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update that memory." }, { status: 500 });
  }
  return NextResponse.json({ memory: toMemory(data) });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Memory id is required." }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("user_memory")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Could not forget that memory." }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
