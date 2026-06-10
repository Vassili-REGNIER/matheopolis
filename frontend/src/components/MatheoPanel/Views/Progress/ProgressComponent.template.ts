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

export function progressPersonalViewTemplate(rows: ProgressRowViewModel[]): string {
  return `
      <header class="view-header">
        <p>Progression</p>
        <h1>Mes énigmes</h1>
      </header>
      <div class="progress-list">
        ${rows.map((row) => progressRowTemplate(row)).join("")}
      </div>
    `;
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
  showBackButton: boolean
): string {
  return `
      <header class="view-header view-header-with-back">
        ${showBackButton ? `
          <button class="back-button" type="button" aria-label="Retour à la classe">
            ${icon("arrowLeft")}
          </button>
        ` : ""}
        <div class="view-header-copy">
          <p>Progression élève</p>
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
    `;
}

function studentSummaryTemplate(summary: StudentProgressSummaryViewModel): string {
  return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon("barChart")}</div>
          <h2>Progression globale des énigmes</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(summary.statusLabel)}</span>
          <span class="row-percent">${summary.percent}%</span>
          <span>${summary.startedChapters} démarrée(s)</span>
          <span>${summary.completedChapters} terminée(s)</span>
          ${summary.dateLabel === "" ? "" : `<span>${escapeHtml(summary.dateLabel)}</span>`}
        </div>
        <div class="bar"><span style="width:${summary.percent}%"></span></div>
      </article>
    `;
}

function progressRowTemplate(row: ProgressRowViewModel): string {
  return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon(row.chapterId === 999 ? "file" : "book")}</div>
          <h2>${escapeHtml(row.title)}</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(row.statusLabel)}</span>
          <span class="row-percent">${row.percent}%</span>
          <span>${row.attemptCount} tentative(s)</span>
          ${row.dateLabel === "" ? "" : `<span>${escapeHtml(row.dateLabel)}</span>`}
        </div>
        <div class="bar"><span style="width:${row.percent}%"></span></div>
      </article>
    `;
}
