import { unwrapEnvelope, type ApiEnvelope } from "../models/ApiEnvelopes.js";
import type { Chapter, ChapterListEnvelopeData } from "../models/Chapter.js";
import type {
  ChapterProgress,
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
    const envelope = await this.api.getStaticJson<ApiEnvelope<ChapterListEnvelopeData>>("./public/mocks/api/puzzles.json");
    return unwrapEnvelope(envelope).items;
  }

  public async startChapter(chapterId: number): Promise<ChapterStartEnvelopeData> {
    return this.startLocalChapter(chapterId);
  }

  public async getProgress(chapterId: number): Promise<ChapterProgress> {
    return this.readLocalProgress(chapterId);
  }

  public async submitAttempt(chapterId: number, answer: string, playToken: string): Promise<ChapterProgress> {
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

  public async completeChapter(chapterId: number, playToken: string): Promise<ChapterProgress> {
    return this.completeLocalChapter(chapterId);
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
