# Parking Fury Guide — playable gaming portal

A mobile-first **gaming portal** for the **Parking Fury** browser-game series
(Parking Fury 1–3 by Andriy Pidvirnyy, and the Parking Fury 3D series by Brain
Software). It ships verified guides for the official series **and a playable
games library**: every game in the library runs **inside this site's own
player page** — no downloads, no redirects to other websites.

Built with [Astro 7](https://astro.build) in **server mode** (`@astrojs/node`,
standalone): editorial pages are prerendered at build time, while the games
library, player pages, sitemap and admin dashboard render per request so that
uploading or editing a game in the dashboard is **live immediately, without a
rebuild**. No ads, no third parties — only two same-origin counters (page
loads and game-frame opens) recorded by this server for the operator's own
dashboard, described in the privacy policy.

---

## Quick start

```bash
npm install
cp .env.example .env      # then set the values (see below)
npm run dev               # dev server at http://localhost:4321
npm run build             # prerendered pages in dist/client, server in dist/server
npm run start             # production server at http://localhost:4321
```

Node ≥ 22.22 required (see `engines` in package.json).

## Configuration (environment variables)

The production server reads variables at **runtime**: real process env wins,
then a `.env` file in the working directory (see `src/lib/auth.ts` for the
parser). `.env.example` documents every variable.

| Variable                 | Required for production | Purpose |
|--------------------------|-------------------------|---------|
| `SITE_URL`               | **Yes** — canonical origin, e.g. `https://example.com` | Drives canonical URLs, the XML sitemap, `robots.txt` and all Open Graph absolute URLs. Also decides whether the admin session cookie is `Secure` (https only). If unset, falls back to `http://localhost:4321`. **Never ship the fallback.** |
| `ADMIN_USER` / `ADMIN_PASSWORD` | **Yes** — operator credentials for `/admin` | Login for the games dashboard. Logins are rejected while `ADMIN_PASSWORD` is unset, so a deployment without credentials simply has no dashboard login. |
| `ADMIN_SESSION_SECRET`   | Recommended | HMAC key for the signed `pf_admin` session cookie. Falls back to `ADMIN_PASSWORD` if unset. |
| `GAME_EMBED_URL`         | No — only with a licence | Optional licensed third-party embed for the *version pages* (`/parking-fury-2/` etc.). Must be `https://` in production. Unset = the pages show the honest "not connected" state linking to the official hosts. |
| `GAME_EMBED_TITLE`       | No | Display title for that embed. |
| `CONTACT_EMAIL`          | Recommended | Address shown on `/contact/`. When unset, the page states honestly that no address is configured — it never invents one. |

## How the games library works

- **Store** — `data/games.json` (atomic writes) holds every game: title,
  slug, description, category, tags, controls, specs table, cover URL and the
  **embed URL**. Uploaded cover images land in `data/uploads/` and are served
  by the `/uploads/[...file]` endpoint.
- **Routes** — `/games/` is the library (server-rendered search `?q=` and
  category filters, no client JS required). `/games/[slug]/` is the player
  page: the game loads in an iframe **pointing at an internal `/embed/…` page
  or at the operator-supplied URL** — it never redirects the visitor away.
  Missing or draft slugs return a real HTTP 404.
- **Embed validation** — the dashboard/API accepts only an `https://` URL or
  an internal `/path`; `javascript:`, `data:` and protocol-relative URLs are
  rejected, so a saved embed cannot execute script or load plaintext HTTP.
  **Licensing any third-party embed is the operator's responsibility** — the
  technical ability to save a URL does not grant the right to frame a game.
- **Uploads** — jpg/png/webp/gif/avif only, 8 MB cap, SVG blocked, random
  filenames. Upload URLs intentionally end with `/` (e.g.
  `/uploads/abc.png/`) because the site runs with `trailingSlash: 'always'`
  and slash-less dynamic routes would 404.
- **Originals** — the seeded games "Tight Lot" (`src/scripts/parking-game.ts`)
  and "Traffic Rush" (`src/scripts/traffic-rush.ts`) are self-authored and
  live on internal `/embed/*` pages. They are not Parking Fury; every page
  states this and no page implies official affiliation.

## Admin dashboard

`/admin` (noindex, excluded from the sitemap) is a single-account operator
console with three pages:

1. **Dashboard** (`/admin/`) — sign in with `ADMIN_USER` / `ADMIN_PASSWORD`;
   failures are timing-safe and the session is an HMAC-signed, HttpOnly
   `pf_admin` cookie (7-day TTL). Create or edit a game: metadata, specs table,
   cover upload, and the embed URL. Saving a game as **published** makes it
   appear on `/games/` and in the sitemap **immediately** — no rebuild, no
   deploy. Unpublish (draft) hides the page (real 404) and the card; delete
   removes the record. All API routes require the session (401 otherwise).
   Uploaded covers are automatically downscaled/re-encoded (max 1600 px,
   ~82 quality) so a multi-megabyte source image can't wreck page weight;
   `npm run optimize:uploads` does the same retroactively for existing files
   (originals are copied to `data/uploads-backups/` first).
