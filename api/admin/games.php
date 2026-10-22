<?php
declare(strict_types=1);

/**
 * /api/admin/games/ — list (GET) and create (POST).
 * Drafts require auth; creating a game makes it live on /games/ immediately
 * after this returns (the pages read the database on every request).
 */

require_once __DIR__ . '/../../includes/boot.php';
require_once __DIR__ . '/../../includes/validate.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $drafts = ($_GET['drafts'] ?? '') === '1';
    if ($drafts && !pf_is_authed()) {
        pf_json_error(401, 'Sign in first.');
    }
    pf_json_ok(['games' => pf_list_games(!$drafts)]);
}

if ($method === 'POST') {
    if (!pf_is_authed()) {
        pf_json_error(401, 'Sign in first.');
    }
    $raw = file_get_contents('php://input');
    $body = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($body)) {
        pf_json_error(400, 'Expected a JSON body.');
    }
    try {
        $game = pf_create_game(pf_validate_game_input($body));
        pf_json_ok(['game' => $game]);
    } catch (Throwable $e) {
        pf_json_error(400, $e->getMessage() !== '' ? $e->getMessage() : 'Invalid game data.');
    }
}

header('Allow: GET, POST');
pf_json_error(405, 'method not allowed');
