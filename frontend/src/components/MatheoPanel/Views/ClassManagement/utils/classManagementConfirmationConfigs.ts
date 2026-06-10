import type { ConfirmationModalConfig } from "../../../../../models/components/ConfirmationModal.js";
import type { ClassDeleteTarget, StudentActionTarget } from "../../../../../models/components/ClassManagement.js";
import { escapeHtml } from "../../../../../utils/dom.js";

export function buildClassDeleteConfirmationConfig(
  target: ClassDeleteTarget,
  message: string,
  isProcessing: boolean
): ConfirmationModalConfig {
  return {
    id: "delete-class",
    eyebrow: "Suppression",
    title: "Supprimer cette classe ?",
    bodyHtml: `
      <p>
        La classe <strong>${escapeHtml(target.name)}</strong> sera supprimée.
        Cette action est reversible uniquement par l'administration.
      </p>
    `,
    message,
    isProcessing,
    overlayClass: "delete-modal",
    confirmAction: {
      label: "Supprimer",
      processingLabel: "Suppression...",
      iconName: "trash",
      variant: "danger"
    }
  };
}

export function buildStudentRemovalConfirmationConfig(
  target: StudentActionTarget,
  message: string,
  isProcessing: boolean
): ConfirmationModalConfig {
  return {
    id: "remove-student",
    eyebrow: "Suppression élève",
    title: "Supprimer ce compte élève ?",
    bodyHtml: `
      <p>
        Le compte de <strong>${escapeHtml(target.name)}</strong>
        (${escapeHtml(target.username)}) sera supprimé.
        Cette action supprimera aussi ses données de progression.
      </p>
    `,
    message,
    isProcessing,
    overlayClass: "remove-student-modal",
    confirmAction: {
      label: "Supprimer le compte",
      processingLabel: "Suppression...",
      iconName: "trash",
      variant: "danger"
    }
  };
}

export function buildStudentPasswordResetConfirmationConfig(
  target: StudentActionTarget,
  generatedPassword: string | null,
  message: string,
  isProcessing: boolean
): ConfirmationModalConfig {
  const hasPassword = generatedPassword !== null && generatedPassword.trim().length > 0;

  return {
    id: "reset-student-password",
    eyebrow: "Mot de passe",
    title: hasPassword ? "Mot de passe régénéré" : "Régénérer le mot de passe ?",
    bodyHtml: hasPassword
      ? `
        <p>
          Le nouveau mot de passe de <strong>${escapeHtml(target.name)}</strong> est affiché une seule fois.
        </p>
        <div class="student-password-result">
          <span>Mot de passe temporaire</span>
          <strong>${escapeHtml(generatedPassword ?? "")}</strong>
        </div>
      `
      : `
        <p>
          Un nouveau mot de passe temporaire sera généré pour <strong>${escapeHtml(target.name)}</strong>.
          L'ancien mot de passe ne fonctionnera plus.
        </p>
      `,
    message,
    isProcessing,
    overlayClass: "reset-student-password-modal",
    cancelAction: {
      label: hasPassword ? "Fermer" : "Annuler"
    },
    confirmAction: hasPassword
      ? null
      : {
        label: "Régénérer",
        processingLabel: "Génération...",
        iconName: "rotate"
      }
  };
}
