import type { APIRoute } from 'astro';

/**
 * robots.txt — generated so the sitemap URL always matches the configured
 * site origin (SITE_URL). No assets are blocked; the site has no private paths.
 */
export const GET: APIRoute = ({ site }) => {
  const base = String(site ?? 'http://localhost:4321').replace(/\/+$/, '');
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: ' + base + '/sitemap.xml',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
