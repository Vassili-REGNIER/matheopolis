<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Service\AcademyEmailPolicy;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\AcademyEmailPolicy
 */
final class AcademyEmailPolicyTest extends TestCase
{
    private AcademyEmailPolicy $policy;

    /**
     * Updates the up.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new AcademyEmailPolicy();
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAllowsAcademicTeacherEmail(): void
    {
        self::assertTrue($this->policy->isAllowedTeacherEmail('prof@ac-paris.fr'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testRejectsPersonalEmailForTeacher(): void
    {
        self::assertFalse($this->policy->isAllowedTeacherEmail('user@gmail.com'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAllowsWwwPrefixedAcademicDomain(): void
    {
        self::assertTrue($this->policy->isAllowedTeacherEmail('teacher@www.ac-lyon.fr'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testRejectsInvalidEmailFormat(): void
    {
        self::assertFalse($this->policy->isAllowedTeacherEmail('not-an-email'));
    }
}
