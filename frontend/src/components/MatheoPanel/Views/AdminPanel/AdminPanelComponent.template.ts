import type {
  AdminPanelTemplateData,
  AdminSectionConfig
} from "../../../../models/components/AdminPanel.js";
import type { QuizDetail, QuizSummary } from "../../../../models/Quiz.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export function adminPanelLoadingTemplate(): string {
  return `<div class="view-loading">Chargement de l'administration...</div>`;
}

export function adminPanelViewTemplate(data: AdminPanelTemplateData): string {
  const selected = data.selectedQuizDetail;

  return `
      <header class="view-header">
        ${data.selectedQuizId !== null ? `<button class="back-publications" type="button">${icon("arrowLeft")}</button>` : ""}
        <div class="view-header-copy">
          <p>Administration</p>
          <h1>${data.selectedQuizId !== null && selected !== null
            ? escapeHtml(formatQuizTitleWithCreator(selected.title, selected.creatorId, data.creatorLabels))
            : "Panel administrateur"}</h1>
          <span>${data.selectedQuizId !== null
            ? (selected?.status === "public"
              ? "Examinez le questionnaire et gérez sa visibilité."
              : "Examinez le questionnaire soumis et validez sa publication.")
            : "Validez les questionnaires soumis et préparez la gestion des enseignants."}</span>
        </div>
      </header>
      ${data.listMessage.length > 0 && data.reviewActionTarget === null && !data.questionDeleteTargetExists ? `
        <p class="list-message">${escapeHtml(data.listMessage)}</p>
      ` : ""}
      ${data.selectedQuizId !== null ? quizDetailTemplate(data) : `
        <div class="admin-sections">
          ${data.sections.map((section) => adminSectionTemplate(section, data)).join("")}
        </div>
      `}
      ${data.selectedQuizId !== null ? floatingDetailReviewActionsTemplate(data.selectedQuizDetail) : ""}
      <div data-confirmation-modals></div>
    `;
}

function floatingDetailReviewActionsTemplate(quiz: QuizDetail | null): string {
  if (quiz === null) {
    return "";
  }

  if (quiz.status === "public") {
    return `
      <div class="detail-review-actions-floating" role="toolbar" aria-label="Actions de visibilité">
        <button class="detail-unpublish-button" type="button" data-unpublish-quiz-id="${quiz.id}">
          ${icon("lock")} Dépublier
        </button>
      </div>
    `;
  }

  return `
      <div class="detail-review-actions-floating" role="toolbar" aria-label="Actions de publication">
        <button class="detail-publish-button" type="button" data-publish-quiz-id="${quiz.id}">
          ${icon("check")} Publier
        </button>
        <button class="detail-reject-button" type="button" data-reject-quiz-id="${quiz.id}">
          ${icon("x")} Refuser
        </button>
      </div>
    `;
}

function quizDetailTemplate(data: AdminPanelTemplateData): string {
  if (data.isLoadingDetail || data.selectedQuizDetail === null) {
    return `<p class="section-loading">Chargement du questionnaire...</p>`;
  }

  const quiz = data.selectedQuizDetail;
  const description = quiz.description?.trim() ?? "";
  const isPublic = quiz.status === "public";
  const visibilityLabel = isPublic ? "Public" : "Privé";
  const submissionLabel = quiz.askAdmin ? "Soumis" : (isPublic ? "Publié" : "Non soumis");

  return `
      <section class="detail-panel">
        <div class="detail-top">
          <article class="detail-stat">
            <span>Visibilité</span>
            <strong>${visibilityLabel}</strong>
          </article>
          <article class="detail-stat">
            <span>Soumission</span>
            <strong>${submissionLabel}</strong>
          </article>
          <article class="detail-stat">
            <span>Questions</span>
            <strong>${quiz.questionCount}</strong>
          </article>
          <article class="detail-stat">
            <span>Créé le</span>
            <strong>${escapeHtml(formatCreatedAt(quiz.createdAt))}</strong>
          </article>
        </div>
        ${description.length > 0 ? `<p class="detail-description">${escapeHtml(description)}</p>` : ""}
        ${data.questionsSectionHtml}
      </section>
    `;
}

