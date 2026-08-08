import { NextResponse } from "next/server";

// The extension runs at a chrome-extension:// origin and calls these routes
// with `Content-Type: application/json`, which triggers a CORS preflight.
// Without these headers on both the preflight and the real response, Chrome
// blocks the request before the extension ever sees a body — silently
// breaking login and save from the popup. `*` is safe here because these
// routes never rely on ambient cookies for cross-origin callers: the
// extension authenticates with an explicit Bearer token, and the session
// cookie itself is SameSite=lax, so it is never attached to a cross-site
// fetch/XHR regardless of these headers.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCors(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export function corsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
