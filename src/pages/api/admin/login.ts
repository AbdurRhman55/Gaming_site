import type { APIRoute } from 'astro';
import { checkCredentials, createSessionValue, jsonError, jsonOk, SESSION_COOKIE } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, site }) => {
  let body: { user?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Expected a JSON body.');
  }
  const user = String(body.user ?? '');
  const password = String(body.password ?? '');
  if (!checkCredentials(user, password)) {
    return jsonError(401, 'Wrong username or password.');
  }
  const secure = String(site ?? '').startsWith('https://');
  cookies.set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return jsonOk({ user });
};
