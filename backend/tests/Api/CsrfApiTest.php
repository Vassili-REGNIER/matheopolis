<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiClient;
use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 */
final class CsrfApiTest extends ApiTestCase
{
    public function testMutationWithoutCsrfTokenIsRejected(): void
    {
        TestUserFactory::insert(TestDatabase::getInstance()->queryable(), 'csrf.user', 'student');
        $this->api->login('csrf.user');

        $clientWithoutCsrf = new ApiClient(getenv('TEST_API_BASE_URL') ?: 'http://127.0.0.1:8080');
        $clientWithoutCsrf->login('csrf.user');

        $response = $clientWithoutCsrf->post('/api/auth/logout', [], false);

        self::assertSame(403, $response['status']);
    }
}
