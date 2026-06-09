import type { GameProgressDetail, RiddleQuestion } from "../GameConfig.js";

export interface QuestionSequenceOptions {
  questions: RiddleQuestion[];
  completionAnswerId: string;
  scoring?: boolean;
  trackMistakes?: boolean;
  onProgress: (detail: GameProgressDetail) => void;
}

export interface SequenceTurnResult {
  isComplete: boolean;
}
