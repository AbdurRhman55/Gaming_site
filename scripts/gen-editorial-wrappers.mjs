/**
 * Generates the thin PHP wrappers for each editorial route.
 * Run once: node scripts/gen-editorial-wrappers.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ROUTES = [
  ['about', '/about/'],
  ['contact', '/contact/'],
  ['how-to-play', '/how-to-play/'],
  ['parking-fury-2', '/parking-fury-2/'],
  ['parking-fury-3', '/parking-fury-3/'],
  ['parking-fury-3d', '/parking-fury-3d/'],
  ['privacy', '/privacy/'],
  ['similar-games', '/similar-games/'],
  ['terms', '/terms/'],
  ['tips', '/tips/'],
  ['walkthrough', '/walkthrough/'],
];

const tpl = (name, path) => `<?php
declare(strict_types=1);

/**
 * ${path}
 *
 * Editorial page: the <body> markup was ported verbatim from the production
 * build (includes/pages/${name}.html) for exact design parity; the <head>
 * (title, canonical, Open Graph, JSON-LD) is generated here so it always
 * matches the live domain instead of being frozen at build time.
 */
require_once __DIR__ . '/includes/boot.php';

$path = '${path}';
$page = pf_static_page('${name}');

pf_layout_header([
    'path'   => $path,
    'trail'  => [],                 // breadcrumb nav is baked into the body
    'jsonLd' => $page['jsonLd'],
]);

echo $page['main'];

pf_layout_footer();
`;

let n = 0;
for (const [name, path] of ROUTES) {
  writeFileSync(join(ROOT, `${name}.php`), tpl(name, path), 'utf8');
  console.log(`ok  ${name}.php`);
  n++;
}

// 404 — same extraction, but with a real 404 status code.
writeFileSync(
  join(ROOT, '404.php'),
  `<?php
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
`,
  'utf8'
);
console.log('ok  404.php');
console.log(`\n${n + 1} wrappers written.`);
