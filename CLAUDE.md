# CLAUDE.md

Standing context for **The Bridge V2** — a neuro-inclusive support layer that
embeds *inside* the learning platforms students already use. A stuck learner
describes the problem in their own words; the Bridge routes contextual support to
the right audience (a learner action, a teacher briefing, or a tech report) —
informed by the stage of work and an optional "thinking profile". Live pilot with East London University across six Book
Creator stages (*Poetry in Motion*) and six ThingLink rooms (*Verse in the Void*).

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript** — `output: 'standalone'`.
- **Styling:** Tailwind v4 utility classes (via `@tailwindcss/postcss`; no tailwind.config).
- **AI:** Google Gemini via `@google/genai`. Env: `GEMINI_API_KEY` (missing key ⇒ 503).
- **Icons:** `lucide-react` + 17 hand-drawn inline SVG glyphs (`RESOURCE_ICON_GLYPHS`).
- **Hosting:** Vercel (`the-bridge-v2-immersive`). **Node 24.x.** Repo private: `Techehood/the-bridge-v2-immersive`.
- Import alias `@/*` resolves to repo root (e.g. `@/app/components/BridgeSupport`, `@/lib/barriers`).

## Commands
- `npm run dev` · `npm run build` · `npm run start` · `npm run lint`
- **Builds:** lint errors do NOT fail the build (`eslint.ignoreDuringBuilds: true`);
  type errors DO (`ignoreBuildErrors: false`). Do not rely on CI to catch unused vars / hook-order bugs.

## Architecture
- `app/page.tsx` — root four-step wizard (~1,200 lines).
- `app/bc/[stage]/page.tsx`, `app/tl/[stage]/page.tsx` — thin `"use client"` wrappers that
  render `<BridgeSupport platform=... stage="stageN"/"roomN" .../>`. Only stages `1`–`6` are valid.
- `app/components/BridgeSupport.tsx` — **the entire support panel.** Most logic lives here.
- `app/components/ClientBridgeWrapper.tsx` (main-app floating launcher), `app/components/Header.tsx`.
- `app/api/diagnose/route.ts` — AI endpoint. Takes **structured** learner context, builds the prompt
  server-side, returns **JSON** with a learner-facing *and* teacher-facing payload (`parseSupport`).
  Model **fallback chain** (`gemini-flash-latest` → `gemini-3.5-flash` → `gemini-3.6-flash` →
  `gemini-3.5-flash-lite`) + per-model **config ladder** (no-thinking → capped → default).
  `maxOutputTokens: 2048`, hard 9.5s timeout, status-coded failures (503/504/502/400). Server-side
  fallback uses `libraryDiagnostic`.
- `app/api/feedback/route.ts` — Yes/No outcome, **log-only** (Vercel `console.info`; no durable store).
- **Support flow (in `BridgeSupport`):** two-axis routing. Axis 1 (`tech > environment > learning`,
  `resolveRoute`) picks the view — learner action / "This one needs your teacher" escalation / tech
  fault ("This one isn't you" + auto-collected technician panel + teacher note). Axis 2
  (language / profile / overwhelmed) shapes **wording only**. A learner-initiated "Show my teacher"
  gate reveals the teacher briefing.
- **Quick Supports** (`QUICK_SUPPORTS`) — per-stage in-widget scaffolds for stages/rooms **1, 2, 4, 6**;
  Room 5 keeps its bespoke assembly panels; Room 3 has **none** (curriculum Prompt Builder owns it).
- `lib/barriers.json` — 36 barriers in two platform-keyed libraries (three per stage/room).
- `lib/barriers.ts` — lookup helpers (`getChipsForStageKey`, `matchBarrierForStageKey`, `libraryDiagnostic`, `getAccent`).
- `next.config.ts` — sets `Cache-Control: no-store` on `/bc/:stage` and `/tl/:stage` (iframes cache independently).

## Design system — LOCKED values, embed literally, never reference by name
- **Type:** Verdana (or Open Sans), body ≥ 16px weight ≥ 400, headings ≥ 24px. Never thin weights / machine-only fonts.
- **Core colour (both platforms, functional — never remap):** text `#2D2730`, background `#FAFAEE`, brand purple `#4B2E83`.
- **Platform accent (orientation only, the ONLY thing that differs):**
  Book Creator = `#B86B4A` terracotta **square** badge; ThingLink = `#6B8E5E` sage **circle** badge.
- **Accessibility floor:** WCAG 2.1 AA — body ≥ 4.5:1, large/non-text ≥ 3:1. Verify any new pairing.
- **`BridgeSupport.tsx` now uses the locked palette** (`#FAFAEE` / `#4B2E83`; `blue-600` = 0) — done in
  the reconciliation. **Residual:** the main-app floating launcher in `ClientBridgeWrapper.tsx` still
  uses `blue-600` — the embeds are correct, that one button is not.

