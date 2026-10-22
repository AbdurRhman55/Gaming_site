# SEO strategy — Parking Fury Guide

Status: initial launch strategy, written 20 Oct 2026.

## Honesty disclaimer (read first)

Everything in the "keyword" columns below is a **research seed** derived from
the search intent behind the game series — **not** measured data. No search
volumes, keyword difficulties, CTR estimates, ranking positions or traffic
forecasts are claimed anywhere on this site or in this document, because none
were measured. Terms marked *(hypothesis)* are unvalidated assumptions to be
checked against real query data (Search Console) after launch.

## 1. Keyword → URL map (one URL per distinct intent)

Single-source registry: `src/data/seo.ts`. Each route owns exactly one intent;
no two pages target the same head term (cannibalisation guardrail enforced by
review; titles/descriptions/H1 are unique per page and verified by
`scripts/check-site.mjs`).

| URL | Intent owned | Primary cluster (seed) | Secondary terms (seed) |
|-----|--------------|------------------------|------------------------|
| `/` | Play the original + hub | `parking fury`, `play parking fury`, `parking fury game` | `parking fury online`, `parking fury free`, `parking fury unblocked` (answered in FAQ, not chased) |
| `/parking-fury-2/` | Understand PF2 | `parking fury 2` | `parking fury 2 controls`, `… play online`, `… unblocked` |
| `/parking-fury-3/` | Understand PF3 | `parking fury 3` | `parking fury 3 controls`, `… play online`, `… unblocked` |
| `/parking-fury-3d/` | Understand the 3D spin-offs | `parking fury 3d` | `… beach city`, `… bounty hunter`, `… controls` |
| `/how-to-play/` | Learn controls | `parking fury controls`, `how to play parking fury` | `parking fury keys`, `arrow keys`, `mobile controls` |
| `/walkthrough/` | Finish levels | `parking fury walkthrough`, `parking fury levels` | `parking fury level 10`, `all levels`, `parking fury 2 walkthrough` |
| `/tips/` | Improve / fix problems | `parking fury tips`, `parking fury help` | `not working`, `unblocked at school`, `mobile compatibility`, `cheats` (answered honestly: no cheats are promoted) |
| `/similar-games/` | Discover alternatives | `games like parking fury`, `car parking games` | `browser driving games`, `parking games online`, `parking fury alternatives` |
| `/about/` | Trust evaluation | `about` (non-search page) | `is this site official`, `parking fury fan site` |
| `/contact/` | Operator contact | `contact` (non-search page) | `copyright takedown`, `report an error` |
| `/privacy/` | Data-handling trust | `privacy policy` | `does this site use cookies`, `data collection` |
| `/terms/` | Legal | `terms of use` | `disclaimer`, `copyright` |
| `/404` | Error recovery | n/a | `noindex`, excluded from sitemap |

### Deliberately *not* published (doorway / thin-content guardrails)

- Per-level pages for the official games (`/walkthrough/level-1/` …). We cannot
  verify official level specifics firsthand, and 10 near-identical thin pages
  would be doorway-style. The walkthrough instead covers the verified 10-level
  structure, the difficulty ramp, a transferable method, and **fully tested**
  step-by-steps for our own mini-game.
- "Unblocked" mirror pages. The term is answered honestly in FAQs/tips
  (official hosts + what "unblocked" sites actually are) instead of shipping
  low-value copies.
- Duplicate version-selector or region pages.

## 2. On-page system

- Unique `<title>` (≤ 70 chars), meta description (≤ 170), single descriptive
  H1 and canonical per page — all generated from `src/data/seo.ts` so
  uniqueness is a build-time invariant, checked by `scripts/check-site.mjs`.
- Breadcrumbs (`BreadcrumbList` JSON-LD) on every inner page; short, readable
  trailing-slash URLs (`/parking-fury-2/`).
- Open Graph + Twitter cards with absolute URLs (need `SITE_URL` at build).
- Structured data: `FAQPage` (homepage, `/tips/`), `VideoGame` (version pages;
  author omitted where the publisher's entity type is unverified), all
  validated as parseable JSON-LD in the offline gate. Nothing speculative
  (no ratings, no aggregateRating, no review markup — we have no such data).

## 3. Technical SEO

- Static HTML output, crawlable `<a href>` navigation (no JS-dependent routing).
- `robots.txt` + XML sitemap generated from the same registry; sitemap excludes
  `noindex` routes; one `SITE_CONTENT_UPDATED` lastmod constant — no fake
  per-page dates, no `changefreq`/`priority` (they are ignored by Google and
  imply data we don't have.
- Custom 404 with `noindex`.
- Performance budgets are targets, not guarantees: LCP ≤ 2.5 s, INP ≤ 200 ms,
  CLS ≤ 0.1. Lab baseline on the production build already measures LCP
  0.9–1.2 s / TBT 0 ms / CLS 0 (`docs/lighthouse-*.json`); field numbers on the
  real origin follow deployment (see `docs/ROADMAP.md`).
- Zero third-party scripts (no analytics/fonts/CDN) → no third-party
  cookie/consent surface, and render path stays under our control.

## 4. Content strategy & provenance

- Every gameplay fact traces to the official Coolmath Games or Poki pages
  (checked 20 Oct 2026): release dates, controls, level count, difficulty
  commentary, series line-up.
- Related-game descriptions and controls are copied from the hosts' own
  on-page data — not invented — and each card links to the official page.
- FAQs answer only questions we can answer truthfully (including "is this
  official?" → no, and "are there cheats?" → we don't promote them).

## 5. Post-launch validation plan (blocked on real data)

1. Verify a production `SITE_URL` is set (canonicals/sitemap/OG depend on it).
2. Submit the sitemap in Google/Bing webmaster tools.
3. After ~4–8 weeks of impressions data, validate the seed map: keep targets
   with real impressions, re-scope or merge pages that show none, and only
   then consider expansion (see `docs/ROADMAP.md`).
4. Re-run `npm run test:external` monthly — official hosts change URLs
   (two such 404s were already caught and fixed during development).
