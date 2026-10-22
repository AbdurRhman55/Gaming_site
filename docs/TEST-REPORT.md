# Test report

Date: 21 Oct 2026 · Build: `npm run build` @ Astro 7.4.1 + `@astrojs/node`
11.1.9 (SSR, node standalone), Node v24.11.1, Windows 11 · Headless browser:
system Google Chrome via `playwright-core`.

Everything below is **measured**, not estimated. How to re-run each suite is in
`README.md → Testing`. Phase-1 (static guide site) results are retained where
still applicable and marked as such.

This run is **Phase 4 — admin console + first-party analytics**: the homepage
games section was aligned, the operator console became a three-page dashboard
(Overview / Analytics / Search & SEO), page-view and game-frame-open counters
are recorded by a **first-party beacon** (`POST /api/track/`) that works on
every page — prerendered and SSR alike — uploaded covers are re-encoded for
web delivery, and the e2e suite was rewritten **data-driven** (expectations
derive from the live `data/games.json`, so the suite keeps testing behaviour
after the operator edits the catalog). All phase-3 retheme checks still pass
unchanged.

## 1. Offline quality gate — `scripts/check-site.mjs` (dist/)

**Result: 14/14 prerendered pages, 0 errors, 0 warnings.**

Verified per prerendered page: unique title (≤ 70 chars) and description
(≤ 170 chars); canonical = configured origin + trailing slash; `robots` meta;
OG/Twitter tags; exactly one H1; no heading-level skips; `header`/`main`/
`footer` landmarks; JSON-LD parses; every internal link, anchor target and
asset resolves; `alt` text on images; `role="img"` SVGs carry `<title>`;
referenced public assets exist.

SSR routes (`/`, `/games/`, `/games/[slug]/`, `/admin/`, `sitemap.xml`,
`robots.txt`) are intentionally not file-checked — the e2e suite validates
them over HTTP instead.

## 2. Headless E2E — `scripts/e2e.mjs`

**Result: 235/235 checks passed** (against the production server on
`localhost:4321`; 13 phases). Store-dependent expectations (featured game,
search terms, categories, embed URLs, admin row targets) are computed from
`data/games.json` at run time — the suite passed with two different featured
orderings across runs, as the operator's store changed between them.

