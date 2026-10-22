<?php
declare(strict_types=1);

/**
 * Router for PHP's built-in dev server ONLY (not used on Hostinger):
 *
 *     php -S localhost:8000 scripts/dev-router.php
 *
 * Mirrors the .htaccess rules so local testing behaves like production:
 * /games/<slug>/, /admin/, /api/…, /sitemap.xml, /robots.txt and the
 * editorial routes all resolve the same way they will on the live host.
 */

$uri = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));
$root = dirname(__DIR__);

// Refuse server-side directories in dev too (parity with .htaccess denies).
if (preg_match('#^/(includes|scripts|src-ts|node_modules|data|docs)/#', $uri)
    || preg_match('#^/(\.env|\.git|database\.sql|package(-lock)?\.json|tailwind\.(config\.js|input\.css))#', $uri)) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}

// Real files: let the built-in server handle them itself.
$path = $root . $uri;
if ($uri !== '/' && is_file($path)) {
    return false;
}

// Site root → the PHP homepage.
if ($uri === '/' || $uri === '') {
    require $root . '/index.php';
    return true;
}

// Directories with an index file.
if ($uri !== '/' && is_dir($path)) {
    if (is_file($path . '/index.php')) {
        require $path . '/index.php';
        return true;
    }
    if (is_file($path . '/index.html')) {
        return false; // built-in server serves the static document
    }
}

// Dynamic text documents.
$exact = [
    '/sitemap.xml' => 'sitemap.php',
    '/robots.txt' => 'robots.php',
];
if (isset($exact[$uri])) {
    require $root . '/' . $exact[$uri];
    return true;
}

// Uploaded covers with a trailing slash.
if (preg_match('#^/uploads/(.+)/$#', $uri, $m) && is_file($root . '/uploads/' . $m[1])) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    header('Content-Type: ' . $finfo->file($root . '/uploads/' . $m[1]));
    readfile($root . '/uploads/' . $m[1]);
    return true;
}

// Admin console.
if (preg_match('#^/admin/?$#', $uri)) {
    require $root . '/admin/index.php';
    return true;
}
if (preg_match('#^/admin/([a-z]+)/?$#', $uri, $m) && is_file($root . '/admin/' . $m[1] . '.php')) {
    require $root . '/admin/' . $m[1] . '.php';
    return true;
}

// API endpoints.
$api = [
    '/api/track' => 'api/track.php',
    '/api/admin/login' => 'api/admin/login.php',
    '/api/admin/logout' => 'api/admin/logout.php',
    '/api/admin/upload' => 'api/admin/upload.php',
    '/api/admin/games' => 'api/admin/games.php',
    '/api/admin/analytics' => 'api/admin/analytics.php',
    '/api/admin/seo' => 'api/admin/seo.php',
];
$norm = rtrim($uri, '/');
if (isset($api[$norm])) {
    require $root . '/' . $api[$norm];
    return true;
}
if (preg_match('#^/api/admin/games/([0-9a-f-]+)$#', $norm, $m)) {
    $_GET['id'] = $m[1];
    require $root . '/api/admin/game.php';
    return true;
}

// Game player.
if (preg_match('#^/games/([a-z0-9-]+)/?$#', $uri, $m) && !is_dir($root . $uri)) {
    $_GET['slug'] = $m[1];
    require $root . '/games/show.php';
    return true;
}

// Editorial single-segment routes.
if (preg_match('#^/([a-z0-9-]+)/?$#', $uri, $m) && is_file($root . '/' . $m[1] . '.php')) {
    require $root . '/' . $m[1] . '.php';
    return true;
}

// Branded 404.
http_response_code(404);
require $root . '/404.php';
return true;
