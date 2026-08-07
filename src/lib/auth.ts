import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

// SERVER ONLY. Simple username/password sessions — no email verification, no
// OAuth. A session is a JWT carrying the user id, handed to the browser as an
// httpOnly cookie (web app) and returned in the JSON body (extension, which
// stores it and sends it back as an Authorization: Bearer header, since
// extensions can't rely on same-site cookies against a separate origin).

export const SESSION_COOKIE = "sp_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// Lazy — reading env only when a token is actually signed/verified, so
// importing this module during `next build` never throws when the secret is
// absent. It only errors if actually called at runtime unconfigured.
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as { sub?: unknown }).sub === "string"
    ) {
      return { userId: (decoded as { sub: string }).sub };
    }
    return null;
  } catch {
    return null;
  }
}

// Reads the session token from the httpOnly cookie (web app requests) or an
// "Authorization: Bearer <token>" header (the extension). Returns the user id
// or null — callers decide whether that's a 401.
export function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const token = bearerToken || cookieToken;
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

// --- Server-side input validation (defense in depth alongside the DB's
// unique constraints on email/username) ---

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUsername(username: string): boolean {
  const u = username.trim();
  return u.length >= 3 && !/\s/.test(u);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
