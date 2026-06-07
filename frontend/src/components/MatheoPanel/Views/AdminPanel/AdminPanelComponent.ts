import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type {
  QuizDetail,
  QuizQuestionFull,
  QuizSummary
} from "../../../../models/Quiz.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";
import {
  QuizQuestionsSectionController,
  quizQuestionsSectionStyles,
  type QuizQuestionsSectionConfig
} from "../shared/QuizQuestionsSection.js";

type AdminSectionId = "publication-requests" | "teachers";

interface AdminSectionConfig {
  id: AdminSectionId;
  eyebrow: string;
  title: string;
  description: string;
  enabled: boolean;
}

type ReviewActionTarget =
  | { kind: "publish"; id: number; title: string }
  | { kind: "reject"; id: number; title: string };

export class AdminPanelComponent extends BaseComponent {
  private publicationRequests: QuizSummary[] = [];
  private creatorLabels = new Map<number, string>();
  private selectedQuizId: number | null = null;
  private selectedQuizDetail: QuizDetail | null = null;
  private reviewActionTarget: ReviewActionTarget | null = null;
  private isProcessingReviewAction = false;
  private isLoading = true;
  private isLoadingDetail = false;
  private listMessage = "";
  private readonly questionsSection = new QuizQuestionsSectionController();

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

    const back = this.query<HTMLButtonElement>(".back-publications");
    if (back !== null) {
      this.listen(back, "click", () => {
        this.closeQuizDetail();
      });
    }

