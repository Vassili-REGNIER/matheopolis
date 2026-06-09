import type { QuizCorrection, QuizPlayView } from "../Quiz.js";

export type QuizPlayQuestion = QuizPlayView["questions"][number];

export interface QuizPlayQuestionTemplateData {
  quiz: QuizPlayView;
  question: QuizPlayQuestion;
  selectedOptionIds: ReadonlySet<number>;
  questionNumber: number;
  progress: number;
  isLastQuestion: boolean;
}

export interface QuizPlayCorrectionTemplateData {
  correction: QuizCorrection;
}
