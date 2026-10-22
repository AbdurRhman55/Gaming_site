<?php
declare(strict_types=1);

/**
 * /games/{slug}/ — the game plays inside this site in a full-width frame.
 * Server-rendered per request: publishing, editing or deleting a game in the
 * dashboard is reflected immediately. PHP port of src/pages/games/[slug].astro.
 *
 * Routed by .htaccess: ^games/([a-z0-9-]+)/?$ → show.php?slug=$1
 */
require_once __DIR__ . '/../includes/boot.php';

$slug = (string) ($_GET['slug'] ?? '');
$game = preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/', $slug) ? pf_get_game_by_slug($slug, true) : null;

if ($game === null) {
    // Missing or unpublished slug: serve the 404 document with a real status.
    http_response_code(404);
    require __DIR__ . '/../404.php';
    exit;
}

$description = strlen($game['description']) > 158
    ? rtrim(substr($game['description'], 0, 155)) . '…'
    : $game['description'];

$published = array_values(array_filter(pf_list_games(true), fn($g) => $g['slug'] !== $game['slug']));
$catLower = mb_strtolower($game['category'], 'UTF-8');
$sameCategory = array_values(array_filter($published, fn($g) => mb_strtolower($g['category'], 'UTF-8') === $catLower));
$otherCategories = array_values(array_filter($published, fn($g) => mb_strtolower($g['category'], 'UTF-8') !== $catLower));
$related = array_slice(array_merge($sameCategory, $otherCategories), 0, 4);

$title = str_contains(mb_strtolower($game['title'], 'UTF-8'), 'parking')
    ? $game['title'] . ': Play Free Online'
    : $game['title'] . ': Play Free Online Parking Game';

$videoGameSchema = [
    '@context' => 'https://schema.org',
    '@type' => 'VideoGame',
    'name' => $game['title'],
    'description' => $game['description'],
    'url' => pf_abs('/games/' . $game['slug'] . '/'),
    'applicationCategory' => 'Game',
    'operatingSystem' => 'Any (plays in a web browser)',
    'gamePlatform' => 'Web browser',
    'genre' => $game['category'],
    'author' => ['@type' => 'Organization', 'name' => PF_SITE_NAME],
];

pf_layout_header([
    'path' => '/games/' . $game['slug'] . '/',
    'title' => $title,
    'description' => $description,
    'trail' => [
        ['name' => 'Games', 'path' => '/games/'],
        ['name' => $game['title'], 'path' => '/games/' . $game['slug'] . '/'],
    ],
    'jsonLd' => [$videoGameSchema],
]);
?>
  <section class="player player--backdrop" data-player aria-label="<?= pf_e($game['title']) ?> game player">
    <div class="player__frame" data-player-frame>
      <iframe
        class="player__iframe"
        src="<?= pf_e($game['embedUrl']) ?>"
        data-slug="<?= pf_e($game['slug']) ?>"
        title="<?= pf_e($game['title']) ?> — playing inside this site"
        allow="fullscreen; autoplay; gamepad; encrypted-media; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
    <div class="player__bar container--wide">
      <a class="btn btn--ghost btn--sm" href="/games/"><span aria-hidden="true">←</span> All games</a>
      <span class="small muted player__hint">The game runs in this frame — it never redirects you elsewhere.</span>
      <button class="btn btn--secondary btn--sm" type="button" data-fullscreen>Fullscreen</button>
    </div>
  </section>

  <article class="section container--wide game-detail">
    <header class="game-detail__head">
      <h1 class="game-detail__title"><?= pf_e($game['title']) ?></h1>
      <div class="game-detail__chips">
        <span class="chip"><?= pf_e($game['category']) ?></span>
        <?php if (!empty($game['featured'])): ?><span class="chip chip--accent">Featured</span><?php endif; ?>
        <?php foreach ($game['tags'] as $tag): ?>
          <span class="chip chip--muted"><?= pf_e((string) $tag) ?></span>
        <?php endforeach; ?>
      </div>
    </header>

    <p class="lead game-detail__desc"><?= pf_e($game['description']) ?></p>

    <div class="game-detail__grid">
      <?php if ($game['controls'] !== ''): ?>
        <section class="panel">
          <h2>Controls</h2>
          <p><?= pf_e($game['controls']) ?></p>
        </section>
      <?php endif; ?>
      <?php if (count($game['specs']) > 0): ?>
        <section class="panel">
          <h2>Game info</h2>
          <dl class="spec-table">
            <?php foreach ($game['specs'] as $spec): ?>
              <dt><?= pf_e((string) ($spec['label'] ?? '')) ?></dt>
              <dd><?= pf_e((string) ($spec['value'] ?? '')) ?></dd>
            <?php endforeach; ?>
          </dl>
        </section>
      <?php endif; ?>
    </div>

    <?php if (count($related) > 0): ?>
      <section class="game-detail__related" aria-labelledby="related-heading">
        <h2 id="related-heading">More <?= pf_e($game['category']) ?> games</h2>
        <div class="game-grid game-grid--compact">
          <?php foreach ($related as $g) {
              pf_game_card($g, null, false);
          } ?>
        </div>
      </section>
    <?php endif; ?>
  </article>
<script>
  (function () {
    var btn = document.querySelector('[data-fullscreen]');
    var frame = document.querySelector('[data-player-frame]');
    if (btn && frame) {
      btn.addEventListener('click', function () {
        if (document.fullscreenElement) {
          var exit = document.exitFullscreen();
          if (exit && exit.catch) exit.catch(function () {});
        } else if (frame.requestFullscreen) {
          var req = frame.requestFullscreen();
          if (req && req.catch) req.catch(function () {});
        }
      });
    }

    // First-party play beacon: the game frame finished loading its document —
    // the most honest "the game opened" signal that works identically for
    // internal (/embed/…) and external embeds. Counted once per page load.
    var gameFrame = document.querySelector('iframe.player__iframe[data-slug]');
    if (gameFrame) {
      var slug = gameFrame.getAttribute('data-slug') || '';
      var counted = false;
      var countPlay = function () {
        if (counted) return;
        counted = true;
        fetch('/api/track/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'play', slug: slug }),
          keepalive: true,
          credentials: 'omit'
        }).catch(function () {});
      };
      gameFrame.addEventListener('load', countPlay);
      // Fast same-origin embeds can finish before this deferred script attaches
      // its listener — detect that case for internal frames.
      try {
        var doc = gameFrame.contentDocument; // null for cross-origin frames
        if (doc && doc.readyState === 'complete') countPlay();
      } catch (e) {
        /* cross-origin — the load listener above covers it */
      }
    }
  })();
</script>
<?php
pf_layout_footer();
