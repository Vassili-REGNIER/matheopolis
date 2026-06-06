import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type { QuizSummary } from "../../../../models/Quiz.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

type AdminSectionId = "publication-requests" | "teachers";

interface AdminSectionConfig {
  id: AdminSectionId;
  eyebrow: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface PublishTarget {
  id: number;
  title: string;
}

export class AdminPanelComponent extends BaseComponent {
  private publicationRequests: QuizSummary[] = [];
  private creatorLabels = new Map<number, string>();
  private openMenuQuizId: number | null = null;
  private publishTarget: PublishTarget | null = null;
  private isPublishing = false;
  private isLoading = true;
  private listMessage = "";

  private readonly sections: AdminSectionConfig[] = [
    {
      id: "publication-requests",
      eyebrow: "Questionnaires",
      title: "Soumissions en attente",
      description: "Questionnaires prives soumis par les enseignants pour publication.",
      enabled: true
    },
    {
      id: "teachers",
      eyebrow: "Enseignants",
      title: "Gestion des enseignants",
      description: "Administration des comptes enseignants.",
      enabled: false
    }
  ];

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-admin-panel-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement de l'administration...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {
    this.bindModalBackdropClose();

    this.queryAll<HTMLButtonElement>("[data-menu-quiz-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuQuizId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuQuizId = this.openMenuQuizId === id ? null : id;
          this.renderView();
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-publish-quiz-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.publishQuizId ?? "", 10);
        const quiz = this.publicationRequests.find((item) => item.id === id);
        if (quiz === undefined) {
          return;
        }

