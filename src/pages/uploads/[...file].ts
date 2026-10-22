import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../../lib/store';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/**
 * Runtime server for admin-uploaded cover images. Files live in data/uploads/
 * (not public/, which is replaced on every build) — this route streams them
 * with the right content type and an immutable cache header.
 */
export const GET: APIRoute = async ({ params }) => {
  // Plain filenames only — reject separators and traversal. A defensive
  // trailing-slash strip keeps either URL shape working.
  const name = (params.file ?? '').replace(/\/+$/, '');
  // Plain filenames only — reject separators and traversal.
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const filePath = join(UPLOADS_DIR, name);
  if (!existsSync(filePath)) return new Response('Not found', { status: 404 });
  const type = TYPES[name.slice(name.lastIndexOf('.')).toLowerCase()] ?? 'application/octet-stream';
  const data = await readFile(filePath);
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': type,
      'Content-Length': String(statSync(filePath).size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
