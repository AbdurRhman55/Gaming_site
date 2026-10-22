<?php
declare(strict_types=1);

/** POST /api/admin/login/ — exchange credentials for the signed session cookie. */

require_once __DIR__ . '/../../includes/boot.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    pf_json_error(405, 'method not allowed');
}

$raw = file_get_contents('php://input');
$body = json_decode($raw === false ? '' : $raw, true);
if (!is_array($body)) {
    pf_json_error(400, 'Expected a JSON body.');
}

$user = (string) ($body['user'] ?? '');
$password = (string) ($body['password'] ?? '');
if (!pf_check_credentials($user, $password)) {
    pf_json_error(401, 'Wrong username or password.');
}
pf_set_auth_cookie();
pf_json_ok(['user' => $user]);
