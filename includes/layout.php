<?php
declare(strict_types=1);

/**
 * Shared page shell: SEO <head>, site header, breadcrumbs, footer and the
 * first-party view beacon. Port of src/layouts/BaseLayout.astro + Header/Footer.
 *
 * Pages call:
 *   pf_layout_header([...]);  // opens <html>/<body>, prints header + <main>
 *   ... content ...
 *   pf_layout_footer();       // closes </main>, prints footer + beacon + </html>
 */

require_once __DIR__ . '/site.php';
require_once __DIR__ . '/seo.php';
require_once __DIR__ . '/functions.php';

/**
 * Load an editorial page extracted from the production build
 * (includes/pages/<name>.html + .json). Returns:
 *   ['main' => inner HTML of <main>, 'jsonLd' => schema array]
 * Absolute URLs inside the schemas carry the @@SITE@@ token, replaced here
 * with the live site origin so canonical/OG always match the real domain.
 */
function pf_static_page(string $name): array
{
    $base = __DIR__ . '/pages/' . preg_replace('/[^a-z0-9\-]/', '', $name);
    $html = is_readable($base . '.html') ? (string) file_get_contents($base . '.html') : '';
    $schemas = [];
    if (is_readable($base . '.json')) {
        $decoded = json_decode((string) file_get_contents($base . '.json'), true);
        if (is_array($decoded)) {
            $schemas = $decoded;
        }
    }
    return [
        'main'   => $html,
        'jsonLd' => $schemas,
    ];
}

/** Print the header, nav, breadcrumbs and open <main>. */
function pf_layout_header(array $args = []): void
{
    $path        = $args['path'] ?? pf_current_path();
    $title       = $args['title'] ?? null;
    $description = $args['description'] ?? null;
    $noindex     = $args['noindex'] ?? false;
    $trail       = $args['trail'] ?? null;   // array of ['name','path']; null = derive from registry
    $showHeader  = $args['header'] ?? true;
    $bodyClass   = $args['bodyClass'] ?? '';

    $pages = pf_pages();
    $page  = $pages[$path] ?? null;

    // Dynamic routes (game pages) supply their own title/description/path.
    if ($title === null)       $title       = $page['title']       ?? 'Parking Fury Guide';
    if ($description === null) $description = $page['description'] ?? PF_SITE_TAGLINE;
    if ($trail === null) {
        $bc = $page['breadcrumb'] ?? null;
        $trail = $bc ? [['name' => 'Home', 'path' => '/'], ['name' => $bc, 'path' => $path]] : [];
    }

    $is404     = ($path === '/404');
    $canonical = pf_canonical($path);
    $siteUrl   = pf_site();
    $ogImage   = $siteUrl . '/images/og-cover.png';
    if ($is404) $title = 'Page Not Found';

    $robots = ($noindex || $is404)
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large';

    // JSON-LD: website (home) + breadcrumb trail.
    $schemas = [];
    if ($path === '/') {
        $schemas[] = [
            '@context' => 'https://schema.org',
            '@type'    => 'WebSite',
            'name'     => PF_SITE_NAME,
            'description' => PF_SITE_TAGLINE,
            'url'      => pf_abs('/'),
            'inLanguage' => 'en',
        ];
    }
    if (count($trail) > 1) {
        $bcSchema = pf_breadcrumb_schema($trail);
        if ($bcSchema) $schemas[] = $bcSchema;
    }
    foreach (($args['jsonLd'] ?? []) as $extra) {
        if ($extra) $schemas[] = $extra;
    }

    echo '<!doctype html>' . "\n" . '<html lang="en">' . "\n  <head>\n";
    echo '    <meta charset="utf-8">' . "\n";
    echo '    <meta name="viewport" content="width=device-width, initial-scale=1">' . "\n";
    echo '    <title>' . pf_e($title) . '</title>' . "\n";
    echo '    <meta name="description" content="' . pf_e($description) . '">' . "\n";
    echo '    <link rel="canonical" href="' . pf_e($canonical) . '">' . "\n";
    echo '    <meta name="robots" content="' . pf_e($robots) . '">' . "\n";
    echo '    <meta name="author" content="' . pf_e(PF_SITE_NAME) . '">' . "\n";
    echo '    <meta name="theme-color" content="' . pf_e(PF_THEME_COLOR) . '">' . "\n";
    echo '    <meta name="color-scheme" content="dark">' . "\n\n";

    // Open Graph
    echo '    <meta property="og:type" content="website">' . "\n";
    echo '    <meta property="og:site_name" content="' . pf_e(PF_SITE_NAME) . '">' . "\n";
    echo '    <meta property="og:locale" content="' . pf_e(PF_LOCALE) . '">' . "\n";
    echo '    <meta property="og:title" content="' . pf_e($title) . '">' . "\n";
    echo '    <meta property="og:description" content="' . pf_e($description) . '">' . "\n";
    echo '    <meta property="og:url" content="' . pf_e($canonical) . '">' . "\n";
    echo '    <meta property="og:image" content="' . pf_e($ogImage) . '">' . "\n";
    echo '    <meta property="og:image:width" content="1200">' . "\n";
    echo '    <meta property="og:image:height" content="630">' . "\n";
    echo '    <meta property="og:image:alt" content="' . pf_e(PF_SITE_NAME . ' — cover image with the words “' . $title . '”') . '">' . "\n\n";

    // Twitter
    echo '    <meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '    <meta name="twitter:title" content="' . pf_e($title) . '">' . "\n";
    echo '    <meta name="twitter:description" content="' . pf_e($description) . '">' . "\n";
    echo '    <meta name="twitter:image" content="' . pf_e($ogImage) . '">' . "\n";
    echo '    <meta name="twitter:image:alt" content="' . pf_e(PF_SITE_NAME . ' — cover image with the words “' . $title . '”') . '">' . "\n\n";

    echo '    <link rel="icon" href="/favicon.svg" type="image/svg+xml">' . "\n";
    echo '    <link rel="apple-touch-icon" href="/images/touch-icon.png">' . "\n\n";

    echo '    <link rel="stylesheet" href="/assets/css/tailwind.css">' . "\n";
    echo '    <link rel="stylesheet" href="/assets/css/global.css">' . "\n";
    echo '    <link rel="stylesheet" href="/assets/css/portal.css">' . "\n\n";

    pf_jsonld($schemas);

    echo '  </head>' . "\n";
    echo '  <body' . ($bodyClass ? ' class="' . pf_e($bodyClass) . '"' : '') . '>' . "\n";
    echo '    <a class="skip-link" href="#main">Skip to main content</a>' . "\n";

    if ($showHeader) {
        pf_render_header_nav($path);
    }

    echo '    <main id="main">' . "\n";
    if (count($trail) > 1) {
        echo '      <nav class="crumbs container" aria-label="Breadcrumb">' . "\n";
        echo '        <ol>' . "\n";
        $last = count($trail) - 1;
        foreach ($trail as $i => $item) {
            echo '          <li>';
            if ($i === $last) {
                echo '<span aria-current="page">' . pf_e($item['name']) . '</span>';
            } else {
                echo '<a href="' . pf_e($item['path']) . '">' . pf_e($item['name']) . '</a>';
            }
            echo '</li>' . "\n";
        }
        echo '        </ol>' . "\n";
        echo '      </nav>' . "\n";
    }
}

