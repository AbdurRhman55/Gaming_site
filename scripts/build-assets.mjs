#!/usr/bin/env node
/**
 * Regenerate optimized brand assets from the originals in public/.
 *
 *   node scripts/build-assets.mjs
 *
 * - public/images/logo-hero.jpg  ← resized from public/logo.jpg (the user's
 *   original 2752×1536 brand artwork). Displayed by VideoHero as the brand
 *   plate (max 29rem wide), so 960px = ~2× retina coverage. Keeping it web-sized
 *   protects LCP; the 2.7 MB original is never referenced by the page.
 *
 * - public/images/logo-mark.png  ← square app-icon crop of the golden car from
 *   the same artwork (dark background sampled from the image itself), used in
 *   the header, footer, admin and game HUDs at 32–64 px.
 *
 * The video poster (public/images/hero-poster.jpg) is hand-composed from the
 * same artwork at 1200×630 (OG dimensions) and is not regenerated here.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'logo.jpg');

/* ---- brand plate (hero / footer) ---- */
const hero = await sharp(SRC)
  .resize({ width: 960, withoutEnlargement: true, fit: 'inside' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(ROOT, 'public', 'images', 'logo-hero.jpg'));

/* ---- square logo mark (header / footer / admin / HUD) ---- */
// Car bounding box in the 2752×1536 source: x≈720..2130, y≈90..880.
const CAR = { left: 700, top: 70, width: 1450, height: 830 };
// Sample the artwork's dark background so the letterbox padding matches
// seamlessly (sharp applies resize before extend, so use fit: 'contain'
// with a background instead of extending).
const px = await sharp(SRC).extract({ left: 12, top: 12, width: 1, height: 1 }).raw().toBuffer();
const bg = { r: px[0], g: px[1], b: px[2] };
const icon = await sharp(SRC)
  .extract(CAR)
  .resize(256, 256, { fit: 'contain', background: bg })
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, 'public', 'images', 'logo-mark.png'));

console.log(
  `wrote logo-hero.jpg — ${hero.width}×${hero.height}, ${Math.round(hero.size / 1024)} KB`,
);
console.log(
  `wrote logo-mark.png — ${icon.width}×${icon.height}, ${Math.round(icon.size / 1024)} KB (bg rgb(${bg.r},${bg.g},${bg.b}))`,
);
