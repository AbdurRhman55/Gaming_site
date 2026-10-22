import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = join(ROOT, 'data', 'uploads');
mkdirSync(UPLOADS, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 720;

function createCoverSvg({
  title,
  subtitle,
  category,
  bgGradient,
  accentColor,
  accentGlow,
  carColor,
  sceneElements,
}) {
  const safeTitle = String(title).replace(/&/g, '&amp;');
  const safeSubtitle = String(subtitle).replace(/&/g, '&amp;');
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
      </linearGradient>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="${accentColor}"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="neon" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="24" result="blur1" />
        <feGaussianBlur stdDeviation="8" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1"/>
          <feMergeNode in="blur2"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>

    <!-- Ambient Glows -->
    <circle cx="200" cy="180" r="280" fill="${accentGlow}" opacity="0.35" filter="url(#glow)"/>
    <circle cx="1080" cy="540" r="320" fill="${accentColor}" opacity="0.18" filter="url(#glow)"/>

    <!-- Scene Graphics -->
    ${sceneElements}

    <!-- Bottom Vignette / Overlay -->
    <rect y="420" width="${WIDTH}" height="300" fill="url(#cardGrad)" opacity="0.9"/>
    <path d="M 0 420 L ${WIDTH} 360 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z" fill="rgba(10, 12, 18, 0.75)"/>

    <!-- Cyber Tech Border Lines -->
    <path d="M 40 40 L 140 40 M 40 40 L 40 140" stroke="${accentColor}" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M ${WIDTH - 40} ${HEIGHT - 40} L ${WIDTH - 140} ${HEIGHT - 40} M ${WIDTH - 40} ${HEIGHT - 40} L ${WIDTH - 40} ${HEIGHT - 140}" stroke="${accentColor}" stroke-width="3" fill="none" opacity="0.8"/>

    <!-- Category Pill -->
    <g transform="translate(60, 60)">
      <rect width="130" height="34" rx="17" fill="rgba(0, 0, 0, 0.65)" stroke="${accentColor}" stroke-width="1.5"/>
      <circle cx="20" cy="17" r="5" fill="${accentColor}" filter="url(#glow)"/>
      <text x="36" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="1">${category.toUpperCase()}</text>
    </g>

    <!-- Title & Subtitle Badge -->
    <g transform="translate(60, 540)">
      <text x="0" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="900" fill="url(#textGrad)" letter-spacing="-0.5">${safeTitle}</text>
      <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#cbd5e1" opacity="0.9">${safeSubtitle}</text>
    </g>

    <!-- Play Icon disc -->
    <g transform="translate(${WIDTH - 130}, ${HEIGHT - 130})">
      <circle cx="45" cy="45" r="45" fill="${accentColor}" filter="url(#neon)"/>
      <polygon points="38,28 38,62 64,45" fill="#090b10"/>
    </g>
  </svg>
  `;
}

const COVERS = [
  {
    filename: 'g-cover-pf3.jpg',
    data: {
      title: 'PARKING FURY 3',
      subtitle: 'Night Shift Precision · Dark Lot Challenges',
      category: 'Parking',
      accentColor: '#f5c518',
      accentGlow: '#f5c518',
      bgGradient: '<stop offset="0%" stop-color="#0a0e1a"/><stop offset="50%" stop-color="#141c2e"/><stop offset="100%" stop-color="#07090f"/>',
      sceneElements: `
        <!-- Asphalt Ground & Bay -->
        <rect x="0" y="320" width="${WIDTH}" height="400" fill="#121620"/>
        <!-- Parking slot yellow dashed markings -->
        <rect x="680" y="240" width="340" height="220" rx="12" fill="none" stroke="#f5c518" stroke-width="6" stroke-dasharray="24 16"/>
        <text x="730" y="360" font-family="sans-serif" font-size="48" font-weight="900" fill="#f5c518" opacity="0.45">RESERVED</text>
        <!-- Car: Yellow Sports Car -->
        <g transform="translate(380, 260) rotate(18)">
          <rect x="-140" y="-70" width="280" height="140" rx="34" fill="#f5c518"/>
          <rect x="-40" y="-55" width="120" height="110" rx="16" fill="#181e29"/>
          <!-- Headlights -->
          <circle cx="130" cy="-45" r="14" fill="#ffffff" filter="url(#glow)"/>
          <circle cx="130" cy="45" r="14" fill="#ffffff" filter="url(#glow)"/>
          <!-- Light Beams -->
          <polygon points="144,-45 420,-110 420,0 144,-45" fill="rgba(255, 255, 255, 0.22)" filter="url(#glow)"/>
          <polygon points="144,45 420,0 420,110 144,45" fill="rgba(255, 255, 255, 0.22)" filter="url(#glow)"/>
          <!-- Taillights -->
          <rect x="-140" y="-50" width="10" height="24" rx="4" fill="#ef4444" filter="url(#glow)"/>
          <rect x="-140" y="26" width="10" height="24" rx="4" fill="#ef4444" filter="url(#glow)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-bounty.jpg',
    data: {
      title: 'PF 3D: BOUNTY HUNTER',
      subtitle: 'Evade Cops · High Stakes Vehicle Drop-offs',
      category: '3D Action',
      accentColor: '#ef4444',
      accentGlow: '#dc2626',
      bgGradient: '<stop offset="0%" stop-color="#1c0a0e"/><stop offset="50%" stop-color="#2a1218"/><stop offset="100%" stop-color="#0d0406"/>',
      sceneElements: `
        <!-- Neon City Skyline -->
        <path d="M 100 350 L 100 180 L 180 180 L 180 350 L 260 350 L 260 120 L 380 120 L 380 350 L 520 350 L 520 200 L 640 200 L 640 350 Z" fill="#141824" opacity="0.6"/>
        <!-- Police Siren Lights -->
        <circle cx="950" cy="220" r="120" fill="#3b82f6" opacity="0.3" filter="url(#neon)"/>
        <circle cx="1080" cy="220" r="120" fill="#ef4444" opacity="0.3" filter="url(#neon)"/>
        <!-- Red Muscle Car -->
        <g transform="translate(680, 310) rotate(-14)">
          <rect x="-160" y="-80" width="320" height="160" rx="38" fill="#ef4444"/>
          <!-- Racing Stripes -->
          <rect x="-160" y="-18" width="320" height="36" fill="#111827"/>
          <rect x="-50" y="-60" width="130" height="120" rx="18" fill="#0f172a"/>
          <!-- Front Grille & Lights -->
          <circle cx="150" cy="-55" r="15" fill="#fef08a" filter="url(#glow)"/>
          <circle cx="150" cy="55" r="15" fill="#fef08a" filter="url(#glow)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-nightthief.jpg',
    data: {
      title: 'PF 3D: NIGHT THIEF',
      subtitle: 'Steal & Deliver · Midnight Urban Maneuvers',
      category: '3D Stealth',
      accentColor: '#a855f7',
      accentGlow: '#9333ea',
      bgGradient: '<stop offset="0%" stop-color="#0f091c"/><stop offset="50%" stop-color="#1d1233"/><stop offset="100%" stop-color="#090512"/>',
      sceneElements: `
        <!-- Moonlight & City Rays -->
        <circle cx="850" cy="130" r="90" fill="#e2e8f0" opacity="0.25" filter="url(#glow)"/>
        <!-- Black/Purple Stealth Supercar -->
        <g transform="translate(620, 300) rotate(10)">
          <rect x="-170" y="-85" width="340" height="170" rx="42" fill="#1e1b4b" stroke="#a855f7" stroke-width="4"/>
          <rect x="-50" y="-65" width="140" height="130" rx="20" fill="#030712"/>
          <circle cx="160" cy="-60" r="16" fill="#c084fc" filter="url(#neon)"/>
          <circle cx="160" cy="60" r="16" fill="#c084fc" filter="url(#neon)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-extremepark.jpg',
    data: {
      title: 'EXTREME CAR PARKING',
      subtitle: 'Zero Margin for Error · Millimeter Precision',
      category: 'Skill',
      accentColor: '#f97316',
      accentGlow: '#ea580c',
      bgGradient: '<stop offset="0%" stop-color="#1a0c04"/><stop offset="50%" stop-color="#2d1609"/><stop offset="100%" stop-color="#0c0502"/>',
      sceneElements: `
        <!-- Danger Barriers & Cones -->
        <g transform="translate(760, 200)">
          <polygon points="40,20 10,120 70,120" fill="#ea580c"/>
          <polygon points="35,50 45,50 50,75 30,75" fill="#ffffff"/>
        </g>
        <g transform="translate(420, 220)">
          <polygon points="40,20 10,120 70,120" fill="#ea580c"/>
          <polygon points="35,50 45,50 50,75 30,75" fill="#ffffff"/>
        </g>
        <!-- Orange Hypercar -->
        <g transform="translate(580, 290) rotate(-6)">
          <rect x="-150" y="-75" width="300" height="150" rx="36" fill="#f97316"/>
          <rect x="-40" y="-55" width="115" height="110" rx="16" fill="#18181b"/>
          <circle cx="140" cy="-50" r="14" fill="#fed7aa" filter="url(#glow)"/>
          <circle cx="140" cy="50" r="14" fill="#fed7aa" filter="url(#glow)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-parkschool.jpg',
    data: {
      title: 'CAR PARKING SCHOOL',
      subtitle: 'Master Parallel, Angle & Reverse Parking',
      category: 'Simulation',
      accentColor: '#06b6d4',
      accentGlow: '#0891b2',
      bgGradient: '<stop offset="0%" stop-color="#05141c"/><stop offset="50%" stop-color="#0b2433"/><stop offset="100%" stop-color="#02080d"/>',
      sceneElements: `
        <!-- Academy Driving Grid -->
        <rect x="520" y="160" width="460" height="280" rx="16" fill="none" stroke="#06b6d4" stroke-width="4" stroke-dasharray="16 12"/>
        <text x="560" y="220" font-family="sans-serif" font-size="28" font-weight="800" fill="#06b6d4" opacity="0.6">TRAINING BAY 04</text>
        <!-- Blue Modern Sedan -->
        <g transform="translate(750, 310) rotate(-8)">
          <rect x="-140" y="-70" width="280" height="140" rx="30" fill="#0284c7"/>
          <rect x="-35" y="-52" width="110" height="104" rx="14" fill="#0f172a"/>
          <circle cx="130" cy="-45" r="12" fill="#bae6fd" filter="url(#glow)"/>
          <circle cx="130" cy="45" r="12" fill="#bae6fd" filter="url(#glow)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-dubaipolice.jpg',
    data: {
      title: 'DUBAI POLICE PARKING 2',
      subtitle: 'Exotic Supercar Patrol · Rapid Response',
      category: 'Supercar',
      accentColor: '#10b981',
      accentGlow: '#059669',
      bgGradient: '<stop offset="0%" stop-color="#041710"/><stop offset="50%" stop-color="#0a2a1d"/><stop offset="100%" stop-color="#020a07"/>',
      sceneElements: `
        <!-- Dubai Skyline Silhouette -->
        <path d="M 200 360 L 200 140 L 240 140 L 240 360 M 320 360 L 320 60 L 350 40 L 380 60 L 380 360 Z" stroke="#10b981" stroke-width="2" fill="#0a2218" opacity="0.5"/>
        <!-- Police Lightbar Flashes -->
        <circle cx="680" cy="180" r="140" fill="#3b82f6" opacity="0.25" filter="url(#neon)"/>
        <circle cx="780" cy="180" r="140" fill="#ef4444" opacity="0.25" filter="url(#neon)"/>
        <!-- Dubai White and Emerald Supercar -->
        <g transform="translate(680, 290) rotate(12)">
          <rect x="-160" y="-80" width="320" height="160" rx="38" fill="#f8fafc"/>
          <!-- Emerald Dubai Police livery -->
          <rect x="-160" y="-28" width="320" height="56" fill="#059669"/>
          <text x="-60" y="8" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff">POLICE</text>
          <rect x="-40" y="-60" width="120" height="120" rx="16" fill="#0f172a"/>
          <!-- Flashing Lightbar on roof -->
          <rect x="-10" y="-40" width="20" height="80" rx="6" fill="#ef4444" filter="url(#glow)"/>
        </g>
      `,
    },
  },
  {
    filename: 'g-cover-parkout.jpg',
    data: {
      title: 'PARK OUT &amp; MASTER',
      subtitle: 'Traffic Jam Puzzle · Unblock The Golden Way',
      category: 'Puzzle',
      accentColor: '#eab308',
      accentGlow: '#ca8a04',
      bgGradient: '<stop offset="0%" stop-color="#181304"/><stop offset="50%" stop-color="#2a2208"/><stop offset="100%" stop-color="#0c0902"/>',
      sceneElements: `
        <!-- Puzzle Grid -->
        <rect x="420" y="140" width="560" height="300" rx="20" fill="none" stroke="#eab308" stroke-width="3" stroke-dasharray="14 10" opacity="0.5"/>
        <!-- Arrow pointing out -->
        <path d="M 940 290 L 1060 290 M 1030 260 L 1060 290 L 1030 320" stroke="#22c55e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
        <!-- Jammed Cars -->
        <rect x="480" y="160" width="70" height="140" rx="14" fill="#ef4444"/>
        <rect x="580" y="240" width="160" height="70" rx="14" fill="#3b82f6"/>
        <rect x="780" y="180" width="70" height="180" rx="14" fill="#a855f7"/>
        <!-- Hero Yellow Car heading to exit -->
        <rect x="620" y="260" width="180" height="80" rx="18" fill="#eab308" stroke="#ffffff" stroke-width="3"/>
      `,
    },
  },
  {
    filename: 'g-cover-drivepark.jpg',
    data: {
      title: 'DRIVE AND PARK',
      subtitle: 'Drift & Slot · One-Touch Parking Sensation',
      category: 'Arcade',
      accentColor: '#38bdf8',
      accentGlow: '#0284c7',
      bgGradient: '<stop offset="0%" stop-color="#04121a"/><stop offset="50%" stop-color="#09202e"/><stop offset="100%" stop-color="#02080d"/>',
      sceneElements: `
        <!-- Skid / Drift Lines -->
        <path d="M 280 420 C 420 380, 520 280, 680 260" stroke="#f1f5f9" stroke-width="6" stroke-dasharray="16 12" fill="none" opacity="0.4"/>
        <path d="M 300 440 C 440 400, 540 300, 700 280" stroke="#f1f5f9" stroke-width="6" stroke-dasharray="16 12" fill="none" opacity="0.4"/>
        <!-- Car Drifting into Spot -->
        <g transform="translate(680, 260) rotate(-28)">
          <rect x="-140" y="-70" width="280" height="140" rx="32" fill="#38bdf8"/>
          <rect x="-35" y="-52" width="110" height="104" rx="14" fill="#0f172a"/>
          <circle cx="130" cy="-45" r="14" fill="#ffffff" filter="url(#glow)"/>
          <circle cx="130" cy="45" r="14" fill="#ffffff" filter="url(#glow)"/>
        </g>
      `,
    },
  },
];

async function main() {
  for (const item of COVERS) {
    const svg = createCoverSvg(item.data);
    const dest = join(UPLOADS, item.filename);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(dest);
    console.log(`Generated: ${dest}`);
  }
}

main().catch(console.error);
