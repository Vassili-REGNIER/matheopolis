import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
import type {
  QuizDetail,
  QuizDetailEnvelopeData,
  QuizListEnvelopeData,
  QuizQuestionEnvelopeData,
  QuizQuestionFull,
  QuizSummary,
  UpdateQuizQuestionRequest,
  UpdateQuizRequest
} from "../../models/Quiz.js";
import type { ApiClient } from "../ApiClient.js";

export class AdminQuizService {
  public constructor(private readonly api: ApiClient) {}

  public async listPublicationRequests(): Promise<QuizSummary[]> {
    const envelope = await this.api.get<QuizListEnvelopeData>("/api/quizzes", {
      publicationRequested: true
    });
    return unwrapEnvelope(envelope).items;
  }

  public async getQuizDetail(quizId: number): Promise<QuizDetail> {
    const envelope = await this.api.get<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`);
    return unwrapEnvelope(envelope).quiz;
  }

  public async publishQuiz(quizId: number): Promise<QuizDetail> {
    const envelope = await this.api.patch<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`, {
      status: "public",
      askAdmin: false
    } satisfies UpdateQuizRequest);
    return unwrapEnvelope(envelope).quiz;
  }

  public async dismissPublicationRequest(quizId: number): Promise<QuizDetail> {
    return this.updateQuiz(quizId, { askAdmin: false });
  }

  public async rejectPublicationRequest(quizId: number): Promise<QuizDetail> {
    return this.dismissPublicationRequest(quizId);
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

  public async updateQuiz(quizId: number, request: UpdateQuizRequest): Promise<QuizDetail> {
    const envelope = await this.api.patch<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`, request);
    return unwrapEnvelope(envelope).quiz;
  }
}
