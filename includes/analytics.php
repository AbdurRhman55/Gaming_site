<?php
declare(strict_types=1);

/**
 * Analytics — first-party, privacy-friendly traffic counters backed by the
 * database (PHP port of src/lib/analytics.ts).
 *
 * Counts only what the site's own beacon reports (POST /api/track/): page
 * views (by path) and game-frame opens (by slug). Nothing is invented,
 * sampled, or estimated — no cookies, no third parties, same-origin only.
 *
 * Storage: one row per (day, kind, ref) — kind is 'view' (ref = path) or
 * 'play' (ref = slug). Aggregation for the dashboard happens in PHP.
 */

require_once __DIR__ . '/db.php';

/** UTC day key, YYYY-MM-DD. */
function pf_today(): string
{
    return gmdate('Y-m-d');
}

/** Canonical path key: strip query/hash, collapse trailing slash. */
function pf_path_key(string $p): string
{
    $clean = trim(explode('#', explode('?', $p)[0])[0]);
    if ($clean === '' || $clean === '/') {
        return '/';
    }
    $clean = rtrim($clean, '/');
    return $clean === '' ? '/' : $clean;
}

/** Count one page view for a normalised path. */
function pf_track_view(string $path): void
{
    try {
        db_ensure_schema();
        db_upsert_count(pf_today(), 'view', pf_path_key($path));
    } catch (Throwable $e) {
        // Analytics must never break a request.
        error_log('pf_track_view: ' . $e->getMessage());
    }
}

/** Count one game-frame open (by slug) — internal or external embed alike. */
function pf_track_play(string $slug): void
{
    try {
        db_ensure_schema();
        db_upsert_count(pf_today(), 'play', $slug);
    } catch (Throwable $e) {
        error_log('pf_track_play: ' . $e->getMessage());
    }
}

/** ISO-week label (YYYY-Www) for a UTC day key, matching the Node build. */
function pf_iso_week_key(string $dayKey): string
{
    $ts = strtotime($dayKey . ' UTC');
    // Move to the Thursday of this week (Monday-start ISO).
    $dow = (int) gmdate('w', $ts);            // 0=Sun..6=Sat
    $mondayOffset = ($dow + 6) % 7;           // days since Monday
    $thursday = $ts - $mondayOffset * 86400 + 3 * 86400;
    $isoYear = (int) gmdate('Y', $thursday);
    // Thursday of week 1 = nearest Thursday to Jan 4.
    $jan4 = gmmktime(0, 0, 0, 1, 4, $isoYear);
    $jan4Dow = (int) gmdate('w', $jan4);
    $firstThursday = $jan4 - (($jan4Dow + 6) % 7) * 86400 + 3 * 86400;
    $week = (int) round(($thursday - $firstThursday) / (7 * 86400)) + 1;
    return sprintf('%04d-W%02d', $isoYear, $week);
}

/** Map a day key to the bucket key for the requested period. */
function pf_bucket_key_for(string $dayKey, string $period): string
{
    if ($period === 'day') {
        return $dayKey;
    }
    if ($period === 'week') {
        return pf_iso_week_key($dayKey);
    }
    if ($period === 'month') {
        return substr($dayKey, 0, 7);
    }
    return substr($dayKey, 0, 4);
}

/**
 * Aggregate history for the dashboard. `since` (YYYY-MM-DD, inclusive) prunes
 * older days before summing so the range switcher is exact, not a client slice.
 */
function pf_analytics_summary(string $period = 'day', ?string $since = null): array
{
    db_ensure_schema();
    $rows = db()->query('SELECT day, kind, ref, count FROM analytics' . ($since ? ' WHERE day >= ' . db()->quote($since) : '') . ' ORDER BY day ASC')->fetchAll();

    $totalsViews = 0;
    $totalsPlays = 0;
    $byBucket = [];
    $pages = [];
    $games = [];
    $daily = [];
    $activeDays = 0;

    $lastDay = null;
    foreach ($rows as $r) {
        $day = (string) $r['day'];
        $kind = (string) $r['kind'];
        $ref = (string) $r['ref'];
        $n = (int) $r['count'];

        if ($kind === 'view') {
            $totalsViews += $n;
            $pages[$ref] = ($pages[$ref] ?? 0) + $n;
        } elseif ($kind === 'play') {
            $totalsPlays += $n;
            $games[$ref] = ($games[$ref] ?? 0) + $n;
        }
        if ($day !== $lastDay) {
            $daily[] = ['day' => $day, 'views' => 0, 'plays' => 0];
            $activeDays++;
            $lastDay = $day;
        }
        $di = count($daily) - 1;
        if ($kind === 'view') {
            $daily[$di]['views'] += $n;
        } elseif ($kind === 'play') {
            $daily[$di]['plays'] += $n;
        }

        $key = pf_bucket_key_for($day, $period);
        if (!isset($byBucket[$key])) {
            $byBucket[$key] = ['key' => $key, 'views' => 0, 'plays' => 0];
        }
        if ($kind === 'view') {
            $byBucket[$key]['views'] += $n;
        } elseif ($kind === 'play') {
            $byBucket[$key]['plays'] += $n;
        }
    }

    $series = array_values($byBucket);
    usort($series, fn($a, $b) => strcmp($a['key'], $b['key']));

    $topPages = [];
    foreach ($pages as $path => $views) {
        $topPages[] = ['path' => $path, 'views' => $views];
    }
    usort($topPages, fn($a, $b) => ($b['views'] <=> $a['views']) ?: strcmp($a['path'], $b['path']));

    $topGames = [];
    foreach ($games as $slug => $plays) {
        $topGames[] = ['slug' => $slug, 'plays' => $plays];
    }
    usort($topGames, fn($a, $b) => ($b['plays'] <=> $a['plays']) ?: strcmp($a['slug'], $b['slug']));

    return [
        'totals'     => ['views' => $totalsViews, 'plays' => $totalsPlays],
        'series'     => $series,
        'topPages'   => $topPages,
        'topGames'   => $topGames,
        'daily'      => $daily,
        'activeDays' => $activeDays,
    ];
}
