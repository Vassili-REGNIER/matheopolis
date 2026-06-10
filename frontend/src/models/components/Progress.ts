import type { StudentProgressViewContext } from "./ClassManagement.js";

export interface ProgressComponentOptions {
  studentContext?: StudentProgressViewContext;
  onBack?: () => void;
}

export interface ProgressRowViewModel {
  title: string;
  chapterId: number;
  percent: number;
  statusLabel: string;
  dateLabel: string;
}

export interface StudentInfoViewModel {
  displayName: string;
  username: string;
  percent: number;
  lastActivityLabel: string;
  registrationDateLabel: string;
}

export interface StudentProgressSummaryViewModel {
  percent: number;
  statusLabel: string;
  startedChapters: number;
  completedChapters: number;
  dateLabel: string;
}
