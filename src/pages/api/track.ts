/**
 * First-party analytics beacon — POST /api/track/
 *
 *   { "kind": "view", "path": "/tips/" }     → count a page load
 *   { "kind": "play", "slug": "tight-lot" }  → count a game-frame open
 *
 * Why a beacon instead of a server request log: the node adapter serves
 * prerendered (editorial) pages straight from disk, so request logging can
 * never see them — SEO pages would show zero forever. The browser reports the
 * load; this server is the only thing that records it. No cookies, no third
 * parties, no cross-site request accepted.
 *
 * Validation is deliberately strict so the numbers stay trustworthy:
 *   - Origin/Referer must resolve to this host (foreign pages cannot forge),
 *   - paths must be clean internal routes (no scheme, query, or admin/api),
 *   - slugs must match the site's slug shape.
 * Operator activity is excluded client-side (admin pages are noindex) and
 * server-side (admin/api paths rejected), so dashboard counts stay honest.
 */
import type { APIRoute } from 'astro';
import { trackPlay, trackView } from '../../lib/analytics';

const MAX_PATH = 200;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const PATH_RE = /^\/[a-z0-9\-/]*$/; // our routes are lowercase; no dots, %, spaces
const BLOCKED = ['/admin', '/api', '/uploads', '/_astro', '/images'];

const bad = (status: number, error: string): Response =>
  new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** The beacon is write-only; answer other methods honestly (405 + Allow). */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });

export const POST: APIRoute = async ({ request, url }) => {
  // 1) Same-origin only. Browsers attach Origin to every same-origin POST;
  //    fall back to Referer for older engines. Neither present → reject.
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  let sender: string | null = origin;
  if (!sender && referer) {
    try {
      sender = new URL(referer).origin;
    } catch {
      sender = null;
    }
  }
  let senderHost: string | null = null;
  if (sender) {
    try {
      senderHost = new URL(sender).host;
    } catch {
      senderHost = null;
    }
  }
  if (!senderHost || senderHost !== url.host) return bad(403, 'cross-origin');

  // 2) Shape of the payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad(400, 'invalid json');
  }
  const kind = (body as { kind?: unknown } | null)?.kind;
  if (kind === 'view') {
    const path = (body as { path?: unknown }).path;
    if (typeof path !== 'string' || !path || path.length > MAX_PATH) return bad(400, 'bad path');
    if (!PATH_RE.test(path)) return bad(400, 'bad path');
    if (BLOCKED.some((pre) => path === pre || path.startsWith(`${pre}/`))) return bad(400, 'blocked path');
    trackView(path);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (kind === 'play') {
    const slug = (body as { slug?: unknown }).slug;
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return bad(400, 'bad slug');
    trackPlay(slug);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return bad(400, 'bad kind');
};
