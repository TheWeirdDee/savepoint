"use client";

import { useState } from "react";

// The mobile fallback: Chrome extensions don't run on any mobile browser
// (not Android Chrome, not iOS Safari — this is a platform restriction, not
// a choice this build made). A bookmarklet is the one capture mechanism that
// genuinely works everywhere a browser does, including phones, without an
// app store, a browser extension store, or any install step beyond "add a
// bookmark." It can't authenticate directly — a bookmarklet runs on
// whatever third-party page it's tapped on, so it can't read this site's
// httpOnly session cookie — so instead it hands the captured context to the
// already-signed-in workspace via a URL, which turns it into a real save
// point (see the ?capture= handling in Workspace.tsx). Capture scope is
// identical to the extension's: title, url, a selection, a short snippet.
// Replace the URL below if you're self-hosting Save Point somewhere else.
const WORKSPACE_ORIGIN = "https://savepoint-seven.vercel.app";

const BOOKMARKLET_HREF = `javascript:(function(){var s=(window.getSelection&&window.getSelection().toString())||'';var m=(document.querySelector('meta[name="description"]')||document.querySelector('meta[property="og:description"]')||{}).content||'';var b=((document.body&&document.body.innerText)||'').replace(/\\s+/g,' ').slice(0,600);var p={title:document.title||'',url:location.href,selectedText:s.slice(0,500),visibleTextSnippet:(m?m+' '+b:b).slice(0,700)};location.href='${WORKSPACE_ORIGIN}/workspace?capture='+encodeURIComponent(JSON.stringify(p));})();`;

export function BookmarkletSection() {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_HREF);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is still visible to select and copy manually */
    }
  }

  return (
    <div className="mt-4">
      <div className="rounded-lg border border-line bg-paper-2 p-4">
        <p className="text-sm font-bold text-ink">On a laptop or desktop</p>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Drag this link to your bookmarks bar:
        </p>
        <a
          href={BOOKMARKLET_HREF}
          onClick={(e) => e.preventDefault()}
          className="mt-2 inline-block cursor-move rounded-md border-[1.5px] border-sage bg-mist px-4 py-2 font-bold text-sage"
        >
          ◍ Save Point
        </a>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-paper-2 p-4">
        <p className="text-sm font-bold text-ink">On a phone (iOS Safari or Android Chrome)</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] text-ink-soft">
          <li>Bookmark any page first (any page — you&apos;ll overwrite its address next).</li>
          <li>
            Open your bookmarks, find that bookmark, and edit it — rename it{" "}
            <strong className="text-ink">Save Point</strong> and replace its
            address with the code below.
          </li>
          <li>
            Save. Now, on any page you want to capture, open bookmarks and tap{" "}
            <strong className="text-ink">Save Point</strong> — it&apos;ll take
            you straight to a &ldquo;Save this page?&rdquo; confirmation in
            your workspace.
          </li>
        </ol>
        <button
          onClick={copyCode}
          className="mt-3 rounded-md border border-line bg-mist px-3 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
        >
          {copied ? "Copied" : "Copy the code"}
        </button>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        The bookmarklet reads only the current page&apos;s title, address, any
        text you had selected, and a short snippet — the same scope as the
        desktop extension. It never runs in the background and does nothing
        until you tap it.
      </p>
    </div>
  );
}
