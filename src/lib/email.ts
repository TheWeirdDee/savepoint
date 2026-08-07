// SERVER ONLY. Sends password-reset emails via Resend's REST API directly —
// no SDK dependency, since this is a single endpoint. Lazy: reading env only
// when actually called, so importing this module during `next build` never
// throws when the key is absent (same pattern as supabase.ts / gemini.ts).

const RESEND_API_URL = "https://api.resend.com/emails";

// Resend's shared sandbox sender works immediately with zero setup — no
// domain verification needed. Good enough for a hackathon build. Swap in a
// verified "Name <you@yourdomain.com>" via RESEND_FROM_EMAIL once you have one.
const DEFAULT_FROM = "Save Point <onboarding@resend.dev>";

function getApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return key;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const apiKey = getApiKey();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Save Point password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #23272A;">
          <p>Someone asked to reset the password on this Save Point account.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block; background:#3A6B63; color:#F7F6F2; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
              Reset your password
            </a>
          </p>
          <p style="color:#5C625F; font-size:14px;">
            This link works once and expires in 1 hour. If you didn't request
            this, you can ignore this email — your password hasn't changed.
          </p>
        </div>
      `,
      text: `Reset your Save Point password: ${resetUrl}\n\nThis link works once and expires in 1 hour. If you didn't request this, ignore this email — your password hasn't changed.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}
