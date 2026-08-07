import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToAuthUser } from "@/lib/map";
import {
  verifyPassword,
  signToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import type { LoginInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The extension calls this route cross-origin (chrome-extension://...).
export async function OPTIONS() {
  return corsPreflight();
}

// POST /api/auth/login — body: { username, password }
// Never reveals which of the two was wrong — always the same generic message.
export async function POST(req: NextRequest) {
  return withCors(await handleLogin(req));
}

async function handleLogin(req: NextRequest): Promise<NextResponse> {
  let body: Partial<LoginInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are both required." },
      { status: 400 }
    );
  }

  const GENERIC_ERROR = { error: "Username or password is incorrect." };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  const ok = await verifyPassword(password, data.password_hash as string);
  if (!ok) {
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  const user = rowToAuthUser(data);
  const token = signToken(user.id);

  const res = NextResponse.json({ token, user });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
