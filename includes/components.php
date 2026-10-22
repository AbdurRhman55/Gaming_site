<?php
declare(strict_types=1);

/**
 * Shared presentational components — PHP ports of the Astro components
 * (GameCard, VersionCard, RelatedGameCard, GamingGallery, FaqList, VideoHero).
 * Markup is kept structurally identical to the original for design parity.
 */

require_once __DIR__ . '/series.php';

/**
 * GameCard — library tile linking to the in-site player page.
 * No fake ratings or play counts: only operator-entered facts.
 *
 * $game: store game array. $href overrides the default player URL.
 * $wrapLink=false renders the card without an <a> wrapper (VersionCard style
 * puts the link on the title instead).
 */
function pf_game_card(array $game, ?string $href = null, bool $featuredBadge = true): void
{
    $href = $href ?? '/games/' . $game['slug'] . '/';
    $cover = pf_cover_url($game['cover'] ?? null);
    $title = (string) ($game['title'] ?? '');
    $desc = (string) ($game['description'] ?? '');
    $cat = (string) ($game['category'] ?? '');
    $featured = !empty($game['featured']) && $featuredBadge;
    $openLink = '<a class="game-card__link" href="' . pf_e($href) . '">';
    ?>
<article class="game-card">
  <?= $openLink ?>
    <div class="game-card__media">
      <?php if ($cover !== null && $cover !== ''): ?>
        <img src="<?= pf_e($cover) ?>" alt="" width="640" height="360" loading="lazy" decoding="async" />
      <?php else: ?>
        <div class="game-card__placeholder" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M4 15.5h16M6.2 15.5l1.4-4.6A2.5 2.5 0 0 1 10 9.2h4a2.5 2.5 0 0 1 2.4 1.7l1.4 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="8" cy="17.4" r="1.6" fill="currentColor" />
            <circle cx="16" cy="17.4" r="1.6" fill="currentColor" />
          </svg>
        </div>
      <?php endif; ?>
      <span class="game-card__play" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </span>
      <?php if ($featured): ?><span class="game-card__badge">Featured</span><?php endif; ?>
    </div>
    <div class="game-card__body">
      <h3 class="game-card__title"><?= pf_e($title) ?></h3>
      <p class="game-card__desc"><?= pf_e($desc) ?></p>
      <div class="game-card__meta">
        <span class="chip chip--sm"><?= pf_e($cat) ?></span>
        <span class="game-card__cta">Play now <span aria-hidden="true">→</span></span>
      </div>
    </div>
  </a>
</article>
    <?php
}

/**
 * VersionCard — an official series entry (homepage "The Official Series").
 */
function pf_version_card(array $v): void
{
    $playPath = pf_play_route((string) $v['slug']);
    $cover = (string) ($v['cover'] ?? '');
    $hasSeries = !empty($v['path']);
    $seriesAlt = 'Original illustration for ' . $v['name']
        . ': a stylised ' . ($v['slug'] === 'parking-fury-3d' ? '3D city street' : 'parking lot')
        . ' scene with a car approaching a highlighted bay.';
    ?>
<article class="game-card">
  <div class="game-card__media">
    <?php if ($cover !== ''): ?>
      <img src="<?= pf_e($cover) ?>" alt="<?= pf_e($v['name']) ?> cover" width="640" height="360" loading="lazy" decoding="async" />
    <?php else: ?>
      <div class="game-card__art" role="img" aria-label="<?= pf_e($seriesAlt) ?>"></div>
    <?php endif; ?>
    <span class="game-card__play" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
    </span>
    <span class="game-card__badge game-card__badge--accent">Official Series</span>
  </div>
  <div class="game-card__body">
    <h3 class="game-card__title"><a href="<?= pf_e($playPath) ?>"><?= pf_e($v['name']) ?></a></h3>
    <p class="game-card__desc"><?= pf_e($v['tagline']) ?></p>
    <div class="card__meta">
      <span class="badge badge--live"><span class="badge__dot" aria-hidden="true"></span>Play in site</span>
      <span class="badge"><?= pf_e($v['release']) ?></span>
      <span class="badge"><?= pf_e($v['controls']) ?></span>
    </div>
    <div class="btn-row" style="margin-top:0.75rem">
      <a class="btn btn--primary btn--sm" href="<?= pf_e($playPath) ?>">Play Now</a>
      <?php if ($hasSeries): ?><a class="btn btn--secondary btn--sm" href="<?= pf_e($v['path']) ?>">Series Guide</a><?php endif; ?>
    </div>
  </div>
</article>
    <?php
}

/**
 * RelatedGameCard — curated related game tile.
 */
function pf_related_game_card(array $g): void
{
    $cover = (string) ($g['cover'] ?? '');
    $alt = (string) ($g['name'] ?? '');
    ?>
<article class="game-card">
  <a class="game-card__link" href="<?= pf_e($g['url']) ?>">
    <div class="game-card__media">
      <?php if ($cover !== ''): ?>
        <img src="<?= pf_e($cover) ?>" alt="<?= pf_e($alt) ?>" width="640" height="360" loading="lazy" decoding="async" />
      <?php else: ?>
        <div class="game-card__art" role="img" aria-label="<?= pf_e('Illustration for ' . $alt) ?>"></div>
      <?php endif; ?>
      <span class="game-card__play" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </span>
      <span class="game-card__badge game-card__badge--accent">Free Play</span>
    </div>
    <div class="game-card__body">
      <h3 class="game-card__title"><?= pf_e($alt) ?></h3>
      <p class="game-card__desc"><?= pf_e($g['description'] ?? '') ?></p>
      <div class="game-card__feature">
        <span class="game-card__dot" aria-hidden="true"></span>
        <span class="small"><?= pf_e($g['diff'] ?? '') ?></span>
      </div>
      <div class="game-card__meta">
        <span class="chip chip--sm"><?= pf_e($g['devices'] ?? 'Browser') ?></span>
        <span class="game-card__cta">Play in site <span aria-hidden="true">→</span></span>
      </div>
    </div>
  </a>
</article>
    <?php
}

