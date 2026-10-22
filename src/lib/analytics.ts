/**
 * Analytics store — first-party, privacy-friendly traffic counters backed by a
 * plain JSON file (same single-process, no-database model as the games store).
 *
 * Design goals:
 *   - Accurate enough to cross-check Google Search Console + AdSense: we count
 *     real page loads reported by the site's own beacon (POST /api/track/) and
 *     real game-frame opens. Nothing is invented, sampled, or estimated.
 *   - Uniform coverage: a server-side request log cannot see prerendered
 *     pages — the node adapter's static handler serves them from disk before
 *     any Astro middleware runs — so editorial SEO pages would permanently
 *     show zero. The beacon reports every rendered page from the browser, so
 *     prerendered and SSR routes count the same way (requires JavaScript, like
 *     every analytics system; no cookies, no third parties, same-origin only).
 *   - Fast writes without hammering the disk: every event bumps an in-memory
 *     counter and the file is flushed at most once per FLUSH_MS (plus on
 *     process exit), so a busy day costs a handful of writes.
 *   - Queryable by day / week / month / year for the dashboard, with a single
 *     canonical "record" entry point used by POST /api/track/.
 *
 * Data model (data/analytics.json):
 *   { "v": 1, "days": { "2026-10-21": { "views": 123, "plays": 9,
 *        "pages": { "/": 40, "/games/": 30 }, "games": { "tight-lot": 6 } } } }
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface DayBucket {
  /** Total page loads reported by the beacon that day. */
  views: number;
  /** Total game-frame opens that day (play = the game finished loading in the player frame). */
  plays: number;
  /** Per-path page view counts ("/", "/games/", …). */
  pages: Record<string, number>;
  /** Per-game frame opens, keyed by slug (works for internal + external embeds). */
  games: Record<string, number>;
}

export interface AnalyticsFile {
  v: number;
  days: Record<string, DayBucket>;
}

export type Period = 'day' | 'week' | 'month' | 'year';

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'analytics.json');
const FLUSH_MS = 5000;

function emptyBucket(): DayBucket {
  return { views: 0, plays: 0, pages: {}, games: {} };
}

function read(): AnalyticsFile {
  if (!existsSync(FILE)) return { v: 1, days: {} };
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as AnalyticsFile;
    if (!parsed || typeof parsed !== 'object' || !parsed.days || typeof parsed.days !== 'object') {
      return { v: 1, days: {} };
    }
    return parsed;
  } catch {
    // A corrupt analytics file must never break the site — start clean rather
    // than throw (unlike the games store, historical counts are non-critical).
    return { v: 1, days: {} };
  }
}

function write(file: AnalyticsFile): void {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(file), 'utf8');
    renameSync(tmp, FILE);
  } catch {
    /* disk full / read-only — never let analytics crash a request */
  }
}

/* ---------------------------------------------------------------------------
 * Write path: keep the file in memory, buffer increments, flush on a timer.
 * ------------------------------------------------------------------------- */

let cache: AnalyticsFile | null = null;
let dirty = false;
let timer: NodeJS.Timeout | null = null;

function ensureLoaded(): AnalyticsFile {
  if (!cache) cache = read();
  return cache;
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flushNow();
  }, FLUSH_MS);
  // Do not keep the process alive just to flush analytics.
  timer.unref?.();
}

function flushNow(): void {
  if (!dirty || !cache) return;
  write(cache);
  dirty = false;
}

/** Flush buffered counters on shutdown so nothing recent is lost. */
export function flushAnalytics(): void {
  flushNow();
}

// Best-effort persistence when the standalone server stops (Ctrl+C / normal
// exit paths that emit 'exit'). Signal-kill (SIGKILL) can still lose at most
// FLUSH_MS of counts — never more.
process.once('exit', () => {
  try {
    flushNow();
  } catch {
    /* never throw during shutdown */
  }
});

/**
 * Wipe all counters (dashboard "Reset counters"). Used to clear local test
 * noise before go-live so the numbers match production traffic exactly.
 * Rewrites the file immediately — no flush delay.
 */
export function resetAnalytics(): void {
  cache = { v: 1, days: {} };
  dirty = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  write(cache);
}

const pathKey = (p: string): string => {
  // Normalise: strip query/hash, collapse trailing slash to a canonical "/x".
  const clean = p.split('?')[0].split('#')[0].trim();
  if (!clean || clean === '/') return '/';
  return clean.replace(/\/+$/, '') || '/';
};

