<?php
declare(strict_types=1);

/**
 * Games data store — MySQL/SQLite backed (the PHP/Hostinger port of store.ts).
 * Every read hits the database at request time, which is what makes admin
 * uploads live instantly without a rebuild.
 *
 * Row shape mirrors the JSON model: tags + specs are stored as JSON strings
 * and decoded on read so callers see the same arrays the Node build exposed.
 */

require_once __DIR__ . '/db.php';

function pf_slugify(string $input): string
{
    $s = mb_strtolower(trim($input), 'UTF-8');
    if (function_exists('iconv')) {
        $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        if ($t !== false) {
            $s = $t;
        }
    }
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    $s = trim($s, '-');
    return substr($s, 0, 80);
}

function pf_decode_json(?string $json, array $fallback = []): array
{
    if ($json === null || $json === '') {
        return $fallback;
    }
    $val = json_decode($json, true);
    return is_array($val) ? $val : $fallback;
}

/** Turn a DB row into the associative game shape the pages expect. */
function pf_row_to_game(array $row): array
{
    return [
        'id'          => (string) $row['id'],
        'slug'        => (string) $row['slug'],
        'title'       => (string) $row['title'],
        'description' => (string) $row['description'],
        'category'    => (string) ($row['category'] ?? ''),
        'tags'        => pf_decode_json($row['tags'] ?? null),
        'controls'    => (string) ($row['controls'] ?? ''),
        'specs'       => pf_decode_json($row['specs'] ?? null),
        'cover'       => ($row['cover'] ?? '') !== '' ? (string) $row['cover'] : null,
        'embedUrl'    => (string) $row['embed_url'],
        'status'      => (string) $row['status'],
        'featured'    => (bool) $row['featured'],
        'createdAt'   => (string) $row['created_at'],
        'updatedAt'   => (string) $row['updated_at'],
    ];
}

/** All games, or only published ones. Featured first, then most recent. */
function pf_list_games(bool $publishedOnly = false): array
{
    db_ensure_schema();
    $sql = 'SELECT * FROM games';
    if ($publishedOnly) {
        $sql .= " WHERE status = 'published'";
    }
    $sql .= ' ORDER BY featured DESC, updated_at DESC';
    $games = [];
    foreach (db()->query($sql) as $row) {
        $games[] = pf_row_to_game($row);
    }
    return $games;
}

function pf_get_game_by_slug(string $slug, bool $publishedOnly = false): ?array
{
    db_ensure_schema();
    $stmt = db()->prepare('SELECT * FROM games WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $game = pf_row_to_game($row);
    if ($publishedOnly && $game['status'] !== 'published') {
        return null;
    }
    return $game;
}

function pf_get_game_by_id(string $id): ?array
{
    db_ensure_schema();
    $stmt = db()->prepare('SELECT * FROM games WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? pf_row_to_game($row) : null;
}

/** A slug that collides with no other game (optionally ignoring one id). */
function pf_unique_slug(string $base, ?string $ignoreId = null): string
{
    db_ensure_schema();
    $root = pf_slugify($base) ?: 'game';
    $slug = $root;
    $stmt = db()->prepare('SELECT COUNT(*) AS n FROM games WHERE slug = ?' . ($ignoreId ? ' AND id <> ?' : ''));
    for ($n = 2; ; $n++) {
        if ($ignoreId) {
            $stmt->execute([$slug, $ignoreId]);
        } else {
            $stmt->execute([$slug]);
        }
        if ((int) $stmt->fetch()['n'] === 0) {
            return $slug;
        }
        $slug = $root . '-' . $n;
    }
}

function pf_create_game(array $input): array
{
    db_ensure_schema();
    $now = gmdate('Y-m-d H:i:s'); // SQL-friendly UTC — fits MySQL DATETIME exactly
    $id = pf_uuid();
    $slug = pf_unique_slug($input['slug'] ?? ($input['title'] ?? ''));
    $stmt = db()->prepare(
        'INSERT INTO games (id, slug, title, description, category, tags, controls, specs, cover, embed_url, status, featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $slug,
        $input['title'],
        $input['description'],
        $input['category'] ?? '',
        json_encode($input['tags'] ?? [], JSON_UNESCAPED_UNICODE),
        $input['controls'] ?? '',
        json_encode($input['specs'] ?? [], JSON_UNESCAPED_UNICODE),
        $input['cover'] ?? null,
        $input['embedUrl'],
        $input['status'] ?? 'draft',
        !empty($input['featured']) ? 1 : 0,
        $now,
        $now,
    ]);
    return pf_get_game_by_id($id);
}

function pf_update_game(string $id, array $patch): ?array
{
    db_ensure_schema();
    $existing = pf_get_game_by_id($id);
    if (!$existing) {
        return null;
    }
    $merged = array_merge($existing, $patch);
    if (array_key_exists('slug', $patch)) {
        $merged['slug'] = pf_unique_slug($patch['slug'] ?: $merged['title'], $id);
    }
    $now = gmdate('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE games SET slug=?, title=?, description=?, category=?, tags=?, controls=?, specs=?, cover=?, embed_url=?, status=?, featured=?, updated_at=? WHERE id=?'
    );
    $stmt->execute([
        $merged['slug'],
        $merged['title'],
        $merged['description'],
        $merged['category'] ?? '',
        json_encode($merged['tags'] ?? [], JSON_UNESCAPED_UNICODE),
        $merged['controls'] ?? '',
        json_encode($merged['specs'] ?? [], JSON_UNESCAPED_UNICODE),
        $merged['cover'] ?? null,
        $merged['embedUrl'],
        $merged['status'] ?? 'draft',
        !empty($merged['featured']) ? 1 : 0,
        $now,
        $id,
    ]);
    return pf_get_game_by_id($id);
}

function pf_delete_game(string $id): bool
{
    db_ensure_schema();
    $stmt = db()->prepare('DELETE FROM games WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}

/** RFC-4122 v4 UUID, matching the id format the Node store produced. */
function pf_uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

/** Case-insensitive dedupe of category chips (preserves first-seen casing). */
function pf_categories(array $games): array
{
    $seen = [];
    $out = [];
    foreach ($games as $g) {
        $c = trim($g['category'] ?? '');
        if ($c === '') {
            continue;
        }
        $k = mb_strtolower($c);
        if (isset($seen[$k])) {
            continue;
        }
        $seen[$k] = true;
        $out[] = $c;
    }
    return $out;
}
