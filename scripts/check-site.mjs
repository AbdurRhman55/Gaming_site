#!/usr/bin/env node
/**
 * Offline site quality gate: run after `npm run build`.
 *
 * The site is SSR (node adapter): editorial pages are prerendered into
 * dist/client/, while the homepage, /games/…, /admin/, /uploads/… and
 * sitemap/robots are rendered at request time. This gate validates everything
 * that exists as a build artifact; the live routes are covered by e2e.mjs.
 *
 * Checks (no network, no dependencies):
 *   1. SEO metadata on prerendered pages: unique titles/descriptions,
 *      canonical, robots, lang, OG/Twitter
 *   2. Structure: single H1, no skipped heading levels, landmarks, viewport,
 *      charset (frame-only /embed/* docs get a reduced subset)
 *   3. Links: internal hrefs resolve to built files or known dynamic routes;
 *      anchors resolve to ids
 *   4. Assets: local scripts/styles/images referenced by pages exist
 *   5. JSON-LD parses; 404 is noindex
 *   6. sitemap/robots: validated here when present as files, otherwise noted
 *      as server-rendered (e2e.mjs checks them over HTTP)
 *   7. Images/SVGs expose accessible names (alt or <title>/aria-hidden)
 *
 * Exit code 1 if any ERROR is found; warnings are informational.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
// node adapter: static output lives in dist/client (plain `dist` for static builds)
const OUT = existsSync(join(DIST, 'client')) ? join(DIST, 'client') : DIST;

if (!existsSync(OUT)) {
  console.error('ERROR: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const errors = [];
const warnings = [];
const notes = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const note = (msg) => notes.push(msg);

/** Frame-only documents (served inside the player iframe): reduced checks. */
const isFrameDoc = (route) => route.startsWith('/embed/');
/** Routes rendered on demand by the server (no dist file by design). */
const isDynamicRoute = (route) =>
  route === '/' ||
  route === '/games/' ||
  /^\/games\/[^/]+\/$/.test(route) ||
  route === '/admin/' ||
  /^\/admin\/(analytics|seo)\/$/.test(route);

/* ---------- collect built HTML files ---------- */
const htmlFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (entry.endsWith('.html')) htmlFiles.push(p);
  }
};
walk(OUT);
if (htmlFiles.length === 0) {
  console.error('ERROR: no HTML files in dist/.');
  process.exit(1);
}

/* ---------- helpers ---------- */
const get = (html, re) => (html.match(re) || [])[1]?.trim();
const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Route path for a dist file: dist/index.html -> '/', dist/about/index.html -> '/about/' */
const routeOf = (file) => {
  const rel = relative(OUT, file).split(/[\\/]/).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  if (rel === '404.html') return '/404';
  return '/' + rel;
};

const siteOrigin = (() => {
  // Homepage is SSR; take the origin from any prerendered page.
  for (const candidate of ['index.html', 'about/index.html', 'privacy/index.html']) {
    const p = join(OUT, candidate);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/<link rel="canonical" href="([^"]+)"/);
    if (m) {
      try {
        return new URL(m[1]).origin;
      } catch {
        /* try next */
      }
    }
  }
  err('origin: no canonical found in any prerendered page');
  return 'http://localhost:4321';
})();

const titleSet = new Map();
const descSet = new Map();
const idsByRoute = new Map();
const pageDocs = [];

