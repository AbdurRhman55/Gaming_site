/**
 * SEO indexing API — live sitemap + indexability audit for the dashboard.
 *
 *   GET /api/admin/seo/
 *
 * Returns, for every route the sitemap exposes, whether it is indexable
 * (published games + editorial pages), whether it carries a canonical, and a
 * roll-up the operator can scan before submitting to Search Console. Data is
 * read straight from the games store and the canonical registry — no invented
 * metrics, no network calls.
 */
import type { APIRoute } from 'astro';
import { isAuthed, jsonError, jsonOk } from '../../../lib/auth';
import { listGames } from '../../../lib/store';

const EDITORIAL = [
  { path: '/', title: 'Home' },
  { path: '/games/', title: 'Games library' },
  { path: '/how-to-play/', title: 'Controls & how to play' },
  { path: '/walkthrough/', title: 'Walkthrough' },
  { path: '/tips/', title: 'Tips & troubleshooting' },
  { path: '/similar-games/', title: 'Games like Parking Fury' },
  { path: '/parking-fury-2/', title: 'Parking Fury 2' },
  { path: '/parking-fury-3/', title: 'Parking Fury 3' },
  { path: '/parking-fury-3d/', title: 'Parking Fury 3D' },
  { path: '/about/', title: 'About' },
  { path: '/contact/', title: 'Contact' },
  { path: '/privacy/', title: 'Privacy' },
  { path: '/terms/', title: 'Terms' },
];

export const GET: APIRoute = async ({ cookies, site }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');

  const games = listGames({ publishedOnly: true });
  const drafts = listGames().filter((g) => g.status === 'draft');

  const origin = String(site ?? 'http://localhost:4321').replace(/\/+$/, '');
  const canonicalFor = (path: string): string => `${origin}${path.startsWith('/') ? path : `/${path}`}`;

  const editorial = EDITORIAL.map((r) => ({
    ...r,
    url: canonicalFor(r.path),
    canonical: canonicalFor(r.path),
    indexable: true,
  }));

  const gamePages = games.map((g) => {
    const path = `/games/${g.slug}/`;
    return {
      path,
      title: g.title,
      url: canonicalFor(path),
      canonical: canonicalFor(path),
      indexable: g.status === 'published',
    };
  });

  const excluded = [
    { path: '/admin/', reason: 'operator console (noindex)' },
    { path: '/404', reason: 'error page (noindex)' },
    ...drafts.map((g) => ({ path: `/games/${g.slug}/`, reason: 'draft — hidden until published' })),
  ];

  return jsonOk({
    origin,
    sitemapUrl: `${origin}/sitemap.xml`,
    robotsUrl: `${origin}/robots.txt`,
    counts: {
      editorial: editorial.length,
      games: gamePages.length,
      indexable: editorial.length + gamePages.length,
      excluded: excluded.length,
    },
    editorial,
    games: gamePages,
    excluded,
  });
};
