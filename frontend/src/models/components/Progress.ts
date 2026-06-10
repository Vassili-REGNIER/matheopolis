import type { StudentProgressViewContext } from "./ClassManagement.js";
import type { IconName } from "./Icons.js";

export interface ProgressComponentOptions {
  studentContext?: StudentProgressViewContext;
  onBack?: () => void;
}

export interface ProgressRowViewModel {
  title: string;
  iconName?: IconName;
  percent: number;
  statusLabel: string;
  dateLabel: string;
  detailLabel: string;
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
  totalChapters: number;
  startedQuizzes: number;
  completedQuizzes: number;
  totalQuizzes: number;
  startedItems: number;
  completedItems: number;
  totalItems: number;
  dateLabel: string;
}