/**
 * GamingGallery — showcase grid of up to 8 unique cover images.
 */
function pf_gallery_section(): void
{
    $items = [];
    foreach (pf_versions() as $v) {
        if (!empty($v['cover'])) {
            $items[] = [
                'name' => $v['name'],
                'cover' => $v['cover'],
                'url' => pf_play_route((string) $v['slug']),
            ];
        }
    }
    foreach (pf_related_games() as $g) {
        if (!empty($g['cover'])) {
            $items[] = ['name' => $g['name'], 'cover' => $g['cover'], 'url' => $g['url']];
        }
    }
    // Deduplicate by cover URL, keep the first 8.
    $seen = [];
    $gallery = [];
    foreach ($items as $it) {
        if (isset($seen[$it['cover']])) {
            continue;
        }
        $seen[$it['cover']] = true;
        $gallery[] = $it;
        if (count($gallery) === 8) {
            break;
        }
    }
    ?>
<section class="section gallery-section" aria-labelledby="gallery-heading">
  <div class="section-head">
    <span class="eyebrow">Gallery</span>
    <h2 id="gallery-heading">Gaming Screenshots &amp; Artwork</h2>
    <p>
      Explore cover art and screenshots from every game in the library.
      Each image links straight to the in-site player — click any card to start playing instantly.
    </p>
  </div>
  <div class="gallery-grid">
    <?php foreach ($gallery as $g): ?>
      <a class="gallery-card" href="<?= pf_e($g['url']) ?>">
        <img src="<?= pf_e($g['cover']) ?>" alt="<?= pf_e($g['name']) ?>" width="640" height="360" loading="lazy" decoding="async" />
        <span class="gallery-card__play" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
        </span>
        <span class="gallery-card__overlay">
          <span class="gallery-card__name"><?= pf_e($g['name']) ?></span>
          <span class="gallery-card__cta">Play now <span aria-hidden="true">→</span></span>
        </span>
      </a>
    <?php endforeach; ?>
  </div>
</section>
    <?php
}

/**
 * FaqList — FAQ built on native <details>/<summary>: keyboard accessible and
 * indexable without JavaScript. Answers may contain trusted HTML (links).
 */
function pf_faq_list(array $items): void
{
    ?>
<div class="faq">
  <?php foreach ($items as $item): ?>
    <details>
      <summary><?= pf_e($item['q']) ?></summary>
      <div class="faq__answer"><?= $item['a'] /* trusted HTML from this file only */ ?></div>
    </details>
  <?php endforeach; ?>
</div>
    <?php
}

/**
 * VideoHero — full-bleed homepage hero: background gameplay video with brand
 * logo plate, headline and calls to action. Under prefers-reduced-motion the
 * video is hidden in CSS and paused here, leaving the poster/gradient.
 */
function pf_video_hero(string $featuredHref, string $featuredTitle): void
{
    ?>
<section class="hero">
  <div class="hero__bg" aria-hidden="true">
    <video class="hero__video" data-hero-video autoplay muted loop playsinline preload="metadata" poster="/images/hero-poster.jpg" tabindex="-1">
      <source src="/bg_video.mp4" type="video/mp4" />
    </video>
    <div class="hero__scrim"></div>
  </div>

  <div class="hero__inner container--wide">
    <h1 class="hero__brand">
      <img class="hero__logo" src="/images/logo-hero.jpg" alt="Parking Fury" width="880" height="495" fetchpriority="high" />
      <span class="hero__sub">Free parking &amp; driving games that play right in your browser</span>
    </h1>

    <p class="hero__lede">
      Park it here: play original games inside this site, use the verified Parking Fury controls and
      walkthroughs, and jump into the whole series — no downloads, no redirects to other websites.
    </p>

    <div class="hero__ctas">
      <a class="btn btn--primary btn--lg" href="<?= pf_e($featuredHref) ?>">Play <?= pf_e($featuredTitle) ?></a>
      <a class="btn btn--secondary btn--lg" href="/games/">Browse all games</a>
      <a class="btn btn--ghost btn--lg" href="/how-to-play/">Controls guide</a>
    </div>

    <ul class="hero__chips">
      <li>Plays in your browser</li>
      <li>Original mini-games on site</li>
      <li>Keyboard &amp; touch</li>
      <li>No sign-up, no ads</li>
    </ul>
  </div>
</section>
<script>
(function () {
  var video = document.querySelector('[data-hero-video]');
  if (!video) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var applyPreference = function () {
    if (reduce.matches) {
      video.pause();
      video.removeAttribute('autoplay');
    } else {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  };
  applyPreference();
  reduce.addEventListener('change', applyPreference);
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isIntersecting && !reduce.matches) {
        var p2 = video.play();
        if (p2 && p2.catch) p2.catch(function () {});
      } else {
        video.pause();
      }
    }
  }, { threshold: 0.15 });
  io.observe(video);
})();
</script>
    <?php
}
