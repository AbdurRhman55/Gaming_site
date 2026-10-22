import type { APIRoute } from 'astro';
import { PAGES } from '../data/seo';
import { listGames } from '../lib/store';

/**
 * XML sitemap — built from the SEO registry plus the live games library, so
 * only canonical, indexable URLs can appear here (noindex routes such as the
 * 404 page and the admin dashboard are excluded automatically). Rendered at
 * request time so newly published games are listed without a rebuild.
 * SITE_CONTENT_UPDATED is the date the static content was last reviewed;
 * game entries use their own updatedAt instead.
 */
const SITE_CONTENT_UPDATED = '2026-10-20';

export const GET: APIRoute = ({ site }) => {
  const base = String(site ?? 'http://localhost:4321').replace(/\/+$/, '');

  const entry = (loc: string, lastmod: string) =>
    ['  <url>', `    <loc>${loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`, '  </url>'].join('\n');

  const registryUrls = Object.values(PAGES)
    .filter((page) => !page.noindex)
    .map((page) => entry(page.path === '/' ? base + '/' : base + page.path, SITE_CONTENT_UPDATED));

  const gameUrls = listGames({ publishedOnly: true }).map((game) =>
    entry(base + `/games/${game.slug}/`, game.updatedAt.slice(0, 10)),
  );

  // Note: '/games/' lives in the PAGES registry — no separate entry needed.
  const urls = [...registryUrls, ...gameUrls].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
