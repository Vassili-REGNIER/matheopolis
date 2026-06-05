import { BaseComponent } from "../../../BaseComponent.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import { displayName, type User } from "../../../../models/User.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type { StudentProgressViewContext } from "../../../../models/ClassManagement.js";
import { clampPercent, escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export interface ProgressComponentOptions {
  studentContext?: StudentProgressViewContext;
  onBack?: () => void;
}

export class ProgressComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices,
    private readonly options?: ProgressComponentOptions
  ) {
    super(container, "matheo-progress-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement de la progression...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null && this.options?.onBack !== undefined) {
      this.listen(back, "click", () => {
        this.options?.onBack?.();
      });
    }
  }

  private async load(): Promise<void> {
    if (this.options?.studentContext !== undefined) {
      await this.loadStudentView(this.options.studentContext);
      return;
    }

    const chapters = await this.services.chapters.listChapters();
    const rows = await Promise.all(chapters.map(async (chapter) => ({
      chapter,
      progress: await this.services.chapters.getProgress(chapter.id)
    })));

    this.render(`
      <header class="view-header">
        <p>Progression</p>
        <h1>Mes enigmes</h1>
      </header>
      <div class="progress-list">
        ${rows.map((row) => this.rowTemplate(row.chapter.title, row.chapter.id, this.services.progressMetrics.progressPercent(row.progress), row.progress)).join("")}
      </div>
    `, this.style());
    this.bindEvents();
  }

  private async loadStudentView(context: StudentProgressViewContext): Promise<void> {
    let user: User;
    try {
      user = await this.services.users.getUserProfile(context.userId);
    } catch {
      this.render(`
        <header class="view-header">
          <p>Progression eleve</p>
          <h1>Eleve indisponible</h1>
        </header>
        <p class="view-loading">Impossible de charger le profil de cet eleve.</p>
      `, this.style());
      this.bindEvents();
      return;
    }

    const summary = context.summary;
    const percent = clampPercent(Math.round(summary.completionRate));

    this.render(`
      <header class="view-header view-header-with-back">
        ${this.options?.onBack !== undefined ? `
          <button class="back-button" type="button" aria-label="Retour a la classe">
            ${icon("arrowLeft")}
          </button>
        ` : ""}
        <div class="view-header-copy">
          <p>Progression eleve</p>
          <h1>${escapeHtml(displayName(user))}</h1>
          <span>@${escapeHtml(user.username)}</span>
        </div>
      </header>
      <div class="student-info-grid">
        <article>${icon("map")}<div><span>Progression globale</span><strong>${percent}%</strong></div></article>
        <article>${icon("clock")}<div><span>Derniere activite</span><strong>${escapeHtml(this.formatLastActivity(summary.lastActivityAt))}</strong></div></article>
        <article>${icon("user")}<div><span>Inscription</span><strong>${escapeHtml(formatDate(user.createdAt))}</strong></div></article>
      </div>
      <div class="progress-list">
        ${this.studentSummaryTemplate(percent, summary)}
      </div>
    `, this.style());
    this.bindEvents();
  }

  private studentSummaryTemplate(percent: number, summary: StudentChapterProgressSummary): string {
    const statusLabel = percent >= 100 ? "Complété" : percent > 0 ? "En cours" : "Non commencé";
    const dateLabel = this.formatLastActivity(summary.lastActivityAt);
    const dateSuffix = dateLabel === "Aucune activite" ? "" : formatDate(summary.lastActivityAt);

    return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon("barChart")}</div>
          <h2>Progression globale des enigmes</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(statusLabel)}</span>
          <span class="row-percent">${percent}%</span>
          <span>${summary.startedChapters} demarree(s)</span>
          <span>${summary.completedChapters} terminee(s)</span>
          ${dateSuffix === "" ? "" : `<span>${escapeHtml(dateSuffix)}</span>`}
        </div>
        <div class="bar"><span style="width:${percent}%"></span></div>
      </article>
    `;
  }

  private rowTemplate(
    title: string,
    chapterId: number,
    percent: number,
    progress: { status: string; attemptCount: number; lastAttemptAt: string | null; completedAt: string | null; startedAt: string | null }
  ): string {
    const dateLabel = this.progressDateLabel(progress);
    return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon(chapterId === 999 ? "file" : "book")}</div>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(this.statusLabel(progress.status))}</span>
          <span class="row-percent">${percent}%</span>
          <span>${progress.attemptCount} tentative(s)</span>
          ${dateLabel === "" ? "" : `<span>${escapeHtml(dateLabel)}</span>`}
        </div>
        <div class="bar"><span style="width:${percent}%"></span></div>
      </article>
    `;
  }

  private formatLastActivity(value: string | null): string {
    if (value === null || value.trim() === "") {
      return "Aucune activite";
    }

    return formatDate(value);
  }

  private statusLabel(status: string): string {
    if (status === "completed") {
      return "Complété";
    }
    if (status === "in_progress") {
      return "En cours";
    }
    return "Non commencé";
  }

  private progressDateLabel(progress: {
    lastAttemptAt: string | null;
    completedAt: string | null;
    startedAt: string | null;
  }): string {
    const raw = progress.lastAttemptAt ?? progress.completedAt ?? progress.startedAt;
    if (raw === null || raw.trim() === "") {
      return "";
    }
    return formatDate(raw);
  }

  private style(): string {
    return `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header-with-back {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      :host .view-header-copy {
        min-width: 0;
      }

      :host .back-button {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        flex: none;
        margin-top: 4px;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
        cursor: pointer;
      }

      :host .back-button:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }

      :host .view-loading,
      :host .view-header p,
      :host .view-header span {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .view-header p,
      :host .student-info-grid span {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0 0 6px;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header span {
        display: block;
        font-size: 0.92rem;
        letter-spacing: normal;
        text-transform: none;
        font-weight: 600;
      }

      :host .student-info-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }

      :host .student-info-grid article {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 92px;
        padding: 18px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .student-info-grid strong {
        display: block;
        color: #fff;
        overflow-wrap: anywhere;
      }

      :host .progress-list {
        display: grid;
        gap: 14px;
      }

      :host article {
        padding: 20px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .row-main {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      :host .row-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 22px;
        height: 22px;
      }

      :host .row-main h2 {
        margin: 0;
        color: #fff;
        line-height: 1.25;
      }

      :host .row-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin: 16px 0 10px;
        font-size: 0.82rem;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .row-percent {
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .bar {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: #312e81;
      }

      :host .bar span {
        display: block;
        height: 100%;
        background: var(--matheo-gold);
      }

      @media (max-width: 860px) {
        :host .student-info-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
