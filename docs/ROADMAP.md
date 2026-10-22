# Roadmap

Ordered by dependency. "Blocked on" states the single prerequisite that gates
the item — nothing here is speculative work that ships without validation.

## 0. Launch blockers (must complete before going public)

| Item | Blocked on | Notes |
|------|-----------|-------|
| Choose + register the production domain | Business decision | Everything below assumes it exists |
| Set `SITE_URL` in the deploy environment | Domain | Canonicals, sitemap, robots.txt and OG URLs all derive from it (read at runtime); it also decides whether the admin session cookie is `Secure`. A build served on the dev fallback would publish `localhost` URLs |
| Set strong `ADMIN_PASSWORD` (+ `ADMIN_SESSION_SECRET`) in the deploy environment | Security decision | The dashboard rejects all logins while the password is unset — safe by default, but the portal is useless without it. Rotate on any suspicion; sessions are stateless HMAC cookies (revocation = change the secret) |
| Set `CONTACT_EMAIL` and rebuild | Address decision | Until then `/contact/` honestly states no address is configured |
| Platform-legal review of the "unblocked" FAQ answers + the operator's own embed-licensing stance | Policy review | The site answers the query honestly and links only official hosts; any third-party embed URL entered in the dashboard is the operator's licensing responsibility |

## 1. First sprint after launch

- **Deploy the SSR server**: `npm run build && npm run start` (node
  standalone) behind an HTTPS terminator — HTTP/2+, correct 404 status from
  the edge for unknown paths (the node server and the dynamic game pages
  already return real 404s; verify the proxy does not swallow them into a
  200), gzip/brotli, long-cache immutable `_astro/` assets, short-cache HTML,
  and persistent storage for `data/` (games store + uploads) across deploys.
- **Search Console + Bing**: verify property, submit sitemap, check Coverage
  and Manual Actions in week 1.
- **Lighthouse on production** (lab, throttled mobile) to confirm the CWV
  targets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) on the real origin. Lab
  baseline on the phase-1 static build scored 100/100/100/100 with LCP
  0.9–1.2 s, TBT 0 ms, CLS 0 (`docs/lighthouse-*.json`); the phase-2 SSR
  build keeps the same structural drivers (prerendered editorial HTML, zero
  third-party scripts, one deferred game module, no web fonts), so the only
  open variable is real network latency — measure, don't assume.
- **Re-run `npm run test:external`** against the production build (some hosts
  behave differently for real user agents/referrers).

## 2. Growth work (validation-gated on 4–8 weeks of real query data)

Only items backed by impressions in Search Console — seeds are not proof:

- If "parking fury controls"-type queries dominate → expand `/how-to-play/`
  with per-device sections rather than new URLs (keeps one-URL-one-intent).
- If version queries show demand for PF2/PF3 specifics we can verify
  firsthand → deepen those pages; **do not** invent level-by-level guides.
- Consider a genuinely distinct "Parking Fury 3D: Beach City vs Bounty
  Hunter" comparison **only** if query data shows comparison intent and only
  with facts verifiable on Poki's pages.
- Internal-link audit from real behaviour (which cards get clicked).

## 3. Product backlog (nice-to-have, no invented scope)

- **Licensed embed**: when (and only when) a rights holder grants permission,
  enter the https URL in the dashboard (version pages) or set
  `GAME_EMBED_URL`, then extend `scripts/embed-test.mjs` to smoke-test the
  real host's frame (load success + timeout) in staging.
- **Dashboard hardening**: login rate-limiting, CSRF token on top of the
  SameSite cookie, and an upload-size quota counter — only if the operator
  faces real abuse; the single-account model is otherwise sufficient.
- **Store growth**: move `data/games.json` to SQLite when concurrent edits or
  search facets outgrow the atomic-write JSON store (fine for one operator
  today; e2e proves the current path).
- Mini-games: a fourth lot, gamepad support, and an optional WebAudio toggle —
  each behind the same "tested before published" rule as the current lots.
- `astro check` + TypeScript strictness in CI once a CI runner exists
  (currently `typescript` is a devDep only; no `astro check` gate yet).
- i18n: only if query data shows non-English demand (the series' audience is
  global but English-first).
- A lightweight CSP report-only rollout after the domain is final.

## 4. Recurring maintenance (calendar)

- Monthly: `npm run test:external` (hosts re-slug URLs — already happened
  twice), spot-check official pages for changed facts (release dates, control
  changes) and update `src/data/games.ts` provenance dates.
- Monthly: review the dashboard library — every published game's embed URL is
  content the operator is responsible for; remove anything unlicensed or dead.
- Quarterly: rotate `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` and re-read
  privacy/terms against actual behaviour (currently: one admin cookie,
  localStorage only for best times — keep it true).
- Quarterly: prune orphaned files in `data/uploads/` (covers whose games were
  deleted).
- On every content edit: bump `SITE_CONTENT_UPDATED` in `src/data/seo.ts` so
  the sitemap `<lastmod>` stays honest.

## 5. Explicit non-goals

- No ads, trackers, affiliate links or email capture.
- No re-hosting, mirroring or "unblocking" of the official games.
- No invented walkthroughs, ratings, reviews, play counts or statistics —
  ever; library cards show category/tags, not fabricated popularity.
- No user accounts, comments or uploads from visitors — the dashboard is a
  single-operator console.