        this.openMenuQuizId = null;
        this.publishTarget = { id: quiz.id, title: quiz.title };
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-close-publish-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isPublishing) {
          this.closePublishModal();
        }
      });
    });

    const confirmPublish = this.query<HTMLButtonElement>("[data-confirm-publish]");
    if (confirmPublish !== null) {
      this.listen(confirmPublish, "click", () => {
        void this.confirmPublish();
      });
    }

    if (this.openMenuQuizId !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(".publication-card-menu-wrap");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuQuizId = null;
          this.renderView();
        }
      });
    }
  }

  private bindModalBackdropClose(): void {
    this.queryAll<HTMLElement>(".create-modal").forEach((overlay) => {
      this.listen(overlay, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const panel = overlay.querySelector(".create-modal-panel");
        if (panel !== null && panel.contains(target)) {
          return;
        }

        if (!this.isPublishing) {
          this.closePublishModal();
        }
      });
    });
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.renderView();

    try {
      this.publicationRequests = await this.services.adminQuizzes.listPublicationRequests();
      this.listMessage = "";
      await this.loadCreatorLabels();
    } catch {
      this.publicationRequests = [];
      this.listMessage = "Impossible de charger les soumissions.";
    } finally {
      this.isLoading = false;
      this.renderView();
    }
  }

  private async loadCreatorLabels(): Promise<void> {
    const creatorIds = [...new Set(this.publicationRequests.map((item) => item.creatorId))];
    const entries = await Promise.all(
      creatorIds.map(async (creatorId) => {
        try {
          const user = await this.services.users.getUserProfile(creatorId);
          const label = `${user.firstName} ${user.lastName}`.trim();
          return [creatorId, label.length > 0 ? label : user.username] as const;
        } catch {
          return [creatorId, `Enseignant #${creatorId}`] as const;
        }
      })
    );

    this.creatorLabels = new Map(entries);
  }

  private closePublishModal(): void {
    this.publishTarget = null;
    this.renderView();
  }

  private async confirmPublish(): Promise<void> {
    if (this.publishTarget === null || this.isPublishing) {
      return;
    }

    const targetId = this.publishTarget.id;
    this.isPublishing = true;
    this.listMessage = "";
    this.renderView();

    try {
      await this.services.adminQuizzes.publishQuiz(targetId);
      this.publicationRequests = this.publicationRequests.filter((item) => item.id !== targetId);
      this.publishTarget = null;
      this.openMenuQuizId = null;
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Publication impossible.";
      this.publishTarget = null;
    } finally {
      this.isPublishing = false;
      this.renderView();
    }
  }

  private renderView(): void {
    this.render(`
      <header class="view-header">
        <div class="view-header-copy">
          <p>Administration</p>
          <h1>Panel administrateur</h1>
          <span>Validez les questionnaires soumis et preparez la gestion des enseignants.</span>
        </div>
      </header>
      ${this.listMessage.length > 0 && this.publishTarget === null ? `
        <p class="list-message">${escapeHtml(this.listMessage)}</p>
      ` : ""}
      <div class="admin-sections">
        ${this.sections.map((section) => this.adminSectionTemplate(section)).join("")}
      </div>
      ${this.publishTarget !== null ? this.publishModalTemplate() : ""}
    `, this.style());
    this.bindEvents();
  }

  private adminSectionTemplate(section: AdminSectionConfig): string {
    if (!section.enabled) {
      return `
        <section class="admin-section admin-section-disabled" data-section-id="${section.id}">
          <header class="admin-section-header">
            <div>
              <p>${escapeHtml(section.eyebrow)}</p>
              <h2>${escapeHtml(section.title)}</h2>
              <span>${escapeHtml(section.description)}</span>
            </div>
            <span class="admin-section-badge">Bientot disponible</span>
          </header>
          <article class="admin-section-placeholder">
            ${icon("graduation")}
            <div>
              <h3>Fonctionnalite a venir</h3>
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
          <span class="admin-section-count">${this.publicationRequests.length}</span>
        </header>
        ${this.isLoading ? `
          <p class="section-loading">Chargement des soumissions...</p>
        ` : (section.id === "publication-requests" ? this.publicationRequestsSectionTemplate() : "")}
      </section>
    `;
  }

  private publicationRequestsSectionTemplate(): string {
    if (this.publicationRequests.length === 0) {
      return `
        <article class="empty-state">
          ${icon("file")}
          <div>
            <h3>Aucune soumission en attente</h3>
            <p>Les questionnaires soumis par les enseignants apparaitront ici.</p>
          </div>
        </article>
      `;
    }

    return `
      <div class="publication-grid">
        ${this.publicationRequests.map((quiz) => this.publicationCardTemplate(quiz)).join("")}
      </div>
    `;
  }

  private publicationCardTemplate(quiz: QuizSummary): string {
    const description = quiz.description?.trim() ?? "";
    const descriptionPreview = description.length > 90
      ? `${description.slice(0, 90)}...`
      : description;
    const creatorLabel = this.creatorLabels.get(quiz.creatorId) ?? `Enseignant #${quiz.creatorId}`;

    return `
      <article class="publication-card">
        <div class="publication-card-menu-wrap">
          ${this.publicationMenuTemplate(quiz.id)}
        </div>
        <div class="publication-card-body">
          <div class="publication-card-head">
            <span class="publication-icon">${icon("file")}</span>
            <div class="publication-card-title-row">
              <h3>${escapeHtml(quiz.title)}</h3>
              <span class="publication-badge">En attente</span>
            </div>
          </div>
          <p class="publication-description">
            ${descriptionPreview.length > 0 ? escapeHtml(descriptionPreview) : ""}
          </p>
          <div class="publication-card-meta">
            <div>
              <span>Enseignant</span>
              <strong>${escapeHtml(creatorLabel)}</strong>
            </div>
            <div>
              <span>Questions</span>
              <strong>${quiz.questionCount}</strong>
            </div>
            <div class="publication-card-date">
              <span>Soumis le</span>
              <strong>${escapeHtml(this.formatCreatedAt(quiz.createdAt))}</strong>
            </div>
          </div>
          <button class="publication-publish-button" type="button" data-publish-quiz-id="${quiz.id}">
            ${icon("check")} Publier le questionnaire
          </button>
        </div>
      </article>
    `;
  }

  private publicationMenuTemplate(quizId: number): string {
    const isOpen = this.openMenuQuizId === quizId;

    return `
      <button
        class="publication-menu-trigger"
        type="button"
        data-menu-quiz-id="${quizId}"
        aria-label="Actions du questionnaire"
        aria-expanded="${isOpen ? "true" : "false"}"
      >
        ${icon("moreVertical")}
      </button>
      ${isOpen ? `
        <div class="publication-menu" role="menu">
          <button
            class="publication-menu-item"
            type="button"
            data-publish-quiz-id="${quizId}"
            role="menuitem"
          >
            Publier
          </button>
        </div>
      ` : ""}
    `;
  }

  private publishModalTemplate(): string {
    if (this.publishTarget === null) {
      return "";
    }

    return `
      <div class="create-modal publish-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="publish-quiz-title">
          <header class="modal-header">
            <div>
              <p>Publication</p>
              <h2 id="publish-quiz-title">Publier ce questionnaire ?</h2>
            </div>
            <button class="modal-close" type="button" data-close-publish-modal aria-label="Fermer" ${this.isPublishing ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="publish-modal-copy">
            Le questionnaire <strong>${escapeHtml(this.publishTarget.title)}</strong> sera rendu public
            et visible selon les regles d'acces de la plateforme.
          </p>
          ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-publish-modal ${this.isPublishing ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="button" data-confirm-publish ${this.isPublishing ? "disabled" : ""}>
              ${this.isPublishing ? "Publication..." : `${icon("check")} Confirmer la publication`}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private formatCreatedAt(value: string): string {
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

  private style(): string {
    return `
      :host {
        display: block;
        min-width: 0;
        max-width: 100%;
      }

      :host .view-loading,
      :host .section-loading {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .list-message,
      :host .modal-message {
        margin: 0 0 18px;
        color: var(--matheo-danger);
      }

      :host .view-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }

      :host .view-header-copy {
        flex: 1;
        min-width: 0;
      }

      :host .view-header p,
      :host .admin-section-header p,
      :host .modal-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1,
      :host .modal-header h2 {
        margin: 0 0 6px;
        color: #fff;
      }

      :host .view-header h1 {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header span,
      :host .admin-section-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .admin-sections {
        display: grid;
        gap: 22px;
      }

      :host .admin-section,
      :host .empty-state,
      :host .create-modal-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .admin-section {
        padding: 22px;
      }

      :host .admin-section-disabled {
        opacity: 0.72;
      }

      :host .admin-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      :host .admin-section-header h2 {
        margin: 0 0 6px;
        color: #fff;
        font-size: 1.45rem;
      }

      :host .admin-section-count {
        min-width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .admin-section-badge {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.78rem;
        font-weight: 800;
        white-space: nowrap;
      }

      :host .admin-section-placeholder,
      :host .empty-state {
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 24px;
      }

      :host .admin-section-placeholder h3,
      :host .empty-state h3 {
        margin: 0 0 6px;
        color: #fff;
      }

      :host .admin-section-placeholder p,
      :host .empty-state p {
        margin: 0;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .publication-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
      }

      :host .publication-card {
        position: relative;
        min-width: 0;
      }

      :host .publication-card:has(.publication-menu-trigger[aria-expanded="true"]) {
        z-index: 4;
      }

      :host .publication-card-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 3;
      }

      :host .publication-card-body {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host .publication-card-head {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding-right: 36px;
      }

      :host .publication-icon .icon {
        width: 28px;
        height: 28px;
        color: var(--matheo-gold);
      }

      :host .publication-card-title-row {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      :host .publication-card-title-row h3 {
        margin: 0;
        color: #fff;
        font-size: 1.15rem;
      }

      :host .publication-badge {
        justify-self: start;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(251, 191, 36, 0.16);
        color: #fde68a;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      :host .publication-description {
        margin: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
      }

      :host .publication-card-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        padding: 12px 14px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-meta > div {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      :host .publication-card-meta span {
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .publication-card-meta strong {
        color: rgba(250, 249, 246, 0.82);
        font-size: 0.92rem;
        overflow-wrap: anywhere;
      }

      :host .publication-card-date {
        text-align: right;
      }

      :host .publication-publish-button,
      :host .modal-submit {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
        cursor: pointer;
      }

      :host .publication-menu-trigger {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.82);
        cursor: pointer;
      }

      :host .publication-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 10;
        min-width: 168px;
        padding: 8px;
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 12px;
        background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
      }

      :host .publication-menu-item {
        width: 100%;
        min-height: 40px;
        display: block;
        padding: 0 12px;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        color: #f8fafc;
        font-size: 0.92rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      :host .create-modal {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.72);
      }

      :host .create-modal-panel {
        width: min(100%, 520px);
        padding: 22px;
      }

      :host .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      :host .publish-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.5;
      }

      :host .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      :host .modal-close,
      :host .modal-cancel {
        min-height: 44px;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.82);
        font-weight: 800;
        cursor: pointer;
      }

      :host .modal-close {
        width: 38px;
        height: 38px;
        min-height: 38px;
        display: grid;
        place-items: center;
        padding: 0;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      @media (max-width: 760px) {
        :host .publication-card-meta {
          grid-template-columns: 1fr;
        }

        :host .publication-card-date {
          text-align: left;
        }
      }
    `;
  }
}