function adminSectionTemplate(section: AdminSectionConfig, data: AdminPanelTemplateData): string {
  if (!section.enabled) {
    return `
        <section class="admin-section admin-section-disabled" data-section-id="${section.id}">
          <header class="admin-section-header">
            <div>
              <p>${escapeHtml(section.eyebrow)}</p>
              <h2>${escapeHtml(section.title)}</h2>
              <span>${escapeHtml(section.description)}</span>
            </div>
            <span class="admin-section-badge">Bientôt disponible</span>
          </header>
          <article class="admin-section-placeholder">
            ${icon("graduation")}
            <div>
              <h3>Fonctionnalité à venir</h3>
              <p>Cette section accueillera prochainement la gestion des enseignants.</p>
            </div>
          </article>
        </section>
      `;
  }

  return `
      <section class="admin-section" data-section-id="${section.id}">
        <header class="admin-section-header">
          <div>
            <p>${escapeHtml(section.eyebrow)}</p>
            <h2>${escapeHtml(section.title)}</h2>
            <span>${escapeHtml(section.description)}</span>
          </div>
          <span class="admin-section-count">${data.publicationRequests.length}</span>
        </header>
        ${data.isLoading ? `
          <p class="section-loading">Chargement des soumissions...</p>
        ` : (section.id === "publication-requests" ? publicationRequestsSectionTemplate(data) : "")}
      </section>
    `;
}

function publicationRequestsSectionTemplate(data: AdminPanelTemplateData): string {
  if (data.publicationRequests.length === 0) {
    return `
        <article class="empty-state">
          ${icon("file")}
          <div>
            <h3>Aucune soumission en attente</h3>
            <p>Les questionnaires soumis par les enseignants apparaîtront ici.</p>
          </div>
        </article>
      `;
  }

  return `
      <div class="publication-grid">
        ${data.publicationRequests.map((quiz) => publicationCardTemplate(quiz, data.creatorLabels)).join("")}
      </div>
    `;
}

function publicationCardTemplate(quiz: QuizSummary, creatorLabels: Map<number, string>): string {
  const description = quiz.description?.trim() ?? "";
  const descriptionPreview = description.length > 90
    ? `${description.slice(0, 90)}...`
    : description;
  const displayTitle = formatQuizTitleWithCreator(quiz.title, quiz.creatorId, creatorLabels);

  return `
      <article class="publication-card">
        <button
          class="publication-card-open"
          type="button"
          data-open-quiz-id="${quiz.id}"
          aria-label="Ouvrir ${escapeHtml(displayTitle)}"
        >
          <div class="publication-card-head">
            <span class="publication-icon">${icon("file")}</span>
            <div class="publication-card-title-row">
              <h2>${escapeHtml(displayTitle)}</h2>
              <div class="publication-card-badges">
                <span class="publication-badge">En attente</span>
              </div>
            </div>
            <span class="publication-card-action">${icon("chevronRight")}</span>
          </div>
          <p class="publication-description">
            ${descriptionPreview.length > 0 ? escapeHtml(descriptionPreview) : ""}
          </p>
          <div class="publication-card-meta">
            <div>
              <span>Questions</span>
              <strong>${quiz.questionCount}</strong>
            </div>
            <div class="publication-card-date">
              <span>Créé le</span>
              <strong>${escapeHtml(formatCreatedAt(quiz.createdAt))}</strong>
            </div>
          </div>
        </button>
        <div class="publication-card-actions">
          <button class="publication-publish-button" type="button" data-publish-quiz-id="${quiz.id}">
            ${icon("check")} Publier
          </button>
          <button class="publication-reject-button" type="button" data-reject-quiz-id="${quiz.id}">
            ${icon("x")} Refuser
          </button>
        </div>
      </article>
    `;
}

function formatQuizTitleWithCreator(
  title: string,
  creatorId: number,
  creatorLabels: Map<number, string>
): string {
  const creatorLabel = creatorLabels.get(creatorId) ?? `Enseignant #${creatorId}`;
  return `${title} - ${creatorLabel}`;
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
