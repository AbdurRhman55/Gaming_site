/**
 * Site-wide identity, navigation and legal copy.
 * Single source of truth — components and pages import from here.
 */

export const SITE = {
  name: 'Parking Fury Guide',
  shortName: 'PF Guide',
  tagline:
    'Independent Parking Fury resource with free parking and driving games that play right in your browser — no downloads, no redirects.',
  /** Filled in by BaseLayout from Astro `site` (SITE_URL env) for absolute URLs. */
  locale: 'en_US',
  themeColor: '#111318',
} as const;

export interface NavItem {
  href: string;
  label: string;
  description?: string;
}

/** Primary header navigation (desktop + mobile). */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/games/', label: 'Games', description: 'Free games that play right on this site' },
  { href: '/how-to-play/', label: 'How to Play', description: 'Keyboard, touch, and every control explained' },
  { href: '/walkthrough/', label: 'Walkthrough', description: 'Level structure and tested parking strategies' },
  { href: '/tips/', label: 'Tips', description: 'Practical advice, common mistakes, and fixes' },
  { href: '/similar-games/', label: 'Similar Games', description: 'Other parking and driving games worth your time' },
];

/** Footer link columns. */
export const FOOTER_NAV: { title: string; links: NavItem[] }[] = [
  {
    title: 'Play',
    links: [
      { href: '/games/', label: 'All games' },
      { href: '/games/tight-lot/', label: 'Tight Lot (our game)' },
      { href: '/parking-fury-2/', label: 'Parking Fury 2' },
      { href: '/parking-fury-3/', label: 'Parking Fury 3' },
      { href: '/parking-fury-3d/', label: 'Parking Fury 3D' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { href: '/how-to-play/', label: 'Controls & how to play' },
      { href: '/walkthrough/', label: 'Walkthrough' },
      { href: '/tips/', label: 'Tips & troubleshooting' },
      { href: '/similar-games/', label: 'Games like Parking Fury' },
    ],
  },
  {
    title: 'Site',
    links: [
      { href: '/about/', label: 'About this site' },
      { href: '/contact/', label: 'Contact' },
      { href: '/privacy/', label: 'Privacy policy' },
      { href: '/terms/', label: 'Terms of use' },
    ],
  },
];

export const DISCLAIMER =
  'Parking Fury and its sequels are the property of their respective creators. This site is an independent, fan-made player resource — it is not affiliated with, endorsed by, or sponsored by the game developer, Coolmath Games, Poki, or any other platform. Games embedded on this site are loaded from their providers inside an iframe; the site operator is responsible for embedding only games they have the right to embed.';