| Phase | Area | Checks |
|-------|------|--------|
| A | 17 routes (editorial + library + players + embeds) → 200, one H1 each, zero console errors (console noise emitted *inside* cross-origin embeds excluded — our own pages stay strictly clean) | 33 |
| B | Video hero: muted/loop/autoplay/inline + poster + playing + metadata; logo loads (optimized asset, web-sized); H1 carries brand; single primary CTA → **the store-featured game**; live games grid + featured badge; guides still linked; header logo mark, footer brand plate, hero fills the viewport (≥ 820 px at 1280×900) | 23 |
| C | Library lists **every published game**; category chips (case-insensitive dedupe); library hero banner; **store-derived** `?q=` narrowing and `?category=` filtering; empty state + Clear link | 11 |
| D | Featured player page: iframe src = the store's embed URL, `data-slug` play-beacon hook, descriptive title, library link, **fullscreen engages the Fullscreen API**, tab never redirects to the embed host, brand-art backdrop (in-frame inspection only runs for same-origin embeds) | 9 |
| D2 | Tight Lot engine at its own frame document (regardless of store state): canvas, HUD 1/3, auto-start, timer advances, Escape pause/resume, pointer touch dispatch registers/releases, **drive → park → completion panel → best time persisted → Next lot → lot 2/3** | 16 |
| E | Traffic Rush engine: auto-start, distance advances, best HUD, **crash → distance summary → best persisted → Enter restarts** | 9 |
| F | Unknown route → real 404 + custom copy + noindex + artwork; missing game slug → real 404; `prefers-reduced-motion` hides the hero video; Tab = skip link + visible focus; mobile menu opens/Escape closes | 11 |
| G | Responsive overflow at 320/768/1280 for `/`, `/games/`, featured player, `/admin/`, `/admin/analytics/`, `/admin/seo/` — 0 px overflow everywhere (+ screenshots); console still clean after gameplay | 19 |
| H | robots.txt (Allow + Sitemap); sitemap valid XML, no duplicates, includes `/`, `/games/` and **every published game URL from the store**, excludes 404; all assets (favicon, OG, touch icon, logo plate, video poster, video) → 200; logo plate verified web-sized; **every store cover served 200** | 34 |
| I | Internal link crawl (all links collected across the crawl set) → 200 | 1 |
| J | **Admin pipeline**: unauthenticated `/admin/` shows login only + noindex; signed-out API create → 401; wrong password rejected; correct credentials → dashboard; table lists every store game; live search (store-derived), status filter empty-state, in-row live/publish toggle flips status + stats + toast and restores state, Edit populates form + heading, Clear resets; cover upload → `/uploads/…/` URL served 200; create → instantly in library + linked card + player page 200 + indexable H1/description/specs + sitemap; unpublish → real 404 + hidden; delete → 200 + 404; test upload removed from disk; zero page errors | 42 |
| K | **Analytics beacon**: script ships on public pages; valid POST accepted (200); foreign `Origin` → 403; admin path → 400; malformed slug → 400; GET → 405; **a real browser view increments the dashboard page counter and a real player load increments the frame-open counter** (authed API reads); no `/admin`, `/api`, asset or `.txt`/`.xml` paths among recorded views | 9 |
| L | **Admin console pages**: `/admin/analytics/` renders (period switcher day/week/month/year with `aria-pressed`, range presets, KPI tiles, chart, top-pages table, day-by-day log, reset control present but deliberately unclicked); `/admin/seo/` renders (KPI tiles, indexability checklist, sitemap audit table); sidebar marks the active page on both | 18 |

Screenshots refreshed in `docs/screenshots/` this run and reviewed visually:
`home-320`, `home-1280`, `games-320`, `games-1280` (all four operator covers
painted), `player-tight-lot-1280` (featured-game naming varies with the
store), `admin-login-1280`, `admin-dashboard-1280`, `admin-analytics-1280`,
`admin-seo-1280`.

## 3. Licensed-embed state machine — `scripts/embed-test.mjs`

Validated in phase 1 (both states: success load and unreachable-host timeout
against stand-in frames; `docs/screenshots/embed-*.png`). The component is
unchanged in phase 2 and still renders the honest "not connected" state on the
version pages when `GAME_EMBED_URL` is unset; the harness was **not re-run**
this phase (requires two extra dev servers; no code paths changed).

## 4. External links — `scripts/check-external.mjs` (live, network)

Phase-1 result retained: **18/18 third-party URLs returned 2xx** (Coolmath ×6,
Poki ×12) after fixing two re-slugified Coolmath URLs. The site now references
29 external URLs (offline-verified only this phase); re-run the live checker
before any release.

## 5. Lighthouse (lab) — phase-1 baseline

`docs/lighthouse-home.json` + `docs/lighthouse-walkthrough.json` (static
build): **100/100/100/100**, LCP 0.9–1.2 s, TBT 0 ms, CLS 0. The phase-2 SSR
build has **not** been re-measured in Lighthouse (localhost caveat applies
either way); the structural drivers are unchanged — prerendered editorial
HTML, zero third-party scripts, one deferred game module, no web fonts. Re-run
on the production origin (ROADMAP §1).

## 6. Bugs found by testing and fixed

Phase 1 (static site, 11 bugs) — see git history of this file; highlights:
malformed selector, `[hidden]` override blocking real clicks, 0-based
best-time keys vs policy, lazy-iframe deadlock, invalid sandbox flag, two
stale external URLs, Windows path mis-derivation in the checker, heading
skip, meta-description length.

**Phase 2 (portal) bugs, all found by the suites/visual QA and fixed:**

