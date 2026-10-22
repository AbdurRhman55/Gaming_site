/**
 * Traffic Rush — an original endless lane-dodging game, written from scratch
 * for this site (no third-party assets or code). Steer between lanes, dodge
 * oncoming traffic, and survive as long as you can. Score = metres covered.
 * Best score persists in localStorage under a key the privacy policy names.
 */

export interface TrafficRushAPI {
  destroy: () => void;
}

const BEST_KEY = 'pfguide.trafficrush.best.1';

export function initTrafficRush(root: HTMLElement | null): TrafficRushAPI {
  if (!root) return { destroy: () => {} };
  const canvas = root.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return { destroy: () => {} };

  const scoreEl = root.querySelector<HTMLElement>('[data-tr-score]');
  const bestEl = root.querySelector<HTMLElement>('[data-tr-best]');
  const statusEl = root.querySelector<HTMLElement>('[data-tr-status]');
  const overPanel = root.querySelector<HTMLElement>('[data-panel="gameover"]');
  const overText = root.querySelector<HTMLElement>('[data-over-text]');

  const W = 480;
  const H = 640;
  canvas.width = W;
  canvas.height = H;

  const ROAD_X = 64;
  const ROAD_W = 352;
  const LANES = 4;
  const LANE_W = ROAD_W / LANES;
  const laneCenter = (lane: number) => ROAD_X + LANE_W * lane + LANE_W / 2;

  const CAR_W = 40;
  const CAR_H = 72;

  let lane = 1;
  let carX = laneCenter(lane);
  let state: 'run' | 'over' = 'run';
  let metres = 0;
  let speed = 260; // px/s at start
  let spawnTimer = 0;
  let lineOffset = 0;
  let best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
  let raf = 0;
  let last = performance.now();

  type Foe = { lane: number; y: number; color: string; hue2: string };
  const foes: Foe[] = [];
  const PALETTE: [string, string][] = [
    ['#8b93a7', '#6a7183'],
    ['#e8b04b', '#c28e2f'],
    ['#d95757', '#b23c3c'],
    ['#5b8dd6', '#3f6ba8'],
    ['#9b7bd4', '#7759ac'],
  ];

  const bestText = () => (bestEl ? `${best} m` : '');
  if (bestEl) bestEl.textContent = bestText();

  const setStatus = (text: string) => {
    if (statusEl) statusEl.textContent = text;
  };

  const readBest = (): number => {
    const raw = Number(localStorage.getItem(BEST_KEY) ?? 0);
    return Number.isFinite(raw) ? raw : 0;
  };

  const spawn = () => {
    const taken = new Set(foes.filter((f) => f.y < H * 0.35).map((f) => f.lane));
    const options = [0, 1, 2, 3].filter((l) => !taken.has(l));
    if (options.length === 0) return;
    const l = options[Math.floor(Math.random() * options.length)];
    const [c1, c2] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    foes.push({ lane: l, y: -CAR_H, color: c1, hue2: c2 });
  };

  const rect = (f: Foe) => ({
    x: laneCenter(f.lane) - CAR_W / 2,
    y: f.y,
    w: CAR_W,
    h: CAR_H,
  });

  const gameOver = () => {
    state = 'over';
    const score = Math.floor(metres);
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      if (bestEl) bestEl.textContent = bestText();
    }
    setStatus('Crashed');
    if (overPanel && overText) {
      overText.textContent = `You covered ${score} m${
        score >= best && score > 0 ? ' — new best!' : ` (best: ${best} m)`
      }. Steer with ← → or A/D, or the on-screen buttons.`;
      overPanel.hidden = false;
    }
  };

  const reset = () => {
    foes.length = 0;
    lane = 1;
    carX = laneCenter(lane);
    metres = 0;
    speed = 260;
    spawnTimer = 0;
    state = 'run';
    setStatus('Dodging');
    if (overPanel) overPanel.hidden = true;
    last = performance.now();
  };

  const drawCar = (x: number, y: number, body: string, dark: string, player: boolean) => {
    const r = 9;
    ctx.beginPath();
    ctx.roundRect(x - CAR_W / 2, y, CAR_W, CAR_H, r);
    ctx.fillStyle = body;
    ctx.fill();
    // windshield + rear window
    ctx.fillStyle = 'rgba(16,20,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(x - CAR_W / 2 + 6, y + 12, CAR_W - 12, 14, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - CAR_W / 2 + 6, y + CAR_H - 26, CAR_W - 12, 12, 4);
    ctx.fill();
    // outline + accent
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - CAR_W / 2, y, CAR_W, CAR_H, r);
    ctx.stroke();
    if (player) {
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(x - 4, y + 4, 8, 4);
    }
  };

  const draw = () => {
    // asphalt
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    // shoulders
    ctx.fillStyle = '#2e323c';
    ctx.fillRect(ROAD_X - 6, 0, 6, H);
    ctx.fillRect(ROAD_X + ROAD_W, 0, 6, H);
    // dashed lane lines
    ctx.strokeStyle = '#464c58';
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 30]);
    ctx.lineDashOffset = -lineOffset;
    for (let i = 1; i < LANES; i++) {
      const x = ROAD_X + LANE_W * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const f of foes) {
      const r = rect(f);
      drawCar(r.x + r.w / 2, r.y, f.color, f.hue2, false);
    }
    drawCar(carX, H - CAR_H - 40, '#f5c518', '#c79a00', true);
  };

  const step = (dt: number) => {
    if (state !== 'run') return;
    metres += (speed * dt) / 12;
    speed = Math.min(520, 260 + metres * 0.55);
    lineOffset = (lineOffset + speed * dt) % 56;
    // smooth lane change
    const target = laneCenter(lane);
    carX += (target - carX) * Math.min(1, dt * 12);
    // traffic moves down relative to player speed
    for (const f of foes) f.y += speed * dt;
    while (foes.length && foes[0].y > H + CAR_H) foes.shift();
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.38, 1.0 - metres / 900);
    }
    // collision (slightly forgiving box)
    const px = carX - CAR_W / 2 + 4;
    const py = H - CAR_H - 40 + 4;
    const pw = CAR_W - 8;
    const ph = CAR_H - 8;
    for (const f of foes) {
      const r = rect(f);
      if (px < r.x + r.w - 6 && px + pw > r.x + 6 && py < r.y + r.h - 6 && py + ph > r.y + 6) {
        gameOver();
        break;
      }
    }
    if (scoreEl) scoreEl.textContent = `${Math.floor(metres)} m`;
  };

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  };

  const onKey = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      lane = Math.max(0, lane - 1);
      e.preventDefault();
    } else if (key === 'arrowright' || key === 'd') {
      lane = Math.min(LANES - 1, lane + 1);
      e.preventDefault();
    } else if ((key === 'enter' || key === ' ') && state === 'over') {
      reset();
      e.preventDefault();
    }
  };

  const onClick = (e: Event) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'restart') reset();
    if (target.dataset.action === 'next') reset();
  };

  const onTouch = (e: Event) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!target) return;
    const key = target.dataset.key;
    if (key === 'left') lane = Math.max(0, lane - 1);
    if (key === 'right') lane = Math.min(LANES - 1, lane + 1);
  };

  const onVisibility = () => {
    if (document.hidden) setStatus('Paused');
    else if (state === 'run') {
      setStatus('Dodging');
      last = performance.now();
    }
  };

  window.addEventListener('keydown', onKey);
  root.addEventListener('click', onClick);
  root.addEventListener('touchstart', onTouch, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  setStatus('Dodging');
  raf = requestAnimationFrame(loop);

  return {
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('click', onClick);
      root.removeEventListener('touchstart', onTouch);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
