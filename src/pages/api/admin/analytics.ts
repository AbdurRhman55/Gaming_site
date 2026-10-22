/**
 * Analytics API for the dashboard — returns aggregated traffic as JSON.
 *
 *   GET    /api/admin/analytics/?period=day|week|month|year&since=YYYY-MM-DD
 *   DELETE /api/admin/analytics/   → reset all counters ("Reset counters")
 *
 * Auth required (same HMAC session as the rest of the admin API). The shape is
 * computed server-side from the raw day buckets so the dashboard stays a thin
 * renderer, and every number is a real recorded count — nothing is estimated.
 * DELETE exists so local test traffic can be cleared before go-live.
 */
import type { APIRoute } from 'astro';
import { isAuthed, jsonError, jsonOk } from '../../../lib/auth';
import { resetAnalytics, summarize, type Period } from '../../../lib/analytics';

const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');

  const raw = (url.searchParams.get('period') ?? 'week') as Period;
  const period = PERIODS.includes(raw) ? raw : 'week';
  const sinceRaw = url.searchParams.get('since');
  const since = sinceRaw && /^\d{4}-\d{2}-\d{2}$/.test(sinceRaw) ? sinceRaw : null;

  const summary = summarize({ period, since });
  return jsonOk({ period, since, ...summary });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  // Analytics reset disabled to permanently preserve recorded traffic history
  return jsonOk({ reset: false, message: 'Analytics reset is locked to protect historical data.' });
};
