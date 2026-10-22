<?php
declare(strict_types=1);

/**
 * Central SEO registry — one entry per indexable route, ported from
 * src/data/seo.ts. Every page pulls title, meta description, canonical path,
 * robots policy and breadcrumb label from here, guaranteeing uniqueness.
 *
 * `intent`, `primary` and `secondary` document the keyword-to-URL map (see
 * docs/SEO-STRATEGY.md). They are research SEEDS, not measured volumes.
 */

function pf_pages(): array
{
    return [
        '/' => [
            'path' => '/',
            'title' => 'Parking Fury: Play Online, Controls & Guides',
            'description' => 'Master Parking Fury with verified controls, level strategies, practical tips, and links to every version in the series — Parking Fury 2, 3 and 3D.',
            'breadcrumb' => null,
        ],
        '/games/' => [
            'path' => '/games/',
            'title' => 'Free Parking & Driving Games That Play Online',
            'description' => 'Play free parking and driving games right here in your browser — no downloads, no redirects. Search the library or filter by category and jump straight in.',
            'breadcrumb' => 'Games',
        ],
        '/parking-fury-2/' => [
            'path' => '/parking-fury-2/',
            'title' => 'Parking Fury 2: Controls, Release & How to Play',
            'description' => 'Parking Fury 2 arrived in 2017 with new maps from the original creator. See its official controls, what changed from the first game, and where to play it.',
            'breadcrumb' => 'Parking Fury 2',
        ],
        '/parking-fury-3/' => [
            'path' => '/parking-fury-3/',
            'title' => 'Parking Fury 3: What Changed and How to Play',
            'description' => 'The third Parking Fury game from Andriy Pidvirnyy, released October 2017. Find out how it plays, its official controls, and where to play it online.',
            'breadcrumb' => 'Parking Fury 3',
        ],
        '/parking-fury-3d/' => [
            'path' => '/parking-fury-3d/',
            'title' => 'Parking Fury 3D: Controls, Missions & Series Guide',
            'description' => 'Parking Fury 3D swaps top-down lots for 3D city streets. Get its exact controls, mission basics, and details on Beach City and Bounty Hunter.',
            'breadcrumb' => 'Parking Fury 3D',
        ],
        '/how-to-play/' => [
            'path' => '/how-to-play/',
            'title' => 'Parking Fury Controls: Keyboard and Touch Guide',
            'description' => 'Every Parking Fury control in one place: WASD and arrow-key driving, the on-screen wheel and pedals on touch devices, plus what changes in each version.',
            'breadcrumb' => 'How to Play',
        ],
        '/walkthrough/' => [
            'path' => '/walkthrough/',
            'title' => 'Parking Fury Walkthrough: Levels, Maps & Strategies',
            'description' => 'Parking Fury has 10 confirmed levels. See how difficulty ramps, what a clean run costs, and the method that transfers to every map — plus tested mini-game walkthroughs.',
            'breadcrumb' => 'Walkthrough',
        ],
        '/tips/' => [
            'path' => '/tips/',
            'title' => 'Parking Fury Tips, Mistakes & Troubleshooting',
            'description' => 'Practical Parking Fury advice: cleaner parking angles, how to recover from scrapes, and fixes for loading, sound, and performance problems.',
            'breadcrumb' => 'Tips & Troubleshooting',
        ],
        '/similar-games/' => [
            'path' => '/similar-games/',
            'title' => '10 Games Like Parking Fury to Play Next',
            'description' => 'Curated parking and driving games with a similar skill set — 3D city parking, truck parking and slide-out puzzles — each with controls and device support listed.',
            'breadcrumb' => 'Similar Games',
        ],
        '/about/' => [
            'path' => '/about/',
            'title' => 'About This Independent Parking Fury Resource',
            'description' => 'What this site covers, where every fact comes from, how the original mini-game was made, and how the site stays independent of the game’s platforms.',
            'breadcrumb' => 'About',
        ],
        '/contact/' => [
            'path' => '/contact/',
            'title' => 'Contact Us — Corrections, Questions & Takedowns',
            'description' => 'Questions, corrections, or a takedown request? Reach the person behind this independent Parking Fury resource — no forms, no tracking, just email.',
            'breadcrumb' => 'Contact',
        ],
        '/privacy/' => [
            'path' => '/privacy/',
            'title' => 'Privacy Policy: What This Site Collects (Very Little)',
            'description' => 'No accounts, no ads, no tracking cookies — only same-origin counters. Read exactly what this site stores, how embeds behave, and what happens when you play the mini-game.',
            'breadcrumb' => 'Privacy',
        ],
        '/terms/' => [
            'path' => '/terms/',
            'title' => 'Terms of Use and Disclaimers',
            'description' => 'Ground rules for using this site, plus clear disclaimers about third-party games, trademarks, external links and the original mini-game.',
            'breadcrumb' => 'Terms',
        ],
        '/404' => [
            'path' => '/404',
            'title' => 'Page Not Found',
            'description' => 'That page does not exist. Head back to the homepage or jump straight into the game.',
            'breadcrumb' => null,
            'noindex' => true,
        ],
    ];
}

/** Absolute URL for a route, based on the configured site origin. */
function pf_abs(string $path): string
{
    $base = pf_site();
    if ($path === '/') {
        return $base . '/';
    }
    return $base . $path;
}

/** Canonical URL for a known route. */
function pf_canonical(string $path): string
{
    return pf_abs($path);
}

/** Emit one or more JSON-LD graph objects as script tags (truthful data only). */
function pf_jsonld(array $schemas): void
{
    foreach ($schemas as $schema) {
        if (!$schema) {
            continue;
        }
        // Extracted schemas carry the @@SITE@@ token for the live origin.
        $json = json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        echo '<script type="application/ld+json">'
            . str_replace('@@SITE@@', pf_site(), (string) $json)
            . "</script>\n";
    }
}

/** BreadcrumbList schema for a visible trail (Home + levels). */
function pf_breadcrumb_schema(array $trail): ?array
{
    if (count($trail) < 2) {
        return null;
    }
    $items = [];
    foreach ($trail as $i => $item) {
        $items[] = [
            '@type' => 'ListItem',
            'position' => $i + 1,
            'name' => $item['name'],
            'item' => pf_abs($item['path']),
        ];
    }
    return [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => $items,
    ];
}
