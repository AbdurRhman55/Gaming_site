<?php
declare(strict_types=1);

/**
 * Analytics API for the dashboard — returns aggregated traffic as JSON.
 *
 *   GET    /api/admin/analytics/?period=day|week|month|year&since=YYYY-MM-DD
 *   DELETE /api/admin/analytics/   → locked (history is permanently preserved)
 *
 * Auth required (same HMAC session as the rest of the admin API). Every
 * number is a real recorded count — nothing is estimated.
 */

require_once __DIR__ . '/../../includes/boot.php';

if (!pf_is_authed()) {
    pf_json_error(401, 'Sign in first.');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $periods = ['day', 'week', 'month', 'year'];
    $raw = (string) ($_GET['period'] ?? 'week');
    $period = in_array($raw, $periods, true) ? $raw : 'week';
    $sinceRaw = (string) ($_GET['since'] ?? '');
    $since = ($sinceRaw !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $sinceRaw)) ? $sinceRaw : null;

    $summary = pf_analytics_summary($period, $since);
    pf_json_ok(array_merge(['period' => $period, 'since' => $since], $summary));
}

if ($method === 'DELETE') {
    // Analytics reset disabled to permanently preserve recorded traffic history.
    pf_json_ok(['reset' => false, 'message' => 'Analytics reset is locked to protect historical data.']);
}

header('Allow: GET, DELETE');
pf_json_error(405, 'method not allowed');
