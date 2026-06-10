import type { ChapterProgress } from "../models/ChapterProgress.js";
import type { ProgressMetrics, ProgressMetricsWithTotal } from "../models/services/ProgressMetrics.js";
import type { ChapterService } from "./ChapterService.js";

export class ProgressMetricsService {
  public async loadFromChapters(chapters: ChapterService): Promise<ProgressMetricsWithTotal> {
    const catalog = await chapters.listChapters();
    const progressItems = await Promise.all(
      catalog.map(async (chapter) => chapters.getProgress(chapter.id))
    );

    return this.fromChapterProgress(progressItems, catalog.length);
  }

  public fromChapterProgress(progressItems: ChapterProgress[], totalChapters = progressItems.length): ProgressMetricsWithTotal {
    const metrics = this.fromProgress(progressItems);

    return {
      ...metrics,
      totalChapters
    };
  }

  public fromProgress(progressItems: ChapterProgress[]): ProgressMetrics {
    const percentages = progressItems.map((progress) => this.progressPercent(progress));
    return this.fromPercentages(percentages);
  }

  /** Single source of truth: maps chapter status to a UI completion percentage (0–100). */
  public progressPercent(progress: ChapterProgress): number {
    if (progress.status === "completed") {
      return 100;
    }
    if (progress.status === "in_progress") {
      return 50;
    }
    return 0;
  }

  public fromPercentages(percentages: number[]): ProgressMetrics {
    const exploredChapters = percentages.filter((percent) => percent > 0).length;
    const totalProgress = percentages.length === 0
      ? 0
      : Math.round(percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length);

    return {
      exploredChapters,
      totalProgress
    };
  }
}
