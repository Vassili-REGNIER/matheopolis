import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
import type {
  QuizDetail,
  QuizDetailEnvelopeData,
  QuizListEnvelopeData,
  QuizSummary,
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

  public async updateQuiz(quizId: number, request: UpdateQuizRequest): Promise<QuizDetail> {
    const envelope = await this.api.patch<QuizDetailEnvelopeData>(`/api/quizzes/${quizId}`, request);
    return unwrapEnvelope(envelope).quiz;
  }
}
