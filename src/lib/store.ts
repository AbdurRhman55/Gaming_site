/**
 * Games data store — a plain JSON file, so the site stays a single Node
 * process with no database dependency. Writes are atomic (tmp + rename).
 *
 * The same file is read by the SSR pages at request time, which is what
 * makes admin uploads live instantly without a rebuild.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface GameSpec {
  label: string;
  value: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  controls: string;
  specs: GameSpec[];
  /** Web path of the cover image (/uploads/…) or null when unset. */
  cover: string | null;
  /** Internal path (/embed/…) or absolute https URL of the game frame. */
  embedUrl: string;
  status: 'published' | 'draft';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GameInput = Omit<Game, 'id' | 'createdAt' | 'updatedAt'>;

interface Store {
  version: number;
  games: Game[];
}

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const GAMES_FILE = join(DATA_DIR, 'games.json');
export const UPLOADS_DIR = join(DATA_DIR, 'uploads');
/** Web root for stored uploads — served by src/pages/uploads/[...file].ts */
export const UPLOADS_WEB = '/uploads';

function ensureDirs(): void {
  mkdirSync(dirname(GAMES_FILE), { recursive: true });
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readStore(): Store {
  if (!existsSync(GAMES_FILE)) return { version: 1, games: [] };
  try {
    const parsed = JSON.parse(readFileSync(GAMES_FILE, 'utf8')) as Store;
    if (!parsed || !Array.isArray(parsed.games)) return { version: 1, games: [] };
    return parsed;
  } catch {
    // Corrupt file: fail loudly instead of silently dropping the library.
    throw new Error(`games.json is not valid JSON: ${GAMES_FILE}`);
  }
}

function writeStore(store: Store): void {
  ensureDirs();
  const tmp = `${GAMES_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  renameSync(tmp, GAMES_FILE);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function uniqueSlug(base: string, ignoreId?: string): string {
  const store = readStore();
  const root = slugify(base) || 'game';
  let slug = root;
  for (let n = 2; store.games.some((g) => g.slug === slug && g.id !== ignoreId); n++) {
    slug = `${root}-${n}`;
  }
  return slug;
}

export function listGames(opts: { publishedOnly?: boolean } = {}): Game[] {
  const games = readStore().games;
  const filtered = opts.publishedOnly ? games.filter((g) => g.status === 'published') : games;
  // Featured first, then most recently updated.
  return [...filtered].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function getGameBySlug(slug: string, opts: { publishedOnly?: boolean } = {}): Game | undefined {
  const game = readStore().games.find((g) => g.slug === slug);
  if (!game) return undefined;
  if (opts.publishedOnly && game.status !== 'published') return undefined;
  return game;
}

export function getGameById(id: string): Game | undefined {
  return readStore().games.find((g) => g.id === id);
}

export function createGame(input: GameInput): Game {
  const store = readStore();
  const now = new Date().toISOString();
  const game: Game = {
    ...input,
    slug: uniqueSlugIn(store, input.slug || input.title),
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.games.push(game);
  writeStore(store);
  return game;
}

export function updateGame(id: string, patch: Partial<GameInput>): Game | undefined {
  const store = readStore();
  const game = store.games.find((g) => g.id === id);
  if (!game) return undefined;
  if (patch.slug !== undefined) patch.slug = uniqueSlugIn(store, patch.slug || game.title, id);
  Object.assign(game, patch, { updatedAt: new Date().toISOString() });
  writeStore(store);
  return game;
}

export function deleteGame(id: string): boolean {
  const store = readStore();
  const before = store.games.length;
  store.games = store.games.filter((g) => g.id !== id);
  if (store.games.length === before) return false;
  writeStore(store);
  return true;
}

function uniqueSlugIn(store: Store, base: string, ignoreId?: string): string {
  const root = slugify(base) || 'game';
  let slug = root;
  for (let n = 2; store.games.some((g) => g.slug === slug && g.id !== ignoreId); n++) {
    slug = `${root}-${n}`;
  }
  return slug;
}