for (const file of htmlFiles) {
  const route = routeOf(file);
  const html = readFileSync(file, 'utf8');
  pageDocs.push({ file, route, html });

  /* --- head basics --- */
  const title = get(html, /<title>([^<]*)<\/title>/);
  if (!title) err(`${route}: missing <title>`);
  else {
    if (titleSet.has(title)) err(`${route}: duplicate title also used by ${titleSet.get(title)} → "${title}"`);
    titleSet.set(title, route);
    if (title.length > 70) warn(`${route}: title longer than 70 chars (${title.length}) → "${title}"`);
  }

  if (!/<html[^>]+lang="en"/.test(html)) err(`${route}: <html> missing lang="en"`);
  if (!/<meta name="viewport"[^>]+width=device-width/.test(html)) err(`${route}: missing viewport meta`);
  if (!/<meta charset="utf-8"|<meta charset="UTF-8"/.test(html)) err(`${route}: missing charset meta`);

  if (isFrameDoc(route)) {
    // Frames are thin documents by design — no canonical/OG/landmarks/h1.
    idsByRoute.set(route, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    continue;
  }

  const desc = get(html, /<meta name="description" content="([^"]*)"/);
  if (!desc) err(`${route}: missing meta description`);
  else {
    if (descSet.has(desc)) err(`${route}: duplicate description also used by ${descSet.get(desc)}`);
    descSet.set(desc, route);
    if (desc.length > 170) warn(`${route}: meta description longer than 170 chars (${desc.length})`);
    if (desc.length < 70) warn(`${route}: meta description shorter than 70 chars (${desc.length})`);
  }

  const canonical = get(html, /<link rel="canonical" href="([^"]+)"/);
  if (!canonical) err(`${route}: missing canonical`);
  else {
    if (!canonical.startsWith(siteOrigin)) err(`${route}: canonical origin mismatch → ${canonical}`);
    const expected = route === '/404' ? null : siteOrigin + (route === '/' ? '/' : route);
    if (expected && canonical !== expected) err(`${route}: canonical should be ${expected} but is ${canonical}`);
  }

  const robots = get(html, /<meta name="robots" content="([^"]+)"/);
  if (route === '/404') {
    if (!robots || !/noindex/.test(robots)) err('/404: robots meta must contain noindex');
  } else if (!robots || !/index/.test(robots)) {
    err(`${route}: robots meta must allow indexing`);
  }

  for (const og of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name']) {
    if (!html.includes(`property="${og}"`)) err(`${route}: missing ${og}`);
  }
  if (!html.includes('name="twitter:card"')) err(`${route}: missing twitter:card`);

  /* --- headings --- */
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length === 0) err(`${route}: no <h1>`);
  if (h1s.length > 1) err(`${route}: ${h1s.length} <h1> elements`);

  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warn(`${route}: heading level jumps from h${levels[i - 1]} to h${levels[i]}`);
      break;
    }
  }

  /* --- landmarks --- */
  if (!/<main[\s>]/.test(html)) err(`${route}: missing <main>`);
  if (!/<header[\s>]/.test(html)) err(`${route}: missing <header>`);
  if (!/<footer[\s>]/.test(html)) err(`${route}: missing <footer>`);
  if (!/<nav[\s>]/.test(html)) err(`${route}: missing <nav>`);

  /* --- JSON-LD --- */
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      err(`${route}: invalid JSON-LD — ${e.message}`);
    }
  }

  /* --- ids for anchor checks --- */
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  idsByRoute.set(route, ids);
}

/* ---------- links & assets ---------- */
const assetRefs = new Set();
const externalLinks = new Set();

for (const { route, html } of pageDocs) {
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const raw = decodeEntities(m[1]);
    if (/^(https?:)?\/\//.test(raw)) {
      if (/^https?:\/\//.test(raw)) externalLinks.add(raw);
      continue;
    }
    if (/^(mailto:|tel:|data:|about:|javascript:)/i.test(raw)) continue;
    assetRefs.add({ from: route, raw });
  }
}

