<?php
declare(strict_types=1);

/**
 * Shared PDO connection + driver-aware helpers.
 *
 * Works on MySQL (Hostinger production) and SQLite (local/dev, zero-setup).
 * The schema in database.sql targets MySQL; data/schema.sqlite.sql mirrors it
 * for SQLite. Only the two `ON CONFLICT`/`ON DUPLICATE KEY` upserts differ by
 * driver, isolated in db_upsert_count().
 */

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = pf_db_dsn();
    $isSqlite = str_starts_with($dsn, 'sqlite:');
    $opts = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    if (!$isSqlite) {
        $opts[PDO::ATTR_STRINGIFY_FETCHES] = false;
    }
    $pdo = new PDO($dsn, pf_db_user() ?: null, pf_db_pass() ?: null, $opts);
    if ($isSqlite) {
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
        // Ensure the single-megabyte counter schema exists on a fresh SQLite file.
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS analytics (
                day    TEXT    NOT NULL,
                kind   TEXT    NOT NULL,
                ref    TEXT    NOT NULL,
                count  INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (day, kind, ref)
            )'
        );
    }
    return $pdo;
}

/** True when the backing store is SQLite (affects upsert syntax only). */
function db_is_sqlite(): bool
{
    return str_starts_with(pf_db_dsn(), 'sqlite:');
}

/**
 * Atomically bump one counter (day, kind, ref) by 1. Driver-aware upsert so a
 * concurrent view/play never loses a hit.
 */
function db_upsert_count(string $day, string $kind, string $ref): void
{
    $pdo = db();
    if (db_is_sqlite()) {
        $stmt = $pdo->prepare(
            'INSERT INTO analytics (day, kind, ref, count) VALUES (?, ?, ?, 1)
             ON CONFLICT (day, kind, ref) DO UPDATE SET count = count + 1'
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO analytics (day, kind, ref, count) VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE count = count + 1'
        );
    }
    $stmt->execute([$day, $kind, $ref]);
}

/** Wipe every counter (operator reset before going live). */
function db_reset_analytics(): void
{
    db()->exec('DELETE FROM analytics');
}

/**
 * Ensure the MySQL schema exists. Called lazily by store/analytics so a fresh
 * Hostinger database self-initialises on first request without a manual import
 * (database.sql remains available for phpMyAdmin seeding).
 */
function db_ensure_schema(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    if (db_is_sqlite()) {
        // SQLite auto-created the analytics table in db(); create games here.
        db()->exec(
            'CREATE TABLE IF NOT EXISTS games (
                id          TEXT    NOT NULL PRIMARY KEY,
                slug        TEXT    NOT NULL UNIQUE,
                title       TEXT    NOT NULL,
                description TEXT    NOT NULL DEFAULT \'\',
                category    TEXT    NOT NULL DEFAULT \'\',
                tags        TEXT    NULL,
                controls    TEXT    NULL,
                specs       TEXT    NULL,
                cover       TEXT    NULL,
                embed_url   TEXT    NOT NULL,
                status      TEXT    NOT NULL DEFAULT \'draft\',
                featured    INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT    NOT NULL,
                updated_at  TEXT    NOT NULL
            )'
        );
        return;
    }
    $pdo = db();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS games (
            id          VARCHAR(64)  NOT NULL,
            slug        VARCHAR(80)  NOT NULL,
            title       VARCHAR(200) NOT NULL,
            description TEXT         NOT NULL,
            category    VARCHAR(60)  NOT NULL DEFAULT '',
            tags        TEXT         NULL,
            controls    TEXT         NULL,
            specs       TEXT         NULL,
            cover       VARCHAR(255) NULL,
            embed_url   VARCHAR(500) NOT NULL,
            status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
            featured    TINYINT(1)   NOT NULL DEFAULT 0,
            created_at  DATETIME     NOT NULL,
            updated_at  DATETIME     NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY games_slug (slug),
            KEY games_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS analytics (
            day    DATE        NOT NULL,
            kind   VARCHAR(10) NOT NULL,
            ref    VARCHAR(220) NOT NULL,
            count  INT         NOT NULL DEFAULT 0,
            PRIMARY KEY (day, kind, ref)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}
