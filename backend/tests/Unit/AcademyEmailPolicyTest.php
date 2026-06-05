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

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new AcademyEmailPolicy();
    }

    public function testAllowsAcademicTeacherEmail(): void
    {
        self::assertTrue($this->policy->isAllowedTeacherEmail('prof@ac-paris.fr'));
    }

    public function testRejectsPersonalEmailForTeacher(): void
    {
        self::assertFalse($this->policy->isAllowedTeacherEmail('user@gmail.com'));
    }

    public function testAllowsWwwPrefixedAcademicDomain(): void
    {
        self::assertTrue($this->policy->isAllowedTeacherEmail('teacher@www.ac-lyon.fr'));
    }

    public function testRejectsInvalidEmailFormat(): void
    {
        self::assertFalse($this->policy->isAllowedTeacherEmail('not-an-email'));
    }
}
