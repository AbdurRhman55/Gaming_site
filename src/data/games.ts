/**
 * Verified game facts.
 *
 * Sources (checked 20 October 2026):
 *  - Coolmath Games game pages (official host of Parking Fury 1-3):
 *    release dates, instructions, level count, creator.
 *  - Poki game pages (official host of the Parking Fury 3D series):
 *    developer, controls, supported devices, release/update dates.
 * No values here are guessed. Fields that could not be verified are omitted
 * rather than filled with plausible-sounding data.
 */

export interface GameVersion {
  /** Local guide path; null when this site's homepage owns the game. */
  path: string | null;
  slug: string;
  name: string;
  tagline: string;
  developer: string;
  host: string;
  officialUrl: string;
  release: string;
  platform: string;
  controls: string;
  /** Only populated where the source states it. */
  levels?: number;
  series?: string[];
  art: string;
  cover?: string;
}

export const VERSIONS: GameVersion[] = [
  {
    path: '/',
    slug: 'parking-fury',
    name: 'Parking Fury',
    tagline: 'The original top-down parking game: 10 levels, one creator, no-frills precision.',
    developer: 'Andriy Pidvirnyy',
    host: 'Coolmath Games',
    officialUrl: 'https://www.coolmathgames.com/0-parking-fury',
    release: '26 May 2016',
    platform: 'Browser and mobile',
    controls: 'WASD or arrow keys',
    levels: 10,
    art: 'pf1',
    cover: '/uploads/g-mvhs1q65-9f1503bf.jpg/',
  },
  {
    path: '/parking-fury-2/',
    slug: 'parking-fury-2',
    name: 'Parking Fury 2',
    tagline: 'Same creator, new maps and a couple of extra features.',
    developer: 'Andriy Pidvirnyy',
    host: 'Coolmath Games',
    officialUrl: 'https://www.coolmathgames.com/0-parking-fury-2',
    release: '23 March 2017',
    platform: 'Browser and mobile',
    controls: 'WASD or arrow keys',
    art: 'pf2',
    cover: '/uploads/g-mvhs6r7l-f4c36f71.jpg/',
  },
  {
    path: '/parking-fury-3/',
    slug: 'parking-fury-3',
    name: 'Parking Fury 3',
    tagline: 'The third entry in the original series — more maps, same tight handling.',
    developer: 'Andriy Pidvirnyy',
    host: 'Coolmath Games',
    officialUrl: 'https://www.coolmathgames.com/0-parking-fury-3',
    release: '19 October 2017',
    platform: 'Browser and mobile',
    controls: 'WASD or arrow keys',
    art: 'pf3',
    cover: '/uploads/g-cover-pf3.jpg/',
  },
  {
    path: '/parking-fury-3d/',
    slug: 'parking-fury-3d',
    name: 'Parking Fury 3D',
    tagline: 'A separate 3D series: steal, drive and deliver cars through city streets.',
    developer: 'Brain Software',
    host: 'Poki',
    officialUrl: 'https://poki.com/en/g/parking-fury-3d',
    release: 'March 2019',
    platform: 'Desktop (per Poki’s supported-devices list)',
    controls: 'Arrow keys to drive, Ctrl to enter or exit vehicles',
    series: ['Parking Fury 3D: Beach City', 'Parking Fury 3D: Bounty Hunter'],
    art: 'pf3d',
    cover: '/uploads/g-mvhrth5h-4f26a042.jpg/',
  },
];

export interface RelatedGame {
  slug: string;
  name: string;
  developer: string;
  host: string;
  url: string;
  cover?: string;
  /** One-sentence, differentiating description based on the host’s own summary. */
  description: string;
  controls?: string;
  devices?: string;
  release?: string;
  /** How it differs from Parking Fury, in one clause. */
  diff: string;
  art: string;
}

