import sharp from 'sharp';
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = join(ROOT, 'data', 'uploads');

const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 893;

const COVERS = [
  {
    filename: 'g-cover-pf3.jpg',
    url: 'https://img.gamedistribution.com/67f5943d779b41b2bc6a67ce132b7c68-1280x720.jpeg',
    fit: 'cover',
    title: 'Parking Fury 3'
  },
  {
    filename: 'g-cover-bounty.jpg',
    url: 'https://img.gamedistribution.com/94e431161cba47ba9cdee2e8bf0482ed-1280x720.jpeg',
    fit: 'cover',
    title: 'Parking Fury 3D: Bounty Hunter'
  },
  {
    filename: 'g-cover-nightthief.jpg',
    url: 'https://img.gamedistribution.com/166e3518b5604a3a92e750145ace5ed2-1280x720.jpeg',
    fit: 'cover',
    title: 'Parking Fury 3D: Night Thief'
  },
  {
    filename: 'g-cover-extremepark.jpg',
    url: 'https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/6a4b4c54f1d0b43c03955a1c95aea8a1/extreme-car-parking-logo.png',
    fit: 'cover',
    position: 'center',
    title: 'Extreme Car Parking'
  },
  {
    filename: 'g-cover-parkschool.jpg',
    url: 'https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/a3d7432f9156488b4e658ecb0923d47a/car-parking-school-logo.png',
    fit: 'cover',
    position: 'center',
    title: 'Car Parking School'
  },
  {
    filename: 'g-cover-dubaipolice.jpg',
    url: 'https://d.pacogames.com/images/fb/dubai-police-parking-2-fb.jpg',
    fit: 'cover',
    title: 'Dubai Police Parking 2'
  },
  {
    filename: 'g-cover-parkout.jpg',
    url: 'https://play-lh.googleusercontent.com/TU2anxn-IE0oTIVzUY1saRkhpe0lx14pPRyL2fvl5tE6G5gf8M_MGIoZbIeBwqFrFX2zTagBep4TbW80dZmV6g=s0-br30',
    fit: 'cover',
    title: 'Park Out & Master'
  },
  {
    filename: 'g-cover-drivepark.jpg',
    url: 'https://play-lh.googleusercontent.com/r5IT3BAknTYF3FwAtPU3qVXpwNl3T9BVq8OxMxFbupQoWS7r00TRZ5yq8_QbN5UZbjCTOv3yOe4nI7VAPNod=s0-br30',
    fit: 'cover',
    title: 'Drive and Park'
  }
];

async function processAll() {
  console.log(`Starting cover generation to ${TARGET_WIDTH}x${TARGET_HEIGHT} high-res JPEG...`);

  for (const c of COVERS) {
    try {
      console.log(`Fetching ${c.title} from ${c.url}...`);
      const res = await fetch(c.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const rawBuf = Buffer.from(await res.arrayBuffer());

      // Scale and enhance with Sharp:
      // Lanczos3 interpolation, subtle sharpen for crisp game UI details, vibrant color balance
      const output = await sharp(rawBuf)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: c.fit || 'cover',
          position: c.position || 'center',
          withoutEnlargement: false,
          background: { r: 12, g: 14, b: 20, alpha: 1 }
        })
        .modulate({
          brightness: 1.03,
          saturation: 1.08
        })
        .sharpen({
          sigma: 0.8,
          m1: 0.5,
          m2: 2.0
        })
        .jpeg({
          quality: 92,
          chromaSubsampling: '4:4:4',
          mozjpeg: true
        })
        .toBuffer();

      const dest = join(UPLOADS, c.filename);
      writeFileSync(dest, output);
      console.log(`✓ Saved ${c.filename} (${(output.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Failed for ${c.title}:`, err.message);
    }
  }

  console.log('All game covers successfully processed!');
}

processAll();
