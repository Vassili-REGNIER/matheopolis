import type { User } from "./User.js";

export type ChapterStatus = "not_started" | "in_progress" | "completed";

export interface ChapterProgress {
  id?: number;
  chapterId: number;
  userId: number;
  status: ChapterStatus;
  currentStepIndex: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  /** Local-only activity timestamp; not returned by the chapter API. */
  lastAttemptAt?: string | null;
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

type ApiChapterProgress = Partial<ChapterProgress> & {
  riddleId?: number;
  userId?: number;
  studentId?: number;
};

export function chapterProgressFromApi(raw: ApiChapterProgress): ChapterProgress {
  const chapterId = raw.chapterId ?? raw.riddleId ?? 0;
  const userId = raw.userId ?? raw.studentId ?? 0;

  return {
    id: raw.id,
    chapterId,
    userId,
    status: raw.status ?? "not_started",
    currentStepIndex: raw.currentStepIndex ?? 0,
    score: raw.score ?? null,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
    ...(raw.lastAttemptAt !== undefined ? { lastAttemptAt: raw.lastAttemptAt } : {})
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
