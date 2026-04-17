# Nassau — Product Audit & Gap Analysis

_Generated 2026-04-17 during the overnight build run on branch `claude/overnight-build-20260417`._

Scope: everything in `src/` + `prisma/` + `vercel.json` + `public/` at HEAD, read-only audit
(no code changes were made as part of this document). The repository type-checks
cleanly — `npx tsc --noEmit` exits 0.

---

## 1. Executive Summary

Nassau is further along than a typical pre-launch v1. The App Router tree has **53
pages** and **106 API routes**, a **19-model Prisma schema** wired through both a
legacy scoring system (`Rounds` / `SkinsGames` / `Scorecards`) and the newer
"Commissioner Mode" (`GameRounds` / `GamePlayers` / `GameScorecards` / `GameSkinsGames`
/ `GameNassauBets` / `GameExpenses` / `GameSettlements`), and a full marketing
agent stack with 12 cron-driven agents. The app ships with Supabase SSR auth, Stripe
billing, Resend transactional email, Anthropic Claude for AI trip ideation and receipt
scanning, and a Prisma 7 + pg adapter backend.

The things that are in very good shape: routing / layout nesting, demo routes (now
with chrome-free marketing variants), the explore page with the new
`destination-images.ts` resolver, type safety, and the SkinsCalculator math. The
things that need attention before the May 4 launch fall into three buckets:

**Launch-blocking (fix this week):**

1. `vercel.json` schedules `/api/cron/engagement` daily at 14:00 UTC, but **the
   route does not exist** (`src/app/api/cron/engagement` is absent). Vercel will
   log a 404 on every run and the daily engagement email will never send.
2. **Row-Level Security is not enabled on 9 production tables.** Of the 19 Prisma
   models, only 10 have `ALTER TABLE … ENABLE ROW LEVEL SECURITY` in
   `schema-step2-policies.sql`. The 7 Commissioner tables plus `Settlements` and
   `MarketingPartnerships` are unprotected. Any Supabase anon-key query against
   those tables currently returns all rows.
3. **Referral flow is broken.** `/r/[code]/page.tsx` calls `redirect("/auth/signup")`
   but `src/app/auth/` contains only `callback/` and `signout/` — there is no
   `signup` route. Every referral click currently lands on a 404.

**Important (fix before wider beta):**

4. `src/app/api/cron/writer/route.ts` is a stub that only returns
   `{ success: true }`. It's orphaned — `vercel.json` points the cron at
   `/api/admin/marketing/writer` instead — but leaving both paths live is
   confusing and the stub should be deleted or implemented.
5. Stripe webhook hardcodes a `TODO: Update with actual Stripe price IDs` and then
   reads `STRIPE_PRO_PRICE_ID` / `STRIPE_PREMIUM_PRICE_ID` from env. If those env
   vars aren't configured in Vercel, subscription tier assignment will silently
   break.
6. **30+ API routes have no `try/catch` wrapping.** Any unhandled Prisma or
   Supabase error will surface in production as a 500 with a stack trace instead
   of a structured JSON error response.
7. **No per-page OG images.** Only the root `public/og-image.png` exists; blog
   posts, trip previews, and explore pages all share the same image when pasted
   into iMessage / Slack.

**Nice-to-have / tech debt (post-launch):**

8. Two parallel scoring systems (`Scorecards` / `Rounds` legacy vs. `Game*`
   Commissioner). Unclear which is authoritative — both have API surface.
9. 49 `console.log` + 128 `console.error` calls sprinkled through `src/`. Fine
   for debugging, but Vercel logs will get noisy at launch scale.
10. Two `CourseSearch` components (`src/components/CourseSearch.tsx` and
    `src/components/shared/CourseSearch.tsx`) — pick one and remove the other.

---

## 2. Route Map

### 2.1 Page routes (53 total)

**Public / marketing:**
`/` (landing), `/pricing`, `/founding`, `/explore`, `/blog`, `/blog/[slug]`,
`/login`, `/login-test`, `/r/[code]` (referral redirect), `/trip/preview/[slug]`.

