<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;

/**
 * @internal
 *
 * @coversNothing
 */
final class SystemApiTest extends ApiTestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testHealthEndpointIsPublic(): void
    {
        $response = $this->api->get('/api/health');

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['success'] ?? false);
    }
}
