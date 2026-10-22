import type { APIRoute } from 'astro';
import { isAuthed, jsonError, jsonOk } from '../../../lib/auth';
import { createGame, listGames } from '../../../lib/store';
import { validateGameInput } from '../../../lib/validate';

/** List games (drafts require auth). */
export const GET: APIRoute = async ({ cookies, url }) => {
  const drafts = url.searchParams.get('drafts') === '1';
  if (drafts && !isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  return jsonOk({ games: listGames({ publishedOnly: !drafts }) });
};

/** Create a game — it is live on /games/ immediately after this returns. */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Expected a JSON body.');
  }
  try {
    const game = createGame(validateGameInput(body));
    return jsonOk({ game });
  } catch (e) {
    return jsonError(400, e instanceof Error ? e.message : 'Invalid game data.');
  }
};
