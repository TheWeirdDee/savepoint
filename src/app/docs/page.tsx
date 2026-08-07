import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "Docs · Save Point",
  description: "Quickstart, what a save point is, loading the extension, and privacy.",
};

export default function DocsPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="wrap">
        <a href="/" className="flex items-center gap-2 font-mono text-sm font-bold text-ink-soft transition-colors hover:text-ink">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-marker" />
          ← Back to Save Point
        </a>

        <h1 className="mt-8 text-3xl font-bold text-ink sm:text-4xl">Docs</h1>
        <p className="mt-3 max-w-read text-lg text-ink-soft">
          Everything you need to set up and use Save Point — the workspace and
          the desktop extension.
        </p>

        <div className="mt-14 max-w-read space-y-16">
          <DocSection id="quickstart" eyebrow="Get started" title="Quickstart">
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <Link href="/signup" className="text-sage underline underline-offset-2">
                  Create an account
                </Link>{" "}
                (email, full name, username, password) or{" "}
                <Link href="/login" className="text-sage underline underline-offset-2">
                  log in
                </Link>{" "}
                if you already have one. You&apos;ll land straight in the workspace.
              </li>
              <li>Write or research in the document area, same as any text editor.</li>
              <li>
                When you need to step away, tap <strong className="text-ink">Save where my brain is</strong>.
                Add a quick note if you want, or skip it — either way it&apos;s
                instant.
              </li>
              <li>Close the tab. Come back whenever — an hour later, or tomorrow.</li>
              <li>
                Reopen the workspace. It quietly offers to restore your last save
                point. Click <strong className="text-ink">Restore where I was</strong> and
                you&apos;ll see one clear next step first, then where you were.
              </li>
            </ol>
          </DocSection>

          <DocSection id="what-is-a-save-point" eyebrow="Concepts" title="What is a save point?">
            <p>
              A save point is a snapshot of where your head is — your goal, what
              you&apos;d already decided, and what&apos;s next — not your files.
              Your browser already keeps those. What it usually doesn&apos;t keep
              is the reasoning that connected them: why you were reading this,
              which idea you&apos;d ruled out, what you were about to write next.
            </p>
            <p className="mt-4">
              When you restore a save point, an AI model reconstructs that
              reasoning from whatever you gave it (a note, your document, a
              selection, the page you were on, your other open tabs) and hands
              you back one concrete next action, plus the context behind it. It
              marks anything it isn&apos;t sure about instead of guessing
              silently — see the FAQ below on what happens when it&apos;s unsure.
            </p>
          </DocSection>

          <DocSection id="extension" eyebrow="Desktop only" title="Loading the desktop extension">
            <p>
              The extension lets you create a save point from any web page — not
              just the workspace — so it works where your reading actually
              happens, across dozens of open tabs. It is desktop Chrome only;
              Manifest V3 extensions don&apos;t run on mobile browsers.
            </p>
            <ol className="mt-4 list-decimal space-y-3 pl-5">
              <li>
                In Chrome, go to <code className="rounded bg-mist px-1.5 py-0.5 text-ink">chrome://extensions</code>.
              </li>
              <li>Turn on <strong className="text-ink">Developer mode</strong> (top right).</li>
              <li>
                Click <strong className="text-ink">Load unpacked</strong> and select the
                extension&apos;s <code className="rounded bg-mist px-1.5 py-0.5 text-ink">extension/</code> folder
                (see the note below if you don&apos;t have this project&apos;s files).
              </li>
              <li>
                Click the Save Point icon in your toolbar. It opens straight to a
                small login form.
              </li>
              <li>
                Log in with the <strong className="text-ink">same username and password</strong> you
                use on the workspace. No codes, no ids to copy — that&apos;s it.
              </li>
            </ol>
            <p className="mt-4">
              Now the popup&apos;s <strong className="text-ink">Save where my brain is</strong> captures
              the active tab, any selected text, a short page snippet, and your
              other open tab titles — plus an optional note — into the same
              account as your workspace saves. Restore always happens back in
              the workspace, never in the popup. If your session ever expires,
              the popup drops back to the login form automatically.
            </p>
            <p className="mt-4">
              If the workspace isn&apos;t running at <code className="rounded bg-mist px-1.5 py-0.5 text-ink">http://localhost:3000</code>,
              right-click the extension icon → <strong className="text-ink">Options</strong> and
              change the <strong className="text-ink">Workspace address</strong> to match.
            </p>
            <p className="mt-4 rounded-lg border border-line bg-paper-2 p-4 text-[15px]">
              <strong className="text-ink">Don&apos;t have this project&apos;s files?</strong> &ldquo;Load
              unpacked&rdquo; needs an actual folder on your computer — Chrome
              can&apos;t install an extension from a link unless it&apos;s
              published on the Chrome Web Store. Ask whoever is running this
              build for a copy of the <code className="rounded bg-mist px-1.5 py-0.5 text-ink">extension/</code> folder,
              or check whether it&apos;s been published to the Web Store yet —
              if so, install it from there instead and skip the steps above.
            </p>
          </DocSection>

          <DocSection id="privacy" eyebrow="How it works" title="Privacy">
            <p>
              Save Point only reads what&apos;s in front of you at the exact
              moment you choose to save — the active tab&apos;s title and URL,
              any text you had selected, a short snippet of the page, your other
              open tab titles, and whatever note you leave. Nothing more.
            </p>
            <p className="mt-4">
              There is no background monitoring, no continuous screen capture, no
              browser-history reading, and no keystroke logging. The extension is
              a save trigger, not a surveillance layer — it does nothing until
              you tap the button.
            </p>
          </DocSection>

          <DocSection id="faq" eyebrow="Questions" title="FAQ">
            <FaqAccordion />
          </DocSection>
        </div>
      </div>
    </div>
  );
}

function DocSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-4 text-ink-soft [&_a]:font-medium">{children}</div>
    </section>
  );
}
