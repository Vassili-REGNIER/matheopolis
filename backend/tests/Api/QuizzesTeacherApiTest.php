<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\QuizFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * Teacher and admin quiz management API tests.
 *
 * @internal
 *
 * @coversNothing
 */
final class QuizzesTeacherApiTest extends ApiTestCase
{
    public function testTeacherUpdatesQuizMetadata(): void
    {
        $seed = $this->seedPrivateQuiz();
        $this->api->login($seed['teacherUsername']);

        $response = $this->api->patch('/api/quizzes/'.$seed['quizId'], [
            'title' => 'Updated title',
            'description' => 'New description',
        ], true);

        self::assertSame(200, $response['status']);
        self::assertSame('Updated title', $response['json']['data']['quiz']['title'] ?? null);
        self::assertSame('New description', $response['json']['data']['quiz']['description'] ?? null);
    }

    public function testTeacherCannotChangeQuizStatus(): void
    {
        $seed = $this->seedPrivateQuiz();
        $this->api->login($seed['teacherUsername']);

        $response = $this->api->patch('/api/quizzes/'.$seed['quizId'], [
            'status' => 'public',
        ], true);

        self::assertSame(403, $response['status']);
    }

    public function testTeacherCanRequestPublication(): void
    {
        $seed = $this->seedPrivateQuiz();
        $this->api->login($seed['teacherUsername']);

        $response = $this->api->patch('/api/quizzes/'.$seed['quizId'], [
            'askAdmin' => true,
        ], true);

        self::assertSame(200, $response['status']);
        self::assertTrue($response['json']['data']['quiz']['askAdmin'] ?? false);
    }

    public function testOtherTeacherCannotManageQuiz(): void
    {
        $seed = $this->seedPrivateQuiz();
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'teacher.other', 'teacher');
        $this->api->login('teacher.other');

        $response = $this->api->patch('/api/quizzes/'.$seed['quizId'], [
            'title' => 'Hijack',
        ], true);

        self::assertSame(403, $response['status']);
    }

    public function testTeacherManagesQuestionsLifecycle(): void
    {
        $seed = $this->seedPrivateQuiz('teacher.questions');
        $this->api->login($seed['teacherUsername']);
        $quizId = $seed['quizId'];
        $firstQuestionId = $seed['questionIds'][0];

        $add = $this->api->post('/api/quizzes/'.$quizId.'/questions', [
            'label' => 'Added question',
            'type' => 'radio',
            'orderIndex' => 2,
            'options' => [
                ['label' => 'Opt A', 'isCorrect' => true],
                ['label' => 'Opt B', 'isCorrect' => false],
            ],
        ], true);
        self::assertSame(201, $add['status']);
        $addedQuestionId = $add['json']['data']['question']['id'] ?? null;

        $update = $this->api->patch('/api/quizzes/'.$quizId.'/questions/'.$firstQuestionId, [
            'label' => 'Renamed Q1',
        ], true);
        self::assertSame(200, $update['status']);
        self::assertSame('Renamed Q1', $update['json']['data']['question']['label'] ?? null);

        $delete = $this->api->delete('/api/quizzes/'.$quizId.'/questions/'.$addedQuestionId, true);
        self::assertSame(204, $delete['status']);

        $show = $this->api->get('/api/quizzes/'.$quizId);
        self::assertSame(200, $show['status']);
        self::assertCount(2, $show['json']['data']['quiz']['questions'] ?? []);
    }

    public function testTeacherDeletesOwnQuiz(): void
    {
        $seed = $this->seedPrivateQuiz('teacher.delete');
        $this->api->login($seed['teacherUsername']);

        $response = $this->api->delete('/api/quizzes/'.$seed['quizId'], true);

        self::assertSame(204, $response['status']);
        self::assertSame(404, $this->api->get('/api/quizzes/'.$seed['quizId'])['status']);
    }

    public function testAdminPublishesQuizAndListsPublicationRequests(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.pub', 'teacher');
        TestUserFactory::insert($db, 'admin.pub', 'admin');
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'private');

        $this->api->login('teacher.pub');
        $this->api->patch('/api/quizzes/'.$quiz['quizId'], ['askAdmin' => true], true);

        $this->api->login('admin.pub');
        $pending = $this->api->get('/api/quizzes?publicationRequested=true');
        $pendingIds = array_column($pending['json']['data']['items'] ?? [], 'id');
        self::assertContains($quiz['quizId'], $pendingIds);

        $publish = $this->api->patch('/api/quizzes/'.$quiz['quizId'], ['status' => 'public'], true);
        self::assertSame(200, $publish['status']);
        self::assertSame('public', $publish['json']['data']['quiz']['status'] ?? null);
        self::assertFalse($publish['json']['data']['quiz']['askAdmin'] ?? true);
    }

    public function testTeacherRemovesTargetClassGrant(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.tgt2', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-RM');
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'private');
        QuizFixture::grantQuizForClass($db, $quiz['quizId'], $classId);

        $this->api->login('teacher.tgt2');
        $remove = $this->api->delete('/api/quizzes/'.$quiz['quizId'].'/target-classes/'.$classId, true);
        self::assertSame(204, $remove['status']);

        $targets = $this->api->get('/api/quizzes/'.$quiz['quizId'].'/target-classes');
        self::assertSame([], $targets['json']['data']['items'] ?? []);
    }

    public function testAdminCannotPublishAlreadyPublicQuiz(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.pub2', 'teacher');
        TestUserFactory::insert($db, 'admin.pub2', 'admin');
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'public');

        $this->api->login('admin.pub2');
        $response = $this->api->patch('/api/quizzes/'.$quiz['quizId'], ['status' => 'public'], true);

        self::assertSame(409, $response['status']);
        self::assertSame('QUIZ_ALREADY_PUBLIC', $response['json']['error']['code'] ?? null);
    }

    public function testStudentCannotAccessPrivateQuizWithoutGrant(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.private', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-PRIV');
        TestUserFactory::insert($db, 'student.private', 'student', $classId);
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'private');

        $this->api->login('student.private');
        $response = $this->api->get('/api/quizzes/'.$quiz['quizId']);

        self::assertSame(403, $response['status']);
    }

    public function testAddQuestionRejectsInvalidPayload(): void
    {
        $seed = $this->seedPrivateQuiz('teacher.invalid');
        $this->api->login($seed['teacherUsername']);

        $response = $this->api->post('/api/quizzes/'.$seed['quizId'].'/questions', [
            'label' => 'Bad',
            'type' => 'radio',
            'orderIndex' => 3,
            'options' => [
                ['label' => 'Only one', 'isCorrect' => true],
            ],
        ], true);

        self::assertSame(422, $response['status']);
    }

    /**
     * @return array{
     *   quizId: int,
     *   questionIds: array<int, int>,
     *   teacherUsername: string
     * }
     */
    private function seedPrivateQuiz(string $teacherUsername = 'teacher.manage'): array
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, $teacherUsername, 'teacher');
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'private');

        return [
            'quizId' => $quiz['quizId'],
            'questionIds' => $quiz['questionIds'],
            'teacherUsername' => $teacherUsername,
        ];
    }
}
