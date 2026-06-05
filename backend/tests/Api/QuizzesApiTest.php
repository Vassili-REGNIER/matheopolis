<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\QuizFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 *
 * @coversNothing
 */
final class QuizzesApiTest extends ApiTestCase
{
    public function testGuestCannotListQuizzes(): void
    {
        $response = $this->api->get('/api/quizzes');
        self::assertSame(401, $response['status']);
    }

    public function testTeacherCanCreatePrivateQuiz(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'teacher.create', 'teacher');
        $this->api->login('teacher.create');

        $response = $this->api->post('/api/quizzes', [
            'title' => 'Teacher quiz',
            'status' => 'private',
            'questions' => [
                [
                    'label' => 'Q1',
                    'type' => 'radio',
                    'orderIndex' => 0,
                    'options' => [
                        ['label' => 'Yes', 'isCorrect' => true],
                        ['label' => 'No', 'isCorrect' => false],
                    ],
                ],
            ],
        ], true);

        self::assertSame(201, $response['status']);
        self::assertSame('Teacher quiz', $response['json']['data']['quiz']['title'] ?? null);
    }

    public function testStudentListsPublicQuiz(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');

        $response = $this->api->get('/api/quizzes');

        self::assertSame(200, $response['status']);
        $ids = array_column($response['json']['data']['items'] ?? [], 'id');
        self::assertContains($quiz['quizId'], $ids);
    }

    public function testStudentDoesNotSeeRestrictedPublicQuiz(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.quiz2', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-RQ');
        TestUserFactory::insert($db, 'student.quiz2', 'student', $classId);
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'public');
        QuizFixture::restrictQuizForClass($db, $quiz['quizId'], $classId);

        $this->api->login('student.quiz2');
        $response = $this->api->get('/api/quizzes');
        $ids = array_column($response['json']['data']['items'] ?? [], 'id');

        self::assertNotContains($quiz['quizId'], $ids);
    }

    public function testQuizAttemptSubmitAndCorrection(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');

        $start = $this->api->post('/api/quizzes/'.$quiz['quizId'].'/attempts', [], true);
        self::assertSame(201, $start['status']);
        self::assertSame('in_progress', $start['json']['data']['progress']['status'] ?? null);

        $answer1 = $this->api->post('/api/quizzes/'.$quiz['quizId'].'/responses', [
            'questionId' => $quiz['questionIds'][0],
            'optionIds' => [$quiz['correctOptionIds'][0]],
        ], true);
        self::assertSame(200, $answer1['status']);
        self::assertSame(1, $answer1['json']['data']['progress']['currentQuestionIndex'] ?? null);

        $answer2 = $this->api->post('/api/quizzes/'.$quiz['quizId'].'/responses', [
            'questionId' => $quiz['questionIds'][1],
            'optionIds' => [$quiz['correctOptionIds'][1]],
        ], true);
        self::assertSame(200, $answer2['status']);
        self::assertSame('completed', $answer2['json']['data']['progress']['status'] ?? null);

        $correction = $this->api->get('/api/quizzes/'.$quiz['quizId'].'/correction');
        self::assertSame(200, $correction['status']);
        self::assertSame(2, $correction['json']['data']['attempt']['score'] ?? null);
        self::assertSame(2, $correction['json']['data']['attempt']['total'] ?? null);
    }

    public function testTeacherGrantsPrivateQuizToClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.target', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-TGT');
        $quiz = QuizFixture::insertQuiz($db, $teacherId, 'private');

        $this->api->login('teacher.target');
        $grant = $this->api->request('PUT', '/api/quizzes/'.$quiz['quizId'].'/target-classes/'.$classId, [
            'isActive' => true,
        ], true);

        self::assertSame(200, $grant['status']);
        self::assertTrue($grant['json']['data']['targetClass']['isActive'] ?? false);

        $targets = $this->api->get('/api/quizzes/'.$quiz['quizId'].'/target-classes');
        self::assertSame(200, $targets['status']);
        self::assertNotEmpty($targets['json']['data']['items'] ?? []);
    }

    public function testQuizProgressReturnsNotStartedBeforeAttempt(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');

        $response = $this->api->get('/api/quizzes/'.$quiz['quizId'].'/progress');

        self::assertSame(200, $response['status']);
        self::assertSame('not_started', $response['json']['data']['progress']['status'] ?? null);
    }

    public function testStudentCanViewPublicQuizPlayPayload(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');

        $response = $this->api->get('/api/quizzes/'.$quiz['quizId']);

        self::assertSame(200, $response['status']);
        self::assertCount(2, $response['json']['data']['quiz']['questions'] ?? []);
        self::assertArrayNotHasKey('isCorrect', $response['json']['data']['quiz']['questions'][0]['options'][0] ?? []);
    }

    public function testStartAttemptTwiceReturnsConflict(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');
        $this->api->post('/api/quizzes/'.$quiz['quizId'].'/attempts', [], true);

        $second = $this->api->post('/api/quizzes/'.$quiz['quizId'].'/attempts', [], true);

        self::assertSame(409, $second['status']);
    }

    public function testSubmitResponseRequiresInOrder(): void
    {
        $quiz = $this->seedPublicQuizForStudent();
        $this->api->login('student.quiz');
        $this->api->post('/api/quizzes/'.$quiz['quizId'].'/attempts', [], true);

        $outOfOrder = $this->api->post('/api/quizzes/'.$quiz['quizId'].'/responses', [
            'questionId' => $quiz['questionIds'][1],
            'optionIds' => [$quiz['correctOptionIds'][1]],
        ], true);

        self::assertSame(422, $outOfOrder['status']);
    }

    /**
     * @return array{
     *   quizId: int,
     *   questionIds: array<int, int>,
     *   correctOptionIds: array<int, int>
     * }
     */
    private function seedPublicQuizForStudent(): array
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.quiz', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-QUIZ');
        TestUserFactory::insert($db, 'student.quiz', 'student', $classId);

        return QuizFixture::insertQuiz($db, $teacherId, 'public');
    }
}
