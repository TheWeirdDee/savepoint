import type { Config } from "tailwindcss";

/**
 * ND-first design tokens (Save Point design system, section 7 of the build spec).
 * No pure white, no pure black, low saturation, calm. Confidence tiers map to
 * sage (high, statement) / marker (medium, hedge) / ask (low, question) — never
 * an alarm color. Forest/bone are the dark-band pairing used for section rhythm
 * on the landing page; paper/paper-2/mist stay for light surfaces everywhere else.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F2",
        "paper-2": "#EFEDE6",
        ink: "#23272A",
        "ink-soft": "#5C625F",
        mist: "#ECEAE3",
        line: "#DAD7CE",
        "line-dark": "rgba(237,234,224,.16)",
        sage: "#3A6B63",
        "sage-bright": "#4E8A7E",
        marker: "#C8823C",
        "marker-soft": "#E6B888",
        ask: "#6B72A6",
        forest: "#223B34",
        "forest-2": "#1B302B",
        bone: "#EDEAE0",
        "bone-soft": "#AFC0B8",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        wrap: "1120px",
        read: "40rem",
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,39,42,0.04), 0 8px 24px rgba(35,39,42,0.05)",
        hero: "0 24px 60px -34px rgba(34,59,52,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