## Conventions & things that are easy to get wrong
- **Two separate projects, never merged:** Book Creator = *Poetry in Motion*, ThingLink = *Verse in the Void*.
  Selected by route (`/bc/*` vs `/tl/*`). Never show one platform's content in the other.
- **`stage` is a STRING** (`"stage3"`, `"room3"`), not a number. `lib/barriers.ts` infers platform from
  the prefix (`stage`→bookcreator, `room`→thinglink). Passing a number/renaming the prefix silently breaks chips.
- **Never concatenate the two barrier libraries.** Two ThingLink-only barriers ("lost in the space",
  "360° sensory overload") have no Book Creator equivalent.
- **localStorage is the ONLY thing that crosses embeds** — six iframes = six documents; React context/shared
  stores cannot cross that boundary. Profile key: `bridge.profile` = `{v:1, values:[...]}`. Device-bound.
- The wrappers still pass `profile={[]}` — this is intentional; the real profile is read from localStorage
  inside `BridgeSupport`. **Do not "fix" it by wiring a prop through.**
- **Curriculum labels are locked** — curriculum name first, creative name second after a `·`. Do not "tidy".
- **PNG icons are the master; the inline SVG glyphs are a derived copy.** If PNGs change, reconcile the glyphs.
- **Never pin a single Gemini model / single config** — both the model list and accepted options change
  under you (this broke prod once). Keep the chain + config ladder.
- `maxOutputTokens` must cover the reasoning step — thinking shares the answer's budget; too small a cap
  presents as a 200 with an unusable body.
- **Book Creator strips `allow="microphone"`** from embeds — voice only works in a full tab; the ↗ fallback
  is the normal path, not an edge case. Do not remove it.
- **Test with `?v=N` or a private window** — embeds cache independently; changes deploy but view stale.
- **Never reflow poetry as prose.** Line breaks/stanzas are authorial. Two distinct exemplar poets, one per platform: **Book Creator (*Poetry in Motion*) = Terrez Thomas** (never "Therese"); **ThingLink (*Verse in the Void*) = Dr Kevin M. Isaac**. Do not swap them across platforms.
- **Language & "overwhelmed" are axis-2 delivery modalities, not blockers.** They shape the *wording*
  after routing is decided — they must NEVER pre-empt it. (A `hasLanguage` early-return once did exactly
  that, so a language-flagged tech fault went unreported. It's fixed; keep it fixed.)
- **Quick Support / resource pointers reference titles, NOT numbers.** Stage 6 has two `6.1`s, two `6.2`s
  and two `6.3`s in the same folder (July + 10-Aug sets) — a number points at two files. Do not "tidy"
  a title back to a number.
- **Quick Supports:** skip Room/Stage 3 (curriculum Prompt Builder owns it); Room/Stage 5 keeps its
  bespoke assembly panels; split by platform only where mechanics differ (BC no-mic, TL hotspot/pin).
- **Do NOT reopen or re-merge `codex/bridge-support-colour-remap` (PR #1, closed).** It predates the
  reconciliation; merging it would clobber the JSON parser and the non-clinical prompt constraints on main.

## Known issues / open items (Aug 2026 — post-reconciliation)
Learner-facing output, two-axis routing, the tech three-output rule, the language-precedence fix,
the JSON contract, and Quick Supports for 1/2/4/6 are **shipped on main**. Still open:
- **36 learner-voiced student actions not written.** `immediateSupport` is teacher-voiced ("read only the
  line *they* name"). The learner path uses per-stage emergency lines + Quick Supports today; per-barrier
  2nd-person actions are the next content build.
- **AI generation writes from the prompt, not the library.** The 36 barriers back the *fallback*
  (`libraryDiagnostic`) and client-side routing, but the live Gemini prompt isn't seeded with the matched
  barrier. Design gap, not a wiring bug.
- **Routing by the `route` field is client-side only** — `resolveRoute` reads `barrier.route` via a local
  match; the AI response returns no route. Fine today; revisit if the AI path should own routing.
- **No teacher summary with Copy / Print** — removed in a pre-reconciliation collapse, never restored.
- **Panel does not server-render** — `profileReady` is set in a `useEffect`, so slow devices flash empty briefly.
- **Feedback endpoint is log-only** — Yes/No lands in Vercel logs; no durable store. Follow-up before scaling.
- **Three barrier `type` labels use "overload"** (`Page` / `Sensory` / `Prompt`) — learner-visible; not in the
  six banned words. `barriers.json` is a locked deliverable, don't edit without sign-off.
- **TL Rooms 4–6 not built in ThingLink yet** — the `/tl/*` routes work; the immersive rooms are curriculum-side.
- **Config-driven direction (strategic, not started):** make barriers/stages/quick-supports data so new
  projects need no code change — the partnership-scaling play. Purple PNG icons still disagree with the app.
