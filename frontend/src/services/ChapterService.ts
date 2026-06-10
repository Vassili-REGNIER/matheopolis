import { unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type { Chapter, ChapterDetail, ChapterListEnvelopeData } from "../models/Chapter.js";
import type {
  ChapterProgress,
  ChapterProgressEnvelopeData,
  ChapterStartEnvelopeData
} from "../models/ChapterProgress.js";
import { chapterProgressFromApi } from "../models/ChapterProgress.js";
import type {
  RiddleProgress,
  RiddleProgressEnvelopeData,
  RiddleResponseRequest,
  RiddleResponseResultEnvelopeData
} from "../models/Riddle.js";
import type { ApiClient } from "./ApiClient.js";
import type { AuthService } from "./AuthService.js";

export class ChapterService {
  public constructor(
    private readonly api: ApiClient,
    private readonly auth: AuthService
  ) {}

  public async listChapters(): Promise<Chapter[]> {
    const envelope = await this.api.get<ChapterListEnvelopeData>("/api/chapters");
    return unwrapEnvelope(envelope).items;
  }

  public async getChapter(chapterId: number): Promise<ChapterDetail> {
    const envelope = await this.api.get<ChapterDetail>(`/api/chapters/${chapterId}`);
    return unwrapEnvelope(envelope);
  }

  public async startChapter(chapterId: number): Promise<ChapterStartEnvelopeData> {
    if (await this.shouldUseLocalProgress()) {
      return this.startLocalChapter(chapterId);
    }

    const envelope = await this.api.post<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/start`);
    return {
      progress: chapterProgressFromApi(unwrapEnvelope(envelope).progress),
      playToken: ""
    };
  }

  public async getProgress(chapterId: number): Promise<ChapterProgress> {
    if (await this.shouldUseLocalProgress()) {
      return this.readLocalProgress(chapterId);
    }

    const envelope = await this.api.get<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/progress`);
    return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
  }

  public async completeChapter(chapterId: number, score?: number, playToken = ""): Promise<ChapterProgress> {
    if (await this.shouldUseLocalProgress()) {
      return this.completeLocalChapter(chapterId, score);
    }

    const body = score === undefined ? undefined : { score };
    const envelope = await this.api.post<ChapterProgressEnvelopeData>(`/api/chapters/${chapterId}/complete`, body);
    return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
  }

  public async submitScore(chapterId: number, score: number, playToken = ""): Promise<ChapterProgress> {
    if (await this.shouldUseLocalProgress()) {
      await this.submitLocalAttempt(chapterId);
      return await this.completeChapter(chapterId, score, playToken);
    }

    return await this.completeChapter(chapterId, score, playToken);
  }

  public async syncChapterStep(chapterId: number, currentStepIndex: number): Promise<ChapterProgress> {
    if (await this.shouldUseLocalProgress()) {
      return this.syncLocalChapterStep(chapterId, currentStepIndex);
    }

    const envelope = await this.api.post<ChapterProgressEnvelopeData>(
      `/api/chapters/${chapterId}/steps`,
      { currentStepIndex }
    );
    return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
  }

  public async startRiddle(riddleId: number): Promise<RiddleProgress> {
    const envelope = await this.api.post<RiddleProgressEnvelopeData>(`/api/riddles/${riddleId}/start`);
    return unwrapEnvelope(envelope).progress;
  }

  public async submitRiddleResponse(
    riddleId: number,
    request: RiddleResponseRequest
  ): Promise<RiddleResponseResultEnvelopeData> {
    const envelope = await this.api.post<RiddleResponseResultEnvelopeData>(
      `/api/riddles/${riddleId}/responses`,
      request
    );
    return unwrapEnvelope(envelope);
  }

  private async shouldUseLocalProgress(): Promise<boolean> {
    const user = await this.auth.getMe();
    return user !== null && this.auth.isLocalOnlyUser(user);
  }

  private startLocalChapter(chapterId: number): ChapterStartEnvelopeData {
    const progress = this.readLocalProgress(chapterId);
    const updated: ChapterProgress = {
      ...progress,
      status: "in_progress",
      currentStepIndex: progress.status === "completed" ? 0 : progress.currentStepIndex,
      score: progress.status === "completed" ? null : progress.score,
      startedAt: progress.status === "completed" ? new Date().toISOString() : (progress.startedAt ?? new Date().toISOString()),
      completedAt: progress.status === "completed" ? null : progress.completedAt
    };
    this.writeLocalProgress(updated);
    return {
      progress: updated,
      playToken: `local-token-${chapterId}-${Date.now()}`
    };
  }

  private async submitLocalAttempt(chapterId: number): Promise<ChapterProgress> {
    const progress = this.readLocalProgress(chapterId);
    const updated: ChapterProgress = {
      ...progress,
      status: "in_progress",
      lastAttemptAt: new Date().toISOString()
    };
    this.writeLocalProgress(updated);
    return updated;
  }

  private syncLocalChapterStep(chapterId: number, currentStepIndex: number): ChapterProgress {
    const progress = this.readLocalProgress(chapterId);
    const updated: ChapterProgress = {
      ...progress,
      currentStepIndex
    };
    this.writeLocalProgress(updated);
    return updated;
  }

  private completeLocalChapter(chapterId: number, score?: number): ChapterProgress {
    const progress = this.readLocalProgress(chapterId);
    const completed: ChapterProgress = {
      ...progress,
      status: "completed",
      score: score ?? progress.score,
      completedAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString()
    };
    this.writeLocalProgress(completed);
    return completed;
  }

  private readLocalProgress(chapterId: number): ChapterProgress {
    const keys = [
      `matheopolis.chapterProgress.${chapterId}`,
      `matheopolis.progress.${chapterId}`
    ];

    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        continue;
      }

      try {
        return chapterProgressFromApi(JSON.parse(raw) as ChapterProgress & { riddleId?: number });
      } catch {
        window.localStorage.removeItem(key);
      }
    }

    return {
      chapterId,
      userId: 0,
      status: "not_started",
      currentStepIndex: 0,
      score: null,
      startedAt: null,
      completedAt: null
    };
  }

  private writeLocalProgress(progress: ChapterProgress): void {
    window.localStorage.setItem(
      `matheopolis.chapterProgress.${progress.chapterId}`,
      JSON.stringify(progress)
    );
  }
}
