import type { CreateQuizRequest, Quiz, QuizValidationRequest } from "../../models/Quiz.js";
import type { GameAccessService } from "../GameAccessService.js";

export class TeacherQuizService {
  private readonly storageKey = "matheopolis.teacher.quizzes";

  public constructor(private readonly gameAccess: GameAccessService) {}

  public listMyQuizzes(): Promise<Quiz[]> {
    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === null) {
      return Promise.resolve([]);
    }

    try {
      return Promise.resolve(JSON.parse(raw) as Quiz[]);
    } catch {
      window.localStorage.removeItem(this.storageKey);
      return Promise.resolve([]);
    }
  }

  public async createQuiz(request: CreateQuizRequest): Promise<Quiz> {
    const quiz: Quiz = {
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

  public assignQuizToClasses(quizId: string, classIds: number[]): Promise<Quiz[]> {
    return this.updateQuiz(quizId, (quiz) => ({
      ...quiz,
      status: "assigned",
      classIds
    }));
  }

  public requestGlobalValidation(request: QuizValidationRequest): Promise<Quiz[]> {
    return this.updateQuiz(request.quizId, (quiz) => ({
      ...quiz,
      status: "pending_validation"
    }));
  }

  public setGameEnabled(chapterId: number, enabled: boolean): void {
    this.gameAccess.setEnabled(chapterId, enabled);
  }

  private async updateQuiz(quizId: string, updater: (quiz: Quiz) => Quiz): Promise<Quiz[]> {
    const quizzes = await this.listMyQuizzes();
    const next = quizzes.map((quiz) => quiz.id === quizId ? updater(quiz) : quiz);
    window.localStorage.setItem(this.storageKey, JSON.stringify(next));
    return next;
  }
}
