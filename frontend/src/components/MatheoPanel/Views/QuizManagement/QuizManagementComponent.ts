import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type { QuizDetail, QuizQuestionFull, QuizStatus, QuizSummary } from "../../../../models/Quiz.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";
import {
  QuizQuestionsSectionController,
  quizQuestionsSectionStyles,
  type QuizQuestionsSectionConfig
} from "../shared/QuizQuestionsSection.js";

type QuestionnaireView = QuizSummary | QuizDetail;

type QuestionnaireModalMode = "create" | "edit";

interface QuestionnaireDeleteTarget {
  id: number;
  title: string;
}

interface SubmitTarget {
  id: number;
  title: string;
}

export class QuizManagementComponent extends BaseComponent {
  private questionnaires: QuizSummary[] = [];
  private selectedQuestionnaireId: number | null = null;
  private selectedQuizDetail: QuizDetail | null = null;
  private openMenuQuestionnaireId: number | null = null;
  private isQuestionnaireModalOpen = false;
  private questionnaireModalMode: QuestionnaireModalMode = "create";
  private editingQuestionnaireId: number | null = null;
  private isSavingQuestionnaire = false;
  private isLoadingDetail = false;
  private isDeleting = false;
  private listMessage = "";
  private deleteTarget: QuestionnaireDeleteTarget | null = null;
  private submitTarget: SubmitTarget | null = null;
  private submittingQuestionnaireId: number | null = null;
  private cancellingSubmissionQuestionnaireId: number | null = null;
  private readonly questionsSection = new QuizQuestionsSectionController();

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-quiz-management-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement des questionnaires...</div>`, this.style());
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.refreshOwnedQuestionnaires();
      this.listMessage = "";
    } catch {
      this.questionnaires = [];
      this.listMessage = "Impossible de charger vos questionnaires.";
    }

    this.renderView();
  }

  private async refreshOwnedQuestionnaires(): Promise<void> {
    const user = await this.services.auth.getMe();
    const userId = user?.id;
    const items = await this.services.teacherQuizzes.listAccessibleQuizzes();

    this.questionnaires = userId !== null && userId !== undefined
      ? items.filter((item) => item.creatorId === userId)
      : [];
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>(".open-create-questionnaire").forEach((button) => {
      this.listen(button, "click", () => {
        this.openCreateQuestionnaireModal();
      });
    });

    this.bindModalBackdropClose();

    this.queryAll<HTMLButtonElement>("[data-close-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        this.closeQuestionnaireModal();
      });
    });

    const form = this.query<HTMLFormElement>('[data-form="questionnaire-form"]');
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        if (this.questionnaireModalMode === "edit") {
          void this.updateQuestionnaire(form);
        } else {
          void this.createQuestionnaire(form);
        }
      });
    }

    this.queryAll<HTMLButtonElement>("[data-menu-questionnaire-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuQuestionnaireId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuQuestionnaireId = this.openMenuQuestionnaireId === id ? null : id;
          this.renderView();
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-questionnaire-id]").forEach((button) => {
      this.listen(button, "click", () => {
        const id = Number.parseInt(button.dataset.questionnaireId ?? "", 10);
        if (!Number.isNaN(id)) {
          void this.openQuestionnaire(id);
        }
      });
    });

    const back = this.query<HTMLButtonElement>(".back-questionnaires");
    if (back !== null) {
      this.listen(back, "click", () => {
        this.openMenuQuestionnaireId = null;
        this.selectedQuestionnaireId = null;
        this.selectedQuizDetail = null;
        this.isLoadingDetail = false;
        this.questionsSection.reset();
        void this.refreshOwnedQuestionnaires()
          .catch(() => undefined)
          .finally(() => {
            this.renderView();
          });
      });
    }

    this.queryAll<HTMLButtonElement>("[data-edit-questionnaire-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.editQuestionnaireId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openEditQuestionnaireModal(id);
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-submit-questionnaire-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        if (button.hasAttribute("disabled")) {
          return;
        }

        const id = Number.parseInt(button.dataset.submitQuestionnaireId ?? "", 10);
        const questionnaire = this.findQuestionnaireById(id);
        if (questionnaire === null || !this.canSubmitQuestionnaire(questionnaire)) {
          return;
        }

        this.openMenuQuestionnaireId = null;
        this.isQuestionnaireModalOpen = false;
        this.deleteTarget = null;
        this.submitTarget = { id: questionnaire.id, title: questionnaire.title };
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-cancel-submission-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        if (this.isCancellingSubmission()) {
          return;
        }

        const id = Number.parseInt(button.dataset.cancelSubmissionId ?? "", 10);
        const questionnaire = this.findQuestionnaireById(id);
        if (questionnaire === null || !this.isSubmissionPending(questionnaire)) {
          return;
        }

        void this.cancelSubmissionQuestionnaire(id);
      });
    });

    this.queryAll<HTMLButtonElement>("[data-close-submit-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isSubmittingQuestionnaire()) {
          this.closeSubmitModal();
        }
      });
    });

    const confirmSubmit = this.query<HTMLButtonElement>("[data-confirm-submit]");
    if (confirmSubmit !== null) {
      this.listen(confirmSubmit, "click", () => {
        void this.confirmSubmitQuestionnaire();
      });
    }

    this.queryAll<HTMLButtonElement>("[data-delete-questionnaire-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.deleteQuestionnaireId ?? "", 10);
        if (Number.isNaN(id)) {
          return;
        }

        const questionnaire = this.findQuestionnaireById(id);
        if (questionnaire === null) {
          return;
        }

        this.openMenuQuestionnaireId = null;
        this.isQuestionnaireModalOpen = false;
        this.questionsSection.deleteTarget = null;
        this.deleteTarget = { id: questionnaire.id, title: questionnaire.title };
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-close-delete-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isDeleting) {
          this.closeDeleteModal();
        }
      });
    });

    const confirmDelete = this.query<HTMLButtonElement>("[data-confirm-delete]");
    if (confirmDelete !== null) {
      this.listen(confirmDelete, "click", () => {
        void this.confirmDeleteQuestionnaire();
      });
    }

    if (this.openMenuQuestionnaireId !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(
          ".questionnaire-card-menu-wrap, .view-header-menu"
        );
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuQuestionnaireId = null;
          this.renderView();
        }
      });
    }

    this.bindQuestionsSection();
    this.bindScrollTopButton();
  }

  private bindQuestionsSection(): void {
    if (this.selectedQuestionnaireId === null || this.root === null) {
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
    const quizId = this.selectedQuestionnaireId ?? 0;
    const questionnaire = this.getSelectedQuestionnaire();
    const questions = questionnaire !== null ? this.getDetailQuestions(questionnaire) : [];

    return {
      quizId,
      questions,
      isLoading: this.isLoadingDetail,
      features: {
        canAdd: true,
        canEdit: true,
        canDelete: true
      },
      emptyState: {
        title: "Aucune question pour le moment",
        description: "Ajoutez votre premiere question avec le bouton ci-dessus."
      },
      actions: {
        updateQuestion: async (questionId, request) => {
          await this.services.teacherQuizzes.updateQuestion(quizId, questionId, request);
        },
        addQuestion: async (input) => {
          await this.services.teacherQuizzes.addQuestion(quizId, input);
        },
        deleteQuestion: async (questionId) => {
          await this.services.teacherQuizzes.deleteQuestion(quizId, questionId);
        }
      },
      findQuestionById: (questionId) => this.findQuestionById(questionId),
      onChanged: async () => {
        if (this.selectedQuestionnaireId === null) {
          return;
        }

        this.selectedQuizDetail = await this.services.teacherQuizzes.getQuizDetail(this.selectedQuestionnaireId);
        this.questionnaires = this.questionnaires.map((item) => (
          item.id === this.selectedQuestionnaireId
            ? { ...item, questionCount: this.selectedQuizDetail?.questionCount ?? item.questionCount }
            : item
        ));
      },
      onError: (message) => {
        this.listMessage = message;
      }
    };
  }

  private bindScrollTopButton(): void {
    const topButton = this.query<HTMLButtonElement>('[data-action="top"]');
    if (topButton !== null) {
      this.listen(topButton, "click", () => {
        this.query<HTMLElement>("#quiz-management-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

        if (overlay.classList.contains("delete-modal")) {
          if (overlay.classList.contains("question-delete-modal")) {
            if (!this.questionsSection.isDeletingQuestion) {
              this.questionsSection.deleteTarget = null;
              this.renderView();
            }
            return;
          }

          if (!this.isDeleting) {
            this.closeDeleteModal();
          }
          return;
        }

        if (overlay.classList.contains("submit-modal")) {
          if (!this.isSubmittingQuestionnaire()) {
            this.closeSubmitModal();
          }
          return;
        }

        this.closeQuestionnaireModal();
      });
    });
  }

  private openCreateQuestionnaireModal(): void {
    this.questionnaireModalMode = "create";
    this.editingQuestionnaireId = null;
    this.isQuestionnaireModalOpen = true;
    this.openMenuQuestionnaireId = null;
    this.listMessage = "";
    this.renderView();
  }

  private openEditQuestionnaireModal(id: number): void {
    const questionnaire = this.findQuestionnaireById(id);
    if (questionnaire === null) {
      return;
    }

    this.questionnaireModalMode = "edit";
    this.editingQuestionnaireId = id;
    this.isQuestionnaireModalOpen = true;
    this.openMenuQuestionnaireId = null;
    this.listMessage = "";
    this.renderView();
  }

  private async openQuestionnaire(id: number): Promise<void> {
    this.openMenuQuestionnaireId = null;
    this.selectedQuestionnaireId = id;
    this.selectedQuizDetail = null;
    this.questionsSection.reset();
    this.isLoadingDetail = true;
    this.renderView();

    try {
      this.selectedQuizDetail = await this.services.teacherQuizzes.getQuizDetail(id);
    } catch {
      this.selectedQuestionnaireId = null;
      this.listMessage = "Impossible de charger le questionnaire.";
    } finally {
      this.isLoadingDetail = false;
      this.renderView();
    }
  }

  private closeQuestionnaireModal(): void {
    if (this.isSavingQuestionnaire) {
      return;
    }
    this.isQuestionnaireModalOpen = false;
    this.questionnaireModalMode = "create";
    this.editingQuestionnaireId = null;
    this.listMessage = "";
    this.renderView();
  }

  private isSubmittingQuestionnaire(): boolean {
    return this.submittingQuestionnaireId !== null;
  }

  private isCancellingSubmission(): boolean {
    return this.cancellingSubmissionQuestionnaireId !== null;
  }

  private async cancelSubmissionQuestionnaire(questionnaireId: number): Promise<void> {
    if (this.isCancellingSubmission()) {
      return;
    }

    this.cancellingSubmissionQuestionnaireId = questionnaireId;
    this.listMessage = "";
    this.openMenuQuestionnaireId = null;
    this.renderView();

    try {
      const updated = await this.services.teacherQuizzes.cancelPublicationRequest(questionnaireId);
      this.selectedQuizDetail = this.selectedQuestionnaireId === questionnaireId ? updated : this.selectedQuizDetail;
      await this.refreshOwnedQuestionnaires();
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Impossible d'annuler l'envoi.";
    } finally {
      this.cancellingSubmissionQuestionnaireId = null;
      this.renderView();
    }
  }

  private closeSubmitModal(): void {
    if (this.isSubmittingQuestionnaire()) {
      return;
    }

    this.submitTarget = null;
    this.renderView();
  }

  private async confirmSubmitQuestionnaire(): Promise<void> {
    if (this.submitTarget === null || this.isSubmittingQuestionnaire()) {
      return;
    }

    const targetId = this.submitTarget.id;
    this.submittingQuestionnaireId = targetId;
    this.listMessage = "";
    this.renderView();

    try {
      const updated = await this.services.teacherQuizzes.requestPublication(targetId);
      this.selectedQuizDetail = this.selectedQuestionnaireId === targetId ? updated : this.selectedQuizDetail;
      await this.refreshOwnedQuestionnaires();

      this.submitTarget = null;
      this.openMenuQuestionnaireId = null;
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Soumission impossible.";
      this.submitTarget = null;
    } finally {
      this.submittingQuestionnaireId = null;
      this.renderView();
    }
  }

  private isSubmissionPending(questionnaire: QuestionnaireView): boolean {
    return questionnaire.status === "private" && this.getAskAdmin(questionnaire);
  }

  private canSubmitQuestionnaire(questionnaire: QuestionnaireView): boolean {
    if (questionnaire.status !== "private") {
      return false;
    }

    if (this.getAskAdmin(questionnaire)) {
      return false;
    }

    return questionnaire.questionCount > 0;
  }

  private submitDisabledReason(questionnaire: QuestionnaireView): string {
    if (this.getAskAdmin(questionnaire)) {
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

  private closeDeleteModal(): void {
    this.deleteTarget = null;
    this.renderView();
  }

  private findQuestionnaireById(id: number): QuizSummary | QuizDetail | null {
    const fromList = this.questionnaires.find((item) => item.id === id);
    if (fromList !== undefined) {
      return fromList;
    }

    if (this.selectedQuizDetail?.id === id) {
      return this.selectedQuizDetail;
    }

    return null;
  }

  private findQuestionById(questionId: number): QuizQuestionFull | null {
    if (this.selectedQuizDetail === null) {
      return null;
    }

    return this.selectedQuizDetail.questions.find((question) => question.id === questionId) ?? null;
  }

  private async confirmDeleteQuestionnaire(): Promise<void> {
    if (this.deleteTarget === null || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.listMessage = "";
    this.renderView();

    try {
      const targetId = this.deleteTarget.id;
      await this.services.teacherQuizzes.deleteQuiz(targetId);
      this.questionnaires = this.questionnaires.filter((item) => item.id !== targetId);
      if (this.selectedQuestionnaireId === targetId) {
        this.selectedQuestionnaireId = null;
        this.selectedQuizDetail = null;
        this.questionsSection.reset();
      }

      this.deleteTarget = null;
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Suppression impossible.";
      this.deleteTarget = null;
    } finally {
      this.isDeleting = false;
      this.renderView();
    }
  }

  private async createQuestionnaire(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();

    if (title.length === 0) {
      this.listMessage = "Le nom est obligatoire.";
      this.renderView();
      return;
    }

    this.isSavingQuestionnaire = true;
    this.renderView();

    try {
      const created = await this.services.teacherQuizzes.createQuiz({
        title,
        description: description.length > 0 ? description : undefined,
        status: "private"
      });

      const summary = this.toSummary(created);
      this.questionnaires = [summary, ...this.questionnaires.filter((item) => item.id !== summary.id)];
      this.isQuestionnaireModalOpen = false;
      this.questionnaireModalMode = "create";
      this.editingQuestionnaireId = null;
      this.listMessage = "";
      this.selectedQuestionnaireId = created.id;
      this.selectedQuizDetail = created;
      form.reset();
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Creation impossible.";
    } finally {
      this.isSavingQuestionnaire = false;
      this.renderView();
    }
  }

  private async updateQuestionnaire(form: HTMLFormElement): Promise<void> {
    if (this.editingQuestionnaireId === null) {
      return;
    }

    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();

    if (title.length === 0) {
      this.listMessage = "Le nom est obligatoire.";
      this.renderView();
      return;
    }

    const quizId = this.editingQuestionnaireId;
    this.isSavingQuestionnaire = true;
    this.renderView();

    try {
      const updated = await this.services.teacherQuizzes.updateQuiz(quizId, {
        title,
        description: description.length > 0 ? description : ""
      });

      this.questionnaires = this.questionnaires.map((item) => (
        item.id === quizId ? this.toSummary(updated) : item
      ));

      if (this.selectedQuestionnaireId === quizId) {
        this.selectedQuizDetail = updated;
      }

      this.isQuestionnaireModalOpen = false;
      this.questionnaireModalMode = "create";
      this.editingQuestionnaireId = null;
      this.listMessage = "";
      form.reset();
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Modification impossible.";
    } finally {
      this.isSavingQuestionnaire = false;
      this.renderView();
    }
  }

  private toSummary(detail: QuizDetail): QuizSummary {
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

  private getSelectedQuestionnaire(): QuestionnaireView | null {
    if (this.selectedQuestionnaireId === null) {
      return null;
    }

    if (this.selectedQuizDetail?.id === this.selectedQuestionnaireId) {
      return this.selectedQuizDetail;
    }

    return this.questionnaires.find((item) => item.id === this.selectedQuestionnaireId) ?? null;
  }

  private renderView(): void {
    const selected = this.getSelectedQuestionnaire();

    this.render(`
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
            ${this.questionnaireMenuTemplate(selected)}
          </div>
        `}
      </header>
      ${this.listMessage.length > 0 && !this.isQuestionnaireModalOpen && this.deleteTarget === null && this.submitTarget === null && this.questionsSection.deleteTarget === null ? `
        <p class="list-message">${escapeHtml(this.listMessage)}</p>
      ` : ""}
      ${selected === null ? this.questionnaireListTemplate() : this.questionnaireDetailTemplate(selected)}
      ${this.isQuestionnaireModalOpen ? this.questionnaireModalTemplate() : ""}
      ${this.submitTarget !== null ? this.submitModalTemplate() : ""}
      ${this.deleteTarget !== null ? this.deleteModalTemplate() : ""}
      ${this.questionsSection.renderDeleteModal()}
      ${selected !== null ? this.floatingTopButton() : ""}
    `, this.style());
    this.bindEvents();
  }

  private floatingTopButton(): string {
    return `
      <button class="top-button floating-top-button" type="button" data-action="top" aria-label="Haut de page">
        ${icon("arrowUp")} Haut de page
      </button>
    `;
  }

  private questionnaireListTemplate(): string {
    return `
      <div class="questionnaire-grid">
        ${this.questionnaires.length === 0 ? `
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
        ` : this.questionnaires.map((item) => this.questionnaireCardTemplate(item)).join("")}
      </div>
    `;
  }

  private questionnaireCardTemplate(questionnaire: QuizSummary): string {
    const description = questionnaire.description?.trim() ?? "";
    const descriptionPreview = description.length > 90
      ? `${description.slice(0, 90)}...`
      : description;
    const visibilityBadge = this.formatVisibilityBadge(questionnaire);
    const submissionBadge = this.formatSubmissionBadge(questionnaire);

    return `
      <article class="questionnaire-card">
        <div class="questionnaire-card-menu-wrap">
          ${this.questionnaireMenuTemplate(questionnaire)}
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
              <strong>${escapeHtml(this.formatCreatedAt(questionnaire.createdAt))}</strong>
            </div>
          </div>
        </button>
      </article>
    `;
  }

  private questionnaireMenuTemplate(questionnaire: QuestionnaireView): string {
    const questionnaireId = questionnaire.id;
    const isOpen = this.openMenuQuestionnaireId === questionnaireId;
    const canSubmit = this.canSubmitQuestionnaire(questionnaire);
    const submitReason = this.submitDisabledReason(questionnaire);
    const submissionPending = this.isSubmissionPending(questionnaire);
    const isCancellingThis = this.cancellingSubmissionQuestionnaireId === questionnaireId;

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

  private submitModalTemplate(): string {
    if (this.submitTarget === null) {
      return "";
    }

    return `
      <div class="create-modal submit-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="submit-questionnaire-title">
          <header class="modal-header">
            <div>
              <p>Soumission</p>
              <h2 id="submit-questionnaire-title">Soumettre ce questionnaire ?</h2>
            </div>
            <button class="modal-close" type="button" data-close-submit-modal aria-label="Fermer" ${this.isSubmittingQuestionnaire() ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="submit-modal-copy">
            Le questionnaire <strong>${escapeHtml(this.submitTarget.title)}</strong> sera transmis a
            l'administration pour validation et publication.
          </p>
          ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-submit-modal ${this.isSubmittingQuestionnaire() ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="button" data-confirm-submit ${this.isSubmittingQuestionnaire() ? "disabled" : ""}>
              ${this.isSubmittingQuestionnaire() ? "Soumission..." : `${icon("check")} Confirmer la soumission`}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private deleteModalTemplate(): string {
    if (this.deleteTarget === null) {
      return "";
    }

    return `
      <div class="create-modal delete-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-target-title">
          <header class="modal-header">
            <div>
              <p>Suppression</p>
              <h2 id="delete-target-title">Supprimer ce questionnaire ?</h2>
            </div>
            <button class="modal-close" type="button" data-close-delete-modal aria-label="Fermer" ${this.isDeleting ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="delete-modal-copy">
            Le questionnaire <strong>${escapeHtml(this.deleteTarget.title)}</strong> sera supprime avec toutes ses questions. Cette action est irreversible.
          </p>
          ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-delete-modal ${this.isDeleting ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit modal-submit-danger" type="button" data-confirm-delete ${this.isDeleting ? "disabled" : ""}>
              ${this.isDeleting ? "Suppression..." : `${icon("trash")} Supprimer`}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private questionnaireModalTemplate(): string {
    const isEdit = this.questionnaireModalMode === "edit";
    const questionnaire = isEdit && this.editingQuestionnaireId !== null
      ? this.findQuestionnaireById(this.editingQuestionnaireId)
      : null;
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
            <button class="modal-close" type="button" data-close-modal aria-label="Fermer" ${this.isSavingQuestionnaire ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <form class="questionnaire-form" data-form="questionnaire-form">
            <label>
              <span>Nom</span>
              <input
                name="title"
                placeholder="Ex : Fractions — evaluation de depart"
                maxlength="120"
                value="${escapeHtml(titleValue)}"
                required
                ${this.isSavingQuestionnaire ? "disabled" : ""}
              >
            </label>
            <label>
              <span>Description</span>
              <textarea
                name="description"
                rows="4"
                placeholder="Objectifs, contexte, consignes generales..."
                ${this.isSavingQuestionnaire ? "disabled" : ""}
              >${escapeHtml(descriptionValue)}</textarea>
            </label>
            ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
            <div class="modal-actions">
              <button class="modal-cancel" type="button" data-close-modal ${this.isSavingQuestionnaire ? "disabled" : ""}>
                Annuler
              </button>
              <button class="modal-submit" type="submit" ${this.isSavingQuestionnaire ? "disabled" : ""}>
                ${this.isSavingQuestionnaire
                  ? (isEdit ? "Enregistrement..." : "Creation...")
                  : (isEdit ? `${icon("check")} Enregistrer` : `${icon("plus")} Creer le questionnaire`)}
              </button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  private questionnaireDetailTemplate(questionnaire: QuestionnaireView): string {
    const description = questionnaire.description?.trim() ?? "";
    const visibilityBadge = this.formatVisibilityBadge(questionnaire);
    const submissionBadge = questionnaire.status === "private"
      ? this.formatSubmissionBadge(questionnaire)
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
            <strong>${escapeHtml(this.formatCreatedAt(questionnaire.createdAt))}</strong>
          </article>
        </div>
        ${description.length > 0 ? `<p class="detail-description">${escapeHtml(description)}</p>` : ""}
        ${this.questionsSection.render(this.buildQuestionsSectionConfig())}
      </section>
    `;
  }

  private getDetailQuestions(questionnaire: QuestionnaireView): QuizQuestionFull[] {
    if ("questions" in questionnaire && Array.isArray(questionnaire.questions)) {
      return [...questionnaire.questions].sort((left, right) => right.orderIndex - left.orderIndex);
    }

    return [];
  }

  private getAskAdmin(questionnaire: QuestionnaireView): boolean {
    return questionnaire.askAdmin;
  }

  private formatVisibilityBadge(questionnaire: QuestionnaireView): { label: string; className: string } {
    if (questionnaire.status === "public") {
      return { label: "Public", className: "questionnaire-status-public" };
    }

    return { label: "Prive", className: "questionnaire-status-private" };
  }

  private formatSubmissionBadge(questionnaire: QuestionnaireView): { label: string; className: string } {
    return this.getAskAdmin(questionnaire)
      ? { label: "Soumis", className: "questionnaire-status-submitted" }
      : { label: "Non soumis", className: "questionnaire-status-not-submitted" };
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
        position: relative;
      }

      :host .view-top-anchor {
        scroll-margin-top: 24px;
      }

      :host .top-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 42px;
        border: 1px solid rgba(212, 175, 55, 0.38);
        border-radius: 10px;
        padding: 0 14px;
        background: rgba(15, 23, 42, 0.54);
        color: var(--matheo-gold);
        font-weight: 900;
        cursor: pointer;
      }

      :host .floating-top-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 40;
        box-shadow: 0 16px 38px rgba(2, 6, 23, 0.28);
      }

      :host .view-loading,
      :host .list-message,
      :host .modal-message {
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
      :host .questionnaire-form label span,
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

      :host .view-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .open-create-questionnaire,
      :host .modal-submit,
      :host .empty-state button,
      :host .add-question-button,
      :host .question-draft-save {
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
        white-space: nowrap;
        cursor: pointer;
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

      :host .back-questionnaires {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
        cursor: pointer;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .questionnaire-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        align-items: stretch;
        gap: 16px;
      }

      :host .questionnaire-card,
      :host .empty-state,
      :host .detail-panel,
      :host .create-modal-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .questionnaire-card {
        position: relative;
        display: flex;
        min-width: 0;
        height: 100%;
      }

      :host .questionnaire-card-menu-wrap,
      :host .view-header-menu {
        position: relative;
        z-index: 3;
      }

      :host .questionnaire-card:has(.questionnaire-menu-trigger[aria-expanded="true"]) {
        z-index: 4;
      }

      :host .questionnaire-card-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
      }

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
        min-width: 192px;
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
        white-space: nowrap;
        cursor: pointer;
      }

      :host .questionnaire-menu-item + .questionnaire-menu-item {
        margin-top: 4px;
      }

      :host .questionnaire-menu-item:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      :host .questionnaire-menu-item-disabled,
      :host .questionnaire-menu-item:disabled {
        color: rgba(250, 249, 246, 0.34);
        background: rgba(255, 255, 255, 0.02);
        cursor: not-allowed;
      }

      :host .questionnaire-menu-item-danger {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.14);
      }

      :host .questionnaire-menu-item-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .questionnaire-card-open {
        width: 100%;
        min-width: 0;
        min-height: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1.35em auto;
        gap: 12px;
        padding: 18px 52px 18px 20px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .questionnaire-card-open:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .questionnaire-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }

      :host .questionnaire-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        flex: none;
      }

      :host .questionnaire-card-title-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      :host .questionnaire-card h2 {
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

      :host .questionnaire-card-badges {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      :host .questionnaire-status {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 11px;
        border-radius: 999px;
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .questionnaire-status-public,
      :host .questionnaire-status-private,
      :host .questionnaire-status-submitted {
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
      }

      :host .questionnaire-status-not-submitted {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.72);
      }

      :host .questionnaire-description {
        margin: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .questionnaire-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
        padding: 12px 14px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .questionnaire-card-meta > div {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      :host .questionnaire-card-date {
        text-align: right;
      }

      :host .questionnaire-card-meta span {
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .questionnaire-card-meta strong {
        color: rgba(250, 249, 246, 0.82);
        font-size: 0.92rem;
      }

      :host .questionnaire-card-action {
        color: rgba(250, 249, 246, 0.38);
        flex: none;
      }

      :host .empty-state {
        grid-column: 1 / -1;
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 28px;
      }

      :host .empty-state .icon {
        width: 42px;
        height: 42px;
        color: var(--matheo-gold);
      }

      :host .empty-state h2 {
        margin: 0 0 8px;
        color: #fff;
      }

      :host .empty-state p {
        margin: 0 0 16px;
        color: rgba(250, 249, 246, 0.62);
      }

      :host .create-modal {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(4px);
      }

      :host .create-modal-panel {
        width: min(560px, 100%);
        padding: 22px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      :host .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }

      :host .modal-header h2 {
        font-size: 1.6rem;
      }

      :host .questionnaire-form {
        display: grid;
        gap: 14px;
      }

      :host .questionnaire-form label {
        display: grid;
        gap: 7px;
      }

      :host .questionnaire-form input,
      :host .questionnaire-form textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .questionnaire-form input {
        min-height: 44px;
      }

      :host .questionnaire-form textarea {
        resize: vertical;
        min-height: 110px;
      }

      :host .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
      }

      :host .modal-cancel,
      :host .modal-submit {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 10px;
        font-weight: 800;
      }

      :host .modal-submit-danger {
        background: #dc2626;
        color: #fff;
        border: 0;
      }

      :host .modal-submit-danger:hover:not(:disabled) {
        background: #b91c1c;
      }

      :host .delete-modal-copy,
      :host .submit-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .delete-modal-copy strong,
      :host .submit-modal-copy strong {
        color: #fff;
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

      @media (max-width: 900px) {
        :host .view-header {
          flex-wrap: wrap;
        }

        :host .detail-top {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        :host .detail-top {
          grid-template-columns: 1fr;
        }

        :host .floating-top-button {
          right: 14px;
          bottom: 14px;
        }
      }
    `;
  }
}