**Onboarded user app:**
`/dashboard`, `/onboarding`, `/profile`, `/trips`, `/trips/new`, `/trips/create`,
`/trips/create/ai`, `/trips/[id]`, `/trips/[id]/expenses`, `/trips/[id]/leaderboard`,
`/trips/[id]/pairings`, `/trips/[id]/scorecards`, `/trips/[id]/skins`,
`/rounds`, `/rounds/new`, `/rounds/[id]`, `/rounds/[id]/live`,
`/scorecards`, `/scorecards/[id]`, `/settlements`.

**Share / invite (unauthenticated readable):**
`/trip/[shareCode]`, `/invite/[code]`, `/round/[shareCode]`,
`/round/[shareCode]/recap`.

**Demo (pre-auth marketing):**
`/demo`, `/demo/explore`, `/demo/invite`, `/demo/planning`, `/demo/recap`,
`/demo/scorecard`, `/demo/settlements`, `/demo/trip-share`, `/demo/trip-wizard`.

**Demo / screenshots (chrome-free, new in Phase C):**
`/demo/screenshots` (index), `/demo/screenshots/command-center`,
`/demo/screenshots/trip-wizard`, `/demo/screenshots/scorecard`,
`/demo/screenshots/settlements`, `/demo/screenshots/share`,
`/demo/screenshots/explore`.

**Admin:**
`/admin/integrity`, `/admin/marketing`, `/admin/marketing/seo/[id]`,
`/admin/visual-generator`.

### 2.2 API routes (106 total)

**Trips & membership:**
`/api/trips`, `/api/trips/[id]`, `/api/trips/ai-ideate`,
`/api/trips/[id]/members`, `/api/trips/[id]/members/[memberId]`,
`/api/trips/[id]/invite`, `/api/trips/[id]/rsvp`,
`/api/trips/[id]/date-poll`, `/api/trips/[id]/date-poll/vote`,
`/api/trips/[id]/date-poll/lock`, `/api/trips/[id]/date-poll/suggestions`,
`/api/trips/[id]/itinerary`, `/api/trips/[id]/itinerary/[itemId]`,
`/api/trips/[id]/itinerary/reorder`,
`/api/trips/[id]/expenses`, `/api/trips/[id]/expenses/scan-receipt`,
`/api/trips/[id]/photos`,
`/api/trips/[id]/rounds`,
`/api/trips/[id]/scorecards`, `/api/trips/[id]/scorecards/[scorecardId]/upload-photo`,
`/api/trips/[id]/scorecards/[scorecardId]/confirm-ocr`,
`/api/trips/[id]/skins`.

**Legacy rounds / scorecards / skins / settlements / expenses:**
`/api/rounds`, `/api/rounds/[id]`, `/api/rounds/[id]/complete`,
`/api/rounds/[id]/settle`,
`/api/scorecards`, `/api/scorecards/[id]`,
`/api/scorecards/[id]/entries/[playerIdx]/[holeIdx]`,
`/api/skins`, `/api/skins/[id]`,
`/api/settlements`, `/api/settlements/[id]`,
`/api/expenses`, `/api/expenses/[id]`.

**Commissioner Mode (`game_*` tables):**
`/api/game-rounds`, `/api/game-rounds/[id]`,
`/api/game-rounds/[id]/players`, `/api/game-rounds/[id]/players/[playerId]`,
`/api/game-rounds/[id]/scorecards`, `/api/game-rounds/[id]/scorecards/scan`,
`/api/game-rounds/[id]/skins`,
`/api/game-rounds/[id]/nassau-bet`,
`/api/game-rounds/[id]/expenses`, `/api/game-rounds/[id]/expenses/[expenseId]`,
`/api/game-rounds/[id]/expenses/scan-receipt`,
`/api/game-rounds/[id]/settlements`, `/api/game-rounds/[id]/settlements/[settlementId]`,
`/api/game-rounds/[id]/settlements/recalculate`,
`/api/game-rounds/invite/[shareCode]`, `/api/game-rounds/invite/[shareCode]/join`.

