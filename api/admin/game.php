<?php
declare(strict_types=1);

/**
 * /api/admin/games/{id}/ — update (PATCH) and delete (DELETE).
 * Routed by .htaccess: ^api/admin/games/([0-9a-f-]+)/?$ → game.php?id=$1
 */

require_once __DIR__ . '/../../includes/boot.php';
require_once __DIR__ . '/../../includes/validate.php';

if (!pf_is_authed()) {
    pf_json_error(401, 'Sign in first.');
}

$id = (string) ($_GET['id'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'PATCH') {
    if (!pf_get_game_by_id($id)) {
        pf_json_error(404, 'Game not found.');
    }
    $raw = file_get_contents('php://input');
    $body = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($body)) {
        pf_json_error(400, 'Expected a JSON body.');
    }
    try {
        $game = pf_update_game($id, pf_validate_game_input($body));
        if ($game === null) {
            pf_json_error(404, 'Game not found.');
        }
        pf_json_ok(['game' => $game]);
    } catch (Throwable $e) {
        pf_json_error(400, $e->getMessage() !== '' ? $e->getMessage() : 'Invalid game data.');
    }
}

if ($method === 'DELETE') {
    if (!pf_get_game_by_id($id)) {
        pf_json_error(404, 'Game not found.');
    }
    pf_delete_game($id);
    pf_json_ok();
}

header('Allow: PATCH, DELETE');
pf_json_error(405, 'method not allowed');
