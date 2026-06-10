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
final class ChaptersApiTest extends ApiTestCase
{
    public function testGuestCanShowFullScenarioWithAllStepTypes(): void
    {
        $narrative = NarrativeFixture::insertFullScenarioChapter(TestDatabase::getInstance()->queryable());

        $response = $this->api->get('/api/chapters/'.$narrative['chapterId']);

        self::assertSame(200, $response['status']);
        self::assertCount(3, $response['json']['data']['scenario']['steps'] ?? []);
    }

    public function testGuestCanShowChapterWithScenario(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle(TestDatabase::getInstance()->queryable());

        $response = $this->api->get('/api/chapters/'.$narrative['chapterId']);

        self::assertSame(200, $response['status']);
        self::assertArrayHasKey('scenario', $response['json']['data'] ?? []);
        self::assertNotEmpty($response['json']['data']['scenario']['steps'] ?? []);
        self::assertSame(
            \count($response['json']['data']['scenario']['steps'] ?? []),
            $response['json']['data']['stepCount'] ?? null,
        );
    }

    public function testGuestCanListChapters(): void
    {
        NarrativeFixture::insertChallengeRiddle(TestDatabase::getInstance()->queryable());

        $response = $this->api->get('/api/chapters');

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['success'] ?? false);
        self::assertNotEmpty($response['json']['data']['items'] ?? []);
        self::assertIsInt($response['json']['data']['items'][0]['stepCount'] ?? null);
    }

    public function testStudentDoesNotSeeRestrictedChapter(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.restrict', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-RST');
        TestUserFactory::insert($db, 'student.restrict', 'student', $classId);
        $narrative = NarrativeFixture::insertChallengeRiddle($db, 'restricted-chapter', 'restricted-riddle');
        NarrativeFixture::restrictChapterForClass($db, $narrative['chapterId'], $classId);

        $this->api->login('student.restrict');
        $list = $this->api->get('/api/chapters');
        $ids = array_column($list['json']['data']['items'] ?? [], 'id');

        self::assertNotContains($narrative['chapterId'], $ids);

        $show = $this->api->get('/api/chapters/'.$narrative['chapterId']);
        self::assertSame(404, $show['status']);
    }

    public function testCompleteBlockedUntilChallengesDone(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/chapters/'.$seed['chapterId'].'/start', [], true);

        $complete = $this->api->post('/api/chapters/'.$seed['chapterId'].'/complete', [], true);

        self::assertSame(409, $complete['status']);
        self::assertSame('CHAPTER_NOT_READY', $complete['json']['error']['code'] ?? null);
    }

    public function testStartResumesInProgressChapterAndSyncsStepIndex(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'student.test', 'student');
        $narrative = NarrativeFixture::insertFullScenarioChapter($db, 'chapter-sync-steps');
        $this->api->login('student.test');
        $this->api->post('/api/chapters/'.$narrative['chapterId'].'/start', [], true);

        $sync = $this->api->post('/api/chapters/'.$narrative['chapterId'].'/steps', [
            'currentStepIndex' => 2,
        ], true);
        self::assertSame(200, $sync['status']);
        self::assertSame(2, $sync['json']['data']['progress']['currentStepIndex'] ?? null);

        $resume = $this->api->post('/api/chapters/'.$narrative['chapterId'].'/start', [], true);
        self::assertSame(200, $resume['status']);
        self::assertSame('in_progress', $resume['json']['data']['progress']['status'] ?? null);
        self::assertSame(2, $resume['json']['data']['progress']['currentStepIndex'] ?? null);
    }

    public function testStartAfterCompletionRestartsChapterAttempt(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/chapters/'.$seed['chapterId'].'/start', [], true);
        $this->api->post('/api/chapters/'.$seed['chapterId'].'/steps', [
            'currentStepIndex' => 1,
        ], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 1,
            'answer' => 'ans1',
        ], true);

        $restart = $this->api->post('/api/chapters/'.$seed['chapterId'].'/start', [], true);
        self::assertSame(200, $restart['status']);
        self::assertSame('in_progress', $restart['json']['data']['progress']['status'] ?? null);
        self::assertSame(0, $restart['json']['data']['progress']['currentStepIndex'] ?? null);
    }

    public function testChapterAutoCompletesWhenAllChallengesDone(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);

        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 1,
            'answer' => 'ans1',
        ], true);

        $progress = $this->api->get('/api/chapters/'.$seed['chapterId'].'/progress');

        self::assertSame(200, $progress['status']);
        self::assertSame('completed', $progress['json']['data']['progress']['status'] ?? null);
    }

    public function testCompletePersistsScoreAfterAutoCompletion(): void
    {
        $seed = $this->seedChallengeRiddleScenario();
        $this->api->login('student.test');
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/start', [], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);
        $this->api->post('/api/riddles/'.$seed['riddleId'].'/responses', [
            'questionIndex' => 1,
            'answer' => 'ans1',
        ], true);

        $complete = $this->api->post('/api/chapters/'.$seed['chapterId'].'/complete', [
            'score' => 50,
        ], true);

        self::assertSame(200, $complete['status']);
        self::assertSame('completed', $complete['json']['data']['progress']['status'] ?? null);
        self::assertSame(50, $complete['json']['data']['progress']['score'] ?? null);
    }
}
