import type { RiddleProgress } from "../models/Progress.js";
import type { RiddleService } from "./RiddleService.js";

export interface ProgressMetrics {
  exploredChapters: number;
  totalProgress: number;
}

export interface ProgressMetricsWithTotal extends ProgressMetrics {
  totalChapters: number;
}

export class ProgressMetricsService {
  public async loadFromRiddles(riddles: RiddleService): Promise<ProgressMetricsWithTotal> {
    const puzzles = await riddles.listPuzzles();
    const progressItems = await Promise.all(
      puzzles.map(async (puzzle) => riddles.getProgress(puzzle.id))
    );
    const metrics = this.fromProgress(progressItems);

    return {
      ...metrics,
      totalChapters: puzzles.length
    };
  }

  public fromProgress(progressItems: RiddleProgress[]): ProgressMetrics {
    const percentages = progressItems.map((progress) => this.progressPercent(progress));
    return this.fromPercentages(percentages);
  }

  /** Single source of truth: maps riddle status to a UI completion percentage (0–100). */
  public progressPercent(progress: RiddleProgress): number {
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