/** The public site header (brand + primary nav + CTA + mobile menu). */
function pf_render_header_nav(string $path): void
{
    $nav = pf_primary_nav();
    $isActive = function (string $href) use ($path) {
        return $path === $href || ($href !== '/' && str_starts_with($path, $href));
    };

    echo '      <header class="site-header">' . "\n";
    echo '        <div class="site-header__inner container">' . "\n";
    echo '          <a class="brand" href="/" aria-label="' . pf_e(PF_SITE_NAME . ' — home') . '">' . "\n";
    echo '            <span class="brand__mark" aria-hidden="true"><img src="/images/logo-mark.png" alt="" width="32" height="32"></span>' . "\n";
    echo '            <span class="brand__text">Parking&nbsp;<strong>Fury</strong>&nbsp;Guide</span>' . "\n";
    echo '          </a>' . "\n";
    echo '          <nav class="nav" aria-label="Primary">' . "\n";
    foreach ($nav as $item) {
        $cur = $isActive($item['href']) ? ' aria-current="page"' : '';
        echo '            <a class="nav__link" href="' . pf_e($item['href']) . '"' . $cur . '>' . pf_e($item['label']) . '</a>' . "\n";
    }
    echo '          </nav>' . "\n";
    echo '          <a class="btn btn--primary btn--sm header-cta" href="/games/">Play now</a>' . "\n";
    echo '          <button class="menu-toggle" type="button" id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu"><span class="menu-toggle__icon" aria-hidden="true"></span>Menu</button>' . "\n";
    echo '        </div>' . "\n";
    echo '        <div class="mobile-nav" id="mobile-menu" hidden><nav aria-label="Mobile">' . "\n";
    foreach ($nav as $item) {
        $cur = $isActive($item['href']) ? ' aria-current="page"' : '';
        echo '          <a class="mobile-nav__link" href="' . pf_e($item['href']) . '"' . $cur . '>' . pf_e($item['label']);
        if (!empty($item['description'])) echo '<span>' . pf_e($item['description']) . '</span>';
        echo '</a>' . "\n";
    }
    echo '        </nav><a class="btn btn--primary" href="/games/">Play games</a></div>' . "\n";
    echo '      </header>' . "\n";
    pf_mobile_menu_script();
}

