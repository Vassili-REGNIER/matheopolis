import type { User } from "./User.js";

export type ChapterStatus = "not_started" | "in_progress" | "completed";

export interface ChapterProgress {
  id?: number;
  chapterId: number;
  studentId?: number;
  userId?: number;
  status: ChapterStatus;
  currentStepIndex?: number;
  attemptCount: number;
  score?: number | null;
  startedAt: string | null;
  completedAt: string | null;
  lastAttemptAt: string | null;
}

export interface ChapterProgressEnvelopeData {
  progress: ChapterProgress;
}

export interface ChapterStartEnvelopeData {
  progress: ChapterProgress;
}

export interface StudentChapterProgressSummary {
  user?: User;
  userId?: number;
  startedChapters: number;
  completedChapters: number;
  completionRate: number;
  lastActivityAt: string | null;
}

export interface StudentChapterProgressListEnvelopeData {
  items: StudentChapterProgressSummary[];
}

export function chapterProgressFromApi(raw: ChapterProgress & { riddleId?: number }): ChapterProgress {
  const chapterId = raw.chapterId ?? raw.riddleId ?? 0;

  return {
    id: raw.id,
    chapterId,
    studentId: raw.studentId ?? raw.userId,
    userId: raw.userId ?? raw.studentId,
    status: raw.status,
    currentStepIndex: raw.currentStepIndex,
    attemptCount: raw.attemptCount,
    score: raw.score,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    lastAttemptAt: raw.lastAttemptAt ?? null
  };
}

export function studentChapterProgressFromApi(raw: StudentChapterProgressSummary): StudentChapterProgressSummary {
  return {
    ...raw
  };
}
