/**
 * One-time porting tool: extracts the prerendered editorial pages from the
 * Astro production build (D:\gaming_website\dist\client) into PHP-friendly
 * partials, so the PHP version ships byte-identical body markup (design
 * parity) with a dynamically generated <head> (correct canonical domain).
 *
 * Outputs per route:
 *   includes/pages/<route>.html   — inner HTML of <main id="main"> (includes
 *                                   the baked breadcrumb nav + page scripts)
 *   includes/pages/<route>.json   — array of JSON-LD schema objects, with the
 *                                   build-time origin replaced by the token
 *                                   @@SITE@@ (substituted with pf_site() at
 *                                   runtime by includes/layout.php)
 *
 * Also writes the two embed documents (thin, noindex, self-contained) to
 * embed/<slug>/index.html with asset paths rewritten to /assets/*.
 *
 * Run: node scripts/extract-editorial.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = 'D:/gaming_website/dist/client';

const SITE_TOKEN = '@@SITE@@';
const BUILD_ORIGIN = 'http://localhost:4321';

/** Editorial routes: [dist folder, partial name] */
const ROUTES = [
  ['about', 'about'],
  ['contact', 'contact'],
  ['how-to-play', 'how-to-play'],
  ['parking-fury-2', 'parking-fury-2'],
  ['parking-fury-3', 'parking-fury-3'],
  ['parking-fury-3d', 'parking-fury-3d'],
  ['privacy', 'privacy'],
  ['similar-games', 'similar-games'],
  ['terms', 'terms'],
  ['tips', 'tips'],
  ['walkthrough', 'walkthrough'],
  ['404.html', '404'],
];

mkdirSync(join(ROOT, 'includes', 'pages'), { recursive: true });

function extractMain(html, label) {
  const open = html.indexOf('<main id="main">');
  const close = html.lastIndexOf('</main>');
  if (open === -1 || close === -1 || close < open) {
    throw new Error(`Cannot find <main> boundaries in ${label}`);
  }
  let inner = html.slice(open + '<main id="main">'.length, close);
  // Page scripts reference the hashed Astro asset dir — point them at ours.
  inner = inner.replaceAll('src="/_astro/', 'src="/assets/js/');
  return inner;
}

function extractJsonLd(html, label) {
  const schemas = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1]);
      // Make every absolute build-time URL domain-relative to our token.
      const json = JSON.stringify(obj).replaceAll(BUILD_ORIGIN, SITE_TOKEN);
      schemas.push(JSON.parse(json));
    } catch (e) {
      throw new Error(`Bad JSON-LD in ${label}: ${e.message}`);
    }
  }
  return schemas;
}

let count = 0;
for (const [folder, name] of ROUTES) {
  const src = join(DIST, folder.endsWith('.html') ? folder : join(folder, 'index.html'));
  if (!existsSync(src)) {
    console.warn(`SKIP (missing): ${src}`);
    continue;
  }
  const html = readFileSync(src, 'utf8');
  const main = extractMain(html, name);
  const schemas = extractJsonLd(html, name);
  writeFileSync(join(ROOT, 'includes', 'pages', `${name}.html`), main, 'utf8');
  writeFileSync(
    join(ROOT, 'includes', 'pages', `${name}.json`),
    JSON.stringify(schemas, null, 1),
    'utf8'
  );
  console.log(`ok  ${name.padEnd(16)} main=${String(main.length).padStart(6)}B  jsonLd=${schemas.length}`);
  count++;
}

// --- embed documents: thin standalone pages (noindex), kept fully static ---
for (const slug of ['tight-lot', 'traffic-rush']) {
  const src = join(DIST, 'embed', slug, 'index.html');
  if (!existsSync(src)) {
    console.warn(`SKIP (missing): ${src}`);
    continue;
  }
  let html = readFileSync(src, 'utf8');
  // Stylesheet: hashed bundle → our source CSS.
  html = html.replaceAll('href="/_astro/global.Cp0RbLm3.css"', 'href="/assets/css/global.css"');
  // Module scripts: hashed dir → our assets/js (relative imports still resolve).
  html = html.replaceAll('src="/_astro/', 'src="/assets/js/');
  const dir = join(ROOT, 'embed', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  console.log(`ok  embed/${slug.padEnd(16)} ${String(html.length).padStart(6)}B`);
  count++;
}

console.log(`\n${count} documents extracted.`);
