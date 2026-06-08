import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
import type {
  CreateQuizRequest,
  QuizDetail,
  QuizDetailEnvelopeData,
  QuizListEnvelopeData,
  QuizQuestionEnvelopeData,
  QuizQuestionFull,
  QuizQuestionInput,
  QuizSummary,
  QuizTargetClassEnvelopeData,
  QuizTargetClassListEnvelopeData,
  UpdateQuizQuestionRequest,
  UpdateQuizRequest
} from "../../models/Quiz.js";
import type { ApiClient } from "../ApiClient.js";
import type { GameAccessService } from "../GameAccessService.js";

export class TeacherQuizService {
  public constructor(
    private readonly api: ApiClient,
    private readonly gameAccess: GameAccessService
  ) {}

  public async listAccessibleQuizzes(): Promise<QuizSummary[]> {
    const envelope = await this.api.get<QuizListEnvelopeData>("/api/quizzes");
    return unwrapEnvelope(envelope).items;
  }

  public async getQuizDetail(quizId: number): Promise<QuizDetail> {
    const envelope = await this.api.get<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`);
    return unwrapEnvelope(envelope).quiz;
  }

  public async createQuiz(request: CreateQuizRequest): Promise<QuizDetail> {
    const envelope = await this.api.post<QuizDetailEnvelopeData>("/api/quizzes", {
      ...request,
      status: request.status ?? "private"
    });
    return unwrapEnvelope(envelope).quiz;
  }

  public async updateQuiz(quizId: number, request: UpdateQuizRequest): Promise<QuizDetail> {
    const envelope = await this.api.patch<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`, request);
    return unwrapEnvelope(envelope).quiz;
  }

  public async requestPublication(quizId: number): Promise<QuizDetail> {
    return this.updateQuiz(quizId, { askAdmin: true });
  }

  public async cancelPublicationRequest(quizId: number): Promise<QuizDetail> {
    return this.updateQuiz(quizId, { askAdmin: false });
  }

  public async addQuestion(quizId: number, question: QuizQuestionInput): Promise<QuizQuestionFull> {
    const envelope = await this.api.post<QuizQuestionEnvelopeData>(`/api/quizzes/${quizId}/questions`, question);
    return unwrapEnvelope(envelope).question;
  }

  public async deleteQuiz(quizId: number): Promise<void> {
    await this.api.delete<null>(`/api/quizzes/${quizId}`);
  }

  public async listClassAccess(quizId: number): Promise<Array<{ classId: number; isActive: boolean }>> {
    const envelope = await this.api.get<QuizTargetClassListEnvelopeData>(`/api/quizzes/${quizId}/target-classes`);
    return unwrapEnvelope(envelope).items;
  }

  public async setClassAccess(quizId: number, classId: number, isActive: boolean): Promise<void> {
    await this.api.put<QuizTargetClassEnvelopeData>(`/api/quizzes/${quizId}/target-classes/${classId}`, {
      isActive
    });
  }

  public async removeClassAccess(quizId: number, classId: number): Promise<void> {
    await this.api.delete<null>(`/api/quizzes/${quizId}/target-classes/${classId}`);
  }

  public async updateQuestion(
    quizId: number,
    questionId: number,
    request: UpdateQuizQuestionRequest
  ): Promise<QuizQuestionFull> {
    const envelope = await this.api.patch<QuizQuestionEnvelopeData>(
      `/api/quizzes/${quizId}/questions/${questionId}`,
      request
    );
    return unwrapEnvelope(envelope).question;
  }

  public async deleteQuestion(quizId: number, questionId: number): Promise<void> {
    await this.api.delete<null>(`/api/quizzes/${quizId}/questions/${questionId}`);
  }

  public setGameEnabled(chapterId: number, enabled: boolean): void {
    this.gameAccess.setEnabled(chapterId, enabled);
  }
}
