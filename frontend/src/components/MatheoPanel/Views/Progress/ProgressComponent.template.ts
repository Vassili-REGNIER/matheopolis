import type {
  ProgressRowViewModel,
  StudentInfoViewModel,
  StudentProgressSummaryViewModel
} from "../../../../models/components/Progress.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export function progressLoadingTemplate(): string {
  return `<div class="view-loading">Chargement de la progression...</div>`;
}

export function progressStudentUnavailableTemplate(): string {
  return `
        <header class="view-header">
          <p>Progression élève</p>
          <h1>Élève indisponible</h1>
        </header>
        <p class="view-loading">Impossible de charger le profil de cet élève.</p>
      `;
}

export function progressStudentViewTemplate(
  info: StudentInfoViewModel,
  summary: StudentProgressSummaryViewModel,
  chapterRows: ProgressRowViewModel[],
  privateQuizRows: ProgressRowViewModel[],
  publicQuizRows: ProgressRowViewModel[],
  showBackButton: boolean,
  eyebrow = "Progression élève"
): string {
  return `
      <header class="view-header view-header-with-back">
        ${showBackButton ? `
          <button class="back-button" type="button" aria-label="Retour à la classe">
            ${icon("arrowLeft")}
          </button>
        ` : ""}
        <div class="view-header-copy">
          <p>${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(info.displayName)}</h1>
          <span>@${escapeHtml(info.username)}</span>
        </div>
      </header>
      <div class="student-info-grid">
        <article>${icon("map")}<div><span>Progression globale</span><strong>${info.percent}%</strong></div></article>
        <article>${icon("clock")}<div><span>Dernière activité</span><strong>${escapeHtml(info.lastActivityLabel)}</strong></div></article>
        <article>${icon("user")}<div><span>Inscription</span><strong>${escapeHtml(info.registrationDateLabel)}</strong></div></article>
      </div>
      <div class="progress-list">
        ${studentSummaryTemplate(summary)}
      </div>
      <div class="progress-sections">
        ${progressSectionTemplate("Progression par chapitre", chapterRows, "Aucun chapitre accessible.")}
        ${progressSectionTemplate("Questionnaires privés", privateQuizRows, "Aucun questionnaire privé accessible.")}
        ${progressSectionTemplate("Questionnaires publics", publicQuizRows, "Aucun questionnaire public accessible.")}
      </div>
    `;
}

function studentSummaryTemplate(summary: StudentProgressSummaryViewModel): string {
  return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon("barChart")}</div>
          <h2>Progression globale</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(summary.statusLabel)}</span>
          <span class="row-percent">${summary.percent}%</span>
          <span>${summary.startedItems} / ${summary.totalItems} contenu(s) démarré(s)</span>
          <span>${summary.completedItems} terminé(s)</span>
          <span>${summary.totalChapters} chapitre(s)</span>
          <span>${summary.totalQuizzes} quiz</span>
          ${summary.dateLabel === "" ? "" : `<span>${escapeHtml(summary.dateLabel)}</span>`}
        </div>
        <div class="bar"><span style="width:${summary.percent}%"></span></div>
      </article>
    `;
}

function progressSectionTemplate(title: string, rows: ProgressRowViewModel[], emptyLabel: string): string {
  return `
      <section class="progress-section">
        <h2 class="progress-section-title">${escapeHtml(title)}</h2>
        <div class="progress-list">
          ${rows.length === 0 ? `<article class="empty-progress-row">${escapeHtml(emptyLabel)}</article>` : rows.map((row) => progressRowTemplate(row)).join("")}
        </div>
      </section>
    `;
}

function progressRowTemplate(row: ProgressRowViewModel): string {
  const iconName = row.iconName ?? "book";

  return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon(iconName)}</div>
          <h2>${escapeHtml(row.title)}</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(row.statusLabel)}</span>
          <span class="row-percent">${row.percent}%</span>
          ${row.detailLabel === "" ? "" : `<span>${escapeHtml(row.detailLabel)}</span>`}
          ${row.dateLabel === "" ? "" : `<span>${escapeHtml(row.dateLabel)}</span>`}
        </div>
        <div class="bar"><span style="width:${row.percent}%"></span></div>
      </article>
    `;
}
