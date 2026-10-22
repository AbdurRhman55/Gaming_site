<?php
declare(strict_types=1);

/**
 * Homepage — server-rendered on every request, so a game published in the
 * admin dashboard appears here instantly (no rebuild).
 * PHP port of src/pages/index.astro.
 */
require_once __DIR__ . '/includes/boot.php';

/** Live library (published only), featured-first then most recent. */
$games = pf_list_games(true);
$lead = null;
foreach ($games as $g) {
    if (!empty($g['featured'])) {
        $lead = $g;
        break;
    }
}
if ($lead === null && count($games) > 0) {
    $lead = $games[0];
}
$homeGames = array_slice($games, 0, 8);

$seriesVersions = array_values(array_filter(pf_versions(), fn($v) => $v['path'] !== '/' && $v['path'] !== null));
$featuredRelated = array_slice(pf_related_games(), 0, 4);

/** FAQ copy — answers may link to internal guide pages (trusted, static). */
$faqs = [
    [
        'q' => 'Is Parking Fury free to play?',
        'a' => 'Yes! Parking Fury, Parking Fury 2, Parking Fury 3, and Parking Fury 3D are completely free to play directly in your web browser right here on this site. No download, registration, or third-party redirection is required.',
    ],
    [
        'q' => 'How many levels does Parking Fury have?',
        'a' => 'Ten. Coolmath Games — the game’s official host — confirms the original has 10 levels, with the difficulty climbing noticeably around levels 8 and 9. Their FAQ also notes that a first playthrough usually takes about 20 to 30 minutes. The full breakdown lives in our <a href="/walkthrough/">Parking Fury walkthrough</a>.',
    ],
    [
        'q' => 'What is the difference between Parking Fury and Parking Fury 3D?',
        'a' => 'They are different games by different developers. Parking Fury 1–3 are top-down games by Andriy Pidvirnyy hosted on Coolmath Games; Parking Fury 3D is a 3D driving game by Brain Software hosted on Poki, where you also steal and deliver cars. Compare them on the <a href="/parking-fury-3d/">Parking Fury 3D page</a>.',
    ],
    [
        'q' => 'Can I play Parking Fury on my phone?',
        'a' => 'The Coolmath Games pages for Parking Fury 1–3 list both browser and mobile platforms, and publish touch instructions: rotate the on-screen wheel to steer and tap the gas and brake pedals to move. Parking Fury 3D is different — Poki lists it as desktop-only. Details and caveats are on our <a href="/how-to-play/">controls page</a>. Our own games, like <a href="/games/tight-lot/">Tight Lot</a>, use on-screen buttons on touch devices.',
    ],
    [
        'q' => 'Is there a working “Parking Fury unblocked” version?',
        'a' => 'School and office networks often block game sites outright, and the so-called “unblocked” mirrors that show up in search are usually unlicensed copies with pop-ups and risky download buttons. We do not link to them. Two safer options: ask whether gaming sites are allowed on your network, or play our original game <a href="/games/tight-lot/">Tight Lot</a>, which runs entirely in your browser with no third-party scripts. We cover the trade-offs in <a href="/tips/">tips and troubleshooting</a>.',
    ],
    [
        'q' => 'Is this site the official Parking Fury site?',
        'a' => 'This is an independent player portal created for the Parking Fury community. All entries in the series play directly on this site with responsive keyboard and touch controls inside our clean game frame — no redirects and no third-party spam. Learn more on our <a href="/about/">about page</a>.',
    ],
    [
        'q' => 'The game will not load. What should I try first?',
        'a' => 'Refresh the page, then check whether your network or browser ad blocker is restricting game frames. If one game times out, you can instantly try another from our library or play our original high-performance browser games. Read our full <a href="/tips/">tips and troubleshooting guide</a>.',
    ],
];

/** FAQPage schema — truthful text, tags stripped for the answer strings. */
$faqSchema = [
    '@context' => 'https://schema.org',
    '@type' => 'FAQPage',
    'mainEntity' => array_map(fn($f) => [
        '@type' => 'Question',
        'name' => $f['q'],
        'acceptedAnswer' => [
            '@type' => 'Answer',
            'text' => trim(preg_replace('/\s+/', ' ', strip_tags($f['a'])) ?? ''),
        ],
    ], $faqs),
];

