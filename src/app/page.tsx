import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Save Point",
  description: "Most tools restore your files. Save Point restores where your thinking left off.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const loggedIn = !!(token && verifyToken(token));

  return (
    <>
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
        <div className="wrap flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-mono text-base font-bold text-ink">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
            Save&nbsp;Point
          </a>
          <nav aria-label="Primary" className="flex items-center gap-5 sm:gap-7">
            <div className="hidden items-center gap-7 md:flex">
              <a href="#problem" className="text-ink-soft transition-colors hover:text-ink">
                Problem
              </a>
              <a href="#how" className="text-ink-soft transition-colors hover:text-ink">
                How it works
              </a>
              <a href="#who" className="text-ink-soft transition-colors hover:text-ink">
                Who it&apos;s for
              </a>
              <a href="#faq" className="text-ink-soft transition-colors hover:text-ink">
                FAQ
              </a>
            </div>
            {loggedIn ? (
              <Link
                href="/workspace"
                className="rounded-md bg-sage px-4 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-sage-bright sm:text-base"
              >
                Open the workspace →
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-bold text-ink-soft transition-colors hover:text-ink sm:text-base"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-sage px-4 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-sage-bright sm:text-base"
                >
                  Sign up →
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="py-14 sm:py-20">
          <div className="wrap grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
                For minds that lose the thread
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-[58px]">
                Most tools restore your files. Save Point restores where your{" "}
                <span className="text-sage">thinking</span> left off.
              </h1>
              <p className="mt-6 max-w-[30em] text-xl text-ink-soft">
                An AI re-entry tool for neurodivergent students. Save your train of
                thought in one tap — come back to exactly where your head was, not
                just where your tabs were.
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link
                  href={loggedIn ? "/workspace" : "/signup"}
                  className="rounded-md bg-sage px-5 py-3.5 text-base font-bold text-paper transition-colors hover:bg-sage-bright"
                >
                  {loggedIn ? "Open the workspace →" : "Create your account →"}
                </Link>
                <a
                  href="#how"
                  className="rounded-md border border-line px-5 py-3.5 text-base font-bold text-ink transition-colors hover:border-sage"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-6 font-mono text-xs text-ink-soft">
                Free · built by an ADHD student · your work is never watched in the background
              </p>
            </div>

            {/* signature: the restore-card mock */}
            <div
              role="img"
              aria-label="Example restore card showing the single next step, where you were, and a gentle confirmation question"
              className="animate-card-pulse rounded-card border border-line bg-mist p-6 shadow-hero sm:p-7"
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-marker">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-marker" />
                Restored
              </div>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                Your next step
              </div>
              <div className="mt-1.5 text-xl font-bold leading-snug text-ink sm:text-[23px]">
                Write two sentences on why Source B is more reliable.
              </div>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                Where you were
              </div>
              <p className="mt-1.5 text-[15.5px] text-ink-soft">
                Comparing the dates and authors of two sources for your biology
                report.
              </p>
              <div className="mt-4 rounded-lg border border-line bg-paper-2 p-3.5">
                <p className="text-[15px] text-ask">
                  One thing I&apos;m less sure about — it looks like you preferred
                  Source B. Was that right?
                </p>
                <div className="mt-2.5 flex gap-2">
                  <span className="rounded-full border-[1.5px] border-sage px-3 py-1.5 text-[13px] font-bold text-sage">
                    Yes
                  </span>
                  <span className="rounded-full border-[1.5px] border-line bg-mist px-3 py-1.5 text-[13px] font-bold text-ink">
                    No, it was A
                  </span>
                </div>
              </div>
              <p className="mt-4 font-mono text-[13.5px] text-ink-soft">
                ▸ More context — 4 open threads · 6 tabs · your note
              </p>
            </div>
          </div>
        </section>

        {/* THE SHIFT */}
        <section className="bg-forest py-16 text-bone sm:py-24">
          <div className="wrap">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-marker-soft">
              The shift
            </span>
            <h2 className="mt-4 max-w-[14em] text-3xl font-bold text-white sm:text-4xl">
              When you&apos;re interrupted, your files survive. Your train of
              thought doesn&apos;t.
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-card border border-line-dark bg-forest-2 p-7">
                <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-bone-soft">
                  What other tools bring back
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "biology_report.doc",
                    "source A — journal",
                    "source B — .edu",
                    "what is peer review?",
                    "youtube",
                    "citation generator",
                    "gmail",
                    "source C?",
                  ].map((tab) => (
                    <span
                      key={tab}
                      className="max-w-full truncate rounded-md border border-line-dark bg-white/[0.06] px-2.5 py-1.5 font-mono text-xs text-bone-soft"
                    >
                      {tab}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-bone-soft">
                  Everything you had open. None of what you were thinking.
                </p>
              </div>
              <div className="rounded-card border border-marker-soft/35 bg-marker/10 p-7">
                <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-marker-soft">
                  What Save Point brings back
                </h3>
                <div className="mt-4 flex items-start gap-3.5">
                  <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-marker" />
                  <div>
                    <div className="text-xl font-bold leading-snug text-white">
                      Write two sentences on why Source B is more reliable.
                    </div>
                    <div className="mt-2 text-sm text-bone-soft">
                      You&apos;d already decided B was stronger. One step, and
                      you&apos;re back in.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section id="problem" className="py-16 sm:py-24">
          <div className="wrap">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
              The problem
            </span>
            <p className="mt-6 max-w-[16em] text-2xl font-bold leading-tight text-ink sm:text-[34px]">
              You don&apos;t lose the assignment. You lose{" "}
              <span
                className="text-sage"
                style={{
                  backgroundImage:
                    "linear-gradient(transparent 62%, rgba(58,107,99,0.16) 62%)",
                }}
              >
                why you were reading this, which idea you&apos;d ruled out, and what
                you were about to write next.
              </span>
            </p>
            <p className="mt-6 max-w-read text-lg text-ink-soft">
              Rebuilding that mental structure from cold is the expensive part —
              and when it costs too much, you just don&apos;t go back. That&apos;s
              not a focus problem to fix. It&apos;s a cost problem to remove.{" "}
              <strong className="font-bold text-ink">
                Save Point doesn&apos;t ask you to concentrate harder or get
                interrupted less. It holds the thread for you, so stepping away
                stops being a punishment.
              </strong>{" "}
              Your deep focus is the thing worth protecting — not the thing to
              apologize for.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="bg-paper-2 py-14 sm:py-20">
          <div className="wrap">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              Three steps. Nothing to learn.
            </h2>
            <div className="mt-11 grid grid-cols-1 gap-5 md:grid-cols-3">
              <StepCard n={1} title="Save your state">
                One tap. Add a quick note by voice or text if you want — or
                don&apos;t. Saving never interrupts you.
              </StepCard>
              <StepCard n={2} title="Get interrupted. Leave.">
                Life happens. Close the tab, walk away, come back in an hour or
                tomorrow. No timers, no guilt.
              </StepCard>
              <StepCard n={3} title="Restore your thinking">
                Come back to one clear next step, where you were, and what
                you&apos;d figured out — not a wall of windows.
              </StepCard>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-16 sm:py-24">
          <div className="wrap">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
              What makes it different
            </span>
            <h2 className="mt-4 max-w-[16em] text-3xl font-bold text-ink sm:text-4xl">
              Built for how your mind actually works — down to the last detail.
            </h2>
            <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureTile title="One next step, first">
                The screen leads with a single physical action small enough to
                just start. Everything else stays folded away.
              </FeatureTile>
              <FeatureTile title="It asks when unsure">
                When the AI can&apos;t tell where you left off, it asks you one
                question instead of inventing a confident wrong answer.
              </FeatureTile>
              <FeatureTile title="Reads the way you need">
                A dyslexia-friendly font, larger text, and reduced motion — one
                tap, remembered for next time.
              </FeatureTile>
              <FeatureTile title="Saves from anywhere">
                A desktop browser extension lets you drop a save point from any
                page, deep in dozens of tabs. It restores back here, in the calm.
              </FeatureTile>
              <FeatureTile title="Never watched">
                No background monitoring, no history scraping. It only captures
                the moment you choose to save. That&apos;s the whole point.
              </FeatureTile>
              <FeatureTile title="No shame, no clock">
                It never tells you how long you were gone or that you fell
                behind. Just a quiet way back in.
              </FeatureTile>
            </div>
          </div>
        </section>

        {/* WHO */}
        <section id="who" className="bg-forest py-16 text-bone sm:py-24">
          <div className="wrap grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-marker-soft">
                Who it&apos;s for
              </span>
              <h2 className="mt-4 max-w-[12em] text-3xl font-bold text-white sm:text-4xl">
                Made for neurodivergent students, from the inside.
              </h2>
              <p className="mt-5 text-lg text-bone-soft">
                Save Point was designed by an ADHD student who kept losing the
                thread every time work got interrupted — and got tired of tools
                that treat that like a character flaw. If your focus runs deep
                but interruptions cost you everything, this was built for the way
                your mind actually works, not an average one.
              </p>
            </div>
            <p className="border-l-2 border-marker pl-5 font-mono text-sm leading-relaxed tracking-wide text-marker-soft">
              Nothing about us,
              <br />
              without us.
              <br />
              <br />
              Designed with neurodivergent students, not just for them.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-24">
          <div className="wrap">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-sage">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
              Questions
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              Fair things to ask.
            </h2>
            <div className="mt-10">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20">
          <div className="wrap">
            <div className="rounded-[22px] bg-forest px-8 py-14 text-center text-white sm:px-11">
              <h2 className="text-3xl font-bold sm:text-[44px]">
                Pick up your train of thought
                <br />
                right where it derailed.
              </h2>
              <p className="mx-auto mt-4 max-w-[34em] text-bone-soft">
                Save your state in a tap. Come back to one clear next step — not a
                wall of tabs.
              </p>
              <Link
                href="/workspace"
                className="mt-7 inline-block rounded-md bg-sage px-6 py-3.5 text-base font-bold text-paper transition-colors hover:bg-sage-bright"
              >
                Open the workspace →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-forest-2 py-14 text-bone-soft">
        <div className="wrap">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 font-mono text-base font-bold text-bone">
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-marker" />
                Save&nbsp;Point
              </div>
              <p className="mt-3.5 max-w-[26em] text-sm">
                Restore where your thinking left off. An AI re-entry tool built
                for how neurodivergent students actually work.
              </p>
            </div>
            <FooterColumn title="Product">
              <FooterLink href="/workspace">Open the workspace</FooterLink>
              <FooterLink href="#how">How it works</FooterLink>
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#faq">FAQ</FooterLink>
            </FooterColumn>
            <FooterColumn title="Get started">
              <FooterLink href="/docs#quickstart">Quickstart guide</FooterLink>
              <FooterLink href="/docs#extension">Load the extension</FooterLink>
              <FooterLink href="/docs">Docs</FooterLink>
              <FooterLink href="/docs#what-is-a-save-point">
                What is a save point?
              </FooterLink>
            </FooterColumn>
            <FooterColumn title="About">
              <FooterLink href="#who">Who it&apos;s for</FooterLink>
              <FooterLink href="/docs#privacy">Our approach to privacy</FooterLink>
              <FooterLink href="#who">Built with the community</FooterLink>
            </FooterColumn>
          </div>
          <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-line-dark pt-6 text-sm">
            <span>◍ Save Point — built for how you think.</span>
            <span>Made for the IncludAI × Stanford NNEA neurodiversity hackathon.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function StepCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-mist p-6">
      <div className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-marker">
        Step {n}
      </div>
      <h3 className="mt-3.5 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[15.5px] text-ink-soft">{children}</p>
    </div>
  );
}

function FeatureTile({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-paper-2 p-6">
      <div className="flex items-center gap-2 text-[17px] font-bold text-ink">
        <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full bg-marker" />
        {title}
      </div>
      <p className="mt-2.5 text-sm text-ink-soft">{children}</p>
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-3.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-marker-soft">
        {title}
      </h4>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="py-1.5 text-sm transition-colors hover:text-white">
      {children}
    </a>
  );
}
