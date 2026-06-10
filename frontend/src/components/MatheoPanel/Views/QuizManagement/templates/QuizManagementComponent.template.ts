import type {
  QuestionnaireView,
  QuizManagementTemplateData
} from "../../../../../models/components/QuizManagement.js";
import type { QuizSummary } from "../../../../../models/Quiz.js";
import { floatingTopButtonTemplate } from "../../../../Shared/FloatingTopButton/FloatingTopButton.js";
import { escapeHtml, formatDate } from "../../../../../utils/dom.js";
import { icon } from "../../../../../utils/icons.js";
import {
  canSubmitQuestionnaire,
  formatSubmissionBadge,
  formatVisibilityBadge,
  isSubmissionPending,
  submitDisabledReason
} from "../utils/QuizManagement.rules.js";

export function quizManagementLoadingTemplate(): string {
  return `<div class="view-loading">Chargement des questionnaires...</div>`;
}

export function quizManagementViewTemplate(data: QuizManagementTemplateData): string {
  const selected = data.selected;

  return `
    <div id="quiz-management-top" class="view-top-anchor"></div>
    <header class="view-header">
      ${selected !== null ? `<button class="back-questionnaires" type="button">${icon("arrowLeft")}</button>` : ""}
      <div class="view-header-copy">
        <p>Questionnaires</p>
        <h1>${selected === null ? "Mes questionnaires" : escapeHtml(selected.title)}</h1>
        <span>${selected === null
          ? "Creez et gerez vos questionnaires pour vos classes."
          : "Interface des questions du questionnaire."}</span>
      </div>
      ${selected === null ? `
        <button class="open-create-questionnaire" type="button">
          ${icon("plus")}
          Creation d'un questionnaire
        </button>
      ` : `
        <div class="view-header-menu">
          ${questionnaireMenuTemplate(selected, data)}
        </div>
      `}
    </header>
    ${data.listMessage.length > 0 && !data.isQuestionnaireModalOpen && data.deleteTarget === null && data.submitTarget === null ? `
      <p class="list-message">${escapeHtml(data.listMessage)}</p>
    ` : ""}
    ${selected === null ? questionnaireListTemplate(data) : questionnaireDetailTemplate(selected, data)}
    ${data.isQuestionnaireModalOpen ? questionnaireModalTemplate(data) : ""}
    <div data-confirmation-modals></div>
    ${data.showFloatingTopButton ? floatingTopButtonTemplate() : ""}
  `;
}

function questionnaireListTemplate(data: QuizManagementTemplateData): string {
  return `
    <div class="questionnaire-grid">
      ${data.questionnaires.length === 0 ? `
        <article class="empty-state">
          ${icon("file")}
          <div>
            <h2>Aucun questionnaire pour le moment</h2>
            <p>Creez votre premier questionnaire pour vos eleves.</p>
            <button class="open-create-questionnaire" type="button">
              ${icon("plus")} Creation d'un questionnaire
            </button>
          </div>
        </article>
      ` : data.questionnaires.map((item) => questionnaireCardTemplate(item, data)).join("")}
    </div>
  `;
}

function questionnaireCardTemplate(questionnaire: QuizSummary, data: QuizManagementTemplateData): string {
  const description = questionnaire.description?.trim() ?? "";
  const descriptionPreview = description.length > 90
    ? `${description.slice(0, 90)}...`
    : description;
  const visibilityBadge = formatVisibilityBadge(questionnaire);
  const submissionBadge = formatSubmissionBadge(questionnaire);

  return `
    <article class="questionnaire-card">
      <div class="questionnaire-card-menu-wrap">
        ${questionnaireMenuTemplate(questionnaire, data)}
      </div>
      <button
        class="questionnaire-card-open"
        type="button"
        data-questionnaire-id="${questionnaire.id}"
        aria-label="Ouvrir ${escapeHtml(questionnaire.title)}"
      >
        <div class="questionnaire-card-head">
          <span class="questionnaire-icon">${icon("file")}</span>
          <div class="questionnaire-card-title-row">
            <h2>${escapeHtml(questionnaire.title)}</h2>
            <div class="questionnaire-card-badges">
              <span class="questionnaire-status ${visibilityBadge.className}">${escapeHtml(visibilityBadge.label)}</span>
              ${questionnaire.status === "private" ? `
                <span class="questionnaire-status ${submissionBadge.className}">${escapeHtml(submissionBadge.label)}</span>
              ` : ""}
            </div>
          </div>
          <span class="questionnaire-card-action">${icon("chevronRight")}</span>
        </div>
        <p class="questionnaire-description">
          ${descriptionPreview.length > 0 ? escapeHtml(descriptionPreview) : ""}
        </p>
        <div class="questionnaire-card-meta">
          <div>
            <span>Questions</span>
            <strong>${questionnaire.questionCount}</strong>
          </div>
          <div class="questionnaire-card-date">
            <span>Cree le</span>
            <strong>${escapeHtml(formatCreatedAt(questionnaire.createdAt))}</strong>
          </div>
        </div>
      </button>
    </article>
  `;
}

