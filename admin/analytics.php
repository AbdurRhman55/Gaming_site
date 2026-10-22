<?php
declare(strict_types=1);

/**
 * /admin/analytics/ — first-party traffic & play counts, broken down by
 * day / week / month / year and by range preset (server-rendered baseline;
 * admin.js re-fetches /api/admin/analytics/ for every change).
 */

require_once __DIR__ . '/../includes/boot.php';
require_once __DIR__ . '/../includes/admin-ui.php';

if (!pf_is_authed()) {
    pf_admin_login();
    exit;
}

$PERIODS = [
    ['key' => 'day', 'label' => 'Daily', 'hint' => 'one bar per day'],
    ['key' => 'week', 'label' => 'Weekly', 'hint' => 'ISO weeks'],
    ['key' => 'month', 'label' => 'Monthly', 'hint' => 'per month'],
    ['key' => 'year', 'label' => 'Yearly', 'hint' => 'per year'],
];
$RANGES = [
    ['key' => '7d', 'label' => 'Last 7 days', 'days' => 7],
    ['key' => '30d', 'label' => 'Last 30 days', 'days' => 30],
    ['key' => '90d', 'label' => 'Last 90 days', 'days' => 90],
    ['key' => '365d', 'label' => 'Last 12 months', 'days' => 365],
    ['key' => 'all', 'label' => 'All time', 'days' => null],
];

$sinceFor = static fn(?int $days): ?string => $days === null
    ? null
    : gmdate('Y-m-d', time() - ($days - 1) * 86400);

// Initial server render: 30 days grouped by week (matches the default UI state).
$initialPeriod = 'week';
$initialSince = $sinceFor(30);
$initial = pf_analytics_summary($initialPeriod, $initialSince);

$views = $initial['totals']['views'];
$plays = $initial['totals']['plays'];
$days = $initial['activeDays'];
$pageKpis = [
    'views' => $views,
    'plays' => $plays,
    'days' => $days,
    'avg' => $days ? (int) round($views / $days) : 0,
    'conv' => $views ? number_format($plays / $views * 100, 1) : '0.0',
    'topPage' => $initial['topPages'][0] ?? null,
    'topGame' => $initial['topGames'][0] ?? null,
];

$nf = fn(int $n): string => number_format($n);

