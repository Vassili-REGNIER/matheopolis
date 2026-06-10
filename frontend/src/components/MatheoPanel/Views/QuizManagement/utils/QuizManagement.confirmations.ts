import type { ConfirmationModalConfig } from "../../../../../models/components/ConfirmationModal.js";
import type {
  QuestionnaireDeleteTarget,
  SubmitTarget
} from "../../../../../models/components/QuizManagement.js";
import { escapeHtml } from "../../../../../utils/dom.js";

export interface QuizManagementConfirmationState {
  submitTarget: SubmitTarget | null;
  deleteTarget: QuestionnaireDeleteTarget | null;
  listMessage: string;
  isSubmittingQuestionnaire: boolean;
  isDeletingQuestionnaire: boolean;
  questionDeleteConfig: ConfirmationModalConfig | null;
}

export function buildQuizManagementConfirmationConfigs(
  state: QuizManagementConfirmationState
): ConfirmationModalConfig[] {
  const configs: ConfirmationModalConfig[] = [];

  if (state.submitTarget !== null) {
    configs.push({
      id: "submit-questionnaire",
      eyebrow: "Soumission",
      title: "Soumettre ce questionnaire ?",
      bodyHtml: `
        <p>
          Le questionnaire <strong>${escapeHtml(state.submitTarget.title)}</strong> sera transmis à
          l'administration pour validation et publication.
        </p>
      `,
      message: state.listMessage,
      isProcessing: state.isSubmittingQuestionnaire,
      overlayClass: "submit-modal",
      confirmAction: {
        label: "Confirmer la soumission",
        processingLabel: "Soumission...",
        iconName: "check"
      }
    });
  }

  if (state.deleteTarget !== null) {
    configs.push({
      id: "delete-questionnaire",
      eyebrow: "Suppression",
      title: "Supprimer ce questionnaire ?",
      bodyHtml: `
        <p>
          Le questionnaire <strong>${escapeHtml(state.deleteTarget.title)}</strong> sera supprimé avec toutes
          ses questions. Cette action est irréversible.
        </p>
      `,
      message: state.listMessage,
      isProcessing: state.isDeletingQuestionnaire,
      overlayClass: "delete-modal",
      confirmAction: {
        label: "Supprimer",
        processingLabel: "Suppression...",
        iconName: "trash",
        variant: "danger"
      }
    });
  }

  if (state.questionDeleteConfig !== null) {
    configs.push(state.questionDeleteConfig);
  }

  return configs;
}
