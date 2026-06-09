import type { QuizDetail, QuizSummary } from "../Quiz.js";

export type QuestionnaireView = QuizSummary | QuizDetail;

export type QuestionnaireModalMode = "create" | "edit";

export interface QuestionnaireDeleteTarget {
  id: number;
  title: string;
}

export interface SubmitTarget {
  id: number;
  title: string;
}
