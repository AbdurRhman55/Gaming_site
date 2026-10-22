<?php
declare(strict_types=1);

/**
 * Loads site + database configuration from the project-root `.env` file.
 * Mirrors the Node build's env model: real environment variables win, then `.env`.
 *
 * `.env` is gitignored — it holds the DB credentials and admin login and is
 * created once on the server (copied from `.env.example`). This file is safe
 * to commit; it contains no secrets of its own.
 */

function pf_load_env(string $path): array
{
    $out = [];
    if (!is_readable($path)) {
        return $out;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }
        $key = trim(substr($line, 0, $eq));
        $val = trim(substr($line, $eq + 1));
        if ($key === '') {
            continue;
        }
        // Strip a matching pair of surrounding quotes.
        if (strlen($val) >= 2) {
            $q = $val[0];
            if (($q === '"' || $q === "'") && substr($val, -1) === $q) {
                $val = substr($val, 1, -1);
            }
        }
        $out[$key] = $val;
    }
    return $out;
}

/** Get a config value: real env first, then .env, then default. */
function pf_env(string $key, string $default = ''): string
{
    static $env = null;
    if ($env === null) {
        $root = dirname(__DIR__);
        $env = array_merge(pf_load_env($root . '/.env'), pf_load_env($root . '/.env.local'));
    }
    $real = getenv($key);
    if ($real !== false && $real !== '') {
        return $real;
    }
    return $env[$key] ?? $default;
}

/** Site origin without trailing slash, e.g. https://example.com */
function pf_site(): string
{
    return rtrim(pf_env('SITE_URL', 'http://localhost:8080'), '/');
}

/** PDO DSN; falls back to a local SQLite file so a fresh clone runs with zero setup. */
function pf_db_dsn(): string
{
    $dsn = pf_env('DB_DSN');
    if ($dsn !== '') {
        return $dsn;
    }
    return 'sqlite:' . dirname(__DIR__) . '/data/app.sqlite';
}

function pf_db_user(): string
{
    return pf_env('DB_USER');
}

function pf_db_pass(): string
{
    return pf_env('DB_PASS');
}
