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
  difficulty: number;
  gameParams?: Record<string, unknown>;
}

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
  question: string;
  expectedAnswer: string;
  inputType?: "text" | "number";
  successMessage: string;
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
