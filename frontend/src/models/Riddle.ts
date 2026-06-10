import type { RiddleStep } from "./GameConfig.js";

export type RiddleStatus = "not_started" | "in_progress" | "completed";

export interface RiddleProgress {
  riddleId: number;
  userId: number;
  status: RiddleStatus;
  currentQuestionIndex: number;
  attemptCount: number;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
}

export interface RiddleProgressEnvelopeData {
  progress: RiddleProgress;
}

export interface RiddleResponseRequest {
  questionId?: number;
  questionIndex?: number;
  answer: string;
}

export interface RiddleResponseResult {
  isCorrect: boolean;
  progress?: RiddleProgress | null;
}

export interface RiddleResponseResultEnvelopeData extends RiddleResponseResult {}

export interface RiddleDetail {
  id: number;
  chapterId: number;
  slug: string;
  gameId: string;
  mode: "practice" | "challenge";
  title: string;
  play: RiddleStep;
}
