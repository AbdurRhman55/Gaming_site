/**
 * Cover-image upload handling for the admin dashboard.
 *
 * Files are stored under data/uploads/ (outside public/ — public/ is replaced
 * wholesale on every build) and served by the SSR route /uploads/[...file].
 * SVG uploads are deliberately rejected: an inline SVG served from our origin
 * can execute script, so only raster formats are accepted.
 */
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { UPLOADS_DIR, UPLOADS_WEB } from './store';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Covers render at a few hundred CSS px — 1600 keeps 2× retina headroom. */
const MAX_EDGE = 1600;
/** Anything at or under this weight is already web-sized; leave it alone. */
const TARGET_BYTES = 400 * 1024;

/**
 * Downscale/re-encode an uploaded raster image so a multi-megabyte camera or
 * AI export can't wreck LCP on the library. Returns null when the original
 * should be kept (already small, animated, or anything sharp can't decode) —
 * callers fall back to the untouched bytes, so an optimization problem can
 * never fail an upload.
 */
async function optimizeCover(buf: Buffer, mime: string): Promise<Buffer | null> {
  // GIF may be animated and AVIF rarely benefits from a re-encode — keep as-is.
  if (mime === 'image/gif' || mime === 'image/avif') return null;
  try {
    const img = sharp(buf, { failOn: 'none' });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return null;
    if (meta.width <= MAX_EDGE && meta.height <= MAX_EDGE && buf.length <= TARGET_BYTES) return null;

    const pipeline = img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
    let out: Buffer;
    if (mime === 'image/png') out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    else if (mime === 'image/webp') out = await pipeline.webp({ quality: 82 }).toBuffer();
    else out = await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
    // Never make the file bigger than what the operator sent.
    return out.length < buf.length ? out : null;
  } catch {
    return null;
  }
}

const ALLOWED = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/avif', '.avif'],
]);

export class UploadError extends Error {}

export interface SavedUpload {
  url: string;
  filename: string;
  bytes: number;
}

export async function saveUpload(request: Request): Promise<SavedUpload> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new UploadError('Expected a multipart form upload.');
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new UploadError('No "file" field in the form.');
  if (file.size === 0) throw new UploadError('The uploaded file is empty.');
  if (file.size > MAX_BYTES) throw new UploadError('Images must be 8 MB or smaller.');
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new UploadError('Unsupported file type. Use JPG, PNG, WebP, GIF or AVIF.');

  mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = `g-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}${ext}`;
  const original = Buffer.from(await file.arrayBuffer());
  const stored = (await optimizeCover(original, file.type)) ?? original;
  await writeFile(join(UPLOADS_DIR, filename), stored);
  // Trailing slash is deliberate: with `trailingSlash: 'always'` the dynamic
  // /uploads/[file] route only matches slash-terminated paths (verified: the
  // slash-less form 404s, static-named endpoints are exempt).
  return { url: `${UPLOADS_WEB}/${filename}/`, filename, bytes: stored.length };
}
