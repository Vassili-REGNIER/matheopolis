import type { User } from "./User.js";

export type RiddleStatus = "not_started" | "in_progress" | "completed";

export interface Puzzle {
  id: number;
  slug: string;
  title: string;
  statement: string;
  position: number;
  isActive: boolean;
}

export interface PuzzleListEnvelopeData {
  items: Puzzle[];
}

export interface RiddleProgress {
  id?: number;
  riddleId: number;
  studentId: number;
  status: RiddleStatus;
  attemptCount: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAttemptAt: string | null;
}

export interface RiddleProgressEnvelopeData {
  progress: RiddleProgress;
}

export interface RiddleStartEnvelopeData {
  progress: RiddleProgress;
  playToken: string;
}

export interface RiddleAttemptRequest {
  answer: string;
  playToken: string;
}

export interface RiddleAttemptResult {
  isCorrect: boolean;
  progress: RiddleProgress;
  playToken?: string | null;
}

export interface RiddleAttemptEnvelopeData {
  attempt: RiddleAttemptResult;
}

export interface RiddleCompleteRequest {
  playToken: string;
}

export interface StudentProgressSummary {
  user?: User;
  userId?: number;
  startedRiddles: number;
  completedRiddles: number;
  completionRate: number;
  lastActivityAt: string | null;
}

export interface StudentProgressListEnvelopeData {
  items: StudentProgressSummary[];
}
