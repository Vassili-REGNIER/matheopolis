<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 *
 * @coversNothing
 */
final class RiddlesApiTest extends ApiTestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testGuestCanLoadPublicRiddle(): void
    {
        $seed = $this->seedChallengeRiddleScenario();

        $response = $this->api->get('/api/riddles/'.$seed['riddleId']);

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['success'] ?? false);
        self::assertSame($seed['riddleId'], $response['json']['data']['id'] ?? null);
        self::assertArrayHasKey('play', $response['json']['data'] ?? []);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testWrongAnswerKeepsProgressOnSameQuestion(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);

        $answer = $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'wrong',
        ], true);

        self::assertSame(200, $answer['status']);
        self::assertFalse($answer['json']['data']['isCorrect'] ?? true);
        self::assertSame(0, $answer['json']['data']['progress']['currentQuestionIndex'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testChallengeFlowWithQuestionIndex(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');

        $start = $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);
        self::assertSame(200, $start['status']);

        $answer = $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);

        self::assertSame(200, $answer['status']);
        self::assertTrue($answer['json']['data']['isCorrect'] ?? false);
        self::assertSame(1, $answer['json']['data']['progress']['currentQuestionIndex'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testCompletedRiddleReturnsMistakeBasedScore(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);

        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'wrong',
        ], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);
        $completed = $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 1,
            'answer' => 'ans1',
        ], true);

        self::assertSame(200, $completed['status']);
        self::assertSame('completed', $completed['json']['data']['progress']['status'] ?? null);
        self::assertSame(67, $completed['json']['data']['progress']['score'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testFreeUserCanReadOwnRiddleProgress(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'felix.test', 'free_user');

        $this->api->login('felix.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);

        $progress = $this->api->get('/api/riddles/'.$seed['riddleId'].'/progress');

        self::assertSame(200, $progress['status']);
        self::assertSame('in_progress', $progress['json']['data']['progress']['status'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testEarlierQuestionSubmissionRestartsRiddleAttempt(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);

        $retry = $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'wrong',
        ], true);

        self::assertSame(200, $retry['status']);
        self::assertFalse($retry['json']['data']['isCorrect'] ?? true);
        self::assertSame(0, $retry['json']['data']['progress']['currentQuestionIndex'] ?? null);
        self::assertSame(2, $retry['json']['data']['progress']['attemptCount'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testPracticeRiddleSupportsStartAndResponses(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $practice = NarrativeFixture::insertPracticeRiddle($db);
        TestUserFactory::insert($db, 'student.practice', 'student');

        $start = $this->api->post('/api/riddles/'.$practice['riddleId'].'/start', [], true);
        self::assertSame(401, $start['status']);

        $this->api->login('student.practice');

        $startAuth = $this->api->post('/api/riddles/'.$practice['riddleId'].'/start', [], true);
        self::assertSame(200, $startAuth['status']);
        self::assertSame('in_progress', $startAuth['json']['data']['progress']['status'] ?? null);

        $response = $this->api->post('/api/riddles/'.$practice['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'practice-ans',
        ], true);
        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['data']['isCorrect'] ?? false);
        self::assertSame('completed', $response['json']['data']['progress']['status'] ?? null);
    }
}
