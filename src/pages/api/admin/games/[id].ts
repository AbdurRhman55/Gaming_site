import type { APIRoute } from 'astro';
import { isAuthed, jsonError, jsonOk } from '../../../../lib/auth';
import { deleteGame, getGameById, updateGame } from '../../../../lib/store';
import { validateGameInput } from '../../../../lib/validate';

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  const id = params.id ?? '';
  if (!getGameById(id)) return jsonError(404, 'Game not found.');
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Expected a JSON body.');
  }
  try {
    const game = updateGame(id, validateGameInput(body));
    return jsonOk({ game });
  } catch (e) {
    return jsonError(400, e instanceof Error ? e.message : 'Invalid game data.');
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  return deleteGame(params.id ?? '') ? jsonOk() : jsonError(404, 'Game not found.');
};
