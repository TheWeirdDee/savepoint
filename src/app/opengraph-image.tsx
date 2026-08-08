import { ImageResponse } from "next/og";

// The preview image shown when a Save Point link is shared (Slack, Discord,
// iMessage, Twitter/X, etc). Generated from code so it can never drift out
// of sync with the actual thesis line or design tokens.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#F7F6F2",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 28,
            fontWeight: 700,
            color: "#23272A",
            marginBottom: 44,
          }}
        >
          {/* Font-independent shape, not the ◍ character — see icon.tsx. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "3px solid #C8823C",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#C8823C",
              }}
            />
          </div>
          Save Point
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#23272A",
            maxWidth: 920,
          }}
        >
          <span>Most tools restore your files. Save Point restores where your </span>
          <span style={{ color: "#3A6B63" }}>thinking </span>
          <span>left off.</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#5C625F",
            marginTop: 36,
          }}
        >
          An AI re-entry tool for neurodivergent students.
        </div>
      </div>
    ),
    { ...size }
  );
}