/** Count one page view for a normalised path. */
export function trackView(path: string): void {
  const file = ensureLoaded();
  const key = new Date().toISOString().slice(0, 10);
  const bucket = (file.days[key] ??= emptyBucket());
  const p = pathKey(path);
  bucket.views += 1;
  bucket.pages[p] = (bucket.pages[p] ?? 0) + 1;
  dirty = true;
  scheduleFlush();
}

/** Count one game-frame open (by slug) — internal or external embed alike. */
export function trackPlay(slug: string): void {
  const file = ensureLoaded();
  const key = new Date().toISOString().slice(0, 10);
  const bucket = (file.days[key] ??= emptyBucket());
  bucket.plays += 1;
  bucket.games[slug] = (bucket.games[slug] ?? 0) + 1;
  dirty = true;
  scheduleFlush();
}

/* ---------------------------------------------------------------------------
 * Read path: aggregate the raw per-day buckets into any period the UI asks for.
 * ------------------------------------------------------------------------- */

export interface Bucket {
  key: string; // day | ISO week | month | year label
  views: number;
  plays: number;
}

export interface Totals {
  views: number;
  plays: number;
}

const startOfWeekKey = (d: Date): string => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7; // Monday = 0
  t.setUTCDate(t.getUTCDate() - day);
  return t.toISOString().slice(0, 10);
};

const WEEK_RE = /^\d{4}-W\d{2}$/;

/** ISO-week label (YYYY-Www) for a given UTC date string (YYYY-MM-DD). */
function isoWeekKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3); // nearest Thursday
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const fDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 864e5));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Map a day key to the bucket key for the requested period. */
function bucketKeyFor(dayKey: string, period: Period): string {
  if (period === 'day') return dayKey;
  if (period === 'week') return isoWeekKey(dayKey);
  if (period === 'month') return dayKey.slice(0, 7);
  return dayKey.slice(0, 4);
}

export interface AnalyticsSummary {
  totals: Totals;
  /** One bucket per populated period slot, oldest → newest. */
  series: Bucket[];
  /** Per-path views for the whole history. */
  topPages: { path: string; views: number }[];
  /** Per-game plays for the whole history. */
  topGames: { slug: string; plays: number }[];
  /** Views for the most recent N days (used for the dashboard sparkline). */
  daily: { day: string; views: number; plays: number }[];
  /** Number of distinct days with recorded traffic. */
  activeDays: number;
}

/**
 * Aggregate history. `since` (YYYY-MM-DD, inclusive) prunes older days before
 * summing so the dashboard's range switcher is exact, not a client-side slice.
 */
export function summarize(opts: { period: Period; since?: string | null } = {}): AnalyticsSummary {
  const file = cache ?? read();
  const period = opts.period;
  const since = opts.since || null;

  const dayKeys = Object.keys(file.days)
    .filter((k) => !since || k >= since)
    .sort();

  const totals: Totals = { views: 0, plays: 0 };
  const byBucket = new Map<string, Bucket>();
  const pages = new Map<string, number>();
  const games = new Map<string, number>();
  const daily: { day: string; views: number; plays: number }[] = [];

  for (const dayKey of dayKeys) {
    const b = file.days[dayKey];
    totals.views += b.views;
    totals.plays += b.plays;
    daily.push({ day: dayKey, views: b.views, plays: b.plays });

    const key = bucketKeyFor(dayKey, period);
    const agg = byBucket.get(key) ?? { key, views: 0, plays: 0 };
    agg.views += b.views;
    agg.plays += b.plays;
    byBucket.set(key, agg);

    for (const [p, n] of Object.entries(b.pages)) pages.set(p, (pages.get(p) ?? 0) + n);
    for (const [s, n] of Object.entries(b.games)) games.set(s, (games.get(s) ?? 0) + n);
  }

  const topPages = [...pages.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));
  const topGames = [...games.entries()]
    .map(([slug, plays]) => ({ slug, plays }))
    .sort((a, b) => b.plays - a.plays || a.slug.localeCompare(b.slug));

  return {
    totals,
    series: [...byBucket.values()].sort((a, b) => a.key.localeCompare(b.key)),
    topPages,
    topGames,
    daily,
    activeDays: dayKeys.length,
  };
}

/** Distinct day keys that carry a given period label (used for range presets). */
export function periodContainsDays(period: Period, label: string): string[] {
  const file = cache ?? read();
  return Object.keys(file.days)
    .filter((k) => bucketKeyFor(k, period) === label)
    .sort();
}

export { WEEK_RE, startOfWeekKey };

