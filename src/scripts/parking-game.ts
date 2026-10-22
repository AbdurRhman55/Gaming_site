/**
 * "Tight Lot" — an original top-down parking mini-game.
 *
 * Written for this site from scratch: original code, original vector-style
 * rendering, no third-party assets, no network calls, no sound (nothing can
 * autoplay). Controls: arrow keys / WASD, or the on-screen touch buttons.
 *
 * The game listens for two custom events dispatched by GameStage:
 *   - 'minigame:command'  { action: 'next' | 'restart' }
 *   - 'minigame:visible'  { detail: boolean }  (pause when off-screen)
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface Level {
  name: string;
  hint: string;
  start: { x: number; y: number; angle: number };
  goal: Rect;
  /** Required parking heading tolerance in radians. */
  goalAngle: number;
  obstacles: (Rect & { kind: 'wall' | 'car'; color?: string })[];
}

export interface GameAPI {
  destroy?: () => void;
}

const W = 640;
const H = 400;
const CAR_L = 42;
const CAR_W = 22;
const HL = CAR_L / 2;
const HW = CAR_W / 2;
const WALL = 16;

const LEVELS: Level[] = [
  {
    name: 'Straight-in bay',
    hint: 'Line up early, then coast into the gold bay — finish slow.',
    start: { x: 320, y: 340, angle: -Math.PI / 2 },
    goal: { x: 300, y: 58, w: 46, h: 46 },
    goalAngle: Math.PI / 2,
    obstacles: [
      { x: 16, y: 16, w: 608, h: 38, kind: 'wall' },
      { x: 242, y: 62, w: 52, h: 30, kind: 'car', color: '#46609a' },
      { x: 352, y: 62, w: 52, h: 30, kind: 'car', color: '#8a5b7d' },
      { x: 120, y: 210, w: 76, h: 34, kind: 'car', color: '#66748f' },
      { x: 444, y: 210, w: 76, h: 34, kind: 'car', color: '#46609a' },
    ],
  },
  {
    name: 'Parallel park',
    hint: 'Pull past the gap, stop, then reverse in while steering hard.',
    start: { x: 540, y: 210, angle: Math.PI },
    goal: { x: 192, y: 50, w: 76, h: 30 },
    goalAngle: 0,
    obstacles: [
      { x: 16, y: 16, w: 608, h: 30, kind: 'wall' },
      { x: 20, y: 52, w: 80, h: 26, kind: 'car', color: '#46609a' },
      { x: 108, y: 52, w: 80, h: 26, kind: 'car', color: '#8a5b7d' },
      { x: 268, y: 52, w: 80, h: 26, kind: 'car', color: '#8a5b7d' },
      { x: 356, y: 52, w: 80, h: 26, kind: 'car', color: '#66748f' },
      { x: 444, y: 52, w: 80, h: 26, kind: 'car', color: '#46609a' },
      { x: 532, y: 52, w: 76, h: 26, kind: 'car', color: '#66748f' },
      { x: 16, y: 352, w: 608, h: 32, kind: 'wall' },
      { x: 300, y: 250, w: 76, h: 34, kind: 'car', color: '#46609a' },
    ],
  },
  {
    name: 'The reverse lane',
    hint: 'Hug the outside of the corner — long turns clip the inside wall.',
    start: { x: 158, y: 300, angle: -Math.PI / 2 },
    goal: { x: 556, y: 34, w: 46, h: 60 },
    goalAngle: Math.PI / 2,
    obstacles: [
      { x: 16, y: 16, w: 520, h: 60, kind: 'wall' },
      { x: 196, y: 150, w: 268, h: 148, kind: 'wall' },
      { x: 16, y: 118, w: 104, h: 60, kind: 'wall' },
      { x: 16, y: 340, w: 300, h: 44, kind: 'wall' },
      { x: 470, y: 340, w: 154, h: 44, kind: 'wall' },
      { x: 500, y: 250, w: 56, h: 30, kind: 'car', color: '#46609a' },
      { x: 76, y: 250, w: 56, h: 30, kind: 'car', color: '#8a5b7d' },
    ],
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function initParkingGame(root: HTMLElement | null): GameAPI {
  if (!root) throw new Error('Mini-game root not found');
  if ((root as HTMLElement & { __game?: boolean }).__game) {
    return ((root as HTMLElement & { __api?: GameAPI }).__api ?? {}) as GameAPI;
  }
  (root as HTMLElement & { __game?: boolean }).__game = true;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
  const wrap = root.querySelector<HTMLElement>('[data-canvas-wrap]');
  const overPanel = root.querySelector<HTMLElement>('[data-panel="gameover"]');
  const overTitle = root.querySelector<HTMLElement>('[data-over-title]');
  const overText = root.querySelector<HTMLElement>('[data-over-text]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]');
  const hudLevel = root.querySelector<HTMLElement>('[data-hud-level]');
  const hudTime = root.querySelector<HTMLElement>('[data-hud-time]');
  const hudScrapes = root.querySelector<HTMLElement>('[data-hud-scrapes]');
  const hudStatus = root.querySelector<HTMLElement>('[data-hud-status]');
  if (!canvas || !wrap) throw new Error('Mini-game canvas missing');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const input = { up: false, down: false, left: false, right: false };
  const car: Car = { ...LEVELS[0].start, speed: 0 };
  let level = 0;
  let scrapes = 0;
  let time = 0;
  let lastScrapeAt = 0;
  let state: 'run' | 'done' = 'run';
  let manualPause = false;
  let visible = true;
  const isPaused = () => manualPause || !visible || document.hidden;
  let flash = 0;
  let raf = 0;
  let last = performance.now();
  let hudAt = 0;

  /* ---------- storage (best times, local only) ---------- */
  /* Keys are 1-based to match the privacy policy: best.1 / best.2 / best.3 */
  const bestKey = (i: number) => `pfguide.tightlot.best.${i + 1}`;
  const readBest = (i: number): string => {
    try {
      return localStorage.getItem(bestKey(i)) ?? '—';
    } catch {
      return '—';
    }
  };
  const writeBest = (i: number, seconds: number) => {
    try {
      const prev = Number(localStorage.getItem(bestKey(i)) ?? 'Infinity');
      if (seconds < prev) localStorage.setItem(bestKey(i), seconds.toFixed(1));
    } catch {
      /* private mode / storage blocked — best time simply not kept */
    }
  };

  /* ---------- level lifecycle ---------- */
  const loadLevel = (i: number) => {
    level = clamp(i, 0, LEVELS.length - 1);
    const lv = LEVELS[level];
    car.x = lv.start.x;
    car.y = lv.start.y;
    car.angle = lv.start.angle;
    car.speed = 0;
    scrapes = 0;
    time = 0;
    state = 'run';
    manualPause = false;
    if (overPanel) overPanel.hidden = true;
    hudStatus && (hudStatus.textContent = lv.name);
    hudLevel && (hudLevel.textContent = `${level + 1}/${LEVELS.length}`);
    if (hudScrapes) hudScrapes.textContent = '0';
    if (hudTime) hudTime.textContent = '0.0s';
  };

  const finishLevel = () => {
    state = 'done';
    car.speed = 0;
    const seconds = time;
    writeBest(level, seconds);
    if (hudStatus) hudStatus.textContent = 'Parked!';
    if (overTitle) {
      overTitle.textContent =
        level === LEVELS.length - 1 ? 'All three lots cleared' : 'Level complete';
    }
    if (overText) {
      const clean = scrapes === 0 ? 'Clean run — zero scrapes.' : `${scrapes} scrape${scrapes > 1 ? 's' : ''} on this run.`;
      overText.textContent = `${LEVELS[level].name}: ${seconds.toFixed(1)}s. ${clean} Best: ${readBest(level)}s.`;
    }
    if (nextBtn) nextBtn.textContent = level === LEVELS.length - 1 ? 'Play again' : 'Next lot';
    if (overPanel) overPanel.hidden = false;
  };

  /* ---------- physics ---------- */
  const corners = (c: Car): [number, number][] => {
    const ux = Math.cos(c.angle);
    const uy = Math.sin(c.angle);
    const vx = -uy;
    const vy = ux;
    return [
      [c.x + ux * HL + vx * HW, c.y + uy * HL + vy * HW],
      [c.x + ux * HL - vx * HW, c.y + uy * HL - vy * HW],
      [c.x - ux * HL - vx * HW, c.y - uy * HL - vy * HW],
      [c.x - ux * HL + vx * HW, c.y - uy * HL + vy * HW],
    ];
  };

  const project = (pts: [number, number][], ax: number, ay: number) => {
    let min = Infinity;
    let max = -Infinity;
    for (const [px, py] of pts) {
      const d = px * ax + py * ay;
      if (d < min) min = d;
      if (d > max) max = d;
    }
    return { min, max };
  };

  /** Resolves OBB-vs-AABB overlap. Returns true if a hit occurred. */
  const collide = (rect: Rect): boolean => {
    const pts = corners(car);
    const rMinX = rect.x;
    const rMaxX = rect.x + rect.w;
    const rMinY = rect.y;
    const rMaxY = rect.y + rect.h;
    const ux = Math.cos(car.angle);
    const uy = Math.sin(car.angle);
    const axes: [number, number][] = [
      [ux, uy],
      [-uy, ux],
      [1, 0],
      [0, 1],
    ];
    let best = Infinity;
    let bax = 0;
    let bay = 0;
    const rPts: [number, number][] = [
      [rMinX, rMinY],
      [rMaxX, rMinY],
      [rMaxX, rMaxY],
      [rMinX, rMaxY],
    ];
    for (const [ax, ay] of axes) {
      const c = project(pts, ax, ay);
      const rProj = project(rPts, ax, ay);
      const min = Math.max(c.min, rProj.min);
      const max = Math.min(c.max, rProj.max);
      const overlap = max - min;
      if (overlap <= 0) return false;
      if (overlap < best) {
        best = overlap;
        bax = ax;
        bay = ay;
      }
    }
    // Push the car out along the smallest axis, away from the rect centre.
    const rcx = rect.x + rect.w / 2;
    const rcy = rect.y + rect.h / 2;
    const sign = (car.x - rcx) * bax + (car.y - rcy) * bay >= 0 ? 1 : -1;
    car.x += bax * best * sign;
    car.y += bay * best * sign;
    return true;
  };

  const registerScrape = () => {
    const now = performance.now();
    if (now - lastScrapeAt > 500) {
      lastScrapeAt = now;
      scrapes += 1;
      if (hudScrapes) hudScrapes.textContent = String(scrapes);
      flash = 0.18;
      if (hudStatus) hudStatus.textContent = 'Scrape!';
    }
  };

  const step = (dt: number) => {
    const lv = LEVELS[level];

    const throttle = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    const accel = throttle > 0 ? 330 : throttle < 0 ? -260 : 0;
    car.speed += accel * dt;
    if (throttle === 0) car.speed -= car.speed * 2.1 * dt; // engine/road drag
    car.speed = clamp(car.speed, -95, 165);

    const grip = clamp(Math.abs(car.speed) / 55, 0, 1);
    if (grip > 0.01) {
      car.angle += steer * 2.5 * grip * Math.sign(car.speed) * dt;
    }

    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;

    // world bounds as walls
    const bounds: Rect[] = [
      { x: 0, y: 0, w: W, h: WALL },
      { x: 0, y: H - WALL, w: W, h: WALL },
      { x: 0, y: 0, w: WALL, h: H },
      { x: W - WALL, y: 0, w: WALL, h: H },
    ];
    let hit = false;
    for (const r of [...bounds, ...lv.obstacles]) hit = collide(r) || hit;
    if (hit) {
      car.speed *= -0.25;
      registerScrape();
    }

    time += dt;

    // goal check: centred in bay, nearly aligned, almost stopped
    const inX = car.x > lv.goal.x && car.x < lv.goal.x + lv.goal.w;
    const inY = car.y > lv.goal.y && car.y < lv.goal.y + lv.goal.h;
    const aligned = Math.abs(angleDiff(car.angle, lv.goalAngle)) < 0.5 || Math.abs(angleDiff(car.angle, lv.goalAngle + Math.PI)) < 0.5;
    if (inX && inY && aligned && Math.abs(car.speed) < 40) {
      finishLevel();
    }
  };

  /* ---------- rendering ---------- */
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = wrap!.clientWidth;
    const ch = wrap!.clientHeight;
    if (cw === 0 || ch === 0) return;
    canvas!.width = Math.round(cw * dpr);
    canvas!.height = Math.round(ch * dpr);
    canvas!.style.width = `${cw}px`;
    canvas!.style.height = `${ch}px`;
    const scale = Math.min(cw / W, ch / H);
    const ox = (cw - W * scale) / 2;
    const oy = (ch - H * scale) / 2;
    ctx!.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  };

  const drawCar = (x: number, y: number, angle: number, color: string, player = false) => {
    const c = ctx!;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(c, -HL + 2, -HW + 3, CAR_L, CAR_W, 6);
    c.fill();
    c.fillStyle = color;
    roundRect(c, -HL, -HW, CAR_L, CAR_W, 6);
    c.fill();
    // windshield + roof
    c.fillStyle = player ? '#111318' : 'rgba(13,16,23,0.72)';
    roundRect(c, -HL + 11, -HW + 4, 13, CAR_W - 8, 3);
    c.fill();
    // headlights / taillights
    c.fillStyle = player ? '#f4f7fb' : '#ffd08b';
    c.fillRect(HL - 3, -HW + 2, 2.5, 5);
    c.fillRect(HL - 3, HW - 7, 2.5, 5);
    c.fillStyle = '#ff6b6b';
    c.fillRect(-HL + 1, -HW + 2, 2.5, 5);
    c.fillRect(-HL + 1, HW - 7, 2.5, 5);
    c.restore();
  };

  const draw = () => {
    const c = ctx!;
    const lv = LEVELS[level];
    // reset transform to clear full buffer
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#070910';
    c.fillRect(0, 0, canvas!.width, canvas!.height);
    c.restore();

    // asphalt
    c.fillStyle = '#0c1017';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(148,163,184,0.07)';
    c.lineWidth = 1;
    for (let gx = 40; gx < W; gx += 40) {
      c.beginPath();
      c.moveTo(gx, 0);
      c.lineTo(gx, H);
      c.stroke();
    }
    for (let gy = 40; gy < H; gy += 40) {
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(W, gy);
      c.stroke();
    }

    // goal bay
    const pulse = reduced ? 0.5 : 0.35 + 0.28 * Math.sin(performance.now() / 380);
    c.save();
    c.strokeStyle = `rgba(245,197,24,${pulse + 0.25})`;
    c.lineWidth = 2;
    c.setLineDash([9, 7]);
    c.strokeRect(lv.goal.x, lv.goal.y, lv.goal.w, lv.goal.h);
    c.setLineDash([]);
    c.fillStyle = `rgba(245,197,24,${pulse * 0.16})`;
    c.fillRect(lv.goal.x, lv.goal.y, lv.goal.w, lv.goal.h);
    c.restore();

    // obstacles
    for (const o of lv.obstacles) {
      if (o.kind === 'wall') {
        c.fillStyle = '#1d2943';
        roundRect(c, o.x, o.y, o.w, o.h, 5);
        c.fill();
        c.fillStyle = 'rgba(148,163,184,0.16)';
        c.fillRect(o.x, o.y, o.w, 3);
        // curb stripes
        c.fillStyle = 'rgba(245,197,24,0.10)';
        for (let sx = o.x + 6; sx < o.x + o.w - 6; sx += 26) {
          c.fillRect(sx, o.y + o.h - 5, 13, 3);
        }
      } else {
        drawCar(o.x + o.w / 2, o.y + o.h / 2, 0, o.color ?? '#66748f');
      }
    }

    // start arrow hint
    if (time < 3.2 && state === 'run') {
      c.save();
      c.globalAlpha = reduced ? 0.6 : 0.4 + 0.3 * Math.sin(performance.now() / 400);
      c.fillStyle = '#f5c518';
      c.beginPath();
      const sx = lv.start.x;
      const sy = lv.start.y + 34;
      c.moveTo(sx, sy - 8);
      c.lineTo(sx - 7, sy + 6);
      c.lineTo(sx + 7, sy + 6);
      c.closePath();
      c.fill();
      c.restore();
    }

    drawCar(car.x, car.y, car.angle, '#f5c518', true);

    if (flash > 0) {
      c.fillStyle = `rgba(255,107,107,${flash})`;
      c.fillRect(0, 0, W, H);
    }

    // hint strip
    c.fillStyle = 'rgba(9,11,17,0.78)';
    roundRect(c, 14, H - 46, W - 28, 30, 8);
    c.fill();
    c.fillStyle = '#b9c4d6';
    c.font = '600 13px ui-sans-serif, system-ui, sans-serif';
    c.textBaseline = 'middle';
    c.fillText(`${lv.name} — ${lv.hint}`, 26, H - 31);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    if (flash > 0) flash = Math.max(0, flash - dt);
    if (state === 'run' && !isPaused()) {
      step(dt);
      if (now - hudAt > 100) {
        hudAt = now;
        if (hudTime) hudTime.textContent = `${time.toFixed(1)}s`;
        if (state === 'run' && hudStatus && hudStatus.textContent !== LEVELS[level].name) {
          hudStatus.textContent = LEVELS[level].name;
        }
      }
    }
    draw();
  };

  /* ---------- input wiring ---------- */
  const KEYMAP: Record<string, keyof typeof input> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!visible) return;
    if (e.key === 'Escape') {
      manualPause = !manualPause;
      if (hudStatus) hudStatus.textContent = manualPause ? 'Paused' : LEVELS[level].name;
      e.preventDefault();
      return;
    }
    const k = KEYMAP[e.key];
    if (k) {
      input[k] = true;
      e.preventDefault(); // stop the page scrolling while driving
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const k = KEYMAP[e.key];
    if (k) input[k] = false;
  };
  const clearInput = () => {
    input.up = input.down = input.left = input.right = false;
    root.querySelectorAll<HTMLElement>('[data-key]').forEach((b) => b.removeAttribute('data-active'));
  };

  const touchButtons = root.querySelectorAll<HTMLElement>('[data-key]');
  touchButtons.forEach((btn) => {
    const key = btn.dataset.key as keyof typeof input;
    const press = () => {
      input[key] = true;
      btn.setAttribute('data-active', 'true');
    };
    const release = () => {
      input[key] = false;
      btn.removeAttribute('data-active');
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // Synthetic events (automated tests, assistive tech) may carry no active
      // pointer id — setPointerCapture would throw, so guard it.
      try {
        (btn as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* no active pointer — still register the press */
      }
      press();
    });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        press();
      }
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') release();
    });
    btn.addEventListener('blur', release);
  });

  const onCommand = (e: Event) => {
    const action = (e as CustomEvent<{ action: string }>).detail?.action;
    if (action === 'restart') loadLevel(level);
    if (action === 'next') loadLevel(level === LEVELS.length - 1 ? 0 : level + 1);
  };
  const onVisible = (e: Event) => {
    const detail = (e as CustomEvent<boolean>).detail;
    visible = detail !== false;
    if (!visible) clearInput();
    if (hudStatus && state === 'run') hudStatus.textContent = isPaused() ? 'Paused' : LEVELS[level].name;
  };
  const onVisibility = () => {
    if (document.hidden) clearInput();
    if (hudStatus && state === 'run') hudStatus.textContent = isPaused() ? 'Paused' : LEVELS[level].name;
  };

  document.addEventListener('minigame:command', onCommand as EventListener);
  document.addEventListener('minigame:visible', onVisible as EventListener);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearInput);

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();
  loadLevel(0);
  raf = requestAnimationFrame(loop);

  const destroy = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    document.removeEventListener('minigame:command', onCommand as EventListener);
    document.removeEventListener('minigame:visible', onVisible as EventListener);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', clearInput);
    (root as HTMLElement & { __game?: boolean }).__game = false;
  };

  const api: GameAPI = { destroy };
  (root as HTMLElement & { __api?: GameAPI }).__api = api;
  return api;
}
