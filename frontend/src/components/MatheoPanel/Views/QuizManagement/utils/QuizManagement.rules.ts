import type {
  QuizDetail,
  QuizQuestionFull,
  QuizSummary
} from "../../../../../models/Quiz.js";
import type { QuestionnaireView } from "../../../../../models/components/QuizManagement.js";

export interface QuestionnaireBadge {
  label: string;
  className: string;
}

export function isSubmissionPending(questionnaire: QuestionnaireView): boolean {
  return questionnaire.status === "private" && questionnaire.askAdmin;
}

export function canSubmitQuestionnaire(questionnaire: QuestionnaireView): boolean {
  if (questionnaire.status !== "private") {
    return false;
  }

  if (questionnaire.askAdmin) {
    return false;
  }

  return questionnaire.questionCount > 0;
}

export function submitDisabledReason(questionnaire: QuestionnaireView): string {
  if (questionnaire.askAdmin) {
    return "Deja soumis";
  }

  if (questionnaire.status !== "private") {
    return "Questionnaire deja public";
  }

  if (questionnaire.questionCount < 1) {
    return "Ajoutez au moins une question";
  }

  return "";
}

export function formatVisibilityBadge(questionnaire: QuestionnaireView): QuestionnaireBadge {
  if (questionnaire.status === "public") {
    return { label: "Public", className: "questionnaire-status-public" };
  }

  return { label: "Prive", className: "questionnaire-status-private" };
}

export function formatSubmissionBadge(questionnaire: QuestionnaireView): QuestionnaireBadge {
  return questionnaire.askAdmin
    ? { label: "Soumis", className: "questionnaire-status-submitted" }
    : { label: "Non soumis", className: "questionnaire-status-not-submitted" };
}

export function getQuestionnaireQuestions(questionnaire: QuestionnaireView): QuizQuestionFull[] {
  if ("questions" in questionnaire && Array.isArray(questionnaire.questions)) {
    return [...questionnaire.questions].sort((left, right) => right.orderIndex - left.orderIndex);
  }

  return [];
}

export function toQuestionnaireSummary(detail: QuizDetail): QuizSummary {
  return {
    id: detail.id,
    type: detail.type,
    title: detail.title,
    description: detail.description,
    status: detail.status,
    creatorId: detail.creatorId,
    askAdmin: detail.askAdmin,
    questionCount: detail.questionCount,
    position: null,
    createdAt: detail.createdAt,
    progress: null
  };
}
