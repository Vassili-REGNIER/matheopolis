export interface ProgressMetrics {
  exploredChapters: number;
  totalProgress: number;
}

export interface ProgressMetricsWithTotal extends ProgressMetrics {
  totalChapters: number;
}
