<?php
declare(strict_types=1);

/**
 * /tips/
 *
 * Editorial page: the <body> markup was ported verbatim from the production
 * build (includes/pages/tips.html) for exact design parity; the <head>
 * (title, canonical, Open Graph, JSON-LD) is generated here so it always
 * matches the live domain instead of being frozen at build time.
 */
require_once __DIR__ . '/includes/boot.php';

$path = '/tips/';
$page = pf_static_page('tips');

pf_layout_header([
    'path'   => $path,
    'trail'  => [],                 // breadcrumb nav is baked into the body
    'jsonLd' => $page['jsonLd'],
]);

echo $page['main'];

pf_layout_footer();
