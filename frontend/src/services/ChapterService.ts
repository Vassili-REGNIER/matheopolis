import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type { Chapter, ChapterDetail, ChapterListEnvelopeData } from "../models/Chapter.js";
import type {
  ChapterProgress,
  ChapterProgressEnvelopeData,
  ChapterStartEnvelopeData
} from "../models/ChapterProgress.js";
import { chapterProgressFromApi } from "../models/ChapterProgress.js";
import type { GameStep, RiddleQuestion, RiddleStep } from "../models/GameConfig.js";
import { isRecord } from "../utils/dom.js";
import type { ApiClient } from "./ApiClient.js";
import type { AuthService } from "./AuthService.js";

export class ChapterService {
  public constructor(
    private readonly api: ApiClient,
    private readonly auth: AuthService
  ) {}

  public async listChapters(): Promise<Chapter[]> {
    const envelope = await this.api.get<ChapterListEnvelopeData>("/api/chapters");
    return unwrapEnvelope(envelope).items.map((chapter) => this.normalizeChapter(chapter));
  }

  public async getChapter(chapterId: number): Promise<ChapterDetail> {
    const envelope = await this.api.get<ChapterDetail>(`/api/chapters/${chapterId}`);
    const detail = unwrapEnvelope(envelope);

    return {
      ...this.normalizeChapter(detail),
      scenario: {
        steps: detail.scenario.steps.map((step) => this.normalizeStep(step))
      }
    };
  }

  public async startChapter(chapterId: number): Promise<ChapterStartEnvelopeData> {
    if (await this.shouldUseVirtualProgress()) {
      return { progress: this.emptyProgress(chapterId) };
    }

    const envelope = await this.api.post<ChapterStartEnvelopeData>(`/api/chapters/${chapterId}/start`);
    const data = unwrapEnvelope(envelope);

    return {
      progress: chapterProgressFromApi(data.progress)
    };
  }

  public async getProgress(chapterId: number): Promise<ChapterProgress> {
    if (await this.shouldUseVirtualProgress()) {
      return this.emptyProgress(chapterId);
    }

    try {
      const envelope = await this.api.get<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/progress`);
      return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return this.emptyProgress(chapterId);
      }
      throw error;
    }
  }

  public async updateProgress(chapterId: number, currentStepIndex: number, score: number | null): Promise<ChapterProgress> {
    if (await this.shouldUseVirtualProgress()) {
      return this.emptyProgress(chapterId, "in_progress");
    }

    const envelope = await this.api.post<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/progress`, {
      currentStepIndex,
      score
    });
    return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
  }

  public async completeChapter(chapterId: number): Promise<ChapterProgress> {
    if (await this.shouldUseVirtualProgress()) {
      return this.emptyProgress(chapterId, "completed");
    }

    const envelope = await this.api.post<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/complete`);
    return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
  }

  private normalizeChapter(chapter: Chapter): Chapter {
    return {
      ...chapter,
      progress: chapter.progress === null || chapter.progress === undefined
        ? null
        : chapterProgressFromApi(chapter.progress)
    };
  }

  private normalizeStep(step: GameStep): GameStep {
    if (step.type !== "riddle") {
      return step;
    }

    return this.normalizeRiddleStep(step);
  }

  private normalizeRiddleStep(step: RiddleStep): RiddleStep {
    const rawQuestions = Array.isArray(step.gameParams?.questions) ? step.gameParams.questions : step.questions ?? [];
    const questions = rawQuestions
      .map((question, index) => this.normalizeQuestion(question, index))
      .filter((question): question is RiddleQuestion => question !== null);
    const { questions: _questions, ...gameParams } = step.gameParams ?? {};

    return {
      ...step,
      questions,
      gameParams
    };
  }

  private normalizeQuestion(value: unknown, index: number): RiddleQuestion | null {
    if (!isRecord(value)) {
      return null;
    }

    const question = typeof value.question === "string" ? value.question : "";
    if (question === "") {
      return null;
    }

    return {
      id: typeof value.id === "number" ? value.id : undefined,
      questionIndex: typeof value.questionIndex === "number" ? value.questionIndex : index,
      question,
      answer: typeof value.answer === "string" ? value.answer : undefined,
      hint: typeof value.hint === "string" ? value.hint : undefined,
      difficulty: typeof value.difficulty === "number" ? value.difficulty : 1,
      metadata: isRecord(value.metadata) ? value.metadata : undefined
    };
  }

  private async shouldUseVirtualProgress(): Promise<boolean> {
    const user = await this.auth.getMe();
    return user === null || this.auth.isLocalOnlyUser(user);
  }

  private emptyProgress(chapterId: number, status: ChapterProgress["status"] = "not_started"): ChapterProgress {
    return {
      chapterId,
      studentId: 0,
      userId: 0,
      status,
      currentStepIndex: 0,
      attemptCount: 0,
      score: null,
      startedAt: null,
      completedAt: null,
      lastAttemptAt: null
    };
  }
}