pf_admin_shell_header('Analytics', 'Traffic & telemetry', 'analytics');
?>
    <div class="analytics" data-analytics data-since="<?= pf_e($initialSince ?? '') ?>" data-period="<?= pf_e($initialPeriod) ?>">
      <div class="analytics__controls panel">
        <div class="analytics__group" role="group" aria-label="Group by">
          <span class="analytics__grouplabel">Group by</span>
          <?php foreach ($PERIODS as $p): ?>
            <button
              class="chip chip--link<?= $p['key'] === $initialPeriod ? ' chip--active' : '' ?>"
              type="button"
              data-period-btn="<?= pf_e($p['key']) ?>"
              aria-pressed="<?= $p['key'] === $initialPeriod ? 'true' : 'false' ?>"
              title="<?= pf_e($p['hint']) ?>"
            >
              <?= pf_e($p['label']) ?>
            </button>
          <?php endforeach; ?>
        </div>
        <div class="analytics__group" role="group" aria-label="Date range">
          <span class="analytics__grouplabel">Range</span>
          <?php foreach ($RANGES as $r): ?>
            <button
              class="chip chip--link<?= $r['days'] === 30 ? ' chip--active' : '' ?>"
              type="button"
              data-range-btn="<?= pf_e($r['key']) ?>"
              data-days="<?= $r['days'] === null ? '' : (int) $r['days'] ?>"
              aria-pressed="<?= $r['days'] === 30 ? 'true' : 'false' ?>"
            >
              <?= pf_e($r['label']) ?>
            </button>
          <?php endforeach; ?>
        </div>
        <p class="analytics__range small muted" data-range-label>
          <?= $initialSince ? pf_e($initialSince . ' → today') : 'All recorded history' ?>
        </p>
        <div class="analytics__group">
          <button class="btn btn--ghost btn--sm" type="button" data-reset-analytics disabled style="opacity: 0.55; cursor: not-allowed;" title="Reset disabled — traffic counts are permanently preserved">
            Reset disabled (Permanent)
          </button>
          <p class="small muted" style="margin:0">
            Analytics are permanently stored in history. Reset is locked to prevent accidental data loss.
          </p>
        </div>
      </div>

      <div class="admin-stats analytics__kpis">
        <div class="admin-stat">
          <span class="admin-stat__label">Page views</span>
          <strong data-kpi="views"><?= $nf($pageKpis['views']) ?></strong>
          <span class="admin-stat__sub small muted">in selected range</span>
        </div>
        <div class="admin-stat admin-stat--live">
          <span class="admin-stat__label">Game plays</span>
          <strong data-kpi="plays"><?= $nf($pageKpis['plays']) ?></strong>
          <span class="admin-stat__sub small muted">frame opens in player</span>
        </div>
        <div class="admin-stat">
          <span class="admin-stat__label">Play conversion</span>
          <strong data-kpi="conv"><?= pf_e($pageKpis['conv']) ?>%</strong>
          <span class="admin-stat__sub small muted">plays per view ratio</span>
        </div>
        <div class="admin-stat">
          <span class="admin-stat__label">Active days</span>
          <strong data-kpi="days"><?= $nf($pageKpis['days']) ?></strong>
          <span class="admin-stat__sub small muted">days with traffic</span>
        </div>
        <div class="admin-stat">
          <span class="admin-stat__label">Avg views / day</span>
          <strong data-kpi="avg"><?= $nf($pageKpis['avg']) ?></strong>
          <span class="admin-stat__sub small muted">across active days</span>
        </div>
      </div>

      <section class="panel analytics__chart" aria-labelledby="chart-title">
        <div class="admin-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <h2 class="admin-toolbar__title" id="chart-title">Traffic &amp; Gameplay Telemetry</h2>
            <p class="small muted" data-chart-note style="margin-top:0.2rem">grouped weekly · last 30 days</p>
          </div>
          <div class="chart__controls">
            <div class="chart__legend">
              <span class="legend-item"><span class="legend-dot legend-dot--views"></span>Views</span>
              <span class="legend-item"><span class="legend-dot legend-dot--plays"></span>Plays</span>
            </div>
            <div class="chip-group" data-chart-type-group role="group" aria-label="Chart type">
              <button class="chip chip--active" type="button" data-chart-type="bar">📊 Bars</button>
              <button class="chip" type="button" data-chart-type="line">📈 Line</button>
              <button class="chip" type="button" data-chart-type="area">🏔️ Area</button>
            </div>
          </div>
        </div>
        <div class="chart" data-chart style="margin-top:1.25rem">
          <p class="empty-state" data-chart-empty hidden>No traffic recorded in this range yet.</p>
        </div>
      </section>

      <div class="analytics__tables">
        <section class="panel analytics__table" aria-labelledby="pages-title">
          <div class="admin-toolbar">
            <h2 class="admin-toolbar__title" id="pages-title">Top pages</h2>
            <p class="small muted">by page views</p>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th scope="col">Path</th>
                  <th scope="col">Views</th>
                  <th scope="col" style="width:30%">Share</th>
                </tr>
              </thead>
              <tbody data-pages-body>
                <?php foreach (array_slice($initial['topPages'], 0, 10) as $p):
                    $pct = $views ? (int) round($p['views'] / $views * 100) : 0; ?>
                  <tr>
                    <td class="admin-table__game"><strong><?= pf_e($p['path']) ?></strong></td>
                    <td class="small"><?= $nf((int) $p['views']) ?></td>
                    <td class="small muted">
                      <div style="display:flex; align-items:center; gap:0.5rem">
                        <span><?= $pct ?>%</span>
                        <div class="meter-track" style="flex:1">
                          <div class="meter-fill" style="width:<?= $pct ?>%"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <p class="empty-state" data-pages-empty hidden>No page views recorded yet.</p>
        </section>

        <section class="panel analytics__table" aria-labelledby="games-title">
          <div class="admin-toolbar">
            <h2 class="admin-toolbar__title" id="games-title">Top games</h2>
            <p class="small muted">by game frame opens</p>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col">Plays</th>
                  <th scope="col" style="width:30%">Share</th>
                </tr>
              </thead>
              <tbody data-games-body>
                <?php foreach (array_slice($initial['topGames'], 0, 10) as $g):
                    $pct = $plays ? (int) round($g['plays'] / $plays * 100) : 0; ?>
                  <tr>
                    <td class="admin-table__game"><strong><?= pf_e($g['slug']) ?></strong></td>
                    <td class="small"><?= $nf((int) $g['plays']) ?></td>
                    <td class="small muted">
                      <div style="display:flex; align-items:center; gap:0.5rem">
                        <span><?= $pct ?>%</span>
                        <div class="meter-track" style="flex:1">
                          <div class="meter-fill meter-fill--plays" style="width:<?= $pct ?>%"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <p class="empty-state" data-games-empty hidden>No plays recorded yet.</p>
        </section>
      </div>

      <section class="panel analytics__table" aria-labelledby="daily-title">
        <div class="admin-toolbar">
          <h2 class="admin-toolbar__title" id="daily-title">Day-by-day log</h2>
          <p class="small muted" data-log-note>most recent days first</p>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Views</th>
                <th scope="col">Game plays</th>
              </tr>
            </thead>
            <tbody data-daily-body>
              <?php foreach (array_reverse(array_slice($initial['daily'], -60)) as $d): ?>
                <tr>
                  <td class="admin-table__game"><strong><?= pf_e($d['day']) ?></strong></td>
                  <td class="small"><?= $nf((int) $d['views']) ?></td>
                  <td class="small"><?= $nf((int) $d['plays']) ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <p class="empty-state" data-daily-empty hidden>No days recorded yet.</p>
      </section>

      <script type="application/json" id="analytics-initial"><?= pf_json(['series' => $initial['series']]) ?></script>
    </div>
<?php
pf_admin_script_tags();
pf_admin_shell_footer();