/** Inline script: mobile menu toggle (port of Header.astro script). */
function pf_mobile_menu_script(): void
{
    echo <<<'HTML'
      <script>
      (function () {
        var toggle = document.getElementById('menu-toggle');
        var menu = document.getElementById('mobile-menu');
        if (!toggle || !menu) return;
        function setOpen(open) {
          toggle.setAttribute('aria-expanded', String(open));
          menu.hidden = !open;
        }
        toggle.addEventListener('click', function () {
          setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });
        menu.addEventListener('click', function (e) {
          if (e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
          }
        });
        var mq = window.matchMedia('(min-width: 60rem)');
        mq.addEventListener('change', function (e) { if (e.matches) setOpen(false); });
      })();
      </script>

HTML;
}

/** Close </main>, print footer + view beacon + </body></html>.
 *  Pass ['footer' => false] for documents that must not render the public
 *  site footer (the admin console, like the original BaseLayout footer={false}). */
function pf_layout_footer(array $args = []): void
{
    echo '    </main>' . "\n";
    if ($args['footer'] ?? true) {
        pf_render_footer();
    }
    pf_view_beacon();
    echo '  </body>' . "\n" . '</html>' . "\n";
}

/** The public site footer (brand plate + link columns + legal). */
function pf_render_footer(): void
{
    echo '      <footer class="site-footer">' . "\n";
    echo '        <div class="container">' . "\n";
    echo '          <div class="footer-grid">' . "\n";
    echo '            <div class="footer__brand">' . "\n";
    echo '              <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"><img src="/images/logo-mark.png" alt="" width="32" height="32" loading="lazy"></span><span class="brand__text">Parking&nbsp;<strong>Fury</strong>&nbsp;Guide</span></a>' . "\n";
    echo '              <img class="footer__logo" src="/images/logo-hero.jpg" alt="Parking Fury — golden supercar on a parking bay" width="960" height="536" loading="lazy">' . "\n";
    echo '              <p>' . pf_e(PF_SITE_TAGLINE) . '</p>' . "\n";
    echo '            </div>' . "\n";
    foreach (pf_footer_nav() as $col) {
        echo '            <div class="footer__col"><h2>' . pf_e($col['title']) . '</h2><ul>' . "\n";
        foreach ($col['links'] as $link) {
            echo '              <li><a href="' . pf_e($link['href']) . '">' . pf_e($link['label']) . '</a></li>' . "\n";
        }
        echo '            </ul></div>' . "\n";
    }
    echo '          </div>' . "\n";
    echo '          <div class="footer__legal">' . "\n";
    echo '            <p>' . pf_e(PF_DISCLAIMER) . '</p>' . "\n";
    echo '            <p>Game facts on this site were checked against the official hosting platforms in October 2026. No game files are hosted or re-uploaded here; outbound links go to the platforms that license each game.</p>' . "\n";
    echo '            <p>© ' . pf_year() . ' ' . pf_e(PF_SITE_NAME) . '. Original site content and mini-game © ' . pf_year() . ' ' . pf_e(PF_SITE_NAME) . '.</p>' . "\n";
    echo '          </div>' . "\n";
    echo '        </div>' . "\n";
    echo '      </footer>' . "\n";
}

/** First-party view beacon (port of BaseLayout inline script). */
function pf_view_beacon(): void
{
    echo <<<'HTML'
    <script>
    (function () {
      var send = function (body) {
        fetch('/api/track/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
          credentials: 'omit'
        }).catch(function () {});
      };
      var view = function () {
        var p = location.pathname;
        if (p.indexOf('/admin') === 0 || p.indexOf('/api') === 0) return;
        if (document.querySelector('meta[name="robots"][content*="noindex"]')) return;
        send({ kind: 'view', path: p });
      };
      if (document.readyState === 'complete') view();
      else window.addEventListener('load', view, { once: true });
    })();
    </script>

HTML;
}
