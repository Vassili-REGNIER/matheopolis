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
  score?: number;
  playToken?: string;
}

export interface StudentChapterProgressSummary {
  user?: User;
  userId?: number;
  startedChapters: number;
  completedChapters: number;
  totalChapters: number;
  startedQuizzes: number;
  completedQuizzes: number;
  totalQuizzes: number;
  startedItems: number;
  completedItems: number;
  totalItems: number;
  completionRate: number;
  lastActivityAt: string | null;
  chapterProgress: StudentChapterProgressDetail[];
  quizProgress: StudentQuizProgressDetail[];
}

export interface StudentChapterProgressDetail {
  chapterId: number;
  title: string;
  status: ChapterStatus;
  percent: number;
  currentStepIndex: number;
  stepCount: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface StudentQuizProgressDetail {
  quizId: number;
  title: string;
  visibility: "public" | "private";
  status: ChapterStatus;
  percent: number;
  currentQuestionIndex: number;
  questionCount: number;
  score: number | null;
  attemptCount: number;
  startedAt: string | null;
  completedAt: string | null;
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

type ApiStudentSummary = Partial<StudentChapterProgressSummary>;

export function studentChapterProgressFromApi(raw: ApiStudentSummary): StudentChapterProgressSummary {
  const startedChapters = raw.startedChapters ?? 0;
  const completedChapters = raw.completedChapters ?? 0;
  const startedQuizzes = raw.startedQuizzes ?? 0;
  const completedQuizzes = raw.completedQuizzes ?? 0;
  const totalChapters = raw.totalChapters ?? 0;
  const totalQuizzes = raw.totalQuizzes ?? 0;

  return {
    ...raw,
    startedChapters,
    completedChapters,
    totalChapters,
    startedQuizzes,
    completedQuizzes,
    totalQuizzes,
    startedItems: raw.startedItems ?? startedChapters + startedQuizzes,
    completedItems: raw.completedItems ?? completedChapters + completedQuizzes,
    totalItems: raw.totalItems ?? totalChapters + totalQuizzes,
    completionRate: raw.completionRate ?? 0,
    lastActivityAt: raw.lastActivityAt ?? null,
    chapterProgress: raw.chapterProgress ?? [],
    quizProgress: raw.quizProgress ?? []
  };
}
