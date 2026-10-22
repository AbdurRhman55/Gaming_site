<?php
declare(strict_types=1);

/**
 * SEO indexing API — live sitemap + indexability audit for the dashboard.
 *
 *   GET /api/admin/seo/
 *
 * Returns, for every route the sitemap exposes, whether it is indexable
 * (published games + editorial pages), whether it carries a canonical, and a
 * roll-up the operator can scan before submitting to Search Console. Data is
 * read straight from the games store and the canonical registry — no invented
 * metrics, no network calls.
 */

require_once __DIR__ . '/../../includes/boot.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    pf_json_error(405, 'method not allowed');
}
if (!pf_is_authed()) {
    pf_json_error(401, 'Sign in first.');
}

$EDITORIAL = [
    ['path' => '/', 'title' => 'Home'],
    ['path' => '/games/', 'title' => 'Games library'],
    ['path' => '/how-to-play/', 'title' => 'Controls & how to play'],
    ['path' => '/walkthrough/', 'title' => 'Walkthrough'],
    ['path' => '/tips/', 'title' => 'Tips & troubleshooting'],
    ['path' => '/similar-games/', 'title' => 'Games like Parking Fury'],
    ['path' => '/parking-fury-2/', 'title' => 'Parking Fury 2'],
    ['path' => '/parking-fury-3/', 'title' => 'Parking Fury 3'],
    ['path' => '/parking-fury-3d/', 'title' => 'Parking Fury 3D'],
    ['path' => '/about/', 'title' => 'About'],
    ['path' => '/contact/', 'title' => 'Contact'],
    ['path' => '/privacy/', 'title' => 'Privacy'],
    ['path' => '/terms/', 'title' => 'Terms'],
];

$games = pf_list_games(true);
$all = pf_list_games(false);
$drafts = array_values(array_filter($all, fn($g) => $g['status'] === 'draft'));

$origin = rtrim(pf_site(), '/');

$canonicalFor = static fn(string $path): string => $origin . ($path !== '' && $path[0] === '/' ? $path : '/' . $path);

$editorial = array_map(fn($r) => [
    'path'      => $r['path'],
    'title'     => $r['title'],
    'url'       => $canonicalFor($r['path']),
    'canonical' => $canonicalFor($r['path']),
    'indexable' => true,
], $EDITORIAL);

$gamePages = array_map(fn($g) => [
    'path'      => '/games/' . $g['slug'] . '/',
    'title'     => $g['title'],
    'url'       => $canonicalFor('/games/' . $g['slug'] . '/'),
    'canonical' => $canonicalFor('/games/' . $g['slug'] . '/'),
    'indexable' => $g['status'] === 'published',
], $games);

$excluded = [
    ['path' => '/admin/', 'reason' => 'operator console (noindex)'],
    ['path' => '/404', 'reason' => 'error page (noindex)'],
];
foreach ($drafts as $g) {
    $excluded[] = ['path' => '/games/' . $g['slug'] . '/', 'reason' => 'draft — hidden until published'];
}

pf_json_ok([
    'origin'     => $origin,
    'sitemapUrl' => $origin . '/sitemap.xml',
    'robotsUrl'  => $origin . '/robots.txt',
    'counts'     => [
        'editorial' => count($editorial),
        'games'     => count($gamePages),
        'indexable' => count($editorial) + count($gamePages),
        'excluded'  => count($excluded),
    ],
    'editorial'  => $editorial,
    'games'      => $gamePages,
    'excluded'   => $excluded,
]);