**Share / invite / referral / public reads:**
`/api/trip/[shareCode]`, `/api/invite/[code]`, `/api/invite/[code]/join`,
`/api/referral/generate`.

**Profile / onboarding:**
`/api/profile`, `/api/profile/stats`, `/api/profile/venmo`,
`/api/onboarding/complete`, `/api/user/me`, `/api/dashboard`.

**Integrations:**
`/api/course-search`, `/api/courses/search`, `/api/places/autocomplete`,
`/api/weather`, `/api/waitlist`, `/api/health`.

**Stripe + auth webhooks:**
`/api/stripe/create-checkout`, `/api/stripe/create-portal`,
`/api/webhooks/stripe`, `/api/webhooks/user-signup`.

**Marketing agents (admin only):**
12 agent endpoints under `/api/admin/marketing/*` +
`/api/admin/integrity-check`, `/api/admin/integrity-history`,
`/api/admin/photos/search`, `/api/admin/seo/[id]`,
`/api/admin/partnerships/*`, `/api/admin/migrate`.

**Cron (Vercel):**
`/api/cron/complete-rounds` (every 15 min),
`/api/cron/integrity-check` (every 4 hours),
`/api/cron/scout`, `/api/cron/strategist`, `/api/cron/writer` (stub).

### 2.3 Layouts (10)

Root `src/app/layout.tsx` (Playfair + Inter + Geist fonts, metadata, NavBar),
`demo/layout.tsx` (now uses `<DemoBadge />`), `demo/screenshots/layout.tsx`
(chrome-free, iPhone 15 Pro viewport, new in Phase C), plus
`explore/`, `founding/`, `pricing/`, `round/[shareCode]/`, `rounds/[id]/`,
`trip/[shareCode]/`, `trips/[id]/` layouts that scope their own chrome.

### 2.4 NavBar chrome-hide guard

`NavBar.tsx` uses `APP_ROUTES = ['/dashboard', '/rounds', '/trips',
'/scorecard', '/settlements', '/profile', '/demo']` and returns `null` for any
pathname that begins with one of those. The new
`/demo/screenshots/*` routes inherit that guard automatically — no additional
middleware needed. ✅

---

## 3. Component & Lib Inventory

**`src/components/`:**
`NavBar.tsx` (public + app guard), `TopBar.tsx` (sticky in-app top bar),
`CourseSearch.tsx` (legacy duplicate), `HeroBackdrop.tsx`,
`DemoBadge.tsx` (new in Phase C, path-aware),
`RoundHub.tsx`, `ReferralCard.tsx`.

**`src/components/landing/`:** `HeroSection.tsx`, `HowItWorks.tsx`,
`DestinationsSection.tsx`, `DestinationGridCard.tsx`, `BetsSection.tsx`,
`CTASection.tsx`.

**`src/components/preview/`:** `PreviewHero.tsx`, `PreviewCourses.tsx`,
`PreviewItinerary.tsx`, `PreviewInsiderTips.tsx`, `PreviewCTA.tsx`.

**`src/components/shared/`:** `ScorecardGrid.tsx`, `MobileScorecard.tsx`,
`ScorecardScanner.tsx`, `SkinsCalculator.tsx`, `NassauBetCalculator.tsx`,
`SettlementList.tsx`, `ExpenseList.tsx`, `ReceiptScanner.tsx`,
`CourseSearch.tsx`, `LayoutSelector.tsx`, `AwardsList.tsx`.

**`src/components/trips/`:** `TripPhotos.tsx`.
**`src/components/admin/`:** `PhotoSearchPanel.tsx`.

**`src/lib/`:** `auth.ts`, `prisma.ts`, `store.ts`, `game-store.ts`,
`utils.ts`, `types.ts`, `weather.ts`, `venmo.ts`, `course-layouts.ts`,
`trip-name-generator.ts`, `auto-migrate.ts`, `destination-utils.ts`,
`destination-images.ts` (new in Phase A), `demo-data.ts`,
`round-awards.ts`, `round-summary.ts`, `marketing-*` (auth / claude / kb /
prompts), `supabase/{client,server,admin}.ts`, `integrity/*`.

