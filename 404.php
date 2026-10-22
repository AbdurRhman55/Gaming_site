<?php
declare(strict_types=1);

/**
 * /404 — not-found document (extracted body + dynamic head, noindex).
 */
require_once __DIR__ . '/includes/boot.php';

http_response_code(404);

$path = '/404';
$page = pf_static_page('404');

pf_layout_header([
    'path'   => $path,
    'trail'  => [],
    'jsonLd' => $page['jsonLd'],
]);

echo $page['main'];

pf_layout_footer();
