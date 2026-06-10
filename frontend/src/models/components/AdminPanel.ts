import type { QuizDetail, QuizSummary } from "../Quiz.js";

export type AdminSectionId = "publication-requests" | "teachers";

export interface AdminSectionConfig {
  id: AdminSectionId;
  eyebrow: string;
  title: string;
  description: string;
  enabled: boolean;
}

export type ReviewActionTarget =
  | { kind: "publish"; id: number; title: string }
  | { kind: "reject"; id: number; title: string }
  | { kind: "unpublish"; id: number; title: string };

export interface AdminPanelTemplateData {
  sections: AdminSectionConfig[];
  publicationRequests: QuizSummary[];
  creatorLabels: Map<number, string>;
  selectedQuizId: number | null;
  selectedQuizDetail: QuizDetail | null;
  reviewActionTarget: ReviewActionTarget | null;
  isProcessingReviewAction: boolean;
  isLoading: boolean;
  isLoadingDetail: boolean;
  listMessage: string;
  questionDeleteTargetExists: boolean;
  questionsSectionHtml: string;
}