| # | Bug | Found by | Fix |
|---|-----|----------|-----|
| 1 | Admin auth read credentials from `process.env` only at module load — the standalone node server never loads `.env`, so **every runtime login was rejected** | Admin e2e (login never granted a session) | Lazy env resolution in `auth.ts`: process env wins, then a cached `.env` parser |
| 2 | Missing/unpublished game slug crashed with HTTP **500** — `Astro.rewrite('/404')` cannot target a prerendered route in server mode | e2e: missing-slug status check | Serve the built `/404.html` with a real 404 status (plus minimal fallback body) |
| 3 | "Next lot"/"Restart" buttons were dead — the engine listens for `minigame:command` events that only GameStage dispatched; the player page never wired them | e2e gameplay loop | Dispatcher added to `TightLotPlayer` (mirrors GameStage) |
| 4 | Embed docs had no favicon → browser requested `/favicon.ico` → 404 console error on every embed view | e2e console check | Icon link added to both embed docs |
| 5 | **All admin fetch URLs lacked trailing slashes** → `trailingSlash: 'always'` issued a 301 that turned POSTs into GETs: login hit the 404 page, "create" silently fetched the games list, and a signed-out create *appeared* to return 200 | e2e API + login checks | Trailing slashes on every admin URL (dashboard JS and tests); e2e now proves 401 signed-out and real login |
| 6 | Sitemap listed `/games/` twice (SEO registry + separate index entry) | e2e duplicate-`<loc>` check | Duplicate entry removed; e2e asserts uniqueness |
| 7 | `public/images/logo-hero.jpg` contained a **screenshot of the site's own 404 page** instead of the user's logo (asset-generation mistake) | Visual QA of homepage screenshots | Regenerated from `public/logo.jpg` (960 px, 67 KB) via new `scripts/build-assets.mjs` |
| 8 | Tight Lot stage capped at 1000 px left a dead column beside the game in the full-width player frame at ≥ 1032 px | Visual QA of player screenshot | Stage now fills the frame |
| 9 | Synthetic `pointerdown` (tests/assistive tech) could throw inside the touch handlers — `setPointerCapture` with no active pointer | Touch-dispatch e2e check | Guarded with try/catch |
| 10 | E2E screenshots raced `loading="lazy"` card covers → screenshots missing cover art (site itself fine) | Screenshot review | `waitForImages()` before capture; verified images paint |

**Phase 3 (visual overhaul / retheme) bugs, all found by the suites/visual QA
and fixed:**

| # | Bug | Found by | Fix |
|---|-----|----------|-----|
| 11 | **`/games/traffic-rush/` returned a 404 — the store had been left in `draft`** by an interrupted prior admin run, so the library/ sitemap/ player all hid it | e2e phase A (`/games/traffic-rush/` → 404, only 1 card on the homepage) | `data/games.json` restored to `published`; noted so a future interrupted run doesn't silently unpublish a live game |
| 12 | Header brand mark still pointed at a stale **`/images/logo.png`** that no longer exists in `dist/` → `check-site` flagged 24 missing-asset errors across 12 prerendered pages | `scripts/check-site.mjs` | Updated to the new `/images/logo-mark.png` (`Header.astro`); re-ran `check-site` → 14/14 clean |
| 13 | **Game covers were still the old lime-green artwork** baked as PNGs from phase 2 — clashed with the new golden theme and left lime on the library cards | Visual QA of `games-1280` | New `scripts/build-covers.mjs` regenerates both covers in the charcoal + gold palette (gold dashed bay, gold player car); re-run it any time `src/data/art.ts` theming changes |
| 14 | Related-game SVG cards rendered an opaque navy (`#0b0f18`) background over the full 16:9 area — read as blue rectangles against the charcoal theme | Visual QA of themed surfaces | Backgrounds made transparent in `art.ts` (11 full-canvas fills + 2 gradient end-stops + 7 ground bands re-tinted) so the card's own charcoal `--surface-3` shows through |
| 15 | Admin table clipped the **Actions** column at 1280 px and wrapped the `UPDATED` date onto two lines | Visual QA of `admin-dashboard-1280` | Cover thumbs reduced to 64×36, `UPDATED`/slug kept on one line (`white-space: nowrap`), `UPDATED` column dropped below 78 rem so the primary columns fit; the table wrap keeps `overflow-x: auto`, so ACTIONS stays reachable by scrolling in the narrow panel beside the editor form |

