import { listConfiguredChapters } from "../features/GameEngine/configs/index.js";
import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type { Chapter } from "../models/Chapter.js";
import type {
  ChapterAttemptEnvelopeData,
  ChapterProgress,
  ChapterProgressEnvelopeData,
  ChapterStartEnvelopeData
} from "../models/ChapterProgress.js";
import { chapterProgressFromApi } from "../models/ChapterProgress.js";
import type { ApiClient } from "./ApiClient.js";
import type { AuthService } from "./AuthService.js";

export class ChapterService {
  public constructor(
    private readonly api: ApiClient,
    private readonly auth: AuthService
  ) {}

  public async listChapters(): Promise<Chapter[]> {
    return listConfiguredChapters();
  }

  public async startChapter(chapterId: number): Promise<ChapterStartEnvelopeData> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.startLocalChapter(chapterId);
    }

    try {
      const envelope = await this.api.post<ChapterStartEnvelopeData>(`/api/riddles/${chapterId}/start`);
      const data = unwrapEnvelope(envelope);
      return {
        playToken: data.playToken,
        progress: chapterProgressFromApi(data.progress)
      };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        return this.startLocalChapter(chapterId);
      }
      throw error;
    }
  }

  public async getProgress(chapterId: number): Promise<ChapterProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.readLocalProgress(chapterId);
    }

    try {
      const envelope = await this.api.get<ChapterProgressEnvelopeData>(`/api/riddles/${chapterId}/progress`);
      return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
    } catch {
      return this.readLocalProgress(chapterId);
    }
  }

  public async submitAttempt(chapterId: number, answer: string, playToken: string): Promise<ChapterProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      const progress = this.readLocalProgress(chapterId);
      const updated: ChapterProgress = {
        ...progress,
        status: "in_progress",
        attemptCount: progress.attemptCount + 1,
        lastAttemptAt: new Date().toISOString()
      };
      this.writeLocalProgress(updated);
      return updated;
    }

    try {
      const envelope = await this.api.post<ChapterAttemptEnvelopeData>(`/api/riddles/${chapterId}/attempt`, {
        answer,
        playToken
      });
      return chapterProgressFromApi(unwrapEnvelope(envelope).attempt.progress);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        const progress = this.readLocalProgress(chapterId);
        const updated: ChapterProgress = {
          ...progress,
          status: "in_progress",
          attemptCount: progress.attemptCount + 1,
          lastAttemptAt: new Date().toISOString()
        };
        this.writeLocalProgress(updated);
        return updated;
      }
      throw error;
    }
  }

  public async completeChapter(chapterId: number, playToken: string): Promise<ChapterProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.completeLocalChapter(chapterId);
    }

    try {
      const envelope = await this.api.post<ChapterProgressEnvelopeData>(`/api/riddles/${chapterId}/complete`, {
        playToken
      });
      return chapterProgressFromApi(unwrapEnvelope(envelope).progress);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        return this.completeLocalChapter(chapterId);
      }
      throw error;
    }
  }

  public async submitScore(chapterId: number, score: number, playToken: string): Promise<ChapterProgress> {
    await this.submitAttempt(chapterId, String(score), playToken);
    return await this.completeChapter(chapterId, playToken);
  }

  private startLocalChapter(chapterId: number): ChapterStartEnvelopeData {
    const progress = this.readLocalProgress(chapterId);
    const updated: ChapterProgress = {
      ...progress,
      status: "in_progress",
      startedAt: progress.startedAt ?? new Date().toISOString()
    };
    this.writeLocalProgress(updated);
    return {
      progress: updated,
      playToken: `local-token-${chapterId}-${Date.now()}`
    };
  }

  private completeLocalChapter(chapterId: number): ChapterProgress {
    const progress = this.readLocalProgress(chapterId);
    const completed: ChapterProgress = {
      ...progress,
      status: "completed",
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
      studentId: 0,
      status: "not_started",
      attemptCount: 0,
      startedAt: null,
      completedAt: null,
      lastAttemptAt: null
    };
  }

  private writeLocalProgress(progress: ChapterProgress): void {
    window.localStorage.setItem(
      `matheopolis.chapterProgress.${progress.chapterId}`,
      JSON.stringify(progress)
    );
  }
}
