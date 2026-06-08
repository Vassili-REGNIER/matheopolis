import { unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type {
  QuizCorrection,
  QuizListEnvelopeData,
  QuizPlayEnvelopeData,
  QuizPlayView,
  QuizProgress,
  QuizProgressEnvelopeData,
  QuizSummary,
  SubmitQuizResponseRequest
} from "../models/Quiz.js";
import type { ApiClient } from "./ApiClient.js";

type ApiQuizProgress = QuizProgress & { userId?: number };

export class QuizService {
  public constructor(private readonly api: ApiClient) {}

  public async listQuizzes(): Promise<QuizSummary[]> {
    const envelope = await this.api.get<QuizListEnvelopeData>("/api/quizzes");
    return unwrapEnvelope(envelope).items ?? [];
  }

  public async getQuiz(quizId: number): Promise<QuizPlayView> {
    const envelope = await this.api.get<QuizPlayEnvelopeData>(`/api/quizzes/${quizId}`);
    return unwrapEnvelope(envelope).quiz;
  }

  public async getProgress(quizId: number): Promise<QuizProgress> {
    const envelope = await this.api.get<QuizProgressEnvelopeData>(`/api/quizzes/${quizId}/progress`);
    return this.normalizeProgress(unwrapEnvelope(envelope).progress);
  }

  public async startAttempt(quizId: number): Promise<QuizProgress> {
    const envelope = await this.api.post<QuizProgressEnvelopeData>(`/api/quizzes/${quizId}/attempts`);
    return this.normalizeProgress(unwrapEnvelope(envelope).progress);
  }

  public async submitResponse(quizId: number, request: SubmitQuizResponseRequest): Promise<QuizProgress> {
    const envelope = await this.api.post<QuizProgressEnvelopeData>(
      `/api/quizzes/${quizId}/responses`,
      request
    );
    return this.normalizeProgress(unwrapEnvelope(envelope).progress);
  }

  public async getCorrection(quizId: number, attempt?: number): Promise<QuizCorrection> {
    const envelope = await this.api.get<QuizCorrection>(
      `/api/quizzes/${quizId}/correction`,
      attempt === undefined ? undefined : { attempt }
    );
    return unwrapEnvelope(envelope);
  }

  private normalizeProgress(progress: ApiQuizProgress): QuizProgress {
    const { userId, studentId, ...rest } = progress;

    return {
      ...rest,
      studentId: studentId ?? userId
    };
  }
}
