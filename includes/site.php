<?php
declare(strict_types=1);

/**
 * Site-wide identity, navigation and legal copy.
 * Single source of truth — the PHP equivalent of src/data/site.ts.
 */

const PF_SITE_NAME = 'Parking Fury Guide';
const PF_SITE_SHORT = 'PF Guide';
const PF_SITE_TAGLINE = 'Independent Parking Fury resource with free parking and driving games that play right in your browser — no downloads, no redirects.';
const PF_LOCALE = 'en_US';
const PF_THEME_COLOR = '#111318';

/** Primary header navigation (desktop + mobile). */
function pf_primary_nav(): array
{
    return [
        ['href' => '/games/', 'label' => 'Games', 'description' => 'Free games that play right on this site'],
        ['href' => '/how-to-play/', 'label' => 'How to Play', 'description' => 'Keyboard, touch, and every control explained'],
        ['href' => '/walkthrough/', 'label' => 'Walkthrough', 'description' => 'Level structure and tested parking strategies'],
        ['href' => '/tips/', 'label' => 'Tips', 'description' => 'Practical advice, common mistakes, and fixes'],
        ['href' => '/similar-games/', 'label' => 'Similar Games', 'description' => 'Other parking and driving games worth your time'],
    ];
}

/** Footer link columns. */
function pf_footer_nav(): array
{
    return [
        [
            'title' => 'Play',
            'links' => [
                ['href' => '/games/', 'label' => 'All games'],
                ['href' => '/games/tight-lot/', 'label' => 'Tight Lot (our game)'],
                ['href' => '/parking-fury-2/', 'label' => 'Parking Fury 2'],
                ['href' => '/parking-fury-3/', 'label' => 'Parking Fury 3'],
                ['href' => '/parking-fury-3d/', 'label' => 'Parking Fury 3D'],
            ],
        ],
        [
            'title' => 'Guides',
            'links' => [
                ['href' => '/how-to-play/', 'label' => 'Controls & how to play'],
                ['href' => '/walkthrough/', 'label' => 'Walkthrough'],
                ['href' => '/tips/', 'label' => 'Tips & troubleshooting'],
                ['href' => '/similar-games/', 'label' => 'Games like Parking Fury'],
            ],
        ],
        [
            'title' => 'Site',
            'links' => [
                ['href' => '/about/', 'label' => 'About this site'],
                ['href' => '/contact/', 'label' => 'Contact'],
                ['href' => '/privacy/', 'label' => 'Privacy policy'],
                ['href' => '/terms/', 'label' => 'Terms of use'],
            ],
        ],
    ];
}

const PF_DISCLAIMER = 'Parking Fury and its sequels are the property of their respective creators. This site is an independent, fan-made player resource — it is not affiliated with, endorsed by, or sponsored by the game developer, Coolmath Games, Poki, or any other platform. Games embedded on this site are loaded from their providers inside an iframe; the site operator is responsible for embedding only games they have the right to embed.';
