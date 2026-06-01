export class AdminQuizValidationService {
    getPendingQuizzes() {
        return Promise.resolve([]);
    }
    validateQuiz(_quizId) {
        return Promise.resolve();
    }
    rejectQuiz(_quizId, _feedback) {
        return Promise.resolve();
    }
}
