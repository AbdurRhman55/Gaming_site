<?php
declare(strict_types=1);

/** POST /api/admin/logout/ — clear the signed session cookie. */

require_once __DIR__ . '/../../includes/boot.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    pf_json_error(405, 'method not allowed');
}

pf_clear_auth_cookie();
pf_json_ok();