for (const { from, raw } of assetRefs) {
  const [pathPart, hash] = raw.split('#');
  const [cleanPath] = pathPart.split('?');

  if (cleanPath === '' && hash) {
    const ids = idsByRoute.get(from);
    if (ids && !ids.has(hash)) err(`${from}: anchor #${hash} not found on page`);
    continue;
  }

  let targetRoute = cleanPath;
  if (!cleanPath.startsWith('/')) {
    const baseDir = from.endsWith('/') ? from : posix.dirname(from) + '/';
    targetRoute = posix.normalize(posix.join(baseDir, cleanPath));
  }

  // Runtime-served upload files (slash-form URLs) — existence verified by e2e.
  if (targetRoute.startsWith('/uploads/')) continue;

  const isAsset = /\.[a-z0-9]+$/i.test(targetRoute);
  if (isAsset) {
    const filePath = join(OUT, targetRoute.replace(/^\//, ''));
    if (!existsSync(filePath)) err(`${from}: asset not found in dist → ${targetRoute}`);
    continue;
  }

  if (!targetRoute.endsWith('/')) targetRoute += '/';
  if (isDynamicRoute(targetRoute) || /^\/games\/[^/]+\/$/.test(targetRoute)) continue;

  const targetFile =
    targetRoute === '/' ? join(OUT, 'index.html') : join(OUT, targetRoute.replace(/^\//, ''), 'index.html');
  if (!existsSync(targetFile)) {
    err(`${from}: internal link to missing page → ${targetRoute}`);
    continue;
  }
  if (hash) {
    const ids2 = idsByRoute.get(targetRoute);
    if (ids2 && !ids2.has(hash)) err(`${from}: link ${targetRoute}#${hash} — target id missing`);
  }
}

/* ---------- 404 file ---------- */
if (!existsSync(join(OUT, '404.html'))) err('404.html missing from dist (custom 404 required by hosts)');

/* ---------- sitemap ---------- */
const sitemapPath = join(OUT, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  note('sitemap.xml is server-rendered (includes live /games/ URLs) — checked over HTTP by e2e.mjs');
} else {
  const sm = readFileSync(sitemapPath, 'utf8');
  try {
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const smSet = new Set(locs);
    const expected = pageDocs
      .map((p) => p.route)
      .filter((r) => r !== '/404' && !isFrameDoc(r))
      .map((r) => siteOrigin + r);
    for (const e of expected) if (!smSet.has(e)) err(`sitemap: missing indexable URL ${e}`);
    for (const l of locs) {
      if (!l.startsWith(siteOrigin)) err(`sitemap: foreign origin ${l}`);
      if (/\/404/.test(l)) err('sitemap: contains the 404 page');
      if (!l.endsWith('/')) warn(`sitemap: URL without trailing slash (host will redirect) → ${l}`);
    }
    if (locs.length !== new Set(locs).size) err('sitemap: duplicate URLs');
  } catch (e) {
    err(`sitemap: unparsable — ${e.message}`);
  }
}

/* ---------- robots.txt ---------- */
const robotsPath = join(OUT, 'robots.txt');
if (!existsSync(robotsPath)) {
  note('robots.txt is server-rendered — checked over HTTP by e2e.mjs');
} else {
  const rt = readFileSync(robotsPath, 'utf8');
  if (!rt.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) err('robots.txt: sitemap URL mismatch');
  const disallows = [...rt.matchAll(/^Disallow:\s*(\/\S*)/gm)].map((m) => m[1]);
  if (disallows.includes('/')) err('robots.txt: Disallow: / blocks everything');
  if (disallows.some((d) => /^\/(assets|_astro|styles|scripts)/.test(d))) err('robots.txt: blocks essential assets');
}

/* ---------- images ---------- */
const imgRe = /<img\b[^>]*>/g;
for (const { route, html } of pageDocs) {
  if (isFrameDoc(route)) continue;
  for (const m of html.matchAll(imgRe)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) err(`${route}: <img> without alt → ${tag.slice(0, 90)}`);
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) warn(`${route}: <img> without width/height (CLS risk)`);
    const src = get(tag, /src="([^"]+)"/);
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/uploads/') && !existsSync(join(OUT, src.replace(/^\//, '')))) {
      err(`${route}: image file missing → ${src}`);
    }
  }
  for (const m of html.matchAll(/<svg[^>]*role="img"[\s\S]*?<\/svg>/g)) {
    if (!m[0].includes('<title>')) err(`${route}: role="img" <svg> without <title>`);
  }
}

/* ---------- referenced public files ---------- */
for (const f of [
  'favicon.svg',
  'images/og-cover.png',
  'images/touch-icon.png',
  'images/logo-hero.jpg',
  'images/hero-poster.jpg',
  'bg_video.mp4',
  'logo.jpg',
]) {
  if (!existsSync(join(OUT, f))) err(`missing public asset: ${f}`);
}

/* ---------- report ---------- */
const sortedRoutes = pageDocs.map((p) => p.route).sort();
console.log(`\nChecked ${pageDocs.length} prerendered pages on ${siteOrigin}`);
console.log('Routes:', sortedRoutes.join(', '));
console.log(`External links referenced: ${externalLinks.size} (not fetched — offline check)`);
for (const n of notes) console.log('NOTE  ' + n);

if (warnings.length) {
  console.log(`\n--- ${warnings.length} warning(s) ---`);
  for (const w of warnings) console.log('WARN  ' + w);
}
if (errors.length) {
  console.log(`\n--- ${errors.length} error(s) ---`);
  for (const e of errors) console.log('ERROR ' + e);
  process.exit(1);
}
console.log('\nAll checks passed.');
