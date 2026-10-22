<?php
declare(strict_types=1);

/**
 * Admin UI shell — PHP ports of AdminLayout.astro + AdminLogin.astro.
 * Always noindex, no site header/footer/breadcrumbs; the topbar, sidebar and
 * toast host are identical to the original operator console so every CSS rule
 * (and every operator habit) keeps working.
 */

require_once __DIR__ . '/layout.php';

const PF_ADMIN_NAV = [
    ['key' => 'overview', 'href' => '/admin/', 'label' => 'Overview', 'icon' => '◧', 'hint' => 'Library & publishing'],
    ['key' => 'analytics', 'href' => '/admin/analytics/', 'label' => 'Analytics', 'icon' => '▲', 'hint' => 'Traffic & plays'],
    ['key' => 'seo', 'href' => '/admin/seo/', 'label' => 'Search & SEO', 'icon' => '⌕', 'hint' => 'Sitemap & indexing'],
];

/** Open the shared admin shell (head + topbar + sidebar + open main). */
function pf_admin_shell_header(string $title, string $crumb, string $active): void
{
    pf_layout_header([
        'path'      => '/admin/',
        'title'     => $title . ' — Parking Fury Guide',
        'description' => 'Site administration.',
        'noindex'   => true,
        'trail'     => [],
        'header'    => false,
    ]);
    ?>
      <section class="admin-shell container--wide">
        <header class="admin-topbar">
          <div class="admin-topbar__id">
            <span class="brand__mark" aria-hidden="true">
              <img src="/images/logo-mark.png" alt="" width="32" height="32" />
            </span>
            <div>
              <p class="admin-topbar__crumb">Parking&nbsp;<strong>Fury</strong> Guide · operator console<?= $crumb !== '' ? ' · ' . pf_e($crumb) : '' ?></p>
              <h1 class="admin-topbar__title"><?= pf_e($title) ?></h1>
            </div>
          </div>
          <div class="admin-topbar__actions">
            <a class="btn btn--ghost btn--sm" href="/games/" target="_blank" rel="noopener noreferrer">
              View site<span class="sr-only">(opens in a new tab)</span>
            </a>
            <button class="btn btn--secondary btn--sm" type="button" data-logout>Sign out</button>
          </div>
        </header>

        <div class="admin-layout">
          <nav class="admin-nav panel" aria-label="Admin sections">
            <ul class="admin-nav__list">
              <?php foreach (PF_ADMIN_NAV as $item): ?>
                <li>
                  <a class="admin-nav__link" href="<?= pf_e($item['href']) ?>" data-nav="<?= pf_e($item['key']) ?>"
                     <?= $item['key'] === $active ? 'aria-current="page"' : '' ?>>
                    <span class="admin-nav__icon" aria-hidden="true"><?= pf_e($item['icon']) ?></span>
                    <span class="admin-nav__text">
                      <strong><?= pf_e($item['label']) ?></strong>
                      <span class="admin-nav__hint"><?= pf_e($item['hint']) ?></span>
                    </span>
                  </a>
                </li>
              <?php endforeach; ?>
            </ul>
            <div class="admin-nav__footer">
              <p class="small muted">Session expires after 7 days. Every save publishes instantly — no rebuild.</p>
            </div>
          </nav>

          <div class="admin-main">
    <?php
}

/** Close the admin shell + page (footer, beacon, </body></html>). */
function pf_admin_shell_footer(): void
{
    ?>
            <div class="admin-toasts" data-toasts aria-live="polite"></div>
          </div>
        </div>
      </section>
    <?php
    pf_layout_footer(['footer' => false]);
}

/** The sign-in card (rendered instead of the shell when unauthenticated). */
function pf_admin_login(): void
{
    pf_layout_header([
        'path'        => '/admin/',
        'title'       => 'Admin sign in — Parking Fury Guide',
        'description' => 'Site administration.',
        'noindex'     => true,
        'trail'       => [],
        'header'      => false,
    ]);
    ?>
      <section class="admin-login container">
      <form class="admin-login__card panel" data-login-form>
        <img
          class="admin-login__logo"
          src="/images/logo-hero.jpg"
          alt="Parking Fury — golden supercar on a parking bay"
          width="960"
          height="536"
        />
        <div class="admin-login__brand">
          <span class="brand__mark" aria-hidden="true">
            <img src="/images/logo-mark.png" alt="" width="32" height="32" />
          </span>
          <span>Parking&nbsp;<strong>Fury</strong>&nbsp;Guide</span>
        </div>
        <h1>Admin sign in</h1>
        <p class="muted small">Sign in to publish, analyse traffic and manage search visibility.</p>
        <label class="field">
          <span>Username</span>
          <input class="input" type="text" name="user" autocomplete="username" required />
        </label>
        <label class="field">
          <span>Password</span>
          <input class="input" type="password" name="password" autocomplete="current-password" required />
        </label>
        <button class="btn btn--primary" type="submit">Sign in</button>
        <p class="form-error" data-login-error hidden></p>
        <p class="small muted admin-login__note">
          Operator console — sessions are signed cookies and expire after 7 days.
        </p>
      </form>
      </section>
    <?php
    pf_admin_script_tags();
    pf_layout_footer(['footer' => false]);
}

/** One shared script tag for every admin page (login + shell + page logic). */
function pf_admin_script_tags(): void
{
    echo '    <script src="/assets/js/admin.js" defer></script>' . "\n";
}
