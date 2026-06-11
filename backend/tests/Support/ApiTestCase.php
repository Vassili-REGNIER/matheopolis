<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support;

use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use PHPUnit\Framework\TestCase;

/**
 * Represents the API test case component.
 */
abstract class ApiTestCase extends TestCase
{
    protected ApiClient $api;

    /**
     * Updates the up.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $baseUrl = getenv('TEST_API_BASE_URL') ?: '';
        if ('' === $baseUrl) {
            self::markTestSkipped('TEST_API_BASE_URL is not set (required for API HTTP tests).');
        }

        if (!TestDatabase::isReachable()) {
            self::markTestSkipped('MySQL test database is not reachable.');
        }

        TestDatabase::getInstance()->reset();
        $this->api = new ApiClient($baseUrl);
    }

    /**
     * @return array{
     *   chapterId: int,
     *   riddleId: int,
     *   questionIds: array<int, int>,
     *   studentId: int
     * }
     */
    protected function seedChallengeRiddleScenario(): array
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.test', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId);
        $studentId = TestUserFactory::insert($db, 'student.test', 'student', $classId);
        $narrative = NarrativeFixture::insertChallengeRiddle($db);

        return [
            'chapterId' => $narrative['chapterId'],
            'riddleId' => $narrative['riddleId'],
            'questionIds' => $narrative['questionIds'],
            'studentId' => $studentId,
        ];
    }
}
