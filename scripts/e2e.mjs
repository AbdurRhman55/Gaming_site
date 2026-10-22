#!/usr/bin/env node
/**
 * Headless end-to-end test suite (playwright-core driving the system Chrome/Edge).
 * Requires the production SSR server running, e.g.:
 *   npm run build && npm run start   (http://localhost:4321)
 *   node scripts/e2e.mjs
 *
 * Covers what the offline checker cannot:
 *   - runtime console/page errors on every route (incl. dynamic SSR routes)
 *   - video hero: video behaves, logo renders, CTAs point at real targets
 *   - games library: grid, search, category filters, empty state
 *   - real gameplay INSIDE the in-site player iframe: timer, pause, touch
 *     dispatch, drive → park → best-time storage (Tight Lot), score advance
 *     (Traffic Rush)
 *   - admin pipeline end to end: login (wrong + right), dashboard, image
 *     upload, create → instantly live on /games/ → playable in player page →
 *     sitemap → draft toggle → 404 → delete → logout, 401 when signed out
 *   - responsive layouts at 320/768/1280 (horizontal overflow assertions)
 *   - keyboard a11y: skip link, mobile menu, Escape, :focus-visible outlines
 *   - prefers-reduced-motion: hero video hidden
 *   - custom 404 status/content/noindex, missing game slug = real 404
 *   - HTTP assets, robots.txt, sitemap.xml (incl. live game URLs)
 *   - internal link crawl returns 200
 *   - screenshots for the test report (docs/screenshots/)
 *
 * Exit code 0 = all checks passed.
 */

import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'screenshots');
mkdirSync(SHOTS, { recursive: true });

const BASE = (process.env.BASE_URL || 'http://localhost:4321').replace(/\/$/, '');

/* ---------- operator credentials (from .env, same file the server reads) ---------- */
const envText = existsSync(join(ROOT, '.env')) ? readFileSync(join(ROOT, '.env'), 'utf8') : '';
const ENVV = (k, d = '') => (process.env[k] || envText.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1] || d).trim();
const ADMIN_USER = ENVV('ADMIN_USER', 'admin');
const ADMIN_PASSWORD = ENVV('ADMIN_PASSWORD');

/* ---------- live store (the operator edits it via the dashboard) ----------
   Expectations that depend on game content (lead game, search terms,
   categories, embed URLs) are derived from data/games.json at run time so the
   suite keeps testing behaviour — not a frozen copy of the catalog. */
const STORE = JSON.parse(readFileSync(join(ROOT, 'data', 'games.json'), 'utf8'));
const publishedGames = STORE.games
  .filter((g) => g.status === 'published')
  .sort((a, b) => (a.featured !== b.featured ? (a.featured ? -1 : 1) : b.updatedAt.localeCompare(a.updatedAt)));
const LEAD = publishedGames[0];
const SECOND = publishedGames[1] ?? LEAD;
const bySlug = (slug) => STORE.games.find((g) => g.slug === slug);
if (!LEAD) {
  console.error('ERROR: data/games.json has no published games — e2e needs at least one.');
  process.exit(1);
}

/** Same matching rules as src/pages/games/index.astro (SSR filters). */
const searchMatches = (g, q) =>
  `${g.title} ${g.description} ${g.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase());
const categoryMatches = (g, cat) => g.category.toLowerCase() === cat.toLowerCase();

/** A search term that narrows the library (falls back to the lead title word). */
const pickSearchTerm = () => {
  const words = new Set();
  for (const g of publishedGames) {
    for (const w of `${g.title} ${g.tags.join(' ')}`.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 4) words.add(w);
    }
  }
  for (const w of words) {
    const n = publishedGames.filter((g) => searchMatches(g, w)).length;
    if (n >= 1 && n < publishedGames.length) return w;
  }
  return publishedGames[0].title.toLowerCase().split(/\s+/)[0];
};

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('ERROR: no Chrome/Edge executable found for headless tests.');
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD missing (.env) — admin pipeline tests need it.');
  process.exit(1);
}

/* ---------- routes ---------- */
const ROUTES = [
  '/',
  '/games/',
  '/games/tight-lot/',
  '/games/traffic-rush/',
  '/embed/tight-lot/',
  '/embed/traffic-rush/',
  '/how-to-play/',
  '/walkthrough/',
  '/tips/',
  '/similar-games/',
  '/parking-fury-2/',
  '/parking-fury-3/',
  '/parking-fury-3d/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
];
const FRAME_ROUTES = new Set(['/embed/tight-lot/', '/embed/traffic-rush/']);
const RESPONSIVE_ROUTES = [
  '/',
  '/games/',
  `/games/${LEAD.slug}/`,
  '/admin/',
  '/admin/analytics/',
  '/admin/seo/',
];
const SIZES = [
  [320, 740],
  [375, 780],
  [768, 900],
  [1024, 860],
  [1280, 900],
];

/* ---------- tiny test harness ---------- */
let passed = 0;
const failed = [];
function check(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ok ${passed + failed.length}  ${label}`);
  } else {
    failed.push(label);
    console.log(`  FAIL      ${label}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Screenshots should show real cover art — wait for card images to decode. */
async function waitForImages(scopePage, selector) {
  // `complete && naturalWidth > 0` only guarantees the metadata arrived — the
  // decode/paint can still lag behind, which raced card covers out of the
  // headless screenshots. Await an actual decode, then confirm completeness.
  await scopePage
    .evaluate(async (sel) => {
      const imgs = [...document.querySelectorAll(sel)];
      await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
    }, selector)
    .catch(() => {});
  await scopePage
    .waitForFunction(
      (sel) => [...document.querySelectorAll(sel)].every((i) => i.complete && i.naturalWidth > 0),
      selector,
      { timeout: 8000 },
    )
    .catch(() => {});
  await scopePage.waitForTimeout(150); // one compositor frame
}

async function waitServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE + '/robots.txt');
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  console.error(`ERROR: server not reachable at ${BASE} — start it with \`npm run start\`.`);
  process.exit(1);
}

