<?php
declare(strict_types=1);

/**
 * Verified game facts (series cards + related games).
 * PHP port of src/data/games.ts — sources checked 20 October 2026 against
 * Coolmath Games / Poki official pages. No guessed values: fields that could
 * not be verified were omitted rather than filled with plausible data.
 */

/** Official host URLs to credit for outbound "play the official game" links. */
function pf_official_hosts(): array
{
    return [
        'coolmath'      => 'https://www.coolmathgames.com/0-parking-fury',
        'coolmathSeries'=> 'https://www.coolmathgames.com/c/parking-fury-games',
        'poki3d'        => 'https://poki.com/en/g/parking-fury-3d',
        'pokiParking'   => 'https://poki.com/en/parking',
    ];
}

/** Map each series version slug to its direct in-site playable page. */
function pf_play_route(string $slug): string
{
    $map = [
        'parking-fury'   => '/games/tight-lot/',
        'parking-fury-2' => '/games/traffic-rush/',
        'parking-fury-3' => '/games/parking-fury-3/',
        'parking-fury-3d'=> '/games/parking-fury-3d/',
    ];
    return $map[$slug] ?? '/games/' . $slug . '/';
}

/** The four official series entries (homepage "The Official Series" grid). */
function pf_versions(): array
{
    return [
        [
            'path' => '/',
            'slug' => 'parking-fury',
            'name' => 'Parking Fury',
            'tagline' => 'The original top-down parking game: 10 levels, one creator, no-frills precision.',
            'developer' => 'Andriy Pidvirnyy',
            'host' => 'Coolmath Games',
            'officialUrl' => 'https://www.coolmathgames.com/0-parking-fury',
            'release' => '26 May 2016',
            'platform' => 'Browser and mobile',
            'controls' => 'WASD or arrow keys',
            'levels' => 10,
            'cover' => '/uploads/g-mvhs1q65-9f1503bf.jpg/',
        ],
        [
            'path' => '/parking-fury-2/',
            'slug' => 'parking-fury-2',
            'name' => 'Parking Fury 2',
            'tagline' => 'Same creator, new maps and a couple of extra features.',
            'developer' => 'Andriy Pidvirnyy',
            'host' => 'Coolmath Games',
            'officialUrl' => 'https://www.coolmathgames.com/0-parking-fury-2',
            'release' => '23 March 2017',
            'platform' => 'Browser and mobile',
            'controls' => 'WASD or arrow keys',
            'cover' => '/uploads/g-mvhs6r7l-f4c36f71.jpg/',
        ],
        [
            'path' => '/parking-fury-3/',
            'slug' => 'parking-fury-3',
            'name' => 'Parking Fury 3',
            'tagline' => 'The third entry in the original series — more maps, same tight handling.',
            'developer' => 'Andriy Pidvirnyy',
            'host' => 'Coolmath Games',
            'officialUrl' => 'https://www.coolmathgames.com/0-parking-fury-3',
            'release' => '19 October 2017',
            'platform' => 'Browser and mobile',
            'controls' => 'WASD or arrow keys',
            'cover' => '/uploads/g-cover-pf3.jpg/',
        ],
        [
            'path' => '/parking-fury-3d/',
            'slug' => 'parking-fury-3d',
            'name' => 'Parking Fury 3D',
            'tagline' => 'A separate 3D series: steal, drive and deliver cars through city streets.',
            'developer' => 'Brain Software',
            'host' => 'Poki',
            'officialUrl' => 'https://poki.com/en/g/parking-fury-3d',
            'release' => 'March 2019',
            'platform' => 'Desktop (per Poki’s supported-devices list)',
            'controls' => 'Arrow keys to drive, Ctrl to enter or exit vehicles',
            'series' => ['Parking Fury 3D: Beach City', 'Parking Fury 3D: Bounty Hunter'],
            'cover' => '/uploads/g-mvhrth5h-4f26a042.jpg/',
        ],
    ];
}

