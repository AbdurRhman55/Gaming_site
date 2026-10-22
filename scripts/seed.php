<?php
declare(strict_types=1);

/**
 * Local/dev seeder — loads a games.json into the configured database.
 *
 *   php scripts/seed.php [path/to/games.json]
 *
 * Default source order: the path argument → project data/games.json.
 * On Hostinger you normally import database.sql via phpMyAdmin instead;
 * this script exists so a fresh local clone (SQLite) has the 12 games to
 * test with. Idempotent: existing slugs are skipped, nothing is overwritten.
 */

require_once __DIR__ . '/../includes/boot.php';

$source = $argv[1] ?? (dirname(__DIR__) . '/data/games.json');
if (!is_readable($source)) {
    fwrite(STDERR, "Source not readable: {$source}\nPass the path to games.json as an argument.\n");
    exit(1);
}

$data = json_decode((string) file_get_contents($source), true);
$games = $data['games'] ?? [];
if (!is_array($games) || count($games) === 0) {
    fwrite(STDERR, "No games found in {$source}\n");
    exit(1);
}

$db = db();
db_ensure_schema();

$added = 0;
$skipped = 0;
foreach ($games as $g) {
    $slug = (string) ($g['slug'] ?? '');
    if ($slug === '' || pf_get_game_by_slug($slug) !== null) {
        $skipped++;
        continue;
    }
    $sqlTime = static function (?string $iso): string {
        if (preg_match('/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/', (string) $iso, $m)) {
            return $m[1] . ' ' . $m[2];
        }
        return gmdate('Y-m-d H:i:s');
    };
    $stmt = $db->prepare(
        'INSERT INTO games (id, slug, title, description, category, tags, controls, specs, cover, embed_url, status, featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        (string) ($g['id'] ?? ('seed-' . $slug)),
        $slug,
        (string) ($g['title'] ?? ''),
        (string) ($g['description'] ?? ''),
        (string) ($g['category'] ?? ''),
        json_encode($g['tags'] ?? [], JSON_UNESCAPED_UNICODE),
        (string) ($g['controls'] ?? ''),
        json_encode($g['specs'] ?? [], JSON_UNESCAPED_UNICODE),
        !empty($g['cover']) ? (string) $g['cover'] : null,
        (string) ($g['embedUrl'] ?? ''),
        ($g['status'] ?? '') === 'draft' ? 'draft' : 'published',
        !empty($g['featured']) ? 1 : 0,
        $sqlTime($g['createdAt'] ?? null),
        $sqlTime($g['updatedAt'] ?? null),
    ]);
    $added++;
}

echo "Seeded {$added} game(s), skipped {$skipped} already present.\n";
echo 'Database: ' . (db_is_sqlite() ? 'SQLite' : 'MySQL') . "\n";
