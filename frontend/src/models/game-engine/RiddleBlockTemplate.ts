import type { RiddleStep } from "../GameConfig.js";

export interface RiddleBlockTemplateData {
  step: RiddleStep;
  isPractice: boolean;
  canReturnToCourse: boolean;
  activeQuestionIndex: number;
  taskPrompt: string;
}