2. **Analytics** (`/admin/analytics/`) — first-party traffic & game-frame-open
   counts recorded by this server itself (no third party, no ads network):
   daily/weekly/monthly/yearly grouping, date-range presets, KPI tiles, an SVG
   time chart, top pages, top games and a day-by-day log. Counters can be
   reset from the page before going live. Numbers are exact counts of beacon
   events — nothing is estimated or invented.
3. **Search & SEO** (`/admin/seo/`) — live sitemap audit (indexable vs excluded
   URLs), indexability checklist generated from the current store, and the
   canonical `/sitemap.xml` + `/robots.txt` links to submit to Google Search
   Console.

## Original mini-games

`src/scripts/parking-game.ts` (Tight Lot: 3 lots, canvas 2D, keyboard + touch,
localStorage best times under `pfguide.tightlot.best.1/.2/.3`) and
`src/scripts/traffic-rush.ts` (Traffic Rush: endless lane dodger, local best
distance) are self-authored. The site links only to official hosts, and the
walkthrough page publishes step-by-step guides only for games we authored and
can test ourselves — never invented per-level guides for the official games.

## Testing

```bash
npm run test          # offline quality gate over dist/ (prerendered pages)
npm run test:site     # build + offline gate
npm run test:e2e      # headless Chrome suite (server must be running)
npm run test:external # live check of every third-party link (needs network)
npm run test:all      # build + offline gate + e2e
node scripts/build-assets.mjs  # regenerate images/logo-hero.jpg from public/logo.jpg
node scripts/build-covers.mjs  # regenerate the two game covers (charcoal + gold palette)
npm run optimize:uploads       # re-encode oversized uploaded covers (backups kept)
```

`test:e2e` uses `playwright-core` driving the system Chrome/Edge — no browser
download — and needs the production server (`npm run build && npm run start`)
at `http://localhost:4321` (or set `BASE_URL`). It covers: every route's
status/console health, the video hero, library search/filters, **real
gameplay** (the in-site engines are driven directly: parking loop, best-time
storage, crash/restart), 404s, responsive overflow at 320/768/1280, keyboard
a11y, reduced motion, robots/sitemap/assets over HTTP, an internal link crawl,
the **full admin pipeline** (login → upload → publish → live → sitemap →
draft → delete → logout, including live search, status filters, in-row publish
toggle and edit form), the **first-party analytics beacon** (valid event
accepted; foreign origin, admin paths, malformed slugs and GET rejected; a
real browser view/play increments the dashboard counters; no admin or asset
URLs ever counted) and the **admin console pages** (analytics period/range
switching, SEO audit). Expectations that depend on game content (featured
game, search terms, categories, embed URLs) are derived from
`data/games.json` at run time, so the suite keeps testing behaviour rather
than a frozen copy of the catalog. It also guards the **golden retheme**:
header logo mark loads, footer brand plate, library hero banner,
full-viewport hero, and the brand-art player backdrop. Latest results:
`docs/TEST-REPORT.md`.

## Project layout

```
data/          games.json (game store) + uploads/ (operator covers) + analytics.json (counters) + uploads-backups/ (pre-optimization originals)
src/
  components/  Header, Footer, VideoHero, GameCard, players + embed docs
  data/        site.ts, games.ts (verified facts + official URLs), seo.ts (canonical registry)
  layouts/     BaseLayout (SEO meta, OG, JSON-LD, breadcrumbs; seo/trail overrides)
  lib/         store.ts (games store), auth.ts (sessions), uploads.ts, embed.ts, validate.ts
  pages/       editorial guides (prerendered), /games/ library + player (SSR),
               /admin dashboard, /embed/* original-game frames, robots + sitemap endpoints
  scripts/     parking-game.ts, traffic-rush.ts (original game engines)
  styles/      global.css (design system) + portal.css (library/player/admin)
scripts/       check-site.mjs, e2e.mjs, check-external.mjs, build-assets.mjs, build-covers.mjs, embed-test.mjs, optimize-uploads.mjs
docs/          SEO-STRATEGY.md, TEST-REPORT.md, ROADMAP.md, screenshots/
tools/         og-template.html + serve-tools.mjs (OG cover / touch icon generator)
```

## Content & ethics policies (enforced by review + tests)

- **No invented data.** Search volumes, difficulty scores, rankings, ratings,
  reviews and gameplay specifics are never fabricated; research seeds are
  labelled as hypotheses in `src/data/seo.ts` and `docs/SEO-STRATEGY.md`.
  Game cards show category/tags — never fake play counts or ratings.
- **No stolen assets.** Self-drawn SVG/canvas art and operator-uploaded
  covers only; no re-hosted official game files. Embedding a third-party game
  requires the operator to hold the licence; the site only stores the URL.
- **No dark patterns.** Buttons do what their labels say; every library game
  plays inside this site (no surprise redirects); external links are marked as
  opening in a new tab.
- **Privacy.** Cookies: only the `pf_admin` admin session. localStorage: game
  best times (`pfguide.tightlot.best.*`, traffic-rush best distance) — all
  documented in `/privacy/`. Analytics are two first-party counters kept on
  this server (date + page path, game slug); no cookies, no third parties, no
  cross-site identifiers — `/privacy/` names exactly what is stored.
- **Fact provenance.** Every gameplay fact about the official series traces to
  the official Coolmath Games or Poki pages (checked 20 Oct 2026). External
  links are re-verified by `scripts/check-external.mjs` before releases.
