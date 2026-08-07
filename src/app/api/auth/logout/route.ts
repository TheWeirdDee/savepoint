import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/auth/logout — clears the session cookie. The extension separately
// clears its own stored Bearer token client-side (see extension/popup.js).
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
