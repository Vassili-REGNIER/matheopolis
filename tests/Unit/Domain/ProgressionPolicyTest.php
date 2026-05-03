<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit\Domain;

use Matheopolis\Domain\Service\ProgressionPolicy;
use PHPUnit\Framework\TestCase;

final class ProgressionPolicyTest extends TestCase
{
    public function testCanAccessNextPuzzleOnly(): void
    {
        $policy = new ProgressionPolicy();

        self::assertTrue($policy->canAccessPuzzle(1, 0));
        self::assertTrue($policy->canAccessPuzzle(3, 2));
        self::assertFalse($policy->canAccessPuzzle(5, 2));
    }

    public function testHintCanBeUnlockedOnlyWhenNotSolved(): void
    {
        $policy = new ProgressionPolicy();

        self::assertTrue($policy->hintCanBeUnlocked(false));
        self::assertFalse($policy->hintCanBeUnlocked(true));
    }
}