function questionnaireMenuTemplate(questionnaire: QuestionnaireView, data: QuizManagementTemplateData): string {
  const questionnaireId = questionnaire.id;
  const isOpen = data.openMenuQuestionnaireId === questionnaireId;
  const canSubmit = canSubmitQuestionnaire(questionnaire);
  const submitReason = submitDisabledReason(questionnaire);
  const submissionPending = isSubmissionPending(questionnaire);
  const isCancellingThis = data.cancellingSubmissionQuestionnaireId === questionnaireId;

  return `
    <button
      class="questionnaire-menu-trigger"
      type="button"
      data-menu-questionnaire-id="${questionnaireId}"
      aria-label="Actions du questionnaire"
      aria-expanded="${isOpen ? "true" : "false"}"
    >
      ${icon("moreVertical")}
    </button>
    ${isOpen ? `
      <div class="questionnaire-menu" role="menu">
        <button
          class="questionnaire-menu-item"
          type="button"
          data-edit-questionnaire-id="${questionnaireId}"
          role="menuitem"
        >
          Modifier
        </button>
        ${submissionPending ? `
          <button
            class="questionnaire-menu-item"
            type="button"
            data-cancel-submission-id="${questionnaireId}"
            role="menuitem"
            ${isCancellingThis ? "disabled aria-disabled=\"true\"" : ""}
          >
            ${isCancellingThis ? "Annulation..." : "Annuler l'envoi"}
          </button>
        ` : `
          <button
            class="questionnaire-menu-item${canSubmit ? "" : " questionnaire-menu-item-disabled"}"
            type="button"
            data-submit-questionnaire-id="${questionnaireId}"
            role="menuitem"
            ${canSubmit ? "" : `disabled aria-disabled="true" title="${escapeHtml(submitReason)}"`}
          >
            Soumettre
          </button>
        `}
        <button
          class="questionnaire-menu-item questionnaire-menu-item-danger"
          type="button"
          data-delete-questionnaire-id="${questionnaireId}"
          role="menuitem"
        >
          Supprimer
        </button>
      </div>
    ` : ""}
  `;
}

function questionnaireModalTemplate(data: QuizManagementTemplateData): string {
  const isEdit = data.questionnaireModalMode === "edit";
  const questionnaire = isEdit ? data.editingQuestionnaire : null;
  const titleValue = questionnaire?.title ?? "";
  const descriptionValue = questionnaire?.description?.trim() ?? "";

  return `
    <div class="create-modal" role="presentation">
      <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="questionnaire-modal-title">
        <header class="modal-header">
          <div>
            <p>${isEdit ? "Questionnaire" : "Nouveau questionnaire"}</p>
            <h2 id="questionnaire-modal-title">${isEdit ? "Modifier le questionnaire" : "Creer un questionnaire"}</h2>
          </div>
          <button class="modal-close" type="button" data-close-modal aria-label="Fermer" ${data.isSavingQuestionnaire ? "disabled" : ""}>
            ${icon("x")}
          </button>
        </header>
        <form class="questionnaire-form" data-form="questionnaire-form">
          <label>
            <span>Nom</span>
            <input
              name="title"
              placeholder="Ex : Fractions - evaluation de depart"
              maxlength="120"
              value="${escapeHtml(titleValue)}"
              required
              ${data.isSavingQuestionnaire ? "disabled" : ""}
            >
          </label>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              rows="4"
              placeholder="Objectifs, contexte, consignes generales..."
              ${data.isSavingQuestionnaire ? "disabled" : ""}
            >${escapeHtml(descriptionValue)}</textarea>
          </label>
          ${data.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(data.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-modal ${data.isSavingQuestionnaire ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="submit" ${data.isSavingQuestionnaire ? "disabled" : ""}>
              ${data.isSavingQuestionnaire
                ? (isEdit ? "Enregistrement..." : "Creation...")
                : (isEdit ? `${icon("check")} Enregistrer` : `${icon("plus")} Creer le questionnaire`)}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function questionnaireDetailTemplate(questionnaire: QuestionnaireView, data: QuizManagementTemplateData): string {
  const description = questionnaire.description?.trim() ?? "";
  const visibilityBadge = formatVisibilityBadge(questionnaire);
  const submissionBadge = questionnaire.status === "private"
    ? formatSubmissionBadge(questionnaire)
    : null;

  return `
    <section class="detail-panel">
      <div class="detail-top">
        <article class="detail-stat">
          <span>Visibilite</span>
          <strong>${escapeHtml(visibilityBadge.label)}</strong>
        </article>
        ${submissionBadge !== null ? `
          <article class="detail-stat">
            <span>Soumission</span>
            <strong>${escapeHtml(submissionBadge.label)}</strong>
          </article>
        ` : ""}
        <article class="detail-stat">
          <span>Questions</span>
          <strong>${questionnaire.questionCount}</strong>
        </article>
        <article class="detail-stat">
          <span>Creation</span>
          <strong>${escapeHtml(formatCreatedAt(questionnaire.createdAt))}</strong>
        </article>
      </div>
      ${description.length > 0 ? `<p class="detail-description">${escapeHtml(description)}</p>` : ""}
      ${data.questionsSectionHtml}
    </section>
  `;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDate(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}
