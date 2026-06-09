<?php

declare(strict_types=1);

/**
 * AlwaysData PHP sites only execute scripts under the site document root (frontend/).
 * Route /api/* here via frontend/.htaccess, then bootstrap the real API front controller.
 */
require dirname(__DIR__, 2).'/backend/public/index.php';
