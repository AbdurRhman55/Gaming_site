<?php
declare(strict_types=1);

/**
 * /admin/ — operator console (dashboard).
 * Port of src/pages/admin.astro: renders the sign-in card when unauthenticated,
 * otherwise the shell with analytics tiles + the library table + the add/edit
 * form. The table is server-rendered for a usable no-JS baseline; admin.js
 * then takes over so search, filters, publish toggles, edits and deletes
 * apply instantly without a reload. Always noindex.
 */

require_once __DIR__ . '/../includes/boot.php';
require_once __DIR__ . '/../includes/admin-ui.php';

if (!pf_is_authed()) {
    pf_admin_login();
    exit;
}

$games = pf_list_games(false);
$counts = [
    'total'     => count($games),
    'published' => count(array_filter($games, fn($g) => $g['status'] === 'published')),
    'drafts'    => count(array_filter($games, fn($g) => $g['status'] === 'draft')),
    'featured'  => count(array_filter($games, fn($g) => $g['featured'])),
];

// First-party analytics for the overview tiles — real recorded counts only.
$allTime = pf_analytics_summary('year');
$weekAgo = gmdate('Y-m-d', time() - 6 * 86400);
$week = pf_analytics_summary('day', $weekAgo);
$topPage = $allTime['topPages'][0] ?? null;
$topGame = $allTime['topGames'][0] ?? null;
$publishedGames = array_filter($games, fn($g) => $g['status'] === 'published');

$categories = ['parking', 'driving', 'racing', 'arcade', 'puzzle'];
$nf = fn(int $n): string => number_format($n);

