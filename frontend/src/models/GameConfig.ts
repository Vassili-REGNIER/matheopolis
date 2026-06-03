export type DialogueEmotion = "neutral" | "happy" | "sad" | "surprised" | "thinking" | "angry";

export interface DialogueLine {
  speaker: string;
  text: string;
  speakerId?: string;
  emotion?: DialogueEmotion;
  soundEffect?: string;
  triggerEvent?: string;
  image?: string;
  position?: "left" | "right";
}

export interface DialogueStep {
  type: "dialogue";
  backgroundImg?: string;
  backgroundStyle?: string;
  music?: string;
  lines: DialogueLine[];
}

export interface RiddleStep {
  type: "riddle";
  gameId: string;
  title: string;
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
} & Record<string, unknown>;

export interface InfoStep {
  type: "info";
  title: string;
  text: string;
  backgroundImg?: string;
  buttonText?: string;
  theme?: "default" | "endChapter" | "startChapter" | "sign";
}

export interface TutorialStep {
  type: "tutorial";
  title: string;
  text: string;
  instruction: string;
  expectedAnswer: string;
  inputType?: "text" | "number";
  completionMessage: string;
  errorMessage: string;
  hints?: string[];
  backgroundImg?: string;
  theme?: "default" | "chalkboard" | "hologram";
}

export type GameStep = DialogueStep | RiddleStep | InfoStep | TutorialStep;

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
