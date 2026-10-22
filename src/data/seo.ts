/**
 * Central SEO registry — one entry per indexable route.
 *
 * Every page pulls its title, meta description, canonical path, robots policy
 * and breadcrumb label from here, which guarantees uniqueness and makes
 * duplicate/missing metadata detectable at build time (see scripts/check-site.mjs).
 *
 * `intent`, `primary` and `secondary` document the keyword-to-URL map
 * (see docs/SEO-STRATEGY.md). They are research SEEDS, not measured volumes.
 */

export interface PageSEO {
  /** Route path with trailing slash (matches astro.config.mjs trailingSlash: 'always'). */
  path: string;
  /** Full title tag, unique per page, no automatic suffix is appended. */
  title: string;
  /** Unique meta description, ~140-160 chars. */
  description: string;
  /** Primary search intent this single URL is meant to satisfy. */
  intent: string;
  /** Primary keyword cluster (seed, no volume data implied). */
  primary: string;
  /** Secondary terms this page may rank for without cannibalising others. */
  secondary: string[];
  /** Breadcrumb label (short); omitted only on the homepage. */
  breadcrumb?: string;
  /** Set true for pages that must stay out of the index (404). */
  noindex?: boolean;
}

export const PAGES: Record<string, PageSEO> = {
  '/': {
    path: '/',
    title: 'Parking Fury: Play Online, Controls & Guides',
    description:
      'Master Parking Fury with verified controls, level strategies, practical tips, and links to every version in the series — Parking Fury 2, 3 and 3D.',
    intent: 'Play the original Parking Fury and learn how it works',
    primary: 'parking fury / play parking fury / parking fury game',
    secondary: ['parking fury online', 'parking fury free', 'parking fury unblocked (answered in FAQ)', 'parking fury walkthrough'],
  },
  '/games/': {
    path: '/games/',
    title: 'Free Parking & Driving Games That Play Online',
    description:
      'Play free parking and driving games right here in your browser — no downloads, no redirects. Search the library or filter by category and jump straight in.',
    intent: 'Browse and play free browser parking/driving games',
    primary: 'parking games online / free driving games',
    secondary: ['play games online free', 'browser parking games', 'car games unblocked'],
    breadcrumb: 'Games',
  },
  '/parking-fury-2/': {
    path: '/parking-fury-2/',
    title: 'Parking Fury 2: Controls, Release & How to Play',
    description:
      'Parking Fury 2 arrived in 2017 with new maps from the original creator. See its official controls, what changed from the first game, and where to play it.',
    intent: 'Find and understand the second Parking Fury game',
    primary: 'parking fury 2',
    secondary: ['parking fury 2 controls', 'parking fury 2 play online', 'parking fury 2 unblocked'],
    breadcrumb: 'Parking Fury 2',
  },
  '/parking-fury-3/': {
    path: '/parking-fury-3/',
    title: 'Parking Fury 3: What Changed and How to Play',
    description:
      'The third Parking Fury game from Andriy Pidvirnyy, released October 2017. Find out how it plays, its official controls, and where to play it online.',
    intent: 'Find and understand the third Parking Fury game',
    primary: 'parking fury 3',
    secondary: ['parking fury 3 controls', 'parking fury 3 play online', 'parking fury 3 unblocked'],
    breadcrumb: 'Parking Fury 3',
  },
  '/parking-fury-3d/': {
    path: '/parking-fury-3d/',
    title: 'Parking Fury 3D: Controls, Missions & Series Guide',
    description:
      'Parking Fury 3D swaps top-down lots for 3D city streets. Get its exact controls, mission basics, and details on Beach City and Bounty Hunter.',
    intent: 'Find and understand the 3D spin-off series',
    primary: 'parking fury 3d',
    secondary: ['parking fury 3d controls', 'parking fury 3d beach city', 'parking fury 3d bounty hunter'],
    breadcrumb: 'Parking Fury 3D',
  },
  '/how-to-play/': {
    path: '/how-to-play/',
    title: 'Parking Fury Controls: Keyboard and Touch Guide',
    description:
      'Every Parking Fury control in one place: WASD and arrow-key driving, the on-screen wheel and pedals on touch devices, plus what changes in each version.',
    intent: 'Learn the controls and how to play',
    primary: 'parking fury controls / how to play parking fury',
    secondary: ['parking fury keys', 'parking fury arrow keys', 'parking fury mobile controls'],
    breadcrumb: 'How to Play',
  },
  '/walkthrough/': {
    path: '/walkthrough/',
    title: 'Parking Fury Walkthrough: Levels, Maps & Strategies',
    description:
      'Parking Fury has 10 confirmed levels. See how difficulty ramps, what a clean run costs, and the method that transfers to every map — plus tested mini-game walkthroughs.',
    intent: 'Get help finishing levels',
    primary: 'parking fury walkthrough / parking fury levels',
    secondary: ['parking fury level 10', 'parking fury all levels', 'parking fury 2 walkthrough'],
    breadcrumb: 'Walkthrough',
  },
  '/tips/': {
    path: '/tips/',
    title: 'Parking Fury Tips, Mistakes & Troubleshooting',
    description:
      'Practical Parking Fury advice: cleaner parking angles, how to recover from scrapes, and fixes for loading, sound, and performance problems.',
    intent: 'Improve at the game or fix a problem',
    primary: 'parking fury tips / parking fury help',
    secondary: ['parking fury not working', 'parking fury unblocked at school', 'parking fury mobile compatibility', 'parking fury cheats'],
    breadcrumb: 'Tips & Troubleshooting',
  },
  '/similar-games/': {
    path: '/similar-games/',
    title: '10 Games Like Parking Fury to Play Next',
    description:
      'Curated parking and driving games with a similar skill set — 3D city parking, truck parking and slide-out puzzles — each with controls and device support listed.',
    intent: 'Discover comparable games',
    primary: 'games like parking fury / car parking games',
    secondary: ['browser driving games', 'parking games online', 'parking fury alternatives'],
    breadcrumb: 'Similar Games',
  },
  '/about/': {
    path: '/about/',
    title: 'About This Independent Parking Fury Resource',
    description:
      'What this site covers, where every fact comes from, how the original mini-game was made, and how the site stays independent of the game’s platforms.',
    intent: 'Evaluate the site’s credibility',
    primary: 'about / site credibility',
    secondary: ['is this site official', 'parking fury fan site'],
    breadcrumb: 'About',
  },
  '/contact/': {
    path: '/contact/',
    title: 'Contact Us — Corrections, Questions & Takedowns',
    description:
      'Questions, corrections, or a takedown request? Reach the person behind this independent Parking Fury resource — no forms, no tracking, just email.',
    intent: 'Reach the site operator',
    primary: 'contact',
    secondary: ['copyright takedown', 'report an error'],
    breadcrumb: 'Contact',
  },
  '/privacy/': {
    path: '/privacy/',
    title: 'Privacy Policy: What This Site Collects (Very Little)',
    description:
      'No accounts, no ads, no tracking cookies — only same-origin counters. Read exactly what this site stores, how embeds behave, and what happens when you play the mini-game.',
    intent: 'Understand data handling',
    primary: 'privacy policy',
    secondary: ['does this site use cookies', 'data collection'],
    breadcrumb: 'Privacy',
  },
  '/terms/': {
    path: '/terms/',
    title: 'Terms of Use and Disclaimers',
    description:
      'Ground rules for using this site, plus clear disclaimers about third-party games, trademarks, external links and the original mini-game.',
    intent: 'Understand usage terms',
    primary: 'terms of use',
    secondary: ['disclaimer', 'copyright'],
    breadcrumb: 'Terms',
  },
  '/404': {
    path: '/404',
    title: 'Page Not Found',
    description: 'That page does not exist. Head back to the homepage or jump straight into the game.',
    intent: 'Error recovery',
    primary: '404',
    secondary: [],
    noindex: true,
  },
};

/** Absolute URL for a route, based on the configured site origin. */
export function canonicalUrl(site: string | URL, path: string): string {
  const base = String(site).replace(/\/+$/, '');
  if (path === '/') return base + '/';
  return base + path;
}
