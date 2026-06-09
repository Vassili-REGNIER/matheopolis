export type DialogueEmotion = "neutral" | "happy" | "sad" | "surprised" | "thinking" | "angry";

export interface DialogueLine {
  speakerId: string;
  text: string;
  emotion?: DialogueEmotion;
  image?: string;
  position?: "left" | "right";
}

export interface DialogueStep {
  type: "dialogue";
  backgroundImg?: string;
  lines: DialogueLine[];
}

export type RiddleMode = "practice" | "challenge";

export interface RiddleStep {
  type: "riddle";
  riddleId?: number;
  gameId: string;
  mode?: RiddleMode;
  title: string;
  introText?: string;
  instruction: string;
  completionMessage: string;
  questions: RiddleQuestion[];
  gameParams?: Record<string, unknown>;
}

export interface RiddleQuestion {
  id?: number;
  questionIndex?: number;
  question: string;
  answer?: string;
  hint?: string;
  difficulty: number;
  metadata?: Record<string, unknown>;
}

export type InfoContentTag =
  | "div"
  | "section"
  | "article"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "p"
  | "span"
  | "em"
  | "strong"
  | "small"
  | "ul"
  | "ol"
  | "li"
  | "input"
  | "label";

export type InfoContentAttribute =
  | "id"
  | "type"
  | "name"
  | "checked"
  | "for"
  | "aria-label";

export interface InfoTextContent {
  type: "text";
  text: string;
}

export interface InfoTitleContent {
  type: "titre";
  text: string;
}

export interface InfoParagraphContent {
  type: "paragraph";
  className?: string;
  "sous-titre"?: string;
  text?: string;
  children?: InfoContentNode[];
}

export interface InfoElementContent {
  type: "element";
  tag: InfoContentTag;
  className?: string;
  attributes?: Partial<Record<InfoContentAttribute, string | number | boolean>>;
  text?: string;
  children?: InfoContentNode[];
}

export type InfoContentNode =
  | string
  | InfoTextContent
  | InfoTitleContent
  | InfoParagraphContent
  | InfoElementContent;

export interface InfoContentDocument {
  id?: string | number;
  titre?: string;
  paragraph?: InfoParagraphContent | InfoParagraphContent[];
  nodes?: InfoContentNode[];
  styles?: string;
}

export interface InfoSecondaryAction {
  text: string;
  targetContentId: string | number;
}

export interface InfoStep {
  type: "info";
  title?: string;
  text?: string;
  content?: InfoContentDocument | InfoContentNode[];
  contentCss?: string;
  secondaryAction?: InfoSecondaryAction;
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

export interface InfoNavigateDetail {
  targetContentId: string | number;
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
