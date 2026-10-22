<?php
declare(strict_types=1);

/** Small shared helpers used across pages and admin. */

/** HTML-escape for safe output. */
function pf_e(?string $s): string
{
    return htmlspecialchars($s ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Current year for footer copyright. */
function pf_year(): int
{
    return (int) gmdate('Y');
}

/** Absolute URL to an uploaded cover, keeping the trailing-slash shape the
 *  original site used. Falls back to a placeholder when unset. */
function pf_cover_url(?string $cover): ?string
{
    if (!$cover) {
        return null;
    }
    // Already absolute or a root path.
    if (str_starts_with($cover, 'http://') || str_starts_with($cover, 'https://') || str_starts_with($cover, '/')) {
        return $cover;
    }
    return '/uploads/' . $cover;
}

/** Is an embed URL internal (same-origin /embed/…) or external (https host)? */
function pf_is_internal_embed(string $url): bool
{
    return str_starts_with($url, '/');
}

/** Whether the current request was made over HTTPS. */
function pf_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

/** Request path with trailing slash normalised, e.g. "/games/tight-lot/". */
function pf_current_path(): string
{
    $p = $_SERVER['REQUEST_URI'] ?? '/';
    $p = explode('?', $p)[0];
    $p = explode('#', $p)[0];
    if ($p === '' || $p[0] !== '/') {
        $p = '/' . $p;
    }
    if ($p !== '/' && !str_ends_with($p, '/')) {
        $p .= '/';
    }
    return $p;
}

/** Is the request path under a given prefix (e.g. '/admin')? */
function pf_path_starts_with(string $prefix): bool
{
    $p = $_SERVER['REQUEST_URI'] ?? '/';
    return $p === $prefix || str_starts_with($p, $prefix . '/') || str_starts_with($p, $prefix . '?');
}

/** Sanitise a beacon path (same rule as the Node track endpoint). */
function pf_valid_track_path(string $p): bool
{
    if (strlen($p) > 200) {
        return false;
    }
    if (!preg_match('#^(/[a-z0-9\-]+)*/?$#', $p)) {
        return false;
    }
    foreach (['/admin', '/api', '/uploads', '/_astro', '/images'] as $blocked) {
        if ($p === $blocked || str_starts_with($p, $blocked . '/')) {
            return false;
        }
    }
    return true;
}

/** Sanitise a game slug (same rule as the Node track endpoint). */
function pf_valid_slug(string $s): bool
{
    return (bool) preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/', $s);
}

/** Escape a string for safe inclusion inside a JS/JSON script block. */
function pf_json(?array $data): string
{
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
}