export const RELATED_GAMES: RelatedGame[] = [
  {
    slug: 'parking-fury-3d-beach-city',
    name: 'Parking Fury 3D: Beach City',
    developer: 'Brain Software',
    host: 'In-Site Player',
    url: '/games/parking-fury-3d-beach-city/',
    cover: '/uploads/g-mvhsiw7n-692eea77.jpg/',
    description:
      'Drive varied cars through narrow alleys of a beachside town, park in marked spots and slip away from police cars watching the area.',
    controls: 'Arrow keys; Ctrl to enter a car; C to change camera',
    devices: 'Desktop & Mobile',
    release: 'November 2019',
    diff: 'a sunny 3D town instead of flat lots',
    art: 'beach',
  },
  {
    slug: 'parking-fury-3d-bounty-hunter',
    name: 'Parking Fury 3D: Bounty Hunter',
    developer: 'Brain Software',
    host: 'In-Site Player',
    url: '/games/parking-fury-3d-bounty-hunter/',
    cover: '/uploads/g-cover-bounty.jpg/',
    description:
      'Hunt target vehicles in a gritty 3D city, evade police cars and deliver each car to its drop-off spot for the reward.',
    controls: 'WASD or arrow keys; C camera; Ctrl to steal a car; Space handbrake',
    devices: 'Desktop & Mobile',
    release: 'March 2019',
    diff: 'mission-based car theft in a dark city',
    art: 'bounty',
  },
  {
    slug: 'parking-fury-3d-night-thief',
    name: 'Parking Fury 3D: Night Thief',
    developer: 'Brain Software',
    host: 'In-Site Player',
    url: '/games/parking-fury-3d-night-thief/',
    cover: '/uploads/g-cover-nightthief.jpg/',
    description:
      'Infiltrate city docks under darkness, seize high-performance luxury vehicles, and execute clean deliveries.',
    controls: 'WASD or Arrow keys; Ctrl to enter/exit; Space to drift',
    devices: 'Desktop & Mobile',
    release: '2020',
    diff: 'midnight stealth operations with luxury cars',
    art: 'bounty',
  },
  {
    slug: 'car-parking-school',
    name: 'Car Parking School',
    developer: 'Peynir Games',
    host: 'In-Site Player',
    url: '/games/car-parking-school/',
    cover: '/uploads/g-cover-parkschool.jpg/',
    description:
      'A driving simulator built around learning traffic rules, with tight parallel parking and reverse parking missions.',
    controls: 'WASD or arrow keys; E camera; Esc pause',
    devices: 'Desktop, phone and tablet',
    release: 'April 2025',
    diff: 'structured lessons and it runs on phones',
    art: 'school',
  },
  {
    slug: 'extreme-car-parking',
    name: 'Extreme Car Parking!',
    developer: 'QKY Games',
    host: 'In-Site Player',
    url: '/games/extreme-car-parking/',
    cover: '/uploads/g-cover-extremepark.jpg/',
    description:
      'Precision parking through the tightest spaces, with barriers to avoid and a designated slot for every level.',
    controls: 'Arrow keys / touch',
    devices: 'Desktop, phone and tablet',
    release: 'March 2019',
    diff: 'pure slot precision with mobile support',
    art: 'extreme',
  },
  {
    slug: 'dubai-police-parking-2',
    name: 'Dubai Police Parking 2',
    developer: 'Park Studios',
    host: 'In-Site Player',
    url: '/games/dubai-police-parking-2/',
    cover: '/uploads/g-cover-dubaipolice.jpg/',
    description:
      'Pilot a fast luxury patrol car through city streets, handle tight turns and park at crime scenes without a scratch.',
    controls: 'Arrow keys / WASD to steer, Space to brake',
    devices: 'Desktop & Mobile',
    release: '2021',
    diff: 'speedy patrol-car handling',
    art: 'dubai',
  },
  {
    slug: 'park-out',
    name: 'Park Out & Master',
    developer: 'BrainLogic',
    host: 'In-Site Player',
    url: '/games/park-out/',
    cover: '/uploads/g-cover-parkout.jpg/',
    description:
      'A sliding-block puzzle: slide cars and buses forward or backward to open exit lanes and free a jammed lot.',
    controls: 'Mouse drag or finger swipe',
    devices: 'Desktop, phone and tablet',
    release: '2022',
    diff: 'no driving at all — pure puzzle logic',
    art: 'puzzle',
  },
  {
    slug: 'drive-and-park',
    name: 'Drive and Park',
    developer: 'TapPlay',
    host: 'In-Site Player',
    url: '/games/drive-and-park/',
    cover: '/uploads/g-cover-drivepark.jpg/',
    description:
      'One-tap drifting into curbside parking spaces. Master precision timing to slide into spots without clipping cars.',
    controls: 'Hold Space / Tap to drift, release to park',
    devices: 'Desktop, phone and tablet',
    release: '2023',
    diff: 'one-touch arcade drift timing',
    art: 'mania',
  },
  {
    slug: 'parking-fury-3',
    name: 'Parking Fury 3',
    developer: 'Andriy Pidvirnyy',
    host: 'In-Site Player',
    url: '/games/parking-fury-3/',
    cover: '/uploads/g-cover-pf3.jpg/',
    description:
      'The third entry in the original series — dark night environments, headlight navigation, and tighter handling.',
    controls: 'WASD or arrow keys',
    devices: 'Desktop & Mobile',
    release: 'October 2017',
    diff: 'night-time driving with headlights',
    art: 'pf3',
  },
  {
    slug: 'traffic-rush',
    name: 'Parking Fury 2',
    developer: 'Andriy Pidvirnyy',
    host: 'In-Site Player',
    url: '/games/traffic-rush/',
    cover: '/uploads/g-mvhs6r7l-f4c36f71.jpg/',
    description:
      'Same creator, new maps and extra vehicle handling physics across 10 challenging urban parking courses.',
    controls: 'WASD or arrow keys',
    devices: 'Desktop & Mobile',
    release: 'March 2017',
    diff: '10 tougher urban stages with new cars',
    art: 'pf2',
  },
];

/** Official hosts to credit for outbound "play the official game" links. */
export const OFFICIAL_HOSTS = {
  coolmath: 'https://www.coolmathgames.com/0-parking-fury',
  coolmathSeries: 'https://www.coolmathgames.com/c/parking-fury-games',
  poki3d: 'https://poki.com/en/g/parking-fury-3d',
  pokiParking: 'https://poki.com/en/parking',
} as const;
