import type { ContentService } from "../../services/ContentService.js";
import type { RiddleMode, RiddleQuestion } from "../GameConfig.js";

export interface RiddleAnswerValidationRequest {
  question: RiddleQuestion;
  questionIndex: number;
  answer: string;
}

export interface RiddleAnswerValidationResult {
  isCorrect: boolean;
  currentQuestionIndex: number;
  score: number | null;
  completed: boolean;
}

export interface BaseGameContext {
  content: ContentService;
  validateAnswer: (request: RiddleAnswerValidationRequest) => Promise<RiddleAnswerValidationResult>;
}

export type BaseGameParams = {
  questions: RiddleQuestion[];
  completionMessage?: string;
  instruction?: string;
  mode?: RiddleMode;
  title?: string;
} & Record<string, unknown>;
