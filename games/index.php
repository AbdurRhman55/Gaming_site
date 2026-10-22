<?php
declare(strict_types=1);

/**
 * /games/ — library, server-rendered per request: a game published in the
 * admin dashboard appears here instantly (no rebuild). Search and category
 * filters work without JavaScript via GET parameters (original behaviour).
 */
require_once __DIR__ . '/../includes/boot.php';

$rawQ = trim((string) ($_GET['q'] ?? ''));
$rawCat = trim((string) ($_GET['category'] ?? ''));
$q = mb_strtolower($rawQ, 'UTF-8');
$cat = mb_strtolower($rawCat, 'UTF-8');

$all = pf_list_games(true);

// Chips dedupe case-insensitively — first spelling wins for display.
$categories = pf_categories($all);
usort($categories, fn($a, $b) => strcasecmp($a, $b));

$games = $all;
if ($cat !== '') {
    $games = array_values(array_filter($games, fn($g) => mb_strtolower($g['category'], 'UTF-8') === $cat));
}
if ($q !== '') {
    $games = array_values(array_filter($games, function ($g) use ($q) {
        if (str_contains(mb_strtolower($g['title'], 'UTF-8'), $q)) {
            return true;
        }
        if (str_contains(mb_strtolower($g['description'], 'UTF-8'), $q)) {
            return true;
        }
        foreach ($g['tags'] as $t) {
            if (str_contains(mb_strtolower((string) $t, 'UTF-8'), $q)) {
                return true;
            }
        }
        return false;
    }));
}

$collectionSchema = [
    '@context' => 'https://schema.org',
    '@type' => 'CollectionPage',
    'name' => 'Free parking & driving games',
    'description' => 'A playable library of free parking and driving browser games that run on this site.',
    'numberOfItems' => count($all),
];

pf_layout_header([
    'path' => '/games/',
    'jsonLd' => [$collectionSchema],
]);
?>
  <section class="library-hero">
    <div class="container--wide">
      <h1 class="page-head__title">Play Free Parking &amp; Driving Games Online</h1>
      <p class="lead library-hero__lead">
        Every game here plays <strong>right inside this site</strong> — no downloads, no redirects to
        other websites. Pick a game and it loads in the player below its page.
      </p>
    </div>
  </section>

  <section class="container--wide filters-wrap" aria-label="Find a game">
    <form class="filters" method="get" action="/games/" role="search">
      <label class="sr-only" for="game-search">Search games</label>
      <input class="input" type="search" id="game-search" name="q" value="<?= pf_e($rawQ) ?>" placeholder="Search games…" autocomplete="off" />
      <button class="btn btn--primary" type="submit">Search</button>
      <?php if ($rawQ !== '' || $rawCat !== ''): ?><a class="btn btn--ghost" href="/games/">Clear</a><?php endif; ?>
    </form>

    <?php if (count($categories) > 0): ?>
      <nav class="cat-chips" aria-label="Game categories">
        <a class="chip chip--link<?= $cat === '' ? ' chip--active' : '' ?>" href="/games/">All</a>
        <?php foreach ($categories as $c): ?>
          <a class="chip chip--link<?= $cat === mb_strtolower($c, 'UTF-8') ? ' chip--active' : '' ?>"
             href="/games/?category=<?= rawurlencode($c) ?>"
             <?= $cat === mb_strtolower($c, 'UTF-8') ? 'aria-current="true"' : '' ?>><?= pf_e($c) ?></a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>
  </section>

  <section class="section container--wide" aria-label="Game library">
    <?php if (count($games) > 0): ?>
      <div class="game-grid">
        <?php foreach ($games as $game) {
            pf_game_card($game);
        } ?>
      </div>
    <?php else: ?>
      <div class="empty-state">
        <h2>No games matched<?= $rawQ !== '' ? ' “' . pf_e($rawQ) . '”' : ' those filters' ?></h2>
        <p>
          <?php if (count($all) === 0): ?>
            The library is empty right now — check back soon.
          <?php else: ?>
            Try a different search term or browse all categories.
          <?php endif; ?>
        </p>
        <a class="btn btn--secondary" href="/games/">Show all games</a>
      </div>
    <?php endif; ?>
  </section>
<?php
pf_layout_footer();
