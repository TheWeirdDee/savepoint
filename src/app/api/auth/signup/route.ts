import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rowToAuthUser } from "@/lib/map";
import {
  hashPassword,
  signToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  isValidEmail,
  isValidUsername,
  isValidPassword,
} from "@/lib/auth";
import type { SignupInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/auth/signup — body: { email, fullName, username, password }
export async function POST(req: NextRequest) {
  let body: Partial<SignupInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const fullName = (body.fullName ?? "").trim();
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!email || !fullName || !username || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid email address." },
      { status: 400 }
    );
  }
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username needs to be at least 3 characters, with no spaces." },
      { status: 400 }
    );
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password needs to be at least 8 characters." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      full_name: fullName,
      username,
      password_hash: passwordHash,
    })
    .select()
    .single();

  if (error || !data) {
    // Postgres unique_violation on the email/username unique constraints.
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "That email or username is already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not create your account. Try once more." },
      { status: 500 }
    );
  }

  const user = rowToAuthUser(data);
  const token = signToken(user.id);

  const res = NextResponse.json({ token, user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
