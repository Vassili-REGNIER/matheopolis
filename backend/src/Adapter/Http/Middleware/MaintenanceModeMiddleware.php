<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\HttpInterface;

/**
 * Applies maintenance mode concerns to incoming HTTP requests.
 */
final class MaintenanceModeMiddleware
{
    /**
     * Creates a new MaintenanceModeMiddleware instance.
     */
    public function __construct(
        private readonly ConfigInterface $config,
        private readonly HttpInterface $http,
    ) {}

    /**
     * Handle.
     */
    public function handle(): void
    {
        if (!$this->config->getBool('APP_MAINTENANCE', false)) {
            return;
        }

        if ('/health' === $this->http->getRequestedPath()) {
            return;
        }

        http_response_code(503);
        header('Retry-After: 300');
        echo '<h1>Maintenance mode</h1><p>The platform is temporarily unavailable.</p>';

        exit;
    }
}