/** Curated related games (homepage "Related parking and driving games"). */
function pf_related_games(): array
{
    return [
        [
            'slug' => 'parking-fury-3d-beach-city',
            'name' => 'Parking Fury 3D: Beach City',
            'developer' => 'Brain Software',
            'url' => '/games/parking-fury-3d-beach-city/',
            'cover' => '/uploads/g-mvhsiw7n-692eea77.jpg/',
            'description' => 'Drive varied cars through narrow alleys of a beachside town, park in marked spots and slip away from police cars watching the area.',
            'devices' => 'Desktop & Mobile',
            'release' => 'November 2019',
            'diff' => 'a sunny 3D town instead of flat lots',
        ],
        [
            'slug' => 'parking-fury-3d-bounty-hunter',
            'name' => 'Parking Fury 3D: Bounty Hunter',
            'developer' => 'Brain Software',
            'url' => '/games/parking-fury-3d-bounty-hunter/',
            'cover' => '/uploads/g-cover-bounty.jpg/',
            'description' => 'Hunt target vehicles in a gritty 3D city, evade police cars and deliver each car to its drop-off spot for the reward.',
            'devices' => 'Desktop & Mobile',
            'release' => 'March 2019',
            'diff' => 'mission-based car theft in a dark city',
        ],
        [
            'slug' => 'parking-fury-3d-night-thief',
            'name' => 'Parking Fury 3D: Night Thief',
            'developer' => 'Brain Software',
            'url' => '/games/parking-fury-3d-night-thief/',
            'cover' => '/uploads/g-cover-nightthief.jpg/',
            'description' => 'Infiltrate city docks under darkness, seize high-performance luxury vehicles, and execute clean deliveries.',
            'devices' => 'Desktop & Mobile',
            'release' => '2020',
            'diff' => 'midnight stealth operations with luxury cars',
        ],
        [
            'slug' => 'car-parking-school',
            'name' => 'Car Parking School',
            'developer' => 'Peynir Games',
            'url' => '/games/car-parking-school/',
            'cover' => '/uploads/g-cover-parkschool.jpg/',
            'description' => 'A driving simulator built around learning traffic rules, with tight parallel parking and reverse parking missions.',
            'devices' => 'Desktop, phone and tablet',
            'release' => 'April 2025',
            'diff' => 'structured lessons and it runs on phones',
        ],
        [
            'slug' => 'extreme-car-parking',
            'name' => 'Extreme Car Parking!',
            'developer' => 'QKY Games',
            'url' => '/games/extreme-car-parking/',
            'cover' => '/uploads/g-cover-extremepark.jpg/',
            'description' => 'Precision parking through the tightest spaces, with barriers to avoid and a designated slot for every level.',
            'devices' => 'Desktop, phone and tablet',
            'release' => 'March 2019',
            'diff' => 'pure slot precision with mobile support',
        ],
        [
            'slug' => 'dubai-police-parking-2',
            'name' => 'Dubai Police Parking 2',
            'developer' => 'Park Studios',
            'url' => '/games/dubai-police-parking-2/',
            'cover' => '/uploads/g-cover-dubaipolice.jpg/',
            'description' => 'Pilot a fast luxury patrol car through city streets, handle tight turns and park at crime scenes without a scratch.',
            'devices' => 'Desktop & Mobile',
            'release' => '2021',
            'diff' => 'speedy patrol-car handling',
        ],
        [
            'slug' => 'park-out',
            'name' => 'Park Out & Master',
            'developer' => 'BrainLogic',
            'url' => '/games/park-out/',
            'cover' => '/uploads/g-cover-parkout.jpg/',
            'description' => 'A sliding-block puzzle: slide cars and buses forward or backward to open exit lanes and free a jammed lot.',
            'devices' => 'Desktop, phone and tablet',
            'release' => '2022',
            'diff' => 'no driving at all — pure puzzle logic',
        ],
        [
            'slug' => 'drive-and-park',
            'name' => 'Drive and Park',
            'developer' => 'TapPlay',
            'url' => '/games/drive-and-park/',
            'cover' => '/uploads/g-cover-drivepark.jpg/',
            'description' => 'One-tap drifting into curbside parking spaces. Master precision timing to slide into spots without clipping cars.',
            'devices' => 'Desktop, phone and tablet',
            'release' => '2023',
            'diff' => 'one-touch arcade drift timing',
        ],
        [
            'slug' => 'parking-fury-3',
            'name' => 'Parking Fury 3',
            'developer' => 'Andriy Pidvirnyy',
            'url' => '/games/parking-fury-3/',
            'cover' => '/uploads/g-cover-pf3.jpg/',
            'description' => 'The third entry in the original series — dark night environments, headlight navigation, and tighter handling.',
            'devices' => 'Desktop & Mobile',
            'release' => 'October 2017',
            'diff' => 'night-time driving with headlights',
        ],
        [
            'slug' => 'traffic-rush',
            'name' => 'Parking Fury 2',
            'developer' => 'Andriy Pidvirnyy',
            'url' => '/games/traffic-rush/',
            'cover' => '/uploads/g-mvhs6r7l-f4c36f71.jpg/',
            'description' => 'Same creator, new maps and extra vehicle handling physics across 10 challenging urban parking courses.',
            'devices' => 'Desktop & Mobile',
            'release' => 'March 2017',
            'diff' => '10 tougher urban stages with new cars',
        ],
    ];
}
