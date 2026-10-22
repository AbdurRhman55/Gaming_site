/**
 * Game input validation shared by the create/update API routes.
 * Everything is trimmed and length-capped; nothing raw reaches a page.
 */
import type { Game, GameSpec, GameInput } from './store';
import { parseEmbed } from './embed';

export class ValidationError extends Error {}

export type GameRecord = Game;

function str(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

/** "Label | Value" lines (form) or [{label,value}] (JSON). Max 12 rows. */
export function parseSpecs(raw: unknown): GameSpec[] {
  if (Array.isArray(raw)) {
    return raw
      .map((s) => ({
        label: str((s as Record<string, unknown>)?.label, 60),
        value: str((s as Record<string, unknown>)?.value, 160),
      }))
      .filter((s) => s.label && s.value)
      .slice(0, 12);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n/)
      .map((line) => {
        const [label, ...rest] = line.split('|');
        return { label: str(label, 60), value: str(rest.join('|'), 160) };
      })
      .filter((s) => s.label && s.value)
      .slice(0, 12);
  }
  return [];
}

export function parseTags(raw: unknown): string[] {
  const s = Array.isArray(raw) ? raw.join(',') : String(raw ?? '');
  return [...new Set(s.split(',').map((t) => str(t, 32)).filter(Boolean))].slice(0, 10);
}

export function parseCover(raw: unknown): string | null {
  const v = str(raw, 512);
  if (!v) return null;
  if (!v.startsWith('/uploads/')) {
    throw new ValidationError('Cover must be an uploaded /uploads/… image.');
  }
  return v;
}

/** Validate + normalise a game payload from the dashboard (or the API). */
export function validateGameInput(raw: unknown): GameInput {
  const body = (raw ?? {}) as Record<string, unknown>;

  const title = str(body.title, 80);
  if (!title) throw new ValidationError('Title is required.');

  const description = str(body.description, 600);
  if (description.length < 10) throw new ValidationError('Description is required (at least 10 characters).');

  // Either "embedUrl" (URL) or "embedCode" (pasted iframe) may be supplied.
  const embedRaw = str(body.embedUrl, 4000) || str(body.embedCode, 8000);
  const embedUrl = parseEmbed(embedRaw);

  const status: Game['status'] = body.status === 'draft' ? 'draft' : 'published';

  return {
    title,
    description,
    category: str(body.category, 40) || 'arcade',
    tags: parseTags(body.tags),
    controls: str(body.controls, 400),
    specs: parseSpecs(body.specs),
    cover: parseCover(body.cover),
    embedUrl,
    status,
    featured: body.featured === true || body.featured === 'true' || body.featured === 'on',
  };
}
