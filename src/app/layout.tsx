import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Lexend, Space_Mono } from "next/font/google";
import { AccessibilityBar } from "@/components/AccessibilityBar";
import "./globals.css";

// Atkinson Hyperlegible: designed by the Braille Institute for maximum legibility
// and character disambiguation. Using it as the default is itself an ND-first
// design decision — the typeface is the accessibility statement.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});

// Lexend: tuned to reduce reading fatigue. Offered as the dyslexia-friendly option.
const lexend = Lexend({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

// Space Mono: used sparingly for eyebrows, labels, and the wordmark — a quiet
// typographic accent, never for body copy.
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const THESIS =
  "Most tools restore your files. Save Point restores where your thinking left off.";
const DESCRIPTION =
  "An AI re-entry tool for neurodivergent students. Save your cognitive state in one tap, then restore your thinking — not just your tabs — with a next action, where you were, and what you'd figured out. Asks instead of fabricating when it's unsure.";
const SITE_URL = "https://savepoint-seven.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Save Point",
  description: DESCRIPTION,
  applicationName: "Save Point",
  keywords: [
    "ADHD",
    "neurodivergent",
    "cognitive re-entry",
    "AI reconstruction",
    "accessibility",
    "study tool",
  ],
  authors: [{ name: "Save Point" }],
  openGraph: {
    title: THESIS,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Save Point",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: THESIS }],
  },
  twitter: {
    card: "summary_large_image",
    title: THESIS,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

// Low-glare by default, on the browser chrome too — a warm paper background
// instead of a stark white or default-dark address bar on mobile.
export const viewport: Viewport = {
  themeColor: "#F7F6F2",
};

// Apply stored accessibility prefs before first paint (no flash of default state).
const prefScript = `
(function () {
  try {
    var p = JSON.parse(localStorage.getItem("savepoint.prefs") || "{}");
    var c = document.documentElement.classList;
    if (p.textSize === "lg") c.add("text-lg-user");
    if (p.textSize === "xl") c.add("text-xl-user");
    if (p.spacing === "relaxed") c.add("spacing-relaxed");
    if (p.dyslexia) c.add("font-dyslexia");
    if (p.motionOff) c.add("motion-off");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${atkinson.variable} ${lexend.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefScript }} />
      </head>
      <body className="bg-paper text-ink" suppressHydrationWarning>
        <AccessibilityBar variant="floating" />
        {children}
      </body>
    </html>
  );
}
