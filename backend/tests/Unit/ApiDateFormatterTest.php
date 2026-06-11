<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Service\ApiDateFormatter;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiDateFormatter
 */
final class ApiDateFormatterTest extends TestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testSqlDatetimeIsExposedAsIsoUtc(): void
    {
        self::assertSame('2026-06-10T14:30:00Z', ApiDateFormatter::toIsoUtc('2026-06-10 14:30:00'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testDateOnlyValueIsExposedAtUtcMidnight(): void
    {
        self::assertSame('2026-06-10T00:00:00Z', ApiDateFormatter::toIsoUtc('2026-06-10'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testOffsetValueIsNormalizedToUtc(): void
    {
        self::assertSame('2026-06-10T12:30:00Z', ApiDateFormatter::toIsoUtc('2026-06-10T14:30:00+02:00'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testNullAndInvalidValuesArePreserved(): void
    {
        self::assertNull(ApiDateFormatter::toIsoUtc(null));
        self::assertSame('not-a-date', ApiDateFormatter::toIsoUtc('not-a-date'));
        self::assertSame('2026-13-40', ApiDateFormatter::toIsoUtc('2026-13-40'));
    }
}
