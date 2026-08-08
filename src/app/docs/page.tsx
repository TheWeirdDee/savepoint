import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/FaqAccordion";
import { BookmarkletSection } from "@/components/BookmarkletSection";
import { MarkerDot } from "@/components/MarkerDot";

export const metadata: Metadata = {
  title: "Docs · Save Point",
  description: "Quickstart, what a save point is, the extension's real limitations, the mobile fallback, and privacy.",
};

export default function DocsPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="wrap">
        <a href="/" className="flex items-center gap-2 font-mono text-sm font-bold text-ink-soft transition-colors hover:text-ink">
          <MarkerDot />
          ← Back to Save Point
        </a>

        <h1 className="mt-8 text-3xl font-bold text-ink sm:text-4xl">Docs</h1>
        <p className="mt-3 max-w-read text-lg text-ink-soft">
          Everything you need to set up and use Save Point — the workspace,
          the desktop extension, and what to do on a phone.
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
              Manifest V3 extensions don&apos;t run on mobile browsers at all.
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
              The popup shows exactly which username will own the save. Its{" "}
              <strong className="text-ink">Save where my brain is</strong> action captures
              the active tab, any selected text, a short page snippet, and your
              other open tab titles — plus an optional note — into the same
              account as your workspace saves. After saving,{" "}
              <strong className="text-ink">Open workspace</strong> opens that exact
              point at <code className="rounded bg-mist px-1.5 py-0.5 text-ink">/workspace</code>.
              The website and extension keep separate sessions, so their shown
              usernames must match. If the extension session expires, the popup
              returns to its login form.
            </p>
            <p className="mt-4">
              Production defaults to <code className="rounded bg-mist px-1.5 py-0.5 text-ink">https://savepoint-seven.vercel.app</code>;
              local development uses <code className="rounded bg-mist px-1.5 py-0.5 text-ink">http://localhost:4477</code>.
              If you need to switch,
              right-click the extension icon → <strong className="text-ink">Options</strong> and
              change the <strong className="text-ink">Workspace address</strong> to match — for
              example <code className="rounded bg-mist px-1.5 py-0.5 text-ink">https://savepoint-seven.vercel.app</code> to
              save into the live deployment instead of a local dev server.
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

            <h3 className="mt-8 text-lg font-bold text-ink">
              What actually gets in the way of using it
            </h3>
            <p className="mt-2">
              Being honest about this matters more than most feature lists,
              because this build is not on the Chrome Web Store yet — every
              limitation below is a direct consequence of that, not a design
              choice:
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5">
              <li>
                <strong className="text-ink">School-managed Chromebooks often block it entirely.</strong>{" "}
                Most K–12 school IT departments manage student Chromebooks
                through Google Admin policy, and a common default is
                disabling Developer Mode and unpacked-extension installs
                outright. On a locked-down school device, step 2 above
                (&ldquo;Turn on Developer mode&rdquo;) may simply not be an
                option — the toggle is greyed out or the whole page is
                blocked. There is no workaround for this from inside the
                extension; it needs either a Chrome Web Store listing (which
                admins can allow-list) or an IT exception. This is the single
                biggest real-world gap for the actual target audience of this
                product.
              </li>
              <li>
                <strong className="text-ink">No auto-updates.</strong> Because
                it&apos;s not on the Web Store, the extension never updates
                itself. If the code changes, you have to manually reload it
                (chrome://extensions → the reload icon on the Save Point
                card) or re-do &ldquo;Load unpacked&rdquo; with the new files.
              </li>
              <li>
                <strong className="text-ink">Chrome nags about it.</strong>{" "}
                Chrome periodically shows a &ldquo;Disable developer mode
                extensions&rdquo; warning banner for any unpacked extension.
                Dismissing it is safe; it&apos;s Chrome being cautious about
                unsigned code, not a sign anything is wrong.
              </li>
              <li>
                <strong className="text-ink">Some pages block it from reading anything.</strong>{" "}
                Chrome doesn&apos;t allow extensions to run on its own internal
                pages (<code className="rounded bg-mist px-1.5 py-0.5 text-ink">chrome://</code>),
                the Chrome Web Store, or a handful of sites with unusually
                strict content-security policies. On those pages, the popup
                still opens and still saves — it just captures an empty
                selection and snippet instead of erroring. If a save from one
                of these pages looks unusually empty, that&apos;s why.
              </li>
              <li>
                <strong className="text-ink">Chrome (desktop) only, tested.</strong>{" "}
                Manifest V3 extensions can sometimes load in other
                Chromium-based browsers (Edge, Brave), but that&apos;s
                untested here — assume Chrome unless you&apos;ve verified
                otherwise yourself.
              </li>
            </ul>
          </DocSection>

          <DocSection id="mobile" eyebrow="No extension here" title="Mobile & locked-down devices">
            <p>
              Browser extensions don&apos;t run on any mobile browser — not
              Android Chrome, not iOS Safari. That&apos;s an Apple/Google
              platform restriction, not something any web app can work around.
              The same is true on a school Chromebook with Developer Mode
              disabled (see above). Two real fallbacks exist for both cases:
            </p>

            <h3 className="mt-6 text-lg font-bold text-ink">
              1. The workspace itself, on your phone
            </h3>
            <p className="mt-2">
              <Link href="/workspace" className="text-sage underline underline-offset-2">
                The workspace
              </Link>{" "}
              is a normal responsive website — open it in your phone&apos;s
              browser, sign in, and it works the same as on a laptop, just
              stacked into one column. What you lose without the extension is
              automatic page capture: you can&apos;t grab the current tab&apos;s
              title, selection, or a snippet with one tap. What you keep is
              everything else — write a quick note about what you were reading
              (typed or dictated, using your phone&apos;s own voice-to-text
              keyboard), tap <strong className="text-ink">Save where my brain
              is</strong>, and the AI reconstructs from that note the same way
              it would from anything else.
            </p>

            <h3 className="mt-6 text-lg font-bold text-ink">
              2. A bookmarklet — the closest thing to the extension, on a phone
            </h3>
            <p className="mt-2">
              A bookmarklet is a bookmark whose address is a small piece of
              JavaScript instead of a URL — tapping it runs on whatever page
              you&apos;re currently looking at. It needs no app store, no
              browser extension store, no Developer Mode, and works
              identically on iOS Safari, Android Chrome, and a locked-down
              school Chromebook. It captures the same scope as the desktop
              extension (page title, address, your selection, a short
              snippet) and hands it to your already-signed-in workspace to
              confirm and save — it can&apos;t save directly, because a
              bookmarklet runs on someone else&apos;s page and has no way to
              prove who you are on this one.
            </p>
            <BookmarkletSection />
          </DocSection>

          <DocSection id="privacy" eyebrow="How it works" title="Privacy">
            <p>
              Save Point only reads what&apos;s in front of you at the exact
              moment you choose to save — the active tab&apos;s title and URL,
              any text you had selected, a short snippet of the page, your other
              open tab titles, and whatever note you leave. Nothing more. The
              mobile bookmarklet follows the identical rule.
            </p>
            <p className="mt-4">
              There is no background monitoring, no continuous screen capture, no
              browser-history reading, and no keystroke logging. Both the
              extension and the bookmarklet are save triggers, not a
              surveillance layer — neither does anything until you tap them.
            </p>
            <p className="mt-4">
              The one deliberate exception is the workspace document itself:
              while you&apos;re typing there, a plain local draft is kept in
              your browser&apos;s own storage — never sent to the server or
              the AI — purely so a forgotten save never means losing what you
              wrote. That same local activity (typing, then going quiet) is
              also what triggers the occasional &ldquo;want me to save your
              place?&rdquo; offer. It reads only this one document, on this
              one tab. Not your other tabs, not your browsing history, and
              nothing runs in the background once you close it.
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
