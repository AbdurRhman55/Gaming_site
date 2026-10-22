#!/usr/bin/env node
/**
 * External link checker (opt-in — needs network).
 *   node scripts/check-external.mjs
 *
 * Extracts every http(s) href/src from dist/, requests each with a browser
 * User-Agent, follows redirects, and fails on any final status outside 200-399.
 * Third-party pages move; run this periodically or before releases.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.html')) files.push(p);
  }
};
walk(DIST);

const links = new Map(); // url -> Set(pages)
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const route = f.slice(DIST.length).split('\\').join('/').replace(/\/?index\.html$/, '/') || '/';
  for (const m of html.matchAll(/(?:href|src|content)="(https?:\/\/[^"]+)"/g)) {
    const url = m[1];
    // skip schema.org / og spec namespaces and site self-references (checked elsewhere)
    if (url.includes('schema.org') || url.includes('sitemaps.org')) continue;
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(route);
  }
}

console.log(`Found ${links.size} unique external URLs across ${files.length} pages.\n`);

// Same-origin URLs are the site's own pages/assets — those are covered by
// check-site.mjs (internal crawl) and by the sitemap comparison, so only
// genuinely third-party URLs are fetched here.
const homeHtml = readFileSync(join(DIST, 'index.html'), 'utf8');
const origin = (homeHtml.match(/<link rel="canonical" href="([^"]+)"/) || [])[1]?.replace(/^(https?:\/\/[^/]+).*$/, '$1') ?? '';
for (const url of [...links.keys()]) {
  if (origin && url.startsWith(origin)) links.delete(url);
}
console.log(`Checking ${links.size} third-party URLs (same-origin skipped).\n`);

const results = [];
const queue = [...links.entries()];
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const [url, pages] = queue.shift();
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.8' },
        signal: AbortSignal.timeout(20000),
      });
      results.push({ url, status: res.status, final: res.url, pages: [...pages] });
      res.body?.cancel?.();
    } catch (err) {
      results.push({ url, status: 0, final: '', pages: [...pages], error: err.name || String(err) });
    }
  }
});
await Promise.all(workers);

const bad = results.filter((r) => r.status < 200 || r.status >= 400);
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const tag = r.status >= 200 && r.status < 400 ? ' OK  ' : 'BAD  ';
  const note = r.error ? `error=${r.error}` : r.final !== r.url && r.final ? `-> ${r.final}` : '';
  console.log(`${tag}${r.status} ${r.url} ${note}  [${[...r.pages].join(' ')}]`);
}

console.log(`\n${results.length - bad.length}/${results.length} external URLs healthy.`);
if (bad.length) {
  console.log('\nBroken:');
  for (const b of bad) console.log(`  ${b.status || 'ERR'} ${b.url} (used on: ${[...b.pages].join(', ')})`);
  process.exit(1);
}
