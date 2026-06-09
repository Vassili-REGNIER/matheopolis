export type RiddleStatus = "not_started" | "in_progress" | "completed";

export interface RiddleProgress {
  riddleId: number;
  userId?: number;
  studentId?: number;
  status: RiddleStatus;
  currentQuestionIndex: number;
  attemptCount: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RiddleProgressEnvelopeData {
  progress: RiddleProgress;
}

export interface SubmitRiddleResponseRequest {
  questionId?: number;
  questionIndex?: number;
  answer: string;
}

export interface SubmitRiddleResponseResult {
  isCorrect: boolean;
  progress: RiddleProgress;
}
