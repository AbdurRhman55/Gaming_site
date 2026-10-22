/**
 * Embed URL parsing + validation.
 *
 * The dashboard accepts either a bare game URL or a pasted <iframe> embed
 * code (the form most game portals hand you). Either way we store only the
 * URL and render the iframe ourselves with consistent, safe attributes —
 * operator-supplied raw HTML is never injected into a page.
 */

const IFRAME_SRC_RE = /<iframe[^>]*?\ssrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i;

export class EmbedError extends Error {}

/** Turn a pasted URL or embed code into a single validated embed URL. */
export function parseEmbed(rawInput: string): string {
  const raw = rawInput.trim();
  if (!raw) throw new EmbedError('Paste a game URL or an <iframe> embed code.');
  let url = raw;
  if (/<iframe/i.test(raw)) {
    const match = IFRAME_SRC_RE.exec(raw);
    if (!match) throw new EmbedError('No src="…" was found inside the iframe code.');
    url = (match[1] ?? match[2] ?? match[3] ?? '').trim();
  }
  return validateEmbedUrl(url);
}

/** Internal paths (our own embed pages) or https:// URLs only. */
export function validateEmbedUrl(url: string): string {
  // Internal path: a single leading slash — "//host" (protocol-relative) is rejected.
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new EmbedError('That is not a valid URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new EmbedError('Game URLs must use https:// (or an internal /path on this site).');
  }
  return parsed.toString();
}

/** True when the embed points at one of our own pages. */
export function isInternalEmbed(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
