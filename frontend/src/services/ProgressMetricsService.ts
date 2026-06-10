import type { ChapterProgress } from "../models/ChapterProgress.js";
import type { ProgressMetrics, ProgressMetricsWithTotal } from "../models/services/ProgressMetrics.js";
import type { ChapterService } from "./ChapterService.js";

export class ProgressMetricsService {
  public async loadFromChapters(chapters: ChapterService): Promise<ProgressMetricsWithTotal> {
    const catalog = await chapters.listChapters();
    const progressItems = await Promise.all(
      catalog.map(async (chapter) => ({
        progress: await chapters.getProgress(chapter.id),
        stepCount: chapter.stepCount ?? 0
      }))
    );

    return this.fromChapterProgress(progressItems, catalog.length);
  }

  public fromChapterProgress(
    progressItems: Array<ChapterProgress | { progress: ChapterProgress; stepCount: number | null | undefined }>,
    totalChapters = progressItems.length
  ): ProgressMetricsWithTotal {
    const metrics = this.fromProgress(progressItems);

    return {
      ...metrics,
      totalChapters
    };
  }

  public fromProgress(
    progressItems: Array<ChapterProgress | { progress: ChapterProgress; stepCount: number | null | undefined }>
  ): ProgressMetrics {
    const percentages = progressItems.map((item) => {
      if ("progress" in item) {
        return this.progressPercent(item.progress, item.stepCount);
      }

      return this.progressPercent(item);
    });
    return this.fromPercentages(percentages);
  }

  /** Single source of truth: maps chapter resume position to a UI completion percentage (0-100). */
  public progressPercent(progress: ChapterProgress, stepCount?: number | null): number {
    if (progress.status === "completed") {
      return 100;
    }
    if (progress.status !== "in_progress" || stepCount === undefined || stepCount === null || stepCount <= 0) {
      return 0;
    }

    const percent = Math.round((progress.currentStepIndex / stepCount) * 100);
    return Math.max(0, Math.min(99, percent));
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