---

## 4. Prisma Schema Audit (19 models)

### 4.1 Model map

| Model                 | Table                   | Has RLS? | Notes |
| --------------------- | ----------------------- | -------- | ----- |
| `Profiles`            | `profiles`              | ✅        | user identity + subscription + Venmo |
| `Trips`               | `trips`                 | ✅        | top-level plan record |
| `TripMembers`         | `trip_members`          | ✅        | RSVP, role, payment status |
| `ItineraryItems`      | `itinerary_items`       | ✅        | day-by-day schedule |
| `Expenses`            | `expenses`              | ✅        | trip-level costs |
| `ExpenseSplits`       | `expense_splits`        | ✅        | per-member shares |
| `Rounds`              | `rounds`                | ✅        | legacy round |
| `SkinsGames`          | `skins_games`           | ✅        | legacy skins buy-in |
| `Scorecards`          | `scorecards`            | ✅        | legacy scoring |
| `Waitlists`           | `waitlist`              | ✅        | landing signups |
| `GameRounds`          | `game_rounds`           | ❌        | Commissioner primary |
| `GamePlayers`         | `game_players`          | ❌        | Commissioner roster |
| `GameScorecards`      | `game_scorecards`       | ❌        | Commissioner scoring |
| `GameSkinsGames`      | `game_skins_games`      | ❌        | Commissioner skins |
| `GameNassauBets`      | `game_nassau_bets`      | ❌        | Commissioner Nassau |
| `GameExpenses`        | `game_expenses`         | ❌        | Commissioner expenses |
| `GameSettlements`     | `game_settlements`      | ❌        | Commissioner settlements |
| `Settlements`         | `settlements`           | ❌        | trip-level settlements |
| `MarketingPartnerships` | `marketing_partnerships` | ❌    | admin-only, RLS still missing |

### 4.2 RLS gap — exact remediation

The 9 tables without RLS are a real launch risk because Supabase's anon key
defaults to "no policy = no access" only when RLS is enabled. If RLS is off and
the client hits the REST API directly, all rows are returned. A migration
script should:

```sql
ALTER TABLE game_rounds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scorecards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_skins_games  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_nassau_bets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settlements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_partnerships ENABLE ROW LEVEL SECURITY;
```

…and then mirror the `trips`-style policies: commissioner-can-read, players can
read rows that reference themselves. See Phase D.3 of the "Recommendations"
section for the exact policy text.

### 4.3 Dual scoring systems

Both the legacy `Rounds/SkinsGames/Scorecards` API tree and the new
`GameRounds/GamePlayers/GameScorecards/GameSkinsGames/GameNassauBets` tree are
live. The `trips` page uses legacy; the `Commissioner` flow uses `game_*`. Pick
one in v2 — having both doubles the mental model.

---

## 5. Feature-by-Feature Checklist

### 5.1 Trip planning ✅ mostly complete

- [x] AI ideation (`/trips/create/ai` + `/api/trips/ai-ideate`) — Claude-powered
- [x] Manual creation (`/trips/create`, `/trips/new`)
- [x] Destination picker backed by 59-entry knowledge base
- [x] Member management + RSVP (`/api/trips/[id]/members`, `/api/trips/[id]/rsvp`)
- [x] Date polling (`/api/trips/[id]/date-poll`, `/vote`, `/lock`, `/suggestions`)
- [x] Itinerary with drag-reorder (`/api/trips/[id]/itinerary/reorder`)
- [x] Lodging as JSON field on `trips`
- [ ] **Missing:** Trip cloning / duplicate-from-last-year flow
- [ ] **Missing:** Offline draft recovery when a trip creator navigates away mid-wizard

### 5.2 Invitations & sharing ⚠️ broken in referral

