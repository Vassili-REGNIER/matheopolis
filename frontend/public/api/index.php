<?php

declare(strict_types=1);

/**
 * AlwaysData PHP sites only execute scripts under the site document root (frontend/public/).
 * Route /api/* here via frontend/public/.htaccess, then bootstrap the real API front controller.
 */
require dirname(__DIR__, 3).'/backend/public/index.php';
