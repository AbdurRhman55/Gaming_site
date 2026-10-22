<?php
declare(strict_types=1);

/**
 * /robots.txt — generated so the sitemap URL always matches the configured
 * site origin (SITE_URL). No assets are blocked; the site has no private paths.
 */

require_once __DIR__ . '/includes/boot.php';

$base = rtrim(pf_site(), '/');

header('Content-Type: text/plain; charset=utf-8');
echo "User-agent: *\n";
echo "Allow: /\n";
echo "\n";
echo 'Sitemap: ' . $base . "/sitemap.xml\n";
