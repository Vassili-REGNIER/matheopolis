import type { StudentChapterProgressSummary } from "./ChapterProgress.js";

export interface StudentProgressViewContext {
  userId: number;
  classId: number;
  summary: StudentChapterProgressSummary;
}

export interface ClassManagementOptions {
  selectedClassId?: number | null;
}
