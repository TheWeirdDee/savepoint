import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToAuthUser } from "@/lib/map";
import { getUserId } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/auth/me — resolves the session cookie or Bearer token to a user.
export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {
  return withCors(await handleGet(req));
}

async function handleGet(req: NextRequest): Promise<NextResponse> {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  return NextResponse.json({ user: rowToAuthUser(data) });
}
