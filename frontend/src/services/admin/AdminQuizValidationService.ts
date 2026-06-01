import type { Quiz } from "../../models/Quiz.js";

export class AdminQuizValidationService {
  public getPendingQuizzes(): Promise<Quiz[]> {
    return Promise.resolve([]);
  }

  public validateQuiz(_quizId: string): Promise<void> {
    return Promise.resolve();
  }

  public rejectQuiz(_quizId: string, _feedback: string): Promise<void> {
    return Promise.resolve();
  }
}