**Phase 4 (admin console + first-party analytics) bugs, all found by the
suites/logs and fixed:**

| # | Bug | Found by | Fix |
|---|-----|----------|-----|
| 16 | `/admin/analytics/` and `/admin/seo/` rendered `<BaseLayout>` **without importing it** — every dashboard subpage crashed with HTTP 500 (`ReferenceError: BaseLayout is not defined`) at runtime | Old server's error log caught during the rebuild | `BaseLayout` import added to both pages; e2e phase L now exercises both console pages |
| 17 | `src/pages/api/track.ts` imported `../../../lib/analytics` (one `..` too many) — production build failed | `npm run build` | Corrected to `../../lib/analytics` |
| 18 | `GET /api/track/` fell through to Astro's default **404** instead of a truthful method response | e2e phase K | Explicit `GET` handler → **405** + `Allow: POST` |
| 19 | **Middleware-era analytics counted nothing on prerendered pages** (Astro middleware never runs for static files served from disk, so every editorial page showed 0 views forever) and counted `/robots.txt` as a page view | Design review of the phase-4b middleware counters | Middleware abandoned for a **first-party beacon**: view script in `BaseLayout` (skips `noindex`/admin paths), play beacon on the player page, validated same-origin `POST /api/track/` (origin check, strict path/slug shapes, blocked prefixes) |
| 20 | Operator-uploaded covers were **2.7–4 MB** each (~14 MB across the library) — an LCP/page-weight risk against the ≤ 2.5 s budget | Byte audit during screenshot QA | Uploads now downscaled/re-encoded on save via sharp (max 1600 px, q82, never larger than the source); the four existing covers re-encoded **in place** under the same filenames (13.4 MB → 0.9 MB total, verified same URL still 200) with originals preserved in `data/uploads-backups/`; `npm run optimize:uploads` is the repeatable tool |
| 21 | E2E screenshots raced image **decode**: `complete && naturalWidth > 0` is true before paint, so card covers appeared as dark rectangles in `games-1280.png` (the site itself was fine — probe showed covers painting once settled) | Immediate-vs-settled screenshot probe in a fresh browser context | `waitForImages()` now awaits `img.decode()` plus one compositor frame; regenerated screenshots show every cover |

## 7. Known limitations (blocked items, see ROADMAP)

- **Field-grade CWV / Lighthouse**: phase-2 SSR pages measured only in
  headless lab against `localhost`; re-measure on the production origin.
- **Beacon counts JS-enabled visits only.** Crawlers and JS-off browsers are
  not counted (they never run the beacon) — deliberate: the counters stay
  exact counts of real beacon events, nothing estimated. Documented in
  `/privacy/`. AdSense/Search Console numbers will differ (their own
  measurement).
- **Counters accumulate test traffic.** Every e2e run and local visit is
  counted; press **Reset counters** on `/admin/analytics/` once before going
  live (endpoint verified: signed-out 401, signed-in 200, file reset to
  `{"v":1,"days":{}}`).
- **Embed against a real licensed host**: code paths are exercised with the
  operator's stand-in external embeds; the real host requires the operator to
  hold a licence.
- **Contact address**: `CONTACT_EMAIL` unset; `/contact/` says so honestly.
- **External link health** is a point-in-time measurement — re-run monthly.
- **Concurrency**: the games store and the analytics file are single JSON
  files with atomic writes — fine for one operator; not tested for many
  concurrent writers.