pf_admin_shell_header('Dashboard', 'Library & publishing', 'overview');
?>
    <div class="admin-stats" data-admin-stats>
      <div class="admin-stat">
        <span class="admin-stat__label">Views · all time</span>
        <strong data-stat="views-total"><?= $nf($allTime['totals']['views']) ?></strong>
        <span class="admin-stat__sub small muted"><?= $nf($week['totals']['views']) ?> in last 7 days</span>
      </div>
      <div class="admin-stat">
        <span class="admin-stat__label">Game plays · all time</span>
        <strong data-stat="plays-total"><?= $nf($allTime['totals']['plays']) ?></strong>
        <span class="admin-stat__sub small muted"><?= $nf($week['totals']['plays']) ?> in last 7 days</span>
      </div>
      <div class="admin-stat">
        <span class="admin-stat__label">Top page</span>
        <strong class="admin-stat__text" data-stat="top-page"><?= pf_e($topPage['path'] ?? '—') ?></strong>
        <span class="admin-stat__sub small muted"><?= $topPage ? pf_e($nf((int) $topPage['views']) . ' views') : 'no traffic yet' ?></span>
      </div>
      <div class="admin-stat">
        <span class="admin-stat__label">Most played</span>
        <strong class="admin-stat__text" data-stat="top-game">
          <?php
          if ($topGame) {
              $match = null;
              foreach ($publishedGames as $pg) {
                  if ($pg['slug'] === $topGame['slug']) {
                      $match = $pg['title'];
                      break;
                  }
              }
              echo pf_e($match ?? $topGame['slug']);
          } else {
              echo '—';
          }
          ?>
        </strong>
        <span class="admin-stat__sub small muted"><?= $topGame ? pf_e($nf((int) $topGame['plays']) . ' plays') : 'no plays yet' ?></span>
      </div>
    </div>

    <div class="admin-stats" data-admin-stats>
      <div class="admin-stat">
        <span class="admin-stat__label">Total games</span>
        <strong data-stat="total"><?= $counts['total'] ?></strong>
      </div>
      <div class="admin-stat admin-stat--live">
        <span class="admin-stat__label">Live now</span>
        <strong data-stat="published"><?= $counts['published'] ?></strong>
      </div>
      <div class="admin-stat">
        <span class="admin-stat__label">Drafts</span>
        <strong data-stat="drafts"><?= $counts['drafts'] ?></strong>
      </div>
      <div class="admin-stat">
        <span class="admin-stat__label">Featured</span>
        <strong data-stat="featured"><?= $counts['featured'] ?></strong>
      </div>
    </div>

    <div class="admin-grid">
      <div class="admin-games panel">
        <div class="admin-toolbar">
          <h2 class="admin-toolbar__title">Library</h2>
          <div class="admin-toolbar__tools">
            <label class="sr-only" for="admin-search">Search games</label>
            <input
              class="input"
              id="admin-search"
              type="search"
              placeholder="Search title, slug, category…"
              data-admin-search
              autocomplete="off"
            />
            <div class="admin-filters" role="group" aria-label="Filter by status">
              <button class="chip chip--link chip--active" type="button" data-admin-filter="all" aria-pressed="true">All</button>
              <button class="chip chip--link" type="button" data-admin-filter="published" aria-pressed="false">Live</button>
              <button class="chip chip--link" type="button" data-admin-filter="draft" aria-pressed="false">Drafts</button>
            </div>
            <button class="btn btn--primary btn--sm" type="button" data-new-game>
              <span aria-hidden="true">＋</span> New game
            </button>
          </div>
        </div>
        <p class="admin-count small muted" data-admin-count>
          <?= $counts['total'] ?> game<?= $counts['total'] === 1 ? '' : 's' ?>
        </p>

        <?php if (count($games) === 0): ?>
          <div class="empty-state" data-admin-empty>
            <h3>No games yet</h3>
            <p>Publish your first game with the form — it goes live on /games/ the moment it is saved.</p>
            <button class="btn btn--primary" type="button" data-new-game>Add your first game</button>
          </div>
        <?php else: ?>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th scope="col">Cover</th>
                  <th scope="col">Game</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Featured</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($games as $g): ?>
                  <tr data-row="<?= pf_e($g['id']) ?>" data-status="<?= pf_e($g['status']) ?>"
                      data-search="<?= pf_e(mb_strtolower($g['title'] . ' ' . $g['slug'] . ' ' . $g['category'] . ' ' . implode(' ', $g['tags']), 'UTF-8')) ?>">
                    <td class="admin-table__cover">
                      <?php if ($g['cover']): ?>
                        <img src="<?= pf_e($g['cover']) ?>" alt="" width="84" height="47" loading="lazy" />
                      <?php else: ?>
                        <span class="admin-table__noimg" aria-hidden="true">no cover</span>
                      <?php endif; ?>
                    </td>
                    <td class="admin-table__game">
                      <strong><?= pf_e($g['title']) ?></strong>
                      <br />
                      <a class="small muted" href="/games/<?= pf_e($g['slug']) ?>/" target="_blank" rel="noopener noreferrer">
                        /games/<?= pf_e($g['slug']) ?>/
                      </a>
                    </td>
                    <td><span class="chip chip--sm"><?= pf_e($g['category']) ?></span></td>
                    <td>
                      <span class="badge <?= $g['status'] === 'published' ? 'badge--live' : 'badge--draft' ?>">
                        <span class="badge__dot" aria-hidden="true"></span><?= pf_e($g['status']) ?>
                      </span>
                    </td>
                    <td><?php if ($g['featured']): ?><span class="admin-star" aria-label="Featured">★</span><?php else: ?><span class="muted">—</span><?php endif; ?></td>
                    <td class="small muted"><?= pf_e(substr($g['updatedAt'], 0, 10)) ?></td>
                    <td class="admin-actions">
                      <button class="btn btn--ghost btn--xs" type="button" data-edit="<?= pf_e($g['id']) ?>">Edit</button>
                      <button class="btn btn--secondary btn--xs" type="button" data-toggle="<?= pf_e($g['id']) ?>">
                        <?= $g['status'] === 'published' ? 'Unpublish' : 'Publish' ?>
                      </button>
                      <button class="btn btn--ghost btn--xs admin-actions__danger" type="button" data-delete="<?= pf_e($g['id']) ?>">Delete</button>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <p class="empty-state admin-no-match" data-admin-no-match hidden>
            No games match your search or filter.
          </p>
        <?php endif; ?>
      </div>

      <form class="admin-form panel" data-game-form>
        <h2 data-form-title>Add a game</h2>
        <p class="small muted">Slug is generated from the title. Saving publishes instantly — no rebuild.</p>
        <input type="hidden" name="id" value="" />

        <div class="form-section">
          <h3 class="form-section__title">Details</h3>
          <label class="field">
            <span>Title</span>
            <input class="input" type="text" name="title" maxlength="80" required />
          </label>

          <label class="field">
            <span>Description</span>
            <textarea class="input" name="description" rows="3" maxlength="600" required></textarea>
          </label>

          <div class="field-row">
            <label class="field">
              <span>Category</span>
              <input class="input" type="text" name="category" list="category-list" maxlength="40" placeholder="parking" />
              <datalist id="category-list">
                <?php foreach ($categories as $c): ?><option value="<?= pf_e($c) ?>"></option>
                <?php endforeach; ?>
              </datalist>
            </label>
            <label class="field">
              <span>Tags <span class="muted small">(comma separated)</span></span>
              <input class="input" type="text" name="tags" maxlength="300" placeholder="top-down, keyboard" />
            </label>
          </div>

          <label class="field">
            <span>Controls <span class="muted small">(how players drive it)</span></span>
            <input class="input" type="text" name="controls" maxlength="400" placeholder="Arrow keys or WASD to drive" />
          </label>

          <label class="field">
            <span>Specs <span class="muted small">(one per line: Label | Value)</span></span>
            <textarea class="input" name="specs" rows="3" placeholder="Devices | Desktop + mobile&#10;Engine | HTML5"></textarea>
          </label>
        </div>

        <div class="form-section">
          <h3 class="form-section__title">Cover image</h3>
          <label class="file-drop" data-drop-zone>
            <input
              class="file-drop__input"
              type="file"
              name="coverFile"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            />
            <span class="file-drop__text">
              <strong>Choose a cover</strong> or drop an image here
              <span class="muted small">JPG / PNG / WebP / GIF / AVIF · max 8 MB</span>
            </span>
          </label>
          <input type="hidden" name="coverUrl" value="" />
          <div class="admin-form__preview" data-cover-preview-wrap hidden>
            <img class="admin-form__cover" data-cover-preview alt="Cover preview" />
            <button class="btn btn--ghost btn--xs" type="button" data-cover-clear>Remove cover</button>
          </div>
          <p class="form-error" data-upload-error hidden></p>
        </div>

        <div class="form-section">
          <h3 class="form-section__title">Game embed</h3>
          <label class="field">
            <span>URL or iframe code</span>
            <textarea
              class="input"
              name="embedUrl"
              rows="3"
              placeholder="https://example.com/game.html   — or paste an &lt;iframe …&gt; snippet"></textarea>
          </label>
          <p class="small muted">
            The game opens in a frame on its own page here — players never leave this site. Only embed
            games you have the right to embed; hosts must allow framing.
          </p>
        </div>

        <div class="form-section">
          <h3 class="form-section__title">Publishing</h3>
          <div class="field-row">
            <label class="field">
              <span>Status</span>
              <select class="input" name="status">
                <option value="published">Published (live now)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </label>
            <label class="field field--check">
              <input type="checkbox" name="featured" />
              <span>Featured (shown first on the homepage)</span>
            </label>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn--primary" type="submit" data-save-label>Publish game</button>
          <button class="btn btn--ghost" type="button" data-reset>Clear form</button>
        </div>
        <p class="form-error" data-form-error hidden></p>
      </form>
    </div>

    <script type="application/json" id="games-data"><?= pf_json($games) ?></script>

    <p class="small muted admin-note">
      First-party counts only — a same-origin beacon reports page loads and game-frame opens, and this
      server records them itself: no cookies, no third-party trackers, no estimates. Use them to
      cross-check <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Search&nbsp;Console</a>
      and AdSense. Full breakdowns live in <a href="/admin/analytics/">Analytics</a>.
    </p>
<?php
pf_admin_script_tags();
pf_admin_shell_footer();
