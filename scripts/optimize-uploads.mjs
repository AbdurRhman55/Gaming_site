/**
 * One-off/opt-in maintenance: re-encode oversized cover images in data/uploads/
 * so multi-megabyte originals can't wreck LCP on the games library.
 *
 *  - originals are copied to data/uploads-backups/ FIRST (never deleted)
 *  - files are re-encoded in place under the SAME filename, so
 *    data/games.json needs no edits and every existing /uploads/… URL keeps
 *    working
 *  - images already web-sized (≤1600px on the long edge and ≤400 KB) and
 *    GIF/AVIF files are left untouched
 *  - if a re-encode ever comes out larger than the original, the original wins
 *
 * Run: node scripts/optimize-uploads.mjs [--dry]
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = join(ROOT, 'data', 'uploads');
const BACKUPS = join(ROOT, 'data', 'uploads-backups');
const DRY = process.argv.includes('--dry');

const MAX_EDGE = 1600;
const TARGET_BYTES = 400 * 1024;
const PROCESSABLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const pct = (a, b) => `${Math.round((1 - a / b) * 100)}%`;

let changed = 0;
let kept = 0;

for (const name of readdirSync(UPLOADS).sort()) {
  const ext = extname(name).toLowerCase();
  const file = join(UPLOADS, name);
  if (!statSync(file).isFile() || !PROCESSABLE.has(ext)) {
    kept += 1;
    continue;
  }
  const before = readFileSync(file);
  let meta;
  try {
    meta = await sharp(before, { failOn: 'none' }).metadata();
  } catch {
    console.log(`skip  ${name} — cannot decode`);
    kept += 1;
    continue;
  }
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longEdge <= MAX_EDGE && before.length <= TARGET_BYTES) {
    console.log(`ok    ${name} — already web-sized (${kb(before.length)})`);
    kept += 1;
    continue;
  }

  let out = null;
  try {
    const pipeline = sharp(before, { failOn: 'none' }).resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    });
    if (ext === '.png') out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    else if (ext === '.webp') out = await pipeline.webp({ quality: 82 }).toBuffer();
    else out = await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
  } catch (e) {
    console.log(`skip  ${name} — re-encode failed (${e.message})`);
    kept += 1;
    continue;
  }
  if (out.length >= before.length) {
    console.log(`keep  ${name} — re-encode not smaller (${kb(before.length)})`);
    kept += 1;
    continue;
  }

  if (DRY) {
    console.log(`dry   ${name} — ${kb(before.length)} → ${kb(out.length)} (${pct(out.length, before.length)} smaller)`);
    continue;
  }
  mkdirSync(BACKUPS, { recursive: true });
  const backup = join(BACKUPS, name);
  // Never overwrite an existing backup — the first copy is the true original.
  if (!existsSync(backup)) copyFileSync(file, backup);
  writeFileSync(file, out);
  changed += 1;
  console.log(
    `fix   ${name} — ${kb(before.length)} → ${kb(out.length)} (${pct(out.length, before.length)} smaller), backup: data/uploads-backups/${name}`,
  );
}

console.log(`\n${changed} file(s) optimized, ${kept} left as-is${DRY ? ' (dry run — nothing written)' : ''}.`);