- [x] Trip share code (`/trip/[shareCode]` + `/api/trip/[shareCode]`)
- [x] Invite code flow (`/invite/[code]` + `/api/invite/[code]/join`)
- [x] Resend transactional emails on invite (needs `RESEND_API_KEY`)
- [x] Round-level share code (`/round/[shareCode]`)
- [x] Recap share (`/round/[shareCode]/recap`)
- [ ] **Bug:** `/r/[code]` redirects to `/auth/signup` which does not exist.
      The app uses Supabase magic-link auth; there is no signup page. Fix:
      redirect to `/login?ref=<code>` and read the `ref` query param in
      `/auth/callback/route.ts` before `getPostLoginRedirect`.

### 5.3 Scoring (dual system)

**Commissioner (primary):**
- [x] Round creation with roster + starting hole (`/api/game-rounds`)
- [x] Scorecard entry per player per hole
- [x] OCR scorecard scan (`/api/game-rounds/[id]/scorecards/scan`)
- [x] Skins calculation (9s-only, 18s-only, or full-18 split)
- [x] Nassau bet (front / back / overall)
- [x] Live share via `shareCode`
- [ ] **Gap:** No "starting hole 10" UX toggle on the wizard — must pass as
      explicit prop to `SkinsCalculator`, easy to miss.

**Legacy:** intact; no known bugs, but orphaned UI in `/rounds/*`.

### 5.4 Settlements ✅ functional, one blocker

- [x] Per-round settlement computation (`/api/game-rounds/[id]/settlements`)
- [x] Recalculate on score edit (`/api/game-rounds/[id]/settlements/recalculate`)
- [x] Venmo deep-link generator (`src/lib/venmo.ts` — verified format correct:
      `venmo://paycharge?txn=pay&recipients=...&amount=...&note=...`)
- [x] Web fallback for desktop (`venmo.com/<user>?txn=pay`)
- [ ] **Gap:** No "mark paid outside Venmo" button; commissioner can't record a
      cash settlement.
- [ ] RLS not enabled on `settlements` or `game_settlements` — launch blocker.

### 5.5 Commissioner Mode

- [x] Dedicated tables (7 `game_*` models)
- [x] Invite flow (`/api/game-rounds/invite/[shareCode]`, `/join`)
- [x] Nassau bet calculator, skins calculator
- [ ] RLS missing on all 7 tables (see §4.2).
- [ ] No admin UI to re-order players in a round after creation.

### 5.6 User profile

- [x] Profile fields (`/api/profile`, `full_name`, `avatar_url`, `handicap`)
- [x] Venmo username (`/api/profile/venmo`)
- [x] Subscription status + tier from Stripe (`/api/webhooks/stripe`)
- [x] Stats endpoint (`/api/profile/stats`)
- [ ] **Gap:** No "verify Venmo handle" check — a typo silently produces broken
      deep links on settlement day.

### 5.7 Public pages / marketing

- [x] Landing (`/`) with hero, bets, destinations, CTAs
- [x] Pricing (`/pricing`)
- [x] Founding member promo (`/founding`)
- [x] Blog index + posts (`/blog`, `/blog/[slug]`)
- [x] Explore (`/explore`) — now with region-themed gradients, Bandon hero,
      aspect-[3/4] cards (Phase A + B)
- [x] Trip preview (`/trip/preview/[slug]`) — SEO-optimized destination landers
- [x] Sitemap (`/sitemap.ts`) includes 15 launch destinations + blog posts
- [x] `robots.ts` blocks `/admin`, `/demo/`, `/api/`, private app routes
- [ ] **Missing:** No per-route `opengraph-image.tsx`. Blog posts and trip
      previews share the generic `/og-image.png`.
- [ ] **Missing:** JSON-LD structured data on blog and trip preview pages.

### 5.8 Infrastructure & integrations

