export type DialogueEmotion = "neutral" | "happy" | "sad" | "surprised" | "thinking" | "angry";

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: DialogueEmotion;
  image?: string;
}

export interface DialogueStep {
  type: "dialogue";
  backgroundImg?: string;
  lines: DialogueLine[];
}

export type RiddleMode = "practice" | "challenge";

export interface RiddleStep {
  type: "riddle";
  gameId: string;
  mode?: RiddleMode;
  title: string;
  introText?: string;
  instruction: string;
  completionMessage: string;
  gameParams: GameParams;
}

export interface RiddleQuestion {
  question: string;
  answer: string;
  hint: string;
  difficulty: number;
  metadata?: Record<string, unknown>;
}

export type GameParams = {
  questions: RiddleQuestion[];
  completionMessage?: string;
  mode?: RiddleMode;
} & Record<string, unknown>;

export interface InfoStep {
  type: "info";
  title: string;
  text: string;
  buttonText?: string;
  theme?: "default" | "endChapter" | "startChapter" | "sign";
}

export type GameStep = DialogueStep | RiddleStep | InfoStep;

export function isPracticeRiddleStep(step: GameStep): step is RiddleStep {
  return step.type === "riddle" && step.mode === "practice";
}

export interface StepCompleteDetail {
  score?: number;
  answer?: string;
}

export interface GameWonDetail {
  score: number;
  answer: string;
}

export interface GameProgressDetail {
  score: number;
  mistakes: number;
  currentQuestionIndex?: number;
}

export interface GameCompletedDetail {
  message: string;
  score: number;
  answer: string;
}

export interface GameValidateDetail {
  visible: boolean;
  enabled: boolean;
}
