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

export interface QuizManagementTemplateData {
  selected: QuestionnaireView | null;
  questionnaires: QuizSummary[];
  openMenuQuestionnaireId: number | null;
  isQuestionnaireModalOpen: boolean;
  questionnaireModalMode: QuestionnaireModalMode;
  editingQuestionnaire: QuestionnaireView | null;
  isSavingQuestionnaire: boolean;
  isDeleting: boolean;
  listMessage: string;
  deleteTarget: QuestionnaireDeleteTarget | null;
  submitTarget: SubmitTarget | null;
  isSubmittingQuestionnaire: boolean;
  cancellingSubmissionQuestionnaireId: number | null;
  questionsSectionHtml: string;
  questionsDeleteModalHtml: string;
  showFloatingTopButton: boolean;
}