pf_layout_header([
    'path' => '/',
    'trail' => [],          // homepage has no breadcrumb trail (original: breadcrumbs={false})
    'jsonLd' => [$faqSchema],
]);

pf_video_hero(
    $lead !== null ? '/games/' . $lead['slug'] . '/' : '/games/',
    $lead['title'] ?? 'a game'
);
?>

  <!-- ============ PLAY NOW — LIVE GAMES GRID ============ -->
  <section class="section section--games" aria-labelledby="games-heading">
    <div class="section-head">
      <span class="eyebrow">Play now</span>
      <h2 id="games-heading">Free games that play right on this site</h2>
      <p>
        Every game below opens in a player on this website — no downloads, no redirects to other
        websites. New games are published from the dashboard and go live the moment they are saved.
      </p>
    </div>
    <?php if (count($homeGames) > 0): ?>
      <div class="game-grid">
        <?php foreach ($homeGames as $game) {
            pf_game_card($game);
        } ?>
      </div>
    <?php else: ?>
      <div class="empty-state">
        <h3>The library is being stocked</h3>
        <p>New games land here as soon as they are published — the guides below cover every version of Parking Fury meanwhile.</p>
      </div>
    <?php endif; ?>
    <div class="section-foot">
      <p class="muted"><a href="/games/">Browse the full games library</a></p>
    </div>
  </section>

  <!-- ============ CONTROLS SNAPSHOT ============ -->
  <section class="section container--wide">
    <div class="section-head">
      <span class="eyebrow">How the series plays</span>
      <h2>Drive into the highlighted bay — that is the whole game</h2>
      <p>
        Official instructions for Parking Fury are refreshingly short: use
        <kbd class="kbd">W</kbd><kbd class="kbd">A</kbd><kbd class="kbd">S</kbd><kbd class="kbd">D</kbd>
        or the arrow keys to drive, follow the arrows to the marked parking space, and do not hit
        walls or parked cars. Every level gives you a new layout; the car handling stays the same.
      </p>
    </div>

    <div class="grid grid--wide">
      <div class="card">
        <div class="card__body">
          <h3 class="card__title">On a keyboard</h3>
          <p class="card__desc">
            <kbd class="kbd">W</kbd> or <kbd class="kbd">↑</kbd> accelerates,
            <kbd class="kbd">S</kbd> or <kbd class="kbd">↓</kbd> reverses,
            <kbd class="kbd">A</kbd>/<kbd class="kbd">D</kbd> or
            <kbd class="kbd">←</kbd>/<kbd class="kbd">→</kbd> steer. Tapping the steer keys
            gives you finer control than holding them through a whole turn.
          </p>
          <p class="small muted">Verified against Coolmath Games’ instructions, October 2026.</p>
          <a class="btn btn--secondary btn--sm" href="/how-to-play/">Full controls guide</a>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <h3 class="card__title">On touch devices</h3>
          <p class="card__desc">
            Coolmath publishes mobile instructions for the series: rotate the on-screen wheel to
            steer, tap the gas pedal to go forward and the brake pedal to reverse, then follow the
            arrows into the yellow rectangle.
          </p>
          <p class="small muted">The 3D series on Poki is listed as desktop-only.</p>
          <a class="btn btn--secondary btn--sm" href="/parking-fury-3d/">Parking Fury 3D details</a>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <h3 class="card__title">One rule breaks a run</h3>
          <p class="card__desc">
            Clipping a wall or another car forces a retry, so a slow, clean approach beats a fast,
            scrappy one every time. Keep your speed low before the bay, not after you are in it.
          </p>
          <a class="btn btn--secondary btn--sm" href="/tips/">Tips and common mistakes</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ TIPS ============ -->
  <section class="section container--wide">
    <div class="split split--2">
      <div>
        <span class="eyebrow">Quick tips</span>
        <h2>Four habits that fix most crashed runs</h2>
        <p class="muted">
          These work on every game in the series because they are about spacing and patience,
          not level tricks.
        </p>
        <a class="btn btn--secondary btn--sm" href="/tips/">Read all tips</a>
      </div>
      <ol class="steps">
        <li><strong>Brake before the turn, not during it.</strong> Finish your speed adjustment while you still have a straight line, then coast into the bay at walking pace.</li>
        <li><strong>Use the whole lane.</strong> Swing away from the bay before cutting in — a wider entry angle shrinks the final correction you need.</li>
        <li><strong>Tap the steering.</strong> On a keyboard, short presses arc the car smoothly; holding steer from speed usually overshoots a tight slot.</li>
        <li><strong>Restart cleanly.</strong> Once you have clipped something, reset the attempt instead of wrestling the car straight — clean runs are faster in the end.</li>
      </ol>
    </div>
  </section>

  <!-- ============ VERSIONS ============ -->
  <section class="section container--wide">
    <div class="section-head">
      <span class="eyebrow">The Official Series</span>
      <h2>Parking Fury 1, 2, 3 &amp; 3D — Play Instantly</h2>
      <p>
        Every entry in the Parking Fury series plays directly on this site inside our high-performance game frame.
        Experience original top-down precision in Parking Fury 1–3, or explore open city missions in Parking Fury 3D.
      </p>
    </div>
    <div class="grid">
      <?php foreach ($seriesVersions as $v) {
          pf_version_card($v);
      } ?>
    </div>
    <div class="section-foot">
      <p class="muted">
        Looking for more games? <a class="btn btn--secondary btn--sm" href="/games/">Browse the Full Games Library →</a>
      </p>
    </div>
  </section>

  <!-- ============ GAMING GALLERY ============ -->
  <?php pf_gallery_section(); ?>

  <!-- ============ GUIDES ============ -->
  <section class="section container--wide">
    <div class="section-head">
      <span class="eyebrow">Guides</span>
      <h2>Go deeper before your next run</h2>
    </div>
    <ul class="link-list">
      <li>
        <a class="link-card" href="/walkthrough/">
          <span class="link-card__icon" aria-hidden="true">▤</span>
          <span>
            <strong>Parking Fury walkthrough: the 10-level structure</strong>
            <span>How difficulty ramps, what to expect from the late levels, and a method that works on every map.</span>
          </span>
        </a>
      </li>
      <li>
        <a class="link-card" href="/how-to-play/">
          <span class="link-card__icon" aria-hidden="true">⌘</span>
          <span>
            <strong>Controls for every version, in one table</strong>
            <span>Keyboard, touch wheel and pedals, and what changes in the 3D games.</span>
          </span>
        </a>
      </li>
      <li>
        <a class="link-card" href="/tips/">
          <span class="link-card__icon" aria-hidden="true">⚑</span>
          <span>
            <strong>Troubleshooting: when the game will not load</strong>
            <span>Network blocks, storage limits, browser extensions — the real fixes, in order.</span>
          </span>
        </a>
      </li>
    </ul>
  </section>

  <!-- ============ RELATED GAMES ============ -->
  <section class="section container--wide">
    <div class="section-head">
      <span class="eyebrow">If you finish the series</span>
      <h2>Related parking and driving games</h2>
      <p>
        Explore other top parking, precision driving, and 3D missions that run right here inside our portal — no downloads and no external redirects.
      </p>
    </div>
    <div class="game-grid">
      <?php foreach ($featuredRelated as $g) {
          pf_related_game_card($g);
      } ?>
    </div>
    <div class="section-foot">
      <p class="muted">
        <a class="btn btn--secondary btn--sm" href="/similar-games/">See all games like Parking Fury</a>
      </p>
    </div>
  </section>

  <!-- ============ FAQ ============ -->
  <section class="section container--wide">
    <div class="section-head">
      <span class="eyebrow">FAQ</span>
      <h2>Questions players actually ask</h2>
    </div>
    <?php pf_faq_list($faqs); ?>
  </section>

  <!-- ============ TRUST ============ -->
  <section class="section--tight container--wide center">
    <div class="note note--plain" style="text-align:left;max-width:48rem;margin-inline:auto">
      <span aria-hidden="true">✓</span>
      <span>
        <strong>Independent by design.</strong> No pirated game files are re-hosted here, no download
        buttons, no fake ratings. Original games run on this site; anything else plays from its
        provider inside a frame. <a href="/about/">How this site works</a> ·
        <a href="/privacy/">Privacy</a> · <a href="/contact/">Contact</a>
      </span>
    </div>
  </section>
<?php
pf_layout_footer();
