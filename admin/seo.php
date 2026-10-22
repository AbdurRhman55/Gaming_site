<?php
declare(strict_types=1);

/**
 * /admin/seo/ — live sitemap audit, indexability roll-up and the pre-flight
 * checklist an operator runs before submitting the site to Search Console.
 * Data comes from /api/admin/seo/ (games store + canonical registry) —
 * nothing is invented, no network calls.
 */

require_once __DIR__ . '/../includes/boot.php';
require_once __DIR__ . '/../includes/admin-ui.php';

if (!pf_is_authed()) {
    pf_admin_login();
    exit;
}

$published = pf_list_games(true);
$all = pf_list_games(false);
$draftCount = count(array_filter($all, fn($g) => $g['status'] === 'draft'));

// Server-rendered baseline (the client re-fetches for the live roll-up).
$baseline = [
    'editorial' => 13,
    'games' => count($published),
    'indexable' => 13 + count($published),
    'excluded' => 2 + $draftCount,
];

pf_admin_shell_header('Search & SEO', 'Sitemap & indexing', 'seo');
?>
      <div class="seo" data-seo>
        <div class="admin-stats seo__kpis">
          <div class="admin-stat admin-stat--live">
            <span class="admin-stat__label">Indexable pages</span>
            <strong data-seo-stat="indexable"><?= (int) $baseline['indexable'] ?></strong>
            <span class="admin-stat__sub small muted">editorial + published games</span>
          </div>
          <div class="admin-stat">
            <span class="admin-stat__label">Editorial pages</span>
            <strong data-seo-stat="editorial"><?= (int) $baseline['editorial'] ?></strong>
            <span class="admin-stat__sub small muted">guides & legal</span>
          </div>
          <div class="admin-stat">
            <span class="admin-stat__label">Game pages</span>
            <strong data-seo-stat="games"><?= (int) $baseline['games'] ?></strong>
            <span class="admin-stat__sub small muted">published</span>
          </div>
          <div class="admin-stat">
            <span class="admin-stat__label">Excluded</span>
            <strong data-seo-stat="excluded"><?= (int) $baseline['excluded'] ?></strong>
            <span class="admin-stat__sub small muted">noindex, drafts, 404</span>
          </div>
        </div>

        <section class="panel seo__links" aria-labelledby="links-title">
          <div class="admin-toolbar">
            <h2 class="admin-toolbar__title" id="links-title">Submit to Search Console</h2>
            <p class="small muted">verify ownership, then add these</p>
          </div>
          <ul class="seo__linklist" data-seo-links>
            <li><a data-seo-sitemap href="/sitemap.xml" target="_blank" rel="noopener noreferrer">/sitemap.xml</a> <span class="small muted">— all indexable URLs</span></li>
            <li><a data-seo-robots href="/robots.txt" target="_blank" rel="noopener noreferrer">/robots.txt</a> <span class="small muted">— crawl rules + sitemap pointer</span></li>
          </ul>
          <p class="small muted" data-seo-origin>origin: —</p>
        </section>

        <section class="panel seo__checklist" aria-labelledby="checklist-title">
          <div class="admin-toolbar">
            <h2 class="admin-toolbar__title" id="checklist-title">Indexability checklist</h2>
            <p class="small muted">generated from the live store</p>
          </div>
          <ul class="seo__checks" data-seo-checks>
            <li class="seo__check seo__check--ok"><strong>Unique titles &amp; descriptions</strong><span>every route renders its own title, meta description and H1</span></li>
            <li class="seo__check seo__check--ok"><strong>Canonical URLs</strong><span>self-referencing canonical on all indexable pages</span></li>
            <li class="seo__check seo__check--ok"><strong>Structured data</strong><span>JSON-LD (WebSite, CollectionPage, VideoGame, FAQPage, BreadcrumbList)</span></li>
            <li class="seo__check seo__check--ok"><strong>noindex coverage</strong><span>admin, 404 and drafts are excluded from the sitemap</span></li>
            <li class="seo__check seo__check--ok"><strong> robots.txt + sitemap.xml</strong><span>served, valid, and pointing at each other</span></li>
          </ul>
          <p class="small muted">
            Core Web Vitals and keyword positions come from Search Console itself — this console only audits
            what this server publishes, so nothing here is estimated or guessed.
          </p>
        </section>

        <section class="panel seo__table" aria-labelledby="urls-title">
          <div class="admin-toolbar">
            <h2 class="admin-toolbar__title" id="urls-title">Sitemap contents</h2>
            <p class="small muted" data-seo-counts><?= (int) $baseline['indexable'] ?> indexable · <?= (int) $baseline['excluded'] ?> excluded</p>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th scope="col">Path</th>
                  <th scope="col">Title</th>
                  <th scope="col">Index</th>
                </tr>
              </thead>
              <tbody data-seo-body></tbody>
            </table>
          </div>
          <p class="empty-state" data-seo-loading>Loading sitemap audit…</p>
        </section>
      </div>
<?php
pf_admin_script_tags();
pf_admin_shell_footer();
