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
  UpdateQuizQuestionRequest,
  UpdateQuizRequest
} from "../../models/Quiz.js";
import type { ApiClient } from "../ApiClient.js";

export class TeacherQuizService {
  public constructor(private readonly api: ApiClient) {}

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
}
