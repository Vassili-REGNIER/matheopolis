export interface ProgressMetrics {
  exploredChapters: number;
  totalProgress: number;
}

export interface ProgressMetricsWithTotal extends ProgressMetrics {
  totalChapters: number;
}

export function formatExploredChapters(metrics: ProgressMetricsWithTotal): string {
  return `${metrics.exploredChapters} / ${metrics.totalChapters}`;
}
