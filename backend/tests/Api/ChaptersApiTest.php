<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 */
final class ChaptersApiTest extends ApiTestCase
{
    public function testGuestCanShowChapterWithScenario(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle(TestDatabase::getInstance()->queryable());

        $response = $this->api->get('/api/chapters/'.$narrative['chapterId']);

        self::assertSame(200, $response['status']);
        self::assertArrayHasKey('scenario', $response['json']['data'] ?? []);
        self::assertNotEmpty($response['json']['data']['scenario']['steps'] ?? []);
    }

    public function testGuestCanListChapters(): void
    {
        NarrativeFixture::insertChallengeRiddle(TestDatabase::getInstance()->queryable());

        $response = $this->api->get('/api/chapters');

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['success'] ?? false);
        self::assertNotEmpty($response['json']['data']['items'] ?? []);
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
}
