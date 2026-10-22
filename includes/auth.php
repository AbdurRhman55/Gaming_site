<?php
declare(strict_types=1);

/**
 * Admin authentication: single operator account backed by env vars, with an
 * HMAC-signed session cookie (no server-side session store needed).
 * PHP port of src/lib/auth.ts — same cookie name, same 7-day TTL.
 *
 *   ADMIN_USER            login name   (default: admin)
 *   ADMIN_PASSWORD        login password (REQUIRED — if unset, all logins fail)
 *   ADMIN_SESSION_SECRET  HMAC key     (falls back to the password)
 */

const PF_SESSION_COOKIE = 'pf_admin';
const PF_SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

function pf_admin_user(): string
{
    $u = pf_env('ADMIN_USER');
    return $u !== '' ? $u : 'admin';
}

function pf_admin_password(): string
{
    return pf_env('ADMIN_PASSWORD');
}

function pf_admin_secret(): string
{
    $s = pf_env('ADMIN_SESSION_SECRET');
    return $s !== '' ? $s : pf_env('ADMIN_PASSWORD');
}

/** Timing-safe string compare (length-safe via hash_equals). */
function pf_safe_equal(string $a, string $b): bool
{
    return hash_equals($b, $a);
}

function pf_check_credentials(string $user, string $password): bool
{
    $pw = pf_admin_password();
    if ($pw === '' || pf_admin_secret() === '') {
        return false; // never leave the door open by default
    }
    return pf_safe_equal($user, pf_admin_user()) && pf_safe_equal($password, $pw);
}

function pf_sign(string $payload): string
{
    return rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, pf_admin_secret(), true)), '+/', '-_'), '=');
}

function pf_create_session_value(): string
{
    $exp = (string) (time() + PF_SESSION_TTL_S);
    return $exp . '.' . pf_sign($exp);
}

function pf_verify_session_value(?string $value): bool
{
    if (!$value || pf_admin_secret() === '') {
        return false;
    }
    $parts = explode('.', $value);
    if (count($parts) !== 2) {
        return false;
    }
    [$exp, $sig] = $parts;
    if (!ctype_digit($exp)) {
        return false;
    }
    if (!pf_safe_equal($sig, pf_sign($exp))) {
        return false;
    }
    return (int) $exp > time();
}

/** Is the current request an authenticated admin? */
function pf_is_authed(): bool
{
    return pf_verify_session_value($_COOKIE[PF_SESSION_COOKIE] ?? null);
}

/** Set the signed admin cookie (Secure when served over HTTPS). */
function pf_set_auth_cookie(): void
{
    setcookie(PF_SESSION_COOKIE, pf_create_session_value(), [
        'expires'  => time() + PF_SESSION_TTL_S,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    ]);
}

function pf_clear_auth_cookie(): void
{
    setcookie(PF_SESSION_COOKIE, '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
}

/** Uniform JSON response helpers for the API endpoints. */
function pf_json_ok(array $body = [], int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => true], $body), JSON_UNESCAPED_SLASHES);
    exit;
}

function pf_json_error(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}