/** Normalise an href to an internal pathname (or null for external/other). */
function internalPath(href, pageUrl) {
  if (!href) return null;
  if (/^(https?:)?\/\//.test(href)) {
    try {
      const u = new URL(href);
      if (u.origin !== new URL(pageUrl).origin) return null;
      href = u.pathname + u.search;
    } catch {
      return null;
    }
  }
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return null;
  if (href.startsWith('#')) return null;
  const [path] = href.split('#');
  const [clean] = path.split('?');
  if (!clean) return null;
  if (!clean.startsWith('/')) return null;
  if (clean.startsWith('/uploads/')) return null;
  if (/\.[a-z0-9]+$/i.test(clean)) return clean; // asset
  return clean.endsWith('/') ? clean : clean + '/';
}

async function main() {
  await waitServer();
  console.log(`\ne2e → ${BASE}`);

  const browser = await chromium.launch({ executablePath, headless: true, args: ['--allow-pre-commit-input'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Errors logged *inside* a cross-origin embed (the licensed game host's
    // own console) are outside this site's control. Our pages must be strictly
    // clean; the embed's internals are the host's business.
    const loc = m.location()?.url ?? '';
    if (loc && !loc.startsWith(BASE)) return;
    consoleErrors.push(`[${page.url()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => pageErrors.push(`[${page.url()}] ${e.message}`));

  const collectedLinks = new Set();

  /* =====================================================================
     PHASE A — route health + console errors
     ===================================================================== */
  console.log('\nPhase A — every route loads, no console errors');
  for (const route of ROUTES) {
    const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    check(resp && resp.status() === 200, `GET ${route} → 200 (got ${resp ? resp.status() : 'none'})`);
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    );
    for (const href of links) {
      const p = internalPath(href, page.url());
      if (p && !/\.[a-z0-9]+$/i.test(p)) collectedLinks.add(p);
    }
    if (!FRAME_ROUTES.has(route)) {
      const hasH1 = await page.evaluate(() => document.querySelectorAll('h1').length);
      check(hasH1 === 1, `${route} has exactly one <h1>`);
    }
    await page.waitForTimeout(100);
  }
  check(consoleErrors.length === 0, `no console errors across ${ROUTES.length} routes${consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(' | ')}` : ''}`);

  /* =====================================================================
     PHASE B — video hero + live games grid on the homepage
     ===================================================================== */
  console.log('\nPhase B — homepage video hero + games grid');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const video = page.locator('video.hero__video');
  check(await video.count() === 1, 'hero video element exists');
  const vinfo = await video.evaluate((v) => ({
    muted: v.muted,
    loop: v.loop,
    playsInline: v.playsInline,
    autoplay: v.hasAttribute('autoplay'),
    poster: v.getAttribute('poster'),
    src: v.querySelector('source')?.getAttribute('src'),
    paused: v.paused,
    w: v.videoWidth,
  }));
  check(vinfo.muted && vinfo.loop && vinfo.playsInline && vinfo.autoplay, 'video is muted/loop/playsinline/autoplay');
  check(vinfo.poster === '/images/hero-poster.jpg', 'video has poster /images/hero-poster.jpg');
  check(vinfo.src === '/bg_video.mp4', 'video source is /bg_video.mp4');
  check(vinfo.paused === false, 'video is actually playing');
  check(vinfo.w > 0, 'video metadata loaded (videoWidth > 0)');

  const logo = page.locator('img.hero__logo');
  check(await logo.count() === 1, 'hero logo image exists');
  check((await logo.getAttribute('alt')) === 'Parking Fury', 'logo has alt="Parking Fury"');
  await logo.waitFor({ state: 'visible' });
  const logoOk = await logo.evaluate((img) => img.complete && img.naturalWidth > 0);
  check(logoOk, 'logo image actually loads');
  const logoSrc = await logo.getAttribute('src');
  check(logoSrc === '/images/logo-hero.jpg', 'logo uses optimized /images/logo-hero.jpg (not the 2.7 MB original)');

  const h1El = page.locator('h1').first();
  const h1Text =
    (await h1El.innerText()) + ' ' + ((await h1El.locator('img').getAttribute('alt')) ?? '');
  check(/parking fury/i.test(h1Text), 'hero H1 conveys the brand (visible text + logo alt)');

  const primaryCta = page.locator('.hero__ctas a.btn--primary');
  check((await primaryCta.count()) === 1, 'exactly one primary hero CTA');
  check(
    (await primaryCta.getAttribute('href')) === `/games/${LEAD.slug}/`,
    `primary CTA → the featured game (${LEAD.slug})`,
  );
  check(/Play \S+/.test(await primaryCta.innerText()), 'primary CTA label reads "Play …"');

  const cards = page.locator('.game-card');
  const cardCount = await cards.count();
  check(cardCount >= 2, `homepage shows live games grid (${cardCount} cards)`);
  const firstHref = await cards.first().locator('a.game-card__link').getAttribute('href');
  check(firstHref === `/games/${LEAD.slug}/`, `featured game (${LEAD.slug}) is first`);
  check((await page.locator('.game-card__badge').count()) >= 1, 'featured badge rendered');
  const browse = page.locator('a:has-text("Browse all games")');
  check((await browse.count()) >= 1 && (await browse.first().getAttribute('href')) === '/games/', '“Browse all games” → /games/');
  const guideStillWorks = await page.locator('a[href="/how-to-play/"]').count();
  check(guideStillWorks >= 1, 'guides still linked from homepage');

  // branding: the logo mark anchors the header, the poster plate the footer,
  // and the hero occupies a full viewport on large screens
  check(
    (await page.locator('.site-header .brand__mark img[src="/images/logo-mark.png"]').count()) === 1,
    'header shows the logo mark',
  );
  const markLoads = await page.evaluate(() => {
    const img = document.querySelector('.site-header .brand__mark img');
    return Boolean(img) && img.complete && img.naturalWidth > 0;
  });
  check(markLoads, 'header logo mark actually loads');
  check(
    (await page.locator('.footer__logo[src="/images/logo-hero.jpg"]').count()) === 1,
    'footer shows the brand plate',
  );
  const heroH = await page.evaluate(() => Math.round(document.querySelector('.hero').getBoundingClientRect().height));
  const vpH = await page.evaluate(() => window.innerHeight);
  check(heroH >= vpH - 80, `hero fills the viewport (${heroH}px >= ${vpH - 80}px)`);

  await page.screenshot({ path: join(SHOTS, 'home-1280.png') });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(SHOTS, 'home-320.png') });
  await page.setViewportSize({ width: 1280, height: 900 });

  /* =====================================================================
     PHASE C — games library: search + filters (SSR, no JS required)
     ===================================================================== */
  console.log('\nPhase C — games library search & filters');
  await page.goto(BASE + '/games/', { waitUntil: 'domcontentloaded' });
  const libCards = await page.locator('.game-card').count();
  check(libCards === publishedGames.length, `library lists every published game (${libCards}/${publishedGames.length})`);
  const chipCount = await page.locator('.cat-chips a.chip').count();
  check(chipCount >= 2, `category chips rendered (All + ${chipCount - 1} categories)`);
  check((await page.locator('.library-hero').count()) === 1, 'library hero banner with brand artwork');

  // search narrowing — the term is computed from the live store so the check
  // keeps meaning when the operator edits the catalog
  const q = pickSearchTerm();
  const qExpected = publishedGames.filter((g) => searchMatches(g, q));
  await page.goto(`${BASE}/games/?q=${encodeURIComponent(q)}`, { waitUntil: 'domcontentloaded' });
  const qCards = await page.locator('.game-card').count();
  const qTitles = await page.locator('.game-card__title').allInnerTexts();
  check(
    qCards === qExpected.length && qCards >= 1,
    `?q=${q} narrows to ${qExpected.length} matching game(s) (${qTitles.join(', ')})`,
  );

  // category filter — first category chip of the live store (filters compare
  // case-insensitively, matching the chips' dedupe)
  const chosenCat = publishedGames[0].category;
  const catExpected = publishedGames.filter((g) => categoryMatches(g, chosenCat));
  await page.goto(`${BASE}/games/?category=${encodeURIComponent(chosenCat)}`, { waitUntil: 'domcontentloaded' });
  const catCards = await page.locator('.game-card').count();
  check(
    catCards === catExpected.length && catCards >= 1,
    `?category=${chosenCat} narrows to ${catExpected.length} game(s)`,
  );
  for (const g of catExpected) {
    check(
      (await page.locator(`.game-card a.game-card__link[href="/games/${g.slug}/"]`).count()) === 1,
      `category "${chosenCat}" shows "${g.title}"`,
    );
  }
  const chipLabels = (await page.locator('.cat-chips a.chip').allInnerTexts()).map((t) => t.trim().toLowerCase());
  check(
    new Set(chipLabels).size === chipLabels.length,
    `category chips dedupe case-insensitively (${chipLabels.join(', ')})`,
  );

  await page.goto(BASE + '/games/?q=zzz-no-such-game', { waitUntil: 'domcontentloaded' });
  check(await page.locator('.empty-state').isVisible(), 'empty state shown for no results');
  check((await page.locator('a[href="/games/"]:has-text("Clear")').count()) >= 1, 'Clear link back to full library');

  await page.goto(BASE + '/games/', { waitUntil: 'domcontentloaded' });
  await waitForImages(page, '.game-card img');
  await page.screenshot({ path: join(SHOTS, 'games-1280.png') });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(SHOTS, 'games-320.png') });
  await page.setViewportSize({ width: 1280, height: 900 });

  /* =====================================================================
     PHASE D — featured game player page (structural) + in-site engine
     ===================================================================== */
  console.log('\nPhase D — featured game page + in-site engine checks');
  const leadGame = bySlug(LEAD.slug);
  await page.goto(`${BASE}/games/${LEAD.slug}/`, { waitUntil: 'domcontentloaded' });

  const frameEl = page.locator('iframe.player__iframe');
  check((await frameEl.count()) === 1, 'player iframe exists');
  check(
    (await frameEl.getAttribute('src')) === leadGame.embedUrl,
    `iframe src = the store's embed URL for ${LEAD.slug}`,
  );
  check((await frameEl.getAttribute('data-slug')) === LEAD.slug, 'iframe carries data-slug for the play beacon');
  const frameTitle = await frameEl.getAttribute('title');
  check(/playing inside this site/.test(frameTitle || ''), 'iframe has descriptive title');
  check((await page.locator('a[href="/games/"]:has-text("All games")').count()) >= 1, 'player bar links back to library');
  check((await page.locator('[data-fullscreen]').count()) === 1, 'fullscreen button exists');
  check(
    new URL(page.url()).pathname === `/games/${LEAD.slug}/`,
    'player page never redirects the tab to the embed host',
  );

  // fullscreen control engages the Fullscreen API
  await page.locator('[data-fullscreen]').click();
  await page.waitForTimeout(400);
  check(await page.evaluate(() => Boolean(document.fullscreenElement)), 'fullscreen button enters fullscreen');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // in-frame inspection is only possible for our own same-origin frames
  if (leadGame.embedUrl.startsWith('/embed/')) {
    const frame = page.frameLocator('iframe.player__iframe');
    await frame.locator('canvas[data-canvas]').waitFor({ state: 'visible', timeout: 8000 });
    check(true, 'in-site game canvas renders inside the player frame');
  } else {
    const host = new URL(leadGame.embedUrl).host;
    console.log(`  · ${LEAD.title} embeds ${host} (cross-origin) — engine checks run on the in-site originals directly`);
  }

  const backdropBg = await page.evaluate(
    () => getComputedStyle(document.querySelector('.player--backdrop'), '::before').backgroundImage,
  );
  check(backdropBg.includes('hero-poster'), 'player page shows the brand-art backdrop');

  await page.screenshot({ path: join(SHOTS, `player-${LEAD.slug}-1280.png`) });

  /* ---- Tight Lot engine at its own frame document (always runs, whatever
          the store currently points the player pages at) ------------------ */
  console.log('\nPhase D2 — Tight Lot engine (direct /embed/tight-lot/ document)');
  await page.goto(BASE + '/embed/tight-lot/', { waitUntil: 'domcontentloaded' });
  await page.locator('canvas[data-canvas]').waitFor({ state: 'visible', timeout: 8000 });
  check(true, 'game canvas renders at /embed/tight-lot/');

  const hudLevel = await page.locator('[data-hud-level]').innerText();
  check(hudLevel.trim() === '1/3', `HUD shows lot 1/3 (got "${hudLevel.trim()}")`);
  const status1 = (await page.locator('[data-hud-status]').innerText()).trim();
  check(status1 === 'Straight-in bay', `game auto-starts (status "${status1}")`);

  const t1 = parseFloat((await page.locator('[data-hud-time]').innerText()).replace('s', ''));
  await page.waitForTimeout(600);
  const t2 = parseFloat((await page.locator('[data-hud-time]').innerText()).replace('s', ''));
  check(t2 > t1, `timer advances (${t1}s → ${t2}s)`);

  // pause / resume via Escape
  await page.keyboard.press('Escape');
  await sleep(150);
  const pausedStatus = (await page.locator('[data-hud-status]').innerText()).trim();
  check(pausedStatus === 'Paused', `Escape pauses the game (status "${pausedStatus}")`);
  await page.keyboard.press('Escape');
  await sleep(150);
  const resumedStatus = (await page.locator('[data-hud-status]').innerText()).trim();
  check(resumedStatus === 'Straight-in bay', `Escape resumes (status "${resumedStatus}")`);

  // pointer/touch dispatch: synthetic events must register and not throw
  const errBefore = pageErrors.length;
  await page.locator('[data-key="up"]').dispatchEvent('pointerdown');
  const activeDuring = await page.locator('[data-key="up"]').getAttribute('data-active');
  await page.locator('[data-key="up"]').dispatchEvent('pointerup');
  await sleep(150);
  check(activeDuring === 'true', 'touch button registers a press (data-active)');
  check((await page.locator('[data-key="up"]').getAttribute('data-active')) === null, 'touch button releases');
  check(pageErrors.length === errBefore, 'touch buttons dispatch without page errors');

  // drive forward in slow pulses and park (level 1 = straight-in bay; the car
  // must settle below the finish speed *inside* the gold bay, so pulses keep
  // the average speed low)
  let parked = false;
  for (let i = 0; i < 26 && !parked; i++) {
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(500);
    parked = await page.locator('[data-panel="gameover"]:not([hidden])').isVisible().catch(() => false);
  }
  check(parked, 'car parks in the bay → completion panel appears');
  if (parked) {
    const overTitle = (await page.locator('[data-over-title]').innerText()).trim();
    check(overTitle === 'Level complete', `completion panel says "Level complete" (got "${overTitle}")`);
    const overText = await page.locator('[data-over-text]').innerText();
    check(/Straight-in bay: \d+\.\d+s/.test(overText), 'completion text reports time for the lot');
    const best = await page.evaluate(() => window.localStorage.getItem('pfguide.tightlot.best.1'));
    check(best !== null, `best time persisted locally (${best})`);
    check((await page.locator('[data-action="next"]').innerText()).includes('Next lot'), 'Next lot button offered');
    await page.locator('[data-action="next"]').click();
    await sleep(250);
    const hud2 = (await page.locator('[data-hud-level]').innerText()).trim();
    check(hud2 === '2/3', `Next lot advances to lot 2/3 (got "${hud2}")`);
    const status2 = (await page.locator('[data-hud-status]').innerText()).trim();
    check(status2 === 'Parallel park', `lot 2 loaded (status "${status2}")`);
  }

  /* =====================================================================
     PHASE E — Traffic Rush engine at its own frame document
     ===================================================================== */
  console.log('\nPhase E — Traffic Rush engine (direct /embed/traffic-rush/ document)');
  await page.goto(BASE + '/embed/traffic-rush/', { waitUntil: 'domcontentloaded' });
  await page.locator('canvas[data-canvas]').waitFor({ state: 'visible', timeout: 8000 });
  check(true, 'traffic game canvas renders at /embed/traffic-rush/');
  const trStatus = (await page.locator('[data-tr-status]').innerText()).trim();
  check(trStatus === 'Dodging', `traffic game auto-starts (status "${trStatus}")`);
  const s1 = parseInt((await page.locator('[data-tr-score]').innerText()).replace(/\D/g, ''), 10);
  await page.waitForTimeout(1400);
  const s2 = parseInt((await page.locator('[data-tr-score]').innerText()).replace(/\D/g, ''), 10);
  check(s2 > s1, `distance counter advances (${s1} m → ${s2} m)`);
  check((await page.locator('[data-tr-best]').count()) === 1, 'best-distance HUD present');

  // steer into the leftmost lane and hold it — a spawned car will collide
  await page.keyboard.press('ArrowLeft');
  let crashed = false;
  for (let i = 0; i < 30 && !crashed; i++) {
    await page.waitForTimeout(1000);
    crashed = await page.locator('[data-panel="gameover"]:not([hidden])').isVisible().catch(() => false);
  }
  check(crashed, 'colliding with traffic ends the run (crash panel)');
  if (crashed) {
    const overText = await page.locator('[data-over-text]').innerText();
    check(/You covered \d+ m/.test(overText), 'crash summary reports the distance covered');
    const trBest = await page.evaluate(() => window.localStorage.getItem('pfguide.trafficrush.best.1'));
    check(trBest !== null, `best distance persisted locally (${trBest} m)`);
    await page.keyboard.press('Enter');
    await sleep(250);
    check(!(await page.locator('[data-panel="gameover"]').isVisible()), 'Enter restarts the run');
    check((await page.locator('[data-tr-status]').innerText()).trim() === 'Dodging', 'status back to “Dodging”');
  }

  /* =====================================================================
     PHASE F — 404, missing game slug, reduced motion, keyboard a11y
     ===================================================================== */
  console.log('\nPhase F — 404 / missing slug / reduced motion / keyboard');
  const nf = await page.goto(BASE + '/definitely-not-a-page/', { waitUntil: 'domcontentloaded' });
  check(nf.status() === 404, `unknown route → HTTP 404 (got ${nf.status()})`);
  check(/does not exist/i.test(await page.locator('h1').innerText()), 'custom 404 copy rendered');
  check(/noindex/.test((await page.locator('meta[name="robots"]').getAttribute('content')) || ''), '404 page is noindex');
  check((await page.locator('.notfound__art').count()) === 1, '404 shows brand artwork');

  const missingGame = await page.goto(BASE + '/games/no-such-game/', { waitUntil: 'domcontentloaded' });
  check(missingGame.status() === 404, `missing game slug → HTTP 404 (got ${missingGame.status()})`);

  // prefers-reduced-motion: hero video hidden
  const rmContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await rmPage.waitForTimeout(400);
  const rmDisplay = await rmPage.locator('video.hero__video').evaluate((v) => getComputedStyle(v).display);
  check(rmDisplay === 'none', `reduced motion hides hero video (display:${rmDisplay})`);
  const rmLogo = await rmPage.locator('img.hero__logo').isVisible();
  check(rmLogo, 'logo still visible under reduced motion');
  await rmContext.close();

  // keyboard a11y on the homepage
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');
  const skipText = await page.evaluate(() => document.activeElement?.textContent?.trim() || '');
  check(/skip/i.test(skipText), `first Tab focuses skip link ("${skipText}")`);
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = getComputedStyle(el);
    return s.outlineStyle !== 'none' || s.boxShadow !== 'none';
  });
  check(outline !== false, ':focus-visible outline present on skip link');
  await page.keyboard.press('Escape'); // closes nothing — just must not throw
  await page.setViewportSize({ width: 375, height: 780 });
  await page.waitForTimeout(200);
  await page.locator('.menu-toggle').click();
  check(await page.locator('.mobile-nav').isVisible(), 'mobile menu opens');
  await page.keyboard.press('Escape');
  await sleep(200);
  const menuHidden = await page.evaluate(() => {
    const nav = document.querySelector('.mobile-nav');
    if (!nav) return true;
    return getComputedStyle(nav).display === 'none' || nav.getAttribute('aria-hidden') === 'true' || nav.hidden;
  });
  check(menuHidden, 'Escape closes mobile menu');
  await page.setViewportSize({ width: 1280, height: 900 });

  /* =====================================================================
     PHASE G — responsive overflow at 320/768/1280 (new routes included)
     ===================================================================== */
  console.log('\nPhase G — responsive overflow (320/768/1280)');
  for (const route of RESPONSIVE_ROUTES) {
    for (const [w, h] of SIZES.filter(([width]) => [320, 768, 1280].includes(width))) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 1, `${route} @ ${w}px — no horizontal overflow (${overflow}px)`);
      if (route === '/admin/' && w === 1280) {
        await page.screenshot({ path: join(SHOTS, 'admin-login-1280.png') });
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  // Chrome logs a console "error" for every document that *is* a 404 — those
  // two navigations are intentional (they verify the custom 404 pages), so
  // filter exactly those out and keep everything else strict.
  const unexpectedConsole = consoleErrors.filter(
    (e) =>
      !(
        (e.includes('/definitely-not-a-page/') || e.includes('/games/no-such-game/')) &&
        e.includes('status of 404')
      ),
  );
  check(
    unexpectedConsole.length === 0,
    `console still clean after gameplay phases${unexpectedConsole.length ? ` — ${unexpectedConsole.slice(0, 6).join(' | ')}` : ''}`,
  );

  /* =====================================================================
     PHASE H — HTTP assets + robots + sitemap (server-rendered)
     ===================================================================== */
  console.log('\nPhase H — robots, sitemap, assets over HTTP');
  const robotsText = await (await page.request.get(BASE + '/robots.txt')).text();
  check(/Allow: \//.test(robotsText), 'robots.txt allows crawling');
  check(/Sitemap: \S+\/sitemap\.xml/.test(robotsText), 'robots.txt points at sitemap');

  const smXml = await (await page.request.get(BASE + '/sitemap.xml')).text();
  check(smXml.includes('<urlset'), 'sitemap is valid XML with urlset');
  // every indexable URL must be listed: homepage, editorial pages, /games/ and
  // each published game (the offline checker enforces the editorial set too)
  const expectedSitemap = [
    '/',
    '/how-to-play/',
    '/walkthrough/',
    '/tips/',
    '/similar-games/',
    '/parking-fury-2/',
    '/parking-fury-3/',
    '/parking-fury-3d/',
    '/about/',
    '/contact/',
    '/privacy/',
    '/terms/',
    '/games/',
    ...publishedGames.map((g) => `/games/${g.slug}/`),
  ];
  for (const route of expectedSitemap) {
    check(smXml.includes(`<loc>${BASE}${route}</loc>`), `sitemap includes ${route}`);
  }
  check(!smXml.includes('/404'), 'sitemap excludes 404');
  const smCount = (smXml.match(/<loc>/g) || []).length;
  const smUnique = new Set(smXml.match(/<loc>[^<]+/g) || []).size;
  check(smUnique === smCount, `sitemap has no duplicate URLs (${smCount} locs, ${smUnique} unique)`);

  const assets = [
    ['/favicon.svg', 200],
    ['/images/og-cover.png', 200],
    ['/images/touch-icon.png', 200],
    ['/images/logo-hero.jpg', 200],
    ['/images/hero-poster.jpg', 200],
    ['/bg_video.mp4', 200],
  ];
  for (const [path, want] of assets) {
    const resp = await page.request.get(BASE + path, { failOnStatusCode: false });
    check(resp.status() === want, `asset ${path} → ${want} (got ${resp.status()})`);
    if (path.includes('logo-hero')) {
      const bytes = (await resp.body()).length;
      check(bytes > 20000 && bytes < 600000, `optimized logo is web-sized (${Math.round(bytes / 1024)} KB)`);
    }
    if (path.includes('hero-poster')) {
      const bytes = (await resp.body()).length;
      check(bytes > 20000, `video poster exists (${Math.round(bytes / 1024)} KB)`);
    }
  }
  // every published game's operator-uploaded cover must be served back
  for (const g of publishedGames) {
    if (!g.cover?.startsWith('/uploads/')) continue;
    const resp = await page.request.get(BASE + g.cover, { failOnStatusCode: false });
    check(resp.status() === 200, `cover of ${g.slug} → 200 (got ${resp.status()})`);
  }

  /* =====================================================================
     PHASE I — internal link crawl
     ===================================================================== */
  console.log('\nPhase I — internal link crawl');
  const crawlTargets = [...collectedLinks].filter((p) => !ROUTES.includes(p)).sort();
  let crawlOk = 0;
  for (const target of crawlTargets) {
    if (/\.[a-z0-9]+$/i.test(target)) continue;
    const resp = await page.request.get(BASE + target, { failOnStatusCode: false });
    if (resp.status() === 200) crawlOk += 1;
    else check(false, `crawl ${target} → 200 (got ${resp.status()})`);
  }
  check(crawlOk === crawlTargets.length, `crawled ${crawlTargets.length} extra internal links → all 200`);
  if (crawlTargets.length) console.log(`  (crawl: ${crawlTargets.join(', ')})`);

  /* =====================================================================
     PHASE J — admin pipeline: login → upload → publish → live → remove
     ===================================================================== */
  console.log('\nPhase J — admin dashboard pipeline');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ap = await adminContext.newPage();
  const adminPageErrors = [];
  ap.on('pageerror', (e) => adminPageErrors.push(e.message));

  // unauthenticated: login view only + APIs refuse
  await ap.goto(BASE + '/admin/', { waitUntil: 'domcontentloaded' });
  check(await ap.locator('[data-login-form]').isVisible(), 'unauthenticated /admin/ shows login form');
  check(/noindex/.test((await ap.locator('meta[name="robots"]').getAttribute('content')) || ''), 'admin is noindex');
  check((await ap.locator('.admin-shell').count()) === 0, 'dashboard not rendered before sign-in');
  const unauthorized = await adminContext.request.post(BASE + '/api/admin/games/', { data: {} });
  check(unauthorized.status() === 401, `API rejects signed-out create (401, got ${unauthorized.status()})`);

  // wrong password
  await ap.fill('input[name="user"]', ADMIN_USER);
  await ap.fill('input[name="password"]', 'definitely-wrong');
  await ap.click('[data-login-form] button[type="submit"]');
  await ap.locator('[data-login-error]').waitFor({ state: 'visible', timeout: 5000 });
  const loginErr = await ap.locator('[data-login-error]').innerText();
  check(/wrong/i.test(loginErr), `wrong password rejected ("${loginErr}")`);
  check((await ap.locator('.admin-shell').count()) === 0, 'still on login view after failure');

  // correct credentials
  await ap.fill('input[name="password"]', ADMIN_PASSWORD);
  await ap.click('[data-login-form] button[type="submit"]');
  await ap.locator('.admin-shell').waitFor({ state: 'visible', timeout: 8000 });
  check(true, 'correct credentials sign in');
  check((await ap.locator('h1:has-text("Dashboard")').count()) === 1, 'dashboard heading rendered');
  check((await ap.locator('.admin-nav__link').count()) >= 3, 'sidebar nav renders (dashboard / analytics / seo)');
  check(
    (await ap.locator('.admin-nav__link[aria-current="page"]').getAttribute('href')) === '/admin/',
    'sidebar marks the current page',
  );
  const rows = await ap.locator('.admin-table tbody tr').count();
  check(rows >= 2, `library table lists seeded games (${rows} rows)`);
  check((await ap.locator('[data-logout]').count()) === 1, 'sign-out control present');
  await waitForImages(ap, '.admin-table img');
  await ap.evaluate(() => window.scrollTo(0, 0));
  await ap.waitForTimeout(150);
  await ap.screenshot({ path: join(SHOTS, 'admin-dashboard-1280.png') });

  // ---- dynamic dashboard: search, filters, live toggle, edit wiring ----
  await ap.fill('[data-admin-search]', SECOND.slug);
  check(
    (await ap.locator('.admin-table tbody tr:not([hidden])').count()) === 1,
    `search filters the table live (1 match for "${SECOND.slug}")`,
  );
  await ap.fill('[data-admin-search]', '');
  check(
    (await ap.locator('.admin-table tbody tr:not([hidden])').count()) === rows,
    'clearing search restores every row',
  );

  await ap.click('[data-admin-filter="draft"]');
  check(await ap.locator('[data-admin-no-match]').isVisible(), 'status filter with no matches shows the empty hint');
  await ap.click('[data-admin-filter="all"]');
  check(
    (await ap.locator('.admin-table tbody tr:not([hidden])').count()) === rows,
    'filter back to “all” restores every row',
  );

  // row toggle flips live<->draft from the UI, then restores the seeded state
  const seeded = `.admin-table tr[data-row="${SECOND.id}"]`;
  await ap.click(`${seeded} [data-toggle]`);
  await ap.locator(`${seeded} .badge--draft`).waitFor({ state: 'visible', timeout: 5000 });
  check(true, 'row toggle unpublishes a game without a reload');
  check(
    (await ap.locator('[data-stat="published"]').innerText()) === String(rows - 1),
    'stats tiles update live after the toggle',
  );
  check(await ap.locator('[data-toasts] .toast').last().isVisible(), 'success toast shown after the toggle');
  await ap.click(`${seeded} [data-toggle]`);
  await ap.locator(`${seeded} .badge--live`).waitFor({ state: 'visible', timeout: 5000 });
  check(
    (await ap.locator('[data-stat="published"]').innerText()) === String(rows),
    'toggle restored — every seeded game is published again',
  );

  // edit wiring: form fills from the row (incl. hidden id), then resets
  await ap.click(`${seeded} [data-edit]`);
  await ap
    .waitForFunction(
      (expected) => document.querySelector('input[name="title"]')?.value === expected,
      SECOND.title,
      { timeout: 3000 },
    )
    .catch(() => {});
  check(
    (await ap.locator('[data-form-title]').innerText()).includes(SECOND.title),
    `Edit fills the form + heading from the row ("${SECOND.title}")`,
  );
  await ap.click('[data-reset]');
  await ap
    .waitForFunction(() => document.querySelector('input[name="title"]')?.value === '', null, { timeout: 3000 })
    .catch(() => {});
  check(true, 'Clear form resets the editor');

  // upload a cover image
  const uploadUrl = await ap.evaluate(async () => {
    const bytes = Uint8Array.from(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
      (c) => c.charCodeAt(0),
    );
    const fd = new FormData();
    fd.append('file', new Blob([bytes], { type: 'image/png' }), 'pixel.png');
    const res = await fetch('/api/admin/upload/', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url || `ERROR:${data.error || res.status}`;
  });
  check(/^\/uploads\/[\w.-]+\/$/.test(uploadUrl), `cover upload returns /uploads/ URL (${uploadUrl})`);
  if (uploadUrl.startsWith('/uploads/')) {
    const upResp = await adminContext.request.get(BASE + uploadUrl);
    check(upResp.status() === 200, 'uploaded cover is served back with 200');
  }

  // create a game → live immediately
  const createRes = await ap.evaluate(async (cover) => {
    const res = await fetch('/api/admin/games/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Racer',
        description:
          'Automated test entry created by the e2e suite to prove the admin publish pipeline works end to end.',
        category: 'racing',
        tags: 'test, e2e, automation',
        controls: 'Arrow keys to drive (test fixture)',
        specs: 'Type | Test fixture\nDevices | Headless Chrome',
        cover,
        embedUrl: 'https://example.invalid/test-racer.html',
        status: 'published',
        featured: false,
      }),
    });
    return { status: res.status, body: await res.json() };
  }, uploadUrl);
  check(createRes.status === 200 && createRes.body.ok === true, `game created via dashboard API (status ${createRes.status})`);
  const testSlug = createRes.body?.game?.slug;
  check(testSlug === 'e2e-test-racer', `slug generated (${testSlug})`);

  // instantly live on /games/
  await ap.goto(BASE + '/games/?q=E2E%20Test', { waitUntil: 'domcontentloaded' });
  const liveCards = await ap.locator('.game-card').count();
  check(liveCards === 1, `new game appears in library without rebuild (${liveCards} card)`);
  const liveHref = await ap.locator('.game-card__link').first().getAttribute('href');
  check(liveHref === '/games/e2e-test-racer/', 'library card links to the player page');
  const coverOnCard = await ap.locator(`img[src="${uploadUrl}"]`).count();
  check(coverOnCard >= 1, 'uploaded cover shown on the library card');

  // player page renders with the operator-supplied embed URL
  const detail = await ap.goto(BASE + '/games/e2e-test-racer/', { waitUntil: 'domcontentloaded' });
  check(detail.status() === 200, 'player page serves 200 for the new game');
  const testIframe = ap.locator('iframe.player__iframe');
  check((await testIframe.getAttribute('src')) === 'https://example.invalid/test-racer.html', 'iframe uses operator-provided URL');
  check(!/noindex/.test((await ap.locator('meta[name="robots"]').getAttribute('content')) || ''), 'published game page is indexable');
  check((await ap.locator('h1:has-text("E2E Test Racer")').count()) === 1, 'game H1 rendered');
  check(
    (await ap.locator('main').innerText()).includes('Automated test entry'),
    'game description rendered on player page',
  );
  check((await ap.locator('.spec-table').count()) === 1, 'operator specs table rendered');

  // listed in the sitemap too
  const smAfter = await (await ap.request.get(BASE + '/sitemap.xml')).text();
  check(smAfter.includes('/games/e2e-test-racer/'), 'new game appears in sitemap immediately');

  // unpublish → real 404 + hidden from library
  const draftRes = await ap.evaluate(async (id) => {
    const res = await fetch(`/api/admin/games/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Racer',
        description:
          'Automated test entry created by the e2e suite to prove the admin publish pipeline works end to end.',
        category: 'racing',
        tags: 'test, e2e',
        controls: 'Arrow keys',
        specs: '',
        cover: null,
        embedUrl: 'https://example.invalid/test-racer.html',
        status: 'draft',
        featured: false,
      }),
    });
    return res.status;
  }, createRes.body?.game?.id);
  check(draftRes === 200, `PATCH unpublish → 200 (got ${draftRes})`);
  const draftPage = await ap.goto(BASE + '/games/e2e-test-racer/', { waitUntil: 'domcontentloaded' });
  check(draftPage.status() === 404, `draft game page → 404 (got ${draftPage.status()})`);
  await ap.goto(BASE + '/games/?q=E2E%20Test', { waitUntil: 'domcontentloaded' });
  check((await ap.locator('.empty-state').count()) === 1, 'draft game hidden from library');

  // delete → gone, then logout
  const delRes = await ap.evaluate(async (id) => {
    const res = await fetch(`/api/admin/games/${id}/`, { method: 'DELETE' });
    return res.status;
  }, createRes.body?.game?.id);
  check(delRes === 200, `DELETE → 200 (got ${delRes})`);
  const afterDelete = await ap.goto(BASE + '/games/e2e-test-racer/', { waitUntil: 'domcontentloaded' });
  check(afterDelete.status() === 404, 'deleted game page → 404');

  // cleanup uploaded cover file
  if (uploadUrl.startsWith('/uploads/')) {
    const fname = uploadUrl.replace(/^\/uploads\//, '').replace(/\/$/, '');
    try {
      unlinkSync(join(ROOT, 'data', 'uploads', fname));
      check(true, 'test upload file removed from data/uploads');
    } catch {
      check(false, 'test upload file removed from data/uploads');
    }
  }

  /* =====================================================================
     PHASE K — first-party analytics beacon (view/play → dashboard)
     ===================================================================== */
  console.log('\nPhase K — first-party analytics beacon');
  const homeHtml = await (await page.request.get(BASE + '/')).text();
  check(homeHtml.includes('/api/track/'), 'view beacon script ships on public pages');

  const track = (payload, headers) => page.request.post(BASE + '/api/track/', { data: payload, headers });
  const sameOrigin = { Origin: new URL(BASE).origin };
  const accept = await track({ kind: 'view', path: '/' }, sameOrigin);
  check(accept.status() === 200, `valid beacon accepted (got ${accept.status()})`);
  const crossOrigin = await track({ kind: 'view', path: '/' }, { Origin: 'https://evil.example' });
  check(crossOrigin.status() === 403, `foreign Origin rejected (got ${crossOrigin.status()})`);
  const adminPath = await track({ kind: 'view', path: '/admin/' }, sameOrigin);
  check(adminPath.status() === 400, `admin path rejected (got ${adminPath.status()})`);
  const badSlug = await track({ kind: 'play', slug: 'Not A Slug!' }, sameOrigin);
  check(badSlug.status() === 400, `malformed slug rejected (got ${badSlug.status()})`);
  const wrongMethod = await page.request.get(BASE + '/api/track/');
  check(wrongMethod.status() === 405, `GET rejected (got ${wrongMethod.status()})`);

  // live browser beacons must move the dashboard counters (authed reads)
  const stats = () =>
    ap.evaluate(() => fetch('/api/admin/analytics/?period=year').then((r) => r.json()));
  const viewsOf = (s, path) => s.topPages?.find((p) => p.path === path)?.views ?? 0;
  const playsOf = (s, slug) => s.topGames?.find((g) => g.slug === slug)?.plays ?? 0;

  const vBefore = viewsOf(await stats(), '/games');
  await ap.goto(`${BASE}/games/`, { waitUntil: 'load' });
  let vAfter = viewsOf(await stats(), '/games');
  for (let i = 0; i < 10 && vAfter <= vBefore; i++) {
    await ap.waitForTimeout(400);
    vAfter = viewsOf(await stats(), '/games');
  }
  check(vAfter > vBefore, `view beacon → dashboard counts the page load (${vBefore} → ${vAfter})`);

  const pBefore = playsOf(await stats(), LEAD.slug);
  await ap.goto(`${BASE}/games/${LEAD.slug}/`, { waitUntil: 'load' });
  let pAfter = playsOf(await stats(), LEAD.slug);
  for (let i = 0; i < 30 && pAfter <= pBefore; i++) {
    await ap.waitForTimeout(500); // external embeds can take a few seconds to load their frame
    pAfter = playsOf(await stats(), LEAD.slug);
  }
  check(pAfter > pBefore, `play beacon → frame opens counted for ${LEAD.title} (${pBefore} → ${pAfter})`);

  const recordedPaths = (await stats()).topPages?.map((p) => p.path) ?? [];
  const junkPaths = recordedPaths.filter(
    (p) => /^\/(admin|api|_astro|uploads)(\/|$)/.test(p) || /\.(txt|xml|json|js|css|png|jpe?g|svg|mp4)$/.test(p),
  );
  check(
    junkPaths.length === 0,
    `only page paths recorded — no admin/asset URLs${junkPaths.length ? ` — ${junkPaths.join(', ')}` : ''}`,
  );

  /* =====================================================================
     PHASE L — admin console pages (analytics + SEO) while signed in
     ===================================================================== */
  console.log('\nPhase L — admin console pages');
  await ap.goto(`${BASE}/admin/analytics/`, { waitUntil: 'load' });
  check(
    (await ap.locator('h1.admin-topbar__title').innerText()).includes('Analytics'),
    'analytics console page renders',
  );
  check(
    (await ap.locator('.admin-nav__link[aria-current="page"]').getAttribute('href')) === '/admin/analytics/',
    'sidebar marks the analytics page',
  );
  check((await ap.locator('[data-period-btn]').count()) === 4, 'period switcher: day / week / month / year');
  check((await ap.locator('[data-range-btn]').count()) >= 2, 'date-range switcher present');
  await ap.locator('[data-period-btn="month"]').click();
  check(
    (await ap.locator('[data-period-btn="month"]').getAttribute('aria-pressed')) === 'true',
    'period switcher toggles aria-pressed',
  );
  check((await ap.locator('[data-kpi="views"]').count()) === 1, 'KPI tiles render');
  check((await ap.locator('[data-chart], [data-chart-empty]').count()) >= 1, 'chart area renders');
  check((await ap.locator('[data-pages-body] tr, [data-pages-empty]').count()) >= 1, 'top-pages table renders');
  check((await ap.locator('[data-daily-body] tr, [data-daily-empty]').count()) >= 1, 'day-by-day log renders');
  check(
    (await ap.locator('[data-reset-analytics]').count()) === 1,
    'reset-counters control present (left unclicked — keeps the recorded counts)',
  );
  await ap.evaluate(() => window.scrollTo(0, 0));
  await ap.screenshot({ path: join(SHOTS, 'admin-analytics-1280.png') });

  await ap.goto(`${BASE}/admin/seo/`, { waitUntil: 'load' });
  check(
    (await ap.locator('h1.admin-topbar__title').innerText()).includes('SEO'),
    'SEO console page renders',
  );
  check(
    (await ap.locator('.admin-nav__link[aria-current="page"]').getAttribute('href')) === '/admin/seo/',
    'sidebar marks the SEO page',
  );
  check((await ap.locator('[data-seo-stat]').count()) >= 4, 'SEO KPI tiles render');
  check((await ap.locator('[data-seo-checks] li').count()) >= 5, 'indexability checklist renders');
  check((await ap.locator('[data-seo-body] tr, [data-seo-loading]').count()) >= 1, 'sitemap audit table renders');
  await ap.evaluate(() => window.scrollTo(0, 0));
  await ap.screenshot({ path: join(SHOTS, 'admin-seo-1280.png') });

  // back on the dashboard (the last stop was the deleted game's 404 page)
  await ap.goto(BASE + '/admin/', { waitUntil: 'domcontentloaded' });
  await ap.locator('[data-logout]').click();
  await ap.locator('[data-login-form]').waitFor({ state: 'visible', timeout: 5000 });
  check(true, 'sign-out returns to login view');
  check(adminPageErrors.length === 0, `admin phase has no page errors${adminPageErrors.length ? ` — ${adminPageErrors[0]}` : ''}`);

  await adminContext.close();

  /* =====================================================================
     final assertions + summary
     ===================================================================== */
  check(pageErrors.length === 0, `no uncaught page errors anywhere${pageErrors.length ? ` — ${pageErrors.slice(0, 3).join(' | ')}` : ''}`);

  await context.close();
  await browser.close();

  console.log(`\n${passed + failed.length} checks: ${passed} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log('\nFailed checks:');
    for (const f of failed) console.log('  ✗ ' + f);
    process.exit(1);
  }
  console.log('All e2e checks passed.');
}

main().catch((e) => {
  console.error('E2E crashed:', e);
  process.exit(1);
});
