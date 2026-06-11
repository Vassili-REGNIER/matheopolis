<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\QuizRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\QuizFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\QuizRepository
 */
final class QuizRepositoryTest extends IntegrationTestCase
{
    private QuizRepository $repository;

    /**
     * Updates the up.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new QuizRepository($this->db);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testFindQuestionsHidesCorrectFlagsForPlay(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.repo', 'teacher');
        $seed = QuizFixture::insertQuiz($this->db, $teacherId);

        $playQuestions = $this->repository->findQuestionsByQuizId($seed['quizId'], false);
        $manageQuestions = $this->repository->findQuestionsByQuizId($seed['quizId'], true);

        self::assertCount(2, $playQuestions);
        self::assertFalse($playQuestions[0]->getOptions()[0]->isCorrect());
        self::assertTrue($manageQuestions[0]->getOptions()[1]->isCorrect());
        self::assertSame(2, $this->repository->countQuestions($seed['quizId']));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testInsertAndDeleteQuiz(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.repo2', 'teacher');

        $quiz = $this->repository->insert(
            'Created quiz',
            'Description',
            $teacherId,
            'private',
            [
                [
                    'label' => 'Question',
                    'type' => 'radio',
                    'orderIndex' => 0,
                    'options' => [
                        ['label' => 'A', 'isCorrect' => true],
                        ['label' => 'B', 'isCorrect' => false],
                    ],
                ],
            ],
        );

        self::assertSame('Created quiz', $quiz->getTitle());
        self::assertNotNull($this->repository->find($quiz->getId()));

        $this->repository->delete($quiz->getId());
        self::assertNull($this->repository->find($quiz->getId()));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testQuestionCrudAndPublicationRequests(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.repo3', 'teacher');
        $quiz = $this->repository->insert('Pub quiz', null, $teacherId, 'private', []);

        $question = $this->repository->insertQuestion($quiz->getId(), 'New Q', 'radio', 0, [
            ['label' => 'Yes', 'isCorrect' => true],
            ['label' => 'No', 'isCorrect' => false],
        ]);
        self::assertSame('New Q', $question->getLabel());

        $updated = $this->repository->updateQuestion($question->getId(), 'Renamed', null, null, null);
        self::assertNotNull($updated);
        self::assertSame('Renamed', $updated->getLabel());

        $this->repository->update($quiz->getId(), null, null, null, true);
        $requests = $this->repository->findPublicationRequests();
        self::assertNotEmpty($requests);

        $this->repository->deleteQuestion($question->getId());
        self::assertNull($this->repository->findQuestionById($question->getId()));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testUpdateQuizMetadata(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.repo5', 'teacher');
        $quiz = QuizFixture::insertQuiz($this->db, $teacherId, 'private');

        $updated = $this->repository->update($quiz['quizId'], 'New title', 'Desc', 'public', false);

        self::assertNotNull($updated);
        self::assertSame('New title', $updated->getTitle());
        self::assertSame('public', $updated->getStatus());
    }

    /**
     * Verifies the expected behavior.
     */
    public function testTargetClassUpsertAndDelete(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.repo4', 'teacher');
        $classId = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-QTC');
        $quiz = QuizFixture::insertQuiz($this->db, $teacherId, 'public');

        $this->repository->upsertTargetClass($quiz['quizId'], $classId, false);
        $targets = $this->repository->findTargetClassesByQuizId($quiz['quizId']);
        self::assertSame([['classId' => $classId, 'isActive' => false]], $targets);

        $this->repository->deleteTargetClass($quiz['quizId'], $classId);
        self::assertSame([], $this->repository->findTargetClassesByQuizId($quiz['quizId']));
    }
}