- [x] Supabase SSR auth (`@supabase/ssr`) + magic-link via Resend
- [x] Prisma 7 + `@prisma/adapter-pg` against Postgres
- [x] `serverExternalPackages: ['pg']` in `next.config.ts` ✅
- [x] Stripe subscriptions (checkout + portal + webhook)
- [x] Resend email (`RESEND_API_KEY`)
- [x] Anthropic Claude (`ANTHROPIC_API_KEY`) for trip ideation, OCR, receipt scan
- [x] GolfCourseAPI (`GOLF_COURSE_API_KEY`) for course search autocomplete
- [x] Google Places API (`GOOGLE_PLACES_API_KEY`) for destination autocomplete
- [x] Unsplash API (`UNSPLASH_ACCESS_KEY`) for editorial photo backfill
- [x] `next/image` whitelisted for `images.unsplash.com` ✅
- [x] Vercel cron: 15 jobs scheduled (12 marketing agents + 3 system crons)
- [ ] **Bug:** `/api/cron/engagement` scheduled but route doesn't exist.
- [ ] **Warning:** Stripe price IDs must be set in env (TODO comment in
      webhook).

---

## 6. Critical Bugs & Launch Blockers

1. **`/api/cron/engagement` is a phantom.** `vercel.json` line 51 schedules
   `0 14 * * *` against this path but no file exists under
   `src/app/api/cron/`. Every cron run will 404.
   _Fix:_ either create the endpoint (daily user engagement email trigger) or
   remove the schedule. Estimated effort: 1-2 hours to implement, 30 seconds to
   remove.

2. **RLS disabled on 9 production tables** (see §4.2). Any client that knows
   the anon key can read every row via `supabase.from('game_rounds').select()`.
   _Fix:_ add a `schema-step4-commissioner-policies.sql` migration enabling RLS
   and mirroring the `trips` policy shape (commissioner + players). Estimated
   effort: 2-3 hours.

3. **Referral `/r/[code]` redirects to a 404.** `redirect("/auth/signup")` on
   line 37 of `src/app/r/[code]/page.tsx` goes to a route that doesn't exist.
   _Fix:_ `redirect(\`/login?ref=${code}\`)`. The cookie already persists the
   code, so `/auth/callback/route.ts` can credit the referral after auth.

4. **`/api/cron/writer/route.ts` is a stub.** Returns `{success:true}` without
   doing anything. Vercel cron targets `/api/admin/marketing/writer` instead,
   so this file is orphaned — still should be removed to prevent future
   confusion.

5. **Stripe price IDs TODO.** `src/app/api/webhooks/stripe/route.ts:163` —
   verify `STRIPE_PRO_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` are set in Vercel
   production env before cutover.

6. **Unhandled errors in 30+ API routes.** Routes listed in §7.2.

---

## 7. Missing Features & Hardening

### 7.1 Missing features

- **Signup page.** The referral flow depends on one, magic-link users don't
  strictly need one, but the mental model of "go to signup" leaks into docs.
- **Cash-settlement marker.** Commissioner should be able to stamp "paid in
  person" on a settlement row.
- **Trip duplication.** "Plan this year's trip using last year's structure" is
  a natural retention hook.
- **Per-page OG images.** Especially for blog and trip preview — run
  `@vercel/og` at the edge to render them dynamically from `{title, dest, dates}`.
- **Engagement email cron** (see §6.1).
- **Venmo handle validation** endpoint (simple HEAD request to
  `venmo.com/<handle>` and check for 200).
- **Pairings auto-balancer** (route exists at `/trips/[id]/pairings` but the
  UI currently requires manual drag-drop; a one-click "balance by handicap"
  would help).

### 7.2 API routes lacking try/catch

Based on a grep for routes with no `try {` block:

