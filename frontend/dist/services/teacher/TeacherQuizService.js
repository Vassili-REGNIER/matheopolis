export class TeacherQuizService {
    gameAccess;
    storageKey = "matheopolis.teacher.quizzes";
    constructor(gameAccess) {
        this.gameAccess = gameAccess;
    }
    listMyQuizzes() {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw === null) {
            return Promise.resolve([]);
        }
        try {
            return Promise.resolve(JSON.parse(raw));
        }
        catch {
            window.localStorage.removeItem(this.storageKey);
            return Promise.resolve([]);
        }
    }
    async createQuiz(request) {
        const quiz = {
            id: `quiz-${Date.now()}`,
            title: request.title,
            status: "draft",
            questionCount: request.questions.length,
            classIds: []
        };
        const quizzes = await this.listMyQuizzes();
        window.localStorage.setItem(this.storageKey, JSON.stringify([quiz, ...quizzes]));
        return quiz;
    }
    assignQuizToClasses(quizId, classIds) {
        return this.updateQuiz(quizId, (quiz) => ({
            ...quiz,
            status: "assigned",
            classIds
        }));
    }
    requestGlobalValidation(request) {
        return this.updateQuiz(request.quizId, (quiz) => ({
            ...quiz,
            status: "pending_validation"
        }));
    }
    setGameEnabled(riddleId, enabled) {
        this.gameAccess.setEnabled(riddleId, enabled);
    }
    async updateQuiz(quizId, updater) {
        const quizzes = await this.listMyQuizzes();
        const next = quizzes.map((quiz) => quiz.id === quizId ? updater(quiz) : quiz);
        window.localStorage.setItem(this.storageKey, JSON.stringify(next));
        return next;
    }
}
