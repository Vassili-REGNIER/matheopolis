<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\QuizRepository;
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

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new QuizRepository($this->db);
    }

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
}
