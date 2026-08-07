import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateResetToken, hashResetToken, isValidEmail, RESET_TOKEN_TTL_MS } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import type { ForgotPasswordInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same response whether or not the email is on file — never confirm which
// accounts exist.
const GENERIC_MESSAGE = "If an account exists for that email, we've sent a reset link.";

// POST /api/auth/forgot-password — body: { email }
export async function POST(req: NextRequest) {
  let body: Partial<ForgotPasswordInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  const { error: updateError } = await supabase
    .from("users")
    .update({ reset_token_hash: tokenHash, reset_token_expires_at: expiresAt })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not start a password reset. Try again." },
      { status: 500 }
    );
  }

  const resetUrl = `${req.nextUrl.origin}/reset-password/${token}`;
  try {
    await sendPasswordResetEmail(user.email as string, resetUrl);
  } catch (err) {
    console.error("[forgot-password] send failed:", err);
    return NextResponse.json(
      { error: "Couldn't send the reset email. Check RESEND_API_KEY is set and try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
