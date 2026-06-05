<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support;

use Matheopolis\Infrastructure\Persistence\Database\Queryable;
use PHPUnit\Framework\TestCase;

abstract class IntegrationTestCase extends TestCase
{
    protected Queryable $db;

    protected function setUp(): void
    {
        parent::setUp();
        if (!TestDatabase::isReachable()) {
            self::markTestSkipped('MySQL test database is not reachable. Set TEST_DB_* in .env and start MySQL.');
        }
        $this->db = TestDatabase::getInstance()->queryable();
        TestDatabase::getInstance()->reset();
    }
}
