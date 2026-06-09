import type { ContentService } from "../../services/ContentService.js";
import type { RiddleMode, RiddleQuestion } from "../GameConfig.js";
import type { SubmitRiddleResponseResult } from "../RiddleProgress.js";

export interface BaseGameContext {
  content: ContentService;
  validateAnswer?: (
    answer: string,
    questionIndex: number,
    questionId?: number
  ) => Promise<SubmitRiddleResponseResult>;
}

export type BaseGameParams = {
  questions: RiddleQuestion[];
  completionMessage?: string;
  instruction?: string;
  mode?: RiddleMode;
  riddleId?: number;
  title?: string;
} & Record<string, unknown>;