```
src/app/api/expenses/route.ts
src/app/api/expenses/[id]/route.ts
src/app/api/health/route.ts
src/app/api/onboarding/complete/route.ts
src/app/api/scorecards/route.ts
src/app/api/scorecards/[id]/route.ts
src/app/api/scorecards/[id]/entries/[playerIdx]/[holeIdx]/route.ts
src/app/api/rounds/route.ts
src/app/api/rounds/[id]/route.ts
src/app/api/rounds/[id]/complete/route.ts
src/app/api/rounds/[id]/settle/route.ts
src/app/api/game-rounds/[id]/expenses/route.ts
src/app/api/game-rounds/[id]/expenses/[expenseId]/route.ts
src/app/api/game-rounds/[id]/nassau-bet/route.ts
src/app/api/game-rounds/[id]/skins/route.ts
src/app/api/game-rounds/[id]/route.ts
src/app/api/game-rounds/[id]/settlements/route.ts
src/app/api/game-rounds/[id]/settlements/[settlementId]/route.ts
src/app/api/game-rounds/[id]/settlements/recalculate/route.ts
src/app/api/game-rounds/[id]/players/[playerId]/route.ts
src/app/api/admin/marketing/settings/route.ts
src/app/api/admin/integrity-history/route.ts
src/app/api/admin/partnerships/[id]/contact/route.ts
src/app/api/user/me/route.ts
src/app/api/skins/route.ts
src/app/api/skins/[id]/route.ts
src/app/api/settlements/route.ts
src/app/api/settlements/[id]/route.ts
src/app/api/invite/[code]/join/route.ts
src/app/api/invite/[code]/route.ts
```

Some of these (`/api/health`) don't need it, but anything that touches Prisma
or Supabase should. A standard helper — e.g. `withRouteErrors(handler)` — would
DRY the fix.

### 7.3 Known bugs sweep

- [x] **Magic-link redirect works.** `/auth/callback/route.ts` handles both
      PKCE `?code=` and OTP `?token_hash=&type=` flows, validates `next`
      against a path allowlist (prevents open redirect), and falls back
      gracefully. ✅
- [x] **Explore renders all 59 destinations.** The Phase B refactor iterates
      `destinations.map(...)` with no `.slice()` cutoff. ✅
- [x] **Scorecard saves.** `PATCH /api/scorecards/[id]/entries/[playerIdx]/[holeIdx]`
      writes per-cell. No race-condition guard (last-write-wins), acceptable
      for MVP.
- [x] **Skins guard.** `/api/game-rounds/[id]/skins/route.ts:22` checks
      `if (!round.skins_game) return 404` before computing. ✅
- [⚠️] **OG images.** Root only — see §7.1.
- [x] **Venmo link format.** Validated in `src/lib/venmo.ts` — matches
      documented Venmo URL scheme. ✅
- [x] **No broken imports.** `tsc --noEmit` passes.
- [x] **GolfCourseAPI autocomplete wired.** `/api/course-search` +
      `/api/courses/search` both use `GOLF_COURSE_API_KEY`. ✅
- [❌] **Supabase RLS on Commissioner tables** — see §6.2.
- [⚠️] **Round completion cron.** `/api/cron/complete-rounds` runs every 15
      min. Verify it handles concurrent runs idempotently before launch.
- [❌] **Engagement email cron.** Missing — see §6.1.
- [⚠️] **Stripe checkout.** Price IDs need production env.
- [ ] **DNS records.** Out of scope for code audit; confirm `nassau.golf` A
      record, Vercel CNAME, Resend SPF/DKIM before launch.

---

## 8. Code Quality & Technical Debt

### 8.1 Type check

`npx tsc --noEmit` exits 0. No type errors. ✅

### 8.2 Logging noise

`console.log` count: **49** across `src/`.
`console.error` count: **128**.
Recommendation: consolidate behind a `src/lib/logger.ts` that no-ops in
production and emits structured JSON in dev. Alternatively wire Sentry or
Axiom before launch.

### 8.3 TODOs / FIXMEs

Only 2 found:
- `src/app/api/webhooks/stripe/route.ts:163` — "Update with actual Stripe
  price IDs"
- `src/app/api/cron/writer/route.ts:4` — "Implement writer agent logic" (stub
  — see §6.4)

No `FIXME` / `HACK` / `XXX` markers. Low technical-debt surface.

### 8.4 Duplication

- **Two `CourseSearch.tsx`** — `src/components/CourseSearch.tsx` and
  `src/components/shared/CourseSearch.tsx`. Likely one is legacy. Diff them
  and delete.
- **Two scoring systems** — `Rounds/SkinsGames/Scorecards` and
  `GameRounds/GamePlayers/GameScorecards/GameSkinsGames/GameNassauBets`. Pick
  one.

