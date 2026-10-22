<?php
declare(strict_types=1);

/**
 * /sitemap.xml — built from the SEO registry plus the live games library, so
 * only canonical, indexable URLs can appear here (noindex routes such as the
 * 404 page and the admin dashboard are excluded automatically). Rendered at
 * request time so newly published games are listed without a rebuild.
 * SITE_CONTENT_UPDATED is the date the static content was last reviewed;
 * game entries use their own updatedAt instead.
 */

require_once __DIR__ . '/includes/boot.php';

$SITE_CONTENT_UPDATED = '2026-10-20';

$base = rtrim(pf_site(), '/');

$entry = static fn(string $loc, string $lastmod): string =>
    "  <url>\n    <loc>{$loc}</loc>\n    <lastmod>{$lastmod}</lastmod>\n  </url>";

$urls = [];
foreach (pf_pages() as $page) {
    if (!empty($page['noindex'])) {
        continue;
    }
    $path = $page['path'];
    $urls[] = $entry($base . ($path === '/' ? '/' : $path), $SITE_CONTENT_UPDATED);
}
foreach (pf_list_games(true) as $game) {
    $urls[] = $entry($base . '/games/' . $game['slug'] . '/', substr($game['updatedAt'], 0, 10));
}

header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo implode("\n", $urls) . "\n";
echo '</urlset>' . "\n";
