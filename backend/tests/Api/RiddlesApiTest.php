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
    public function testGuestCanLoadPublicRiddle(): void
    {
        $seed = $this->seedChallengeRiddleScenario();

        $response = $this->api->get('/api/riddles/'.$seed['riddleId']);

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['success'] ?? false);
        self::assertSame($seed['riddleId'], $response['json']['data']['id'] ?? null);
        self::assertArrayHasKey('play', $response['json']['data'] ?? []);
    }

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

    public function testPracticeRiddleRejectsStartAndResponses(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $practice = NarrativeFixture::insertPracticeRiddle($db);
        TestUserFactory::insert($db, 'student.practice', 'student');

        $start = $this->api->post('/api/riddles/'.$practice['riddleId'].'/start', [], true);
        self::assertSame(401, $start['status']);

        $this->api->login('student.practice');

        $startAuth = $this->api->post('/api/riddles/'.$practice['riddleId'].'/start', [], true);
        self::assertSame(422, $startAuth['status']);

        $response = $this->api->post('/api/riddles/'.$practice['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'practice-ans',
        ], true);
        self::assertSame(422, $response['status']);
    }
}
