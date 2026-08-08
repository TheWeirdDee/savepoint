import { ImageResponse } from "next/og";

// The iOS "add to home screen" icon — same glyph, larger canvas, filled
// background (iOS doesn't respect transparency well on home-screen icons).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#223B34",
        }}
      >
        {/* Same font-independent shape as icon.tsx, scaled up. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: "50%",
            border: "16px solid #C8823C",
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
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
