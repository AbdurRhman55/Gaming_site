<?php
declare(strict_types=1);

/**
 * First-party analytics beacon — POST /api/track/
 *
 *   { "kind": "view", "path": "/tips/" }     → count a page load
 *   { "kind": "play", "slug": "tight-lot" }  → count a game-frame open
 *
 * Validation is deliberately strict so the numbers stay trustworthy:
 *   - Origin/Referer must resolve to this host (foreign pages cannot forge),
 *   - paths must be clean internal routes (no scheme, query, or admin/api),
 *   - slugs must match the site's slug shape.
 * Operator activity is excluded client-side (admin pages are noindex) and
 * server-side (admin/api paths rejected), so dashboard counts stay honest.
 */

require_once __DIR__ . '/../includes/boot.php';

/** The beacon is write-only; answer other methods honestly (405 + Allow). */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    header('Allow: POST');
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

/** Host part of a URL, including a non-default port (matches URL.host). */
$hostOf = static function (?string $url): ?string {
    if (!$url) {
        return null;
    }
    $p = parse_url($url);
    if ($p === false || empty($p['host'])) {
        return null;
    }
    $host = strtolower($p['host']);
    if (!empty($p['port'])) {
        $host .= ':' . $p['port'];
    }
    return $host;
};

// 1) Same-origin only. Browsers attach Origin to every same-origin POST;
//    fall back to Referer for older engines. Neither present → reject.
$senderHost = $hostOf($_SERVER['HTTP_ORIGIN'] ?? null) ?? $hostOf($_SERVER['HTTP_REFERER'] ?? null);
$requestHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
if (!$senderHost || $senderHost !== $requestHost) {
    pf_json_error(403, 'cross-origin');
}

// 2) Shape of the payload.
$raw = file_get_contents('php://input');
$body = json_decode($raw === false ? '' : $raw, true);
if (!is_array($body)) {
    pf_json_error(400, 'invalid json');
}

$kind = $body['kind'] ?? null;
if ($kind === 'view') {
    $path = $body['path'] ?? null;
    if (!is_string($path) || $path === '' || strlen($path) > 200) {
        pf_json_error(400, 'bad path');
    }
    if (!preg_match('#^(/[a-z0-9\-]+)*/?$#', $path)) {
        pf_json_error(400, 'bad path');
    }
    foreach (['/admin', '/api', '/uploads', '/_astro', '/images'] as $blocked) {
        if ($path === $blocked || str_starts_with($path, $blocked . '/')) {
            pf_json_error(400, 'blocked path');
        }
    }
    pf_track_view($path);
    pf_json_ok();
}
if ($kind === 'play') {
    $slug = $body['slug'] ?? null;
    if (!is_string($slug) || !pf_valid_slug($slug)) {
        pf_json_error(400, 'bad slug');
    }
    pf_track_play($slug);
    pf_json_ok();
}
pf_json_error(400, 'bad kind');