### 8.5 Generated code

`src/generated/prisma/` is the configured Prisma output target (custom per
`schema.prisma` line 1-4). Make sure this directory is in `.gitignore` or
committed but tagged `generated`.

### 8.6 Dead files

Zero found with `find + grep -L "from.*{file}"` spot-checks. Clean repo.

### 8.7 Security observations

- ✅ `createServiceClient` (service role key) is only imported by server-side
  files: `sitemap.ts`, `auth/callback/route.ts`, `api/waitlist/route.ts`,
  `api/admin/*`, `api/r/[code]/page.tsx`. No client-side leaks.
- ✅ No `process.env.*` in files under `src/components/` (i.e. no secrets
  bundled to the client).
- ✅ `next.config.ts` declares `pg` as `serverExternalPackages`, preventing it
  from being traced into Edge bundles.
- ⚠️ `console.log("Auth callback hit:", ...)` in
  `src/app/auth/callback/route.ts:72` logs the full URL including auth codes.
  At Vercel scale, this leaks sensitive query params into logs. Redact.
- ⚠️ Admin panel (`/admin/*`) has no visible auth middleware in this audit —
  `src/lib/marketing-auth.ts` presumably gates it. Verify it enforces
  `user.email === ADMIN_EMAIL` on every admin route.

---

## 9. Recommendations (prioritized)

### 9.1 Must ship before May 4

1. Create `src/app/api/cron/engagement/route.ts` OR remove its entry from
   `vercel.json`. If implementing, steal the shape of
   `/api/cron/complete-rounds` (CRON_SECRET auth, idempotent write).
2. Create a `schema-step4-commissioner-policies.sql` enabling RLS on the 9
   unprotected tables and mirroring the `trips` policy structure:
   commissioner-can-read-and-write, players-can-read-rows-where-they-are-a-player.
3. Change `src/app/r/[code]/page.tsx` line 37 from
   `redirect("/auth/signup")` to `redirect(\`/login?ref=${code}\`)`.
4. Set `STRIPE_PRO_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` in Vercel prod env.
5. Delete `src/app/api/cron/writer/route.ts` (orphan stub).
6. Wrap the 30 try/catch-less API routes with a shared
   `withRouteErrors()` helper.

### 9.2 Should ship in first post-launch sprint

7. Add per-page OG images via `@vercel/og` for `/blog/[slug]` and
   `/trip/preview/[slug]`.
8. Redact auth codes from `console.log("Auth callback hit:", ...)`.
9. Consolidate the two `CourseSearch` components.
10. Add JSON-LD structured data to blog + trip preview pages for SEO.
11. Implement "mark paid outside Venmo" on the settlement UI.
12. Add a "validate Venmo handle" endpoint.

### 9.3 Post-launch tech debt

13. Unify scoring on `Game*` models, deprecate the legacy `Rounds` /
    `SkinsGames` / `Scorecards` API tree.
14. Introduce `src/lib/logger.ts`, replace 49 + 128 scattered console calls.
15. Add E2E tests (Playwright) for the three critical flows: magic-link
    signup, trip creation, round + settlement.
16. Audit `middleware.ts` absence — currently there is none, which is by
    design, but document the decision in `README.md` so future devs don't
    add one without thinking.

---

## 10. Appendix — Environment Variables Referenced

Grepped `process.env.X` across `src/`:

Runtime (server-side): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `ANTHROPIC_API_KEY`,
`RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRO_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`,
`GOLF_COURSE_API_KEY`, `GOOGLE_PLACES_API_KEY`, `UNSPLASH_ACCESS_KEY`,
`CRON_SECRET`.

Build-time: `DATABASE_URL` (consumed by Prisma).

Pre-flight before launch: verify all 15 are present in Vercel Production env.

---

_End of audit. Branch `claude/overnight-build-20260417` carries this file plus
the Phase A / B / C deliverables. See `COMMIT_LOG.md` for per-commit notes and
`BLOCKERS.md` for operator follow-ups._
