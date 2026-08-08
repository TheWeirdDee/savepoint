# Save Point checklist

## Correctable memory pass

- [x] User-owned `user_memory` table defined in the full schema and safe migration.
- [x] Corrections update the card immediately and persist on the save point.
- [x] Corrections create authoritative prompt memory.
- [x] Memory list is visible, editable, and deletable.
- [x] Prompt loads no more than five user-confirmed memories.
- [x] Evidence is raw-input provenance, capped at two items and 140 characters.
- [x] Evidence disclosures are collapsed and absent when empty.
- [x] Low-context answers trigger a fresh reconstruction.
- [x] Reusable recovery memory requires explicit opt-in.
- [x] Take me back opens one safe active page and copies the next action.
- [x] Extra pages are individual opt-in links, capped at three.
- [x] Take me back explicitly marks the save restored.
- [x] Same-context continuity compares raw snapshots.
- [x] First-ever saves cannot display a fabricated change list.
- [x] Continuity is collapsed and capped at four bullets.
- [x] No timers, tutoring, quizzes, emotion detection, gamification, learner
  profiling, knowledge graphs, background monitoring, or multi-agent system added.

## Verification

- [x] TypeScript passed after Item 1.
- [x] Webpack production build passed after Item 1.
- [x] TypeScript passed after Item 2.
- [x] Webpack production build passed after Item 2.
- [x] TypeScript passed after Item 3.
- [x] Webpack production build passed after Item 3.
- [x] TypeScript passed after Item 4.
- [x] Webpack production build passed after Item 4.
- [x] TypeScript passed after Item 5.
- [x] Webpack production build passed after Item 5.
- [ ] Apply `supabase/migrations/20260808_memory_loop.sql` to hosted Supabase.
- [ ] Live-create, edit, and delete one remembered correction.
- [ ] Confirm a real subsequent Gemini prompt contains the five-or-fewer
  `USER-CONFIRMED MEMORY` block.
- [ ] Test the primary-page and clipboard behavior in the target browser.
- [ ] Record the final video using `NEW DEMO.md`.

Unchecked items require the hosted Supabase project or an interactive browser;
they are not claimed as completed by the coding environment.

## Groq primary / Gemini fallback

- [x] Groq SDK installed with a lazy server-only client.
- [x] Groq primary model pinned to `llama-3.3-70b-versatile`.
- [x] Gemini fallback pinned to the verified `gemini-3.5-flash-lite`.
- [x] Either provider key works independently; missing providers are skipped.
- [x] Provider failures and unreadable JSON trigger automatic fallback.
- [x] Failed reconstructions remain uncached and are not marked restored.
- [x] Opt-in health route reports both providers and the active primary.
- [ ] Add `GROQ_API_KEY` locally and in Vercel.
- [ ] Run `/api/health/ai?check=1` with both production keys.
- [ ] Exercise a forced Groq failure and confirm Gemini restores successfully.
