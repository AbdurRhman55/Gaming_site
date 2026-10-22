#!/usr/bin/env node
/**
 * Regenerate the two game cover artworks in the brand palette.
 *
 *   node scripts/build-covers.mjs
 *
 * Writes (overwrites in place, so the store paths never change):
 *   data/uploads/g-cover-tightlot.png     — Tight Lot cover
 *   data/uploads/g-cover-trafficrush.png  — Traffic Rush cover
 *
 * Both are original compositions drawn as SVG (text left, gameplay scene
 * right) and rasterised with sharp at 1246×864 — the same canvas the first
 * set of covers used, so card layout/CLS is unchanged. Colours follow the
 * logo palette: charcoal surfaces, gold accent #f5c518, silver type.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'data', 'uploads');
const W = 1246;
const H = 864;

const FONT = "'Segoe UI', Arial, sans-serif";
const GOLD = '#f5c518';
const GOLD_SOFT = '#ffd84a';
const INK = '#16130a';
const WHITE = '#f7f6f2';
const SILVER = '#c2c1ba';
const GREY = '#918f87';

/* Shared chrome: charcoal gradient, warm top-right glow, text block. */
function frame({ eyebrow, titleLead, titleAccent, subtitle, chips, meta }) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14161c"/>
      <stop offset="0.55" stop-color="#0e0f13"/>
      <stop offset="1" stop-color="#0a0b0e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.16" r="0.6">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#0a0b0e" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#0a0b0e" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect y="${H * 0.55}" width="${W}" height="${H * 0.45}" fill="url(#vig)" opacity="0.5"/>
  <!-- watermark P -->
  <text x="${W - 90}" y="${H - 40}" text-anchor="end" font-family="${FONT}"
    font-size="430" font-weight="800" fill="${GOLD}" opacity="0.05">P</text>
  <!-- bottom bay dashes -->
  <path d="M0 ${H - 34} H ${W}" stroke="${GOLD}" stroke-width="14" stroke-dasharray="64 44"
    opacity="0.5" stroke-linecap="round"/>

  <!-- eyebrow pill -->
  <g>
    <rect x="88" y="266" width="392" height="62" rx="31" fill="none" stroke="${GOLD}"
      stroke-width="2.5" opacity="0.9"/>
    <text x="284" y="306" text-anchor="middle" font-family="${FONT}" font-size="26"
      font-weight="800" letter-spacing="4" fill="${GOLD}">${eyebrow}</text>
  </g>

  <!-- title -->
  <text x="88" y="470" font-family="${FONT}" font-size="104" font-weight="800"
    letter-spacing="-1" fill="${WHITE}">${titleLead} <tspan fill="${GOLD}">${titleAccent}</tspan></text>

  <!-- subtitle -->
  <text x="90" y="540" font-family="${FONT}" font-size="30" font-weight="500"
    fill="${SILVER}">${subtitle}</text>

  <!-- key chips -->
  <g transform="translate(90 592)">
    ${chips
      .map((label, i) => {
        const w = 44 + label.length * 24;
        const x = chips.slice(0, i).reduce((acc, l) => acc + 44 + l.length * 24 + 24, 0);
        return `
      <g transform="translate(${x} 0)">
        <rect width="${w}" height="64" rx="14" fill="#1d2129" stroke="#2e333d" stroke-width="2"/>
        <text x="${w / 2}" y="43" text-anchor="middle" font-family="${FONT}" font-size="27"
          font-weight="700" letter-spacing="3" fill="${WHITE}">${label}</text>
      </g>`;
      })
      .join('')}
  </g>

  <!-- meta line -->
  <text x="90" y="722" font-family="${FONT}" font-size="26" fill="${GREY}">${meta}</text>`;
}

/* Right-hand gameplay scenes (drawn over the text frame's right half). */
const tightLotScene = `
  <g>
    <!-- lot surface -->
    <rect x="778" y="70" width="430" height="700" rx="28" fill="#17191f" stroke="#252a33" stroke-width="3"/>
    <!-- parking divider lines -->
    <g stroke="#3d434e" stroke-width="6" stroke-linecap="round">
      <path d="M806 150 H 960"/><path d="M806 260 H 960"/>
      <path d="M806 470 H 960"/><path d="M806 580 H 960"/><path d="M806 690 H 960"/>
    </g>
    <!-- muted parked cars -->
    <g>
      <rect x="836" y="176" width="96" height="56" rx="16" fill="#39414d"/>
      <rect x="852" y="192" width="44" height="24" rx="8" fill="#14161b" opacity="0.75"/>
      <rect x="836" y="496" width="96" height="56" rx="16" fill="#46609a"/>
      <rect x="852" y="512" width="44" height="24" rx="8" fill="#14161b" opacity="0.75"/>
      <rect x="836" y="606" width="96" height="56" rx="16" fill="#8a5b7d"/>
      <rect x="852" y="622" width="44" height="24" rx="8" fill="#14161b" opacity="0.75"/>
    </g>
    <!-- target bay (gold, dashed — matches the real game) -->
    <rect x="1022" y="180" width="140" height="240" rx="14" fill="${GOLD}" fill-opacity="0.07"
      stroke="${GOLD}" stroke-width="5" stroke-dasharray="26 20"/>
    <!-- approach arrow -->
    <path d="M1092 700 C 1092 600, 1092 540, 1092 470" fill="none" stroke="${GOLD}"
      stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round" opacity="0.9"/>
    <path d="M1092 448 l18 26 -18 26" fill="none" stroke="${GOLD}" stroke-width="7"
      stroke-linecap="round" stroke-linejoin="round"/>
    <!-- player car (gold) heading up into the bay -->
    <g transform="translate(1092 640)">
      <rect x="-58" y="-104" width="116" height="208" rx="34" fill="${GOLD}"/>
      <rect x="-58" y="-104" width="116" height="208" rx="34" fill="none" stroke="#16130a" stroke-width="4" opacity="0.35"/>
      <rect x="-40" y="-76" width="80" height="52" rx="14" fill="#14161b"/>
      <rect x="-40" y="16" width="80" height="52" rx="14" fill="#14161b" opacity="0.9"/>
      <rect x="-64" y="-70" width="14" height="44" rx="7" fill="#14161b"/>
      <rect x="50" y="-70" width="14" height="44" rx="7" fill="#14161b"/>
      <rect x="-64" y="40" width="14" height="44" rx="7" fill="#14161b"/>
      <rect x="50" y="40" width="14" height="44" rx="7" fill="#14161b"/>
      <circle cx="-30" cy="-96" r="9" fill="${GOLD_SOFT}"/>
      <circle cx="30" cy="-96" r="9" fill="${GOLD_SOFT}"/>
      <circle cx="-30" cy="96" r="9" fill="#ff6b6b"/>
      <circle cx="30" cy="96" r="9" fill="#ff6b6b"/>
    </g>
  </g>`;

const trafficRushScene = `
  <g>
    <!-- vertical road -->
    <rect x="848" y="-20" width="400" height="${H + 40}" fill="#121418"/>
    <rect x="832" y="-20" width="16" height="${H + 40}" fill="#2e323c"/>
    <rect x="1248" y="-20" width="16" height="${H + 40}" fill="#2e323c"/>
    <!-- lanes -->
    <g stroke="#464c58" stroke-width="8" stroke-dasharray="46 46" stroke-linecap="round">
      <path d="M978 -20 V ${H + 20}"/><path d="M1118 -20 V ${H + 20}"/>
    </g>
    <!-- traffic -->
    <g>
      <rect x="912" y="96" width="92" height="164" rx="26" fill="#ff6b6b"/>
      <rect x="928" y="126" width="60" height="54" rx="14" fill="#14161b" opacity="0.85"/>
      <rect x="928" y="196" width="60" height="44" rx="12" fill="#14161b" opacity="0.7"/>
      <rect x="1052" y="330" width="92" height="164" rx="26" fill="#46609a"/>
      <rect x="1068" y="360" width="60" height="54" rx="14" fill="#14161b" opacity="0.85"/>
      <rect x="1068" y="430" width="60" height="44" rx="12" fill="#14161b" opacity="0.7"/>
      <rect x="912" y="470" width="92" height="164" rx="26" fill="#9aa4b8"/>
      <rect x="928" y="500" width="60" height="54" rx="14" fill="#14161b" opacity="0.85"/>
      <rect x="928" y="570" width="60" height="44" rx="12" fill="#14161b" opacity="0.7"/>
    </g>
    <!-- player (gold) -->
    <g>
      <rect x="1052" y="640" width="92" height="176" rx="26" fill="${GOLD}"/>
      <rect x="1052" y="640" width="92" height="176" rx="26" fill="none" stroke="#16130a" stroke-width="4" opacity="0.35"/>
      <rect x="1068" y="672" width="60" height="54" rx="14" fill="#14161b"/>
      <rect x="1068" y="748" width="60" height="46" rx="12" fill="#14161b" opacity="0.85"/>
      <rect x="1040" y="666" width="14" height="48" rx="7" fill="#14161b"/>
      <rect x="1142" y="666" width="14" height="48" rx="7" fill="#14161b"/>
      <rect x="1040" y="742" width="14" height="48" rx="7" fill="#14161b"/>
      <rect x="1142" y="742" width="14" height="48" rx="7" fill="#14161b"/>
      <rect x="1074" y="646" width="48" height="10" rx="5" fill="${GOLD_SOFT}"/>
      <!-- motion streaks -->
      <g stroke="${GOLD}" stroke-width="6" stroke-linecap="round" opacity="0.55">
        <path d="M1016 700 v 60"/><path d="M1180 700 v 60"/>
      </g>
    </g>
  </g>`;

const covers = [
  {
    file: 'g-cover-tightlot.png',
    scene: tightLotScene,
    text: {
      eyebrow: 'ORIGINAL · PARKING',
      titleLead: 'TIGHT',
      titleAccent: 'LOT',
      subtitle: 'Steer into the highlighted bay. Touch nothing.',
      chips: ['W A S D', '↑ ↓ ← →'],
      meta: '3 lots · timer · best saved in your browser',
    },
  },
  {
    file: 'g-cover-trafficrush.png',
    scene: trafficRushScene,
    text: {
      eyebrow: 'ORIGINAL · DRIVING',
      titleLead: 'TRAFFIC',
      titleAccent: 'RUSH',
      subtitle: 'Switch lanes. Survive the rush.',
      chips: ['←  →'],
      meta: 'Endless · speed ramps up · best run saved locally',
    },
  },
];

for (const { file, text, scene } of covers) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${frame(text)}
    ${scene}
  </svg>`;
  const info = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT_DIR, file));
  console.log(`wrote data/uploads/${file} — ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
}
