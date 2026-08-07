import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToAuthUser } from "@/lib/map";
import {
  hashPassword,
  hashResetToken,
  isValidPassword,
  signToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import type { ResetPasswordInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/auth/reset-password — body: { token, password }
// On success, signs the user in immediately (same as signup) — no reason to
// make someone who just proved account ownership log in a second time.
export async function POST(req: NextRequest) {
  let body: Partial<ResetPasswordInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (!token || !password) {
    return NextResponse.json({ error: "Missing reset token or password." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password needs to be at least 8 characters." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const tokenHash = hashResetToken(token);

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("reset_token_hash", tokenHash)
    .gt("reset_token_expires_at", new Date().toISOString())
    .single();

  if (!user) {
    return NextResponse.json(
      { error: "That reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not reset your password. Try again." },
      { status: 500 }
    );
  }

  const authUser = rowToAuthUser(user);
  const sessionToken = signToken(authUser.id);

  const res = NextResponse.json({ token: sessionToken, user: authUser });
  res.cookies.set(SESSION_COOKIE, sessionToken, SESSION_COOKIE_OPTIONS);
  return res;
}
