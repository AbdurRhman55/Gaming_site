/**
 * Admin authentication: a single operator account backed by env vars,
 * with an HMAC-signed session cookie (no server-side session store needed).
 *
 *   ADMIN_USER           login name            (default: admin)
 *   ADMIN_PASSWORD       login password        (REQUIRED for the dashboard —
 *                        if unset, all logins are rejected)
 *   ADMIN_SESSION_SECRET HMAC key for cookies  (falls back to the password)
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SESSION_COOKIE = 'pf_admin';
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

/**
 * Environment resolution: real process env wins, then a `.env` file in the
 * working directory. The standalone node server (`node dist/server/entry.mjs`)
 * does not auto-load `.env` — `astro build` only sees it at build time — so a
 * small parser here keeps local/production credentials working at runtime.
 */
let dotEnvCache: Record<string, string> | null = null;
function readDotEnv(): Record<string, string> {
  if (dotEnvCache) return dotEnvCache;
  dotEnvCache = {};
  try {
    const p = join(process.cwd(), '.env');
    if (existsSync(p)) {
      for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!m || m[1].startsWith('#')) continue;
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        dotEnvCache[m[1]] = v;
      }
    }
  } catch {
    /* unreadable .env — treat as no credentials */
  }
  return dotEnvCache;
}

function env(name: string): string {
  return process.env[name] || readDotEnv()[name] || '';
}

const USER = () => env('ADMIN_USER') || 'admin';
const PASSWORD = () => env('ADMIN_PASSWORD');
const SECRET = () => env('ADMIN_SESSION_SECRET') || env('ADMIN_PASSWORD') || '';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Compare against self to keep timing uniform, then fail.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function checkCredentials(user: string, password: string): boolean {
  const pw = PASSWORD();
  if (!pw || !SECRET()) return false; // never leave the door open by default
  return safeEqual(user, USER()) && safeEqual(password, pw);
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET()).update(payload).digest('base64url');
}

export function createSessionValue(): string {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_S);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value || !SECRET()) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(exp) * 1000 > Date.now();
}

/** Auth check for API handlers (Astro provides the parsed cookie jar). */
export function isAuthed(cookies: { get: (name: string) => { value?: string } | undefined }): boolean {
  return verifySessionValue(cookies.get(SESSION_COOKIE)?.value);
}

/** Uniform JSON error helper for API routes. */
export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function jsonOk(body: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
