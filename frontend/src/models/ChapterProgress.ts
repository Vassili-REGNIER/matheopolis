import type { User } from "./User.js";

export type ChapterStatus = "not_started" | "in_progress" | "completed";

export interface ChapterProgress {
  id?: number;
  chapterId: number;
  studentId: number;
  status: ChapterStatus;
  attemptCount: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAttemptAt: string | null;
}

export interface ChapterProgressEnvelopeData {
  progress: ChapterProgress;
}

export interface ChapterStartEnvelopeData {
  progress: ChapterProgress;
  playToken: string;
}

export interface ChapterAttemptRequest {
  answer: string;
  playToken: string;
}

export interface ChapterAttemptResult {
  isCorrect: boolean;
  progress: ChapterProgress;
  playToken?: string | null;
}

export interface ChapterAttemptEnvelopeData {
  attempt: ChapterAttemptResult;
}

export interface ChapterCompleteRequest {
  playToken: string;
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
    studentId: raw.studentId,
    status: raw.status,
    attemptCount: raw.attemptCount,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    lastAttemptAt: raw.lastAttemptAt
  };
}

type LegacyStudentSummary = StudentChapterProgressSummary & {
  startedRiddles?: number;
  completedRiddles?: number;
};

export function studentChapterProgressFromApi(raw: LegacyStudentSummary): StudentChapterProgressSummary {
  return {
    ...raw,
    startedChapters: raw.startedChapters ?? raw.startedRiddles ?? 0,
    completedChapters: raw.completedChapters ?? raw.completedRiddles ?? 0
  };
}
