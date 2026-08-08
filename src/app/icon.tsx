import { ImageResponse } from "next/og";

// The browser-tab favicon — generated from code, not a static asset, so it
// always matches the one signature glyph (◍) used everywhere else in the
// app instead of drifting into a second logo. Replaces Vercel's default
// triangle icon, which shows whenever a Next.js app defines none of its own.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F6F2",
        }}
      >
        {/* Drawn as nested circles rather than the ◍ character itself —
            satori's remote font fetch for this glyph isn't reliable, and a
            shape renders identically everywhere with no font dependency. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "3px solid #C8823C",
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#C8823C",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