    this.queryAll<HTMLButtonElement>("[data-open-quiz-id]").forEach((button) => {
      this.listen(button, "click", () => {
        const id = Number.parseInt(button.dataset.openQuizId ?? "", 10);
        if (!Number.isNaN(id)) {
          void this.openQuiz(id);
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-publish-quiz-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        this.openReviewAction("publish", button.dataset.publishQuizId ?? "");
      });
    });

    this.queryAll<HTMLButtonElement>("[data-reject-quiz-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        this.openReviewAction("reject", button.dataset.rejectQuizId ?? "");
      });
    });

    this.queryAll<HTMLButtonElement>("[data-close-review-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isProcessingReviewAction) {
          this.closeReviewModal();
        }
      });
    });

    const confirmReview = this.query<HTMLButtonElement>("[data-confirm-review]");
    if (confirmReview !== null) {
      this.listen(confirmReview, "click", () => {
        void this.confirmReviewAction();
      });
    }

    this.bindQuestionsSection();
  }

  private bindQuestionsSection(): void {
    if (this.selectedQuizId === null || this.root === null) {
      return;
    }

    this.questionsSection.bindEvents(
      {
        root: this.root,
        listen: (target, type, listener) => {
          this.listen(target, type, listener as (event: HTMLElementEventMap[typeof type]) => void);
        },
        onRender: () => {
          this.renderView();
        }
      },
      this.buildQuestionsSectionConfig()
    );
  }

  private buildQuestionsSectionConfig(): QuizQuestionsSectionConfig {
    const quizId = this.selectedQuizId ?? 0;

    return {
      quizId,
      questions: this.getDetailQuestions(),
      isLoading: this.isLoadingDetail,
      features: {
        canAdd: false,
        canEdit: true,
        canDelete: true
      },
      emptyState: {
        title: "Aucune question pour le moment",
        description: "Ce questionnaire ne contient aucune question."
      },
      actions: {
        updateQuestion: async (questionId, request) => {
          await this.services.adminQuizzes.updateQuestion(quizId, questionId, request);
        },
        deleteQuestion: async (questionId) => {
          await this.services.adminQuizzes.deleteQuestion(quizId, questionId);
        }
      },
      findQuestionById: (questionId) => this.findQuestionById(questionId),
      onChanged: async () => {
        if (this.selectedQuizId === null) {
          return;
        }

        this.selectedQuizDetail = await this.services.adminQuizzes.getQuizDetail(this.selectedQuizId);
        this.publicationRequests = this.publicationRequests.map((item) => (
          item.id === this.selectedQuizId
            ? { ...item, questionCount: this.selectedQuizDetail?.questionCount ?? item.questionCount }
            : item
        ));
      },
      onError: (message) => {
        this.listMessage = message;
      }
    };
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

        if (overlay.classList.contains("question-delete-modal")) {
          if (!this.questionsSection.isDeletingQuestion) {
            this.questionsSection.deleteTarget = null;
            this.renderView();
          }
          return;
        }

        if (!this.isProcessingReviewAction) {
          this.closeReviewModal();
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

  private async openQuiz(id: number): Promise<void> {
    this.selectedQuizId = id;
    this.selectedQuizDetail = null;
    this.isLoadingDetail = true;
    this.questionsSection.reset();
    this.listMessage = "";
    this.renderView();

    try {
      this.selectedQuizDetail = await this.services.adminQuizzes.getQuizDetail(id);
    } catch {
      this.selectedQuizId = null;
      this.listMessage = "Impossible de charger le questionnaire.";
    } finally {
      this.isLoadingDetail = false;
      this.renderView();
    }
  }

  private closeQuizDetail(): void {
    this.selectedQuizId = null;
    this.selectedQuizDetail = null;
    this.isLoadingDetail = false;
    this.questionsSection.reset();
    this.renderView();
  }

  private openReviewAction(kind: ReviewActionTarget["kind"], idRaw: string): void {
    const id = Number.parseInt(idRaw, 10);
    if (Number.isNaN(id)) {
      return;
    }

    const quiz = this.findQuizSummary(id);
    if (quiz === undefined) {
      return;
    }

    this.reviewActionTarget = {
      kind,
      id: quiz.id,
      title: this.formatQuizTitleWithCreator(quiz.title, quiz.creatorId)
    };
    this.listMessage = "";
    this.renderView();
  }

  private findQuizSummary(id: number): QuizSummary | undefined {
    if (this.selectedQuizDetail?.id === id) {
      return {
        id: this.selectedQuizDetail.id,
        type: this.selectedQuizDetail.type,
        title: this.selectedQuizDetail.title,
        description: this.selectedQuizDetail.description,
        status: this.selectedQuizDetail.status,
        creatorId: this.selectedQuizDetail.creatorId,
        askAdmin: this.selectedQuizDetail.askAdmin,
        questionCount: this.selectedQuizDetail.questionCount,
        position: null,
        createdAt: this.selectedQuizDetail.createdAt,
        progress: null
      };
    }

    return this.publicationRequests.find((item) => item.id === id);
  }

  private closeReviewModal(): void {
    this.reviewActionTarget = null;
    this.renderView();
  }

  private async confirmReviewAction(): Promise<void> {
    if (this.reviewActionTarget === null || this.isProcessingReviewAction) {
      return;
    }

    const target = this.reviewActionTarget;
    this.isProcessingReviewAction = true;
    this.listMessage = "";
    this.renderView();

    try {
      if (target.kind === "publish") {
        await this.services.adminQuizzes.publishQuiz(target.id);
      } else {
        await this.services.adminQuizzes.rejectPublicationRequest(target.id);
      }

      this.publicationRequests = this.publicationRequests.filter((item) => item.id !== target.id);
      this.reviewActionTarget = null;
      this.closeQuizDetail();
      await this.loadCreatorLabels();
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Action impossible.";
      this.reviewActionTarget = null;
    } finally {
      this.isProcessingReviewAction = false;
      this.renderView();
    }
  }

  private findQuestionById(questionId: number): QuizQuestionFull | null {
    if (this.selectedQuizDetail === null) {
      return null;
    }

    return this.selectedQuizDetail.questions.find((question) => question.id === questionId) ?? null;
  }

  private getDetailQuestions(): QuizQuestionFull[] {
    if (this.selectedQuizDetail === null) {
      return [];
    }

    return [...this.selectedQuizDetail.questions].sort((left, right) => right.orderIndex - left.orderIndex);
  }

  private renderView(): void {
    const selected = this.selectedQuizDetail;

    this.render(`
      <header class="view-header">
        ${this.selectedQuizId !== null ? `<button class="back-publications" type="button">${icon("arrowLeft")}</button>` : ""}
        <div class="view-header-copy">
          <p>Administration</p>
          <h1>${this.selectedQuizId !== null && selected !== null
            ? escapeHtml(this.formatQuizTitleWithCreator(selected.title, selected.creatorId))
            : "Panel administrateur"}</h1>
          <span>${this.selectedQuizId !== null
            ? "Examinez le questionnaire soumis et validez sa publication."
            : "Validez les questionnaires soumis et preparez la gestion des enseignants."}</span>
        </div>
      </header>
      ${this.listMessage.length > 0 && this.reviewActionTarget === null && this.questionsSection.deleteTarget === null ? `
        <p class="list-message">${escapeHtml(this.listMessage)}</p>
      ` : ""}
      ${this.selectedQuizId !== null ? this.quizDetailTemplate() : `
        <div class="admin-sections">
          ${this.sections.map((section) => this.adminSectionTemplate(section)).join("")}
        </div>
      `}
      ${this.selectedQuizId !== null ? this.floatingDetailReviewActions(this.selectedQuizId) : ""}
      ${this.reviewActionTarget !== null ? this.reviewModalTemplate() : ""}
      ${this.questionsSection.renderDeleteModal()}
    `, this.style());
    this.bindEvents();
  }

  private floatingDetailReviewActions(quizId: number): string {
    return `
      <div class="detail-review-actions-floating" role="toolbar" aria-label="Actions de publication">
        <button class="detail-publish-button" type="button" data-publish-quiz-id="${quizId}">
          ${icon("check")} Publier
        </button>
        <button class="detail-reject-button" type="button" data-reject-quiz-id="${quizId}">
          ${icon("x")} Refuser
        </button>
      </div>
    `;
  }

  private quizDetailTemplate(): string {
    if (this.isLoadingDetail || this.selectedQuizDetail === null) {
      return `<p class="section-loading">Chargement du questionnaire...</p>`;
    }

    const quiz = this.selectedQuizDetail;
    const description = quiz.description?.trim() ?? "";

    return `
      <section class="detail-panel">
        <div class="detail-top">
          <article class="detail-stat">
            <span>Visibilite</span>
            <strong>Prive</strong>
          </article>
          <article class="detail-stat">
            <span>Soumission</span>
            <strong>Soumis</strong>
          </article>
          <article class="detail-stat">
            <span>Questions</span>
            <strong>${quiz.questionCount}</strong>
          </article>
          <article class="detail-stat">
            <span>Cree le</span>
            <strong>${escapeHtml(this.formatCreatedAt(quiz.createdAt))}</strong>
          </article>
        </div>
        ${description.length > 0 ? `<p class="detail-description">${escapeHtml(description)}</p>` : ""}
        ${this.questionsSection.render(this.buildQuestionsSectionConfig())}
      </section>
    `;
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
    const displayTitle = this.formatQuizTitleWithCreator(quiz.title, quiz.creatorId);

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
              <span>Cree le</span>
              <strong>${escapeHtml(this.formatCreatedAt(quiz.createdAt))}</strong>
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

  private reviewModalTemplate(): string {
    if (this.reviewActionTarget === null) {
      return "";
    }

    const isPublish = this.reviewActionTarget.kind === "publish";
    const title = isPublish ? "Publier ce questionnaire ?" : "Refuser cette publication ?";
    const copy = isPublish
      ? `Le questionnaire <strong>${escapeHtml(this.reviewActionTarget.title)}</strong> sera rendu public et visible selon les regles d'acces de la plateforme.`
      : `Le questionnaire <strong>${escapeHtml(this.reviewActionTarget.title)}</strong> restera prive. L'enseignant pourra le modifier et le soumettre a nouveau.`;

    return `
      <div class="create-modal review-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="review-quiz-title">
          <header class="modal-header">
            <div>
              <p>${isPublish ? "Publication" : "Refus"}</p>
              <h2 id="review-quiz-title">${title}</h2>
            </div>
            <button class="modal-close" type="button" data-close-review-modal aria-label="Fermer" ${this.isProcessingReviewAction ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="review-modal-copy">${copy}</p>
          ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-review-modal ${this.isProcessingReviewAction ? "disabled" : ""}>
              Annuler
            </button>
            <button
              class="modal-submit${isPublish ? "" : " modal-submit-danger"}"
              type="button"
              data-confirm-review
              ${this.isProcessingReviewAction ? "disabled" : ""}
            >
              ${this.isProcessingReviewAction
                ? (isPublish ? "Publication..." : "Refus...")
                : (isPublish ? `${icon("check")} Confirmer la publication` : `${icon("x")} Confirmer le refus`)}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private formatQuizTitleWithCreator(title: string, creatorId: number): string {
    const creatorLabel = this.creatorLabels.get(creatorId) ?? `Enseignant #${creatorId}`;
    return `${title} - ${creatorLabel}`;
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

      :host .back-publications {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
        cursor: pointer;
        flex: none;
      }

      :host .detail-review-actions-floating {
        position: fixed;
        top: 32px;
        right: 32px;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(8px);
        box-shadow: 0 16px 38px rgba(2, 6, 23, 0.32);
      }

      :host .detail-review-actions-floating .detail-publish-button,
      :host .detail-review-actions-floating .detail-reject-button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 0.88rem;
        white-space: nowrap;
      }

      :host .detail-publish-button,
      :host .publication-publish-button,
      :host .question-draft-save,
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

      :host .detail-reject-button,
      :host .publication-reject-button,
      :host .modal-submit-danger {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 0;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.18);
        color: #fecaca;
        font-weight: 900;
        cursor: pointer;
      }

      :host .modal-submit-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.28);
        color: #fff;
      }

      :host .view-header-copy {
        flex: 1;
        min-width: 0;
      }

      :host .view-header p,
      :host .admin-section-header p,
      :host .detail-top span,
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
      :host .create-modal-panel,
      :host .detail-panel {
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
        align-items: stretch;
        gap: 16px;
      }

      :host .publication-card {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      :host .publication-card:has(.publication-card-open:hover),
      :host .publication-card:has(.publication-card-actions:hover) {
        border-color: rgba(212, 175, 55, 0.42);
        background: rgba(15, 23, 42, 0.72);
      }

      :host .publication-card-open {
        flex: 1;
        width: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1.35em auto;
        gap: 12px;
        padding: 18px 20px 12px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .publication-card:has(.publication-card-open:hover) .publication-card-open,
      :host .publication-card:has(.publication-card-actions:hover) .publication-card-open {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 0 20px 18px;
        flex: none;
        border-radius: 0 0 14px 14px;
      }

      :host .publication-card:has(.publication-card-actions:hover) .publication-card-actions {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-actions .publication-publish-button,
      :host .publication-card-actions .publication-reject-button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 0.88rem;
        white-space: nowrap;
      }

      :host .publication-card-action {
        color: rgba(250, 249, 246, 0.38);
        flex: none;
      }

      :host .publication-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }

      :host .publication-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        flex: none;
      }

      :host .publication-icon .icon {
        width: 20px;
        height: 20px;
      }

      :host .publication-card-title-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      :host .publication-card h2 {
        margin: 0;
        width: 100%;
        min-width: 0;
        font-size: 1.3rem;
        font-weight: 900;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .publication-card-badges {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      :host .publication-badge {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 11px;
        border-radius: 999px;
        background: rgba(251, 191, 36, 0.16);
        color: #fde68a;
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .publication-description {
        margin: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .publication-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
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

      :host .detail-panel {
        padding: 22px;
      }

      :host .detail-top {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }

      :host .detail-top article {
        padding: 16px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host .detail-stat {
        display: grid;
        gap: 8px;
        align-content: start;
        min-width: 0;
      }

      :host .detail-stat strong {
        color: #fff;
        font-size: 1rem;
        line-height: 1.35;
      }

      :host .detail-description {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      ${quizQuestionsSectionStyles()}

      :host .questionnaire-menu-trigger {
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

      :host .questionnaire-menu-trigger:hover,
      :host .questionnaire-menu-trigger[aria-expanded="true"] {
        background: rgba(212, 175, 55, 0.18);
        color: #fff;
      }

      :host .questionnaire-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 10;
        min-width: 168px;
        padding: 8px;
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 12px;
        background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
        box-shadow:
          0 18px 40px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(212, 175, 55, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      :host .questionnaire-menu-item {
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

      :host .questionnaire-menu-item + .questionnaire-menu-item {
        margin-top: 4px;
      }

      :host .questionnaire-menu-item:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      :host .questionnaire-menu-item-danger {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.14);
      }

      :host .questionnaire-menu-item-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

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

      :host .delete-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .delete-modal-copy strong {
        color: #fff;
      }

      :host .review-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.5;
      }

      :host .review-modal-copy strong {
        color: #fff;
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

      @media (max-width: 900px) {
        :host .view-header {
          flex-wrap: wrap;
        }

        :host .detail-top {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        :host .publication-card-meta {
          grid-template-columns: 1fr;
        }

        :host .publication-card-date {
          text-align: left;
        }
      }

      @media (max-width: 860px) {
        :host .detail-review-actions-floating {
          top: 22px;
          right: 22px;
          left: 22px;
          justify-content: stretch;
        }

        :host .detail-review-actions-floating .detail-publish-button,
        :host .detail-review-actions-floating .detail-reject-button {
          flex: 1;
        }
      }

      @media (max-width: 640px) {
        :host .detail-top {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
