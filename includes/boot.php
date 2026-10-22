<?php
declare(strict_types=1);

/**
 * Single include that boots the whole app. Every page starts with:
 *   require_once __DIR__ . '/includes/boot.php';
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/site.php';
require_once __DIR__ . '/seo.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/store.php';
require_once __DIR__ . '/analytics.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/series.php';
require_once __DIR__ . '/components.php';
require_once __DIR__ . '/layout.php';
