import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type { QuizDetail, QuizQuestionFull, QuizQuestionType, QuizStatus, QuizSummary } from "../../../../models/Quiz.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

type QuestionnaireView = QuizSummary | QuizDetail;

interface DraftProposition {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  questionId: number | null;
  label: string;
  propositions: DraftProposition[];
}

type QuestionnaireModalMode = "create" | "edit";

type DeleteTarget =
  | { kind: "questionnaire"; id: number; title: string }
  | { kind: "question"; questionId: number; label: string };

export class QuizManagementComponent extends BaseComponent {
  private questionnaires: QuizSummary[] = [];
  private selectedQuestionnaireId: number | null = null;
  private selectedQuizDetail: QuizDetail | null = null;
  private openMenuQuestionnaireId: number | null = null;
  private openMenuQuestionId: number | null = null;
  private isQuestionnaireModalOpen = false;
  private questionnaireModalMode: QuestionnaireModalMode = "create";
  private editingQuestionnaireId: number | null = null;
  private isSavingQuestionnaire = false;
  private isLoadingDetail = false;
  private isSavingQuestion = false;
  private isDeleting = false;
  private listMessage = "";
  private deleteTarget: DeleteTarget | null = null;
  private questionDraft: QuestionDraft | null = null;
  private questionDraftMessage = "";

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
      const user = await this.services.auth.getMe();
      const items = await this.services.teacherQuizzes.listAccessibleQuizzes();
      const userId = user?.id;

      this.questionnaires = userId !== null && userId !== undefined
        ? items.filter((item) => item.creatorId === userId)
        : [];
      this.listMessage = "";
    } catch {
      this.questionnaires = [];
      this.listMessage = "Impossible de charger vos questionnaires.";
    }

    this.renderView();
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
          this.openMenuQuestionId = null;
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
        this.openMenuQuestionId = null;
        this.selectedQuestionnaireId = null;
        this.selectedQuizDetail = null;
        this.isLoadingDetail = false;
        this.questionDraft = null;
        this.questionDraftMessage = "";
        this.renderView();
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

    this.queryAll<HTMLButtonElement>("[data-menu-action='submit']").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        if (button.hasAttribute("disabled")) {
          return;
        }
        this.openMenuQuestionnaireId = null;
        this.renderView();
      });
    });

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
        this.deleteTarget = { kind: "questionnaire", id: questionnaire.id, title: questionnaire.title };
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-menu-question-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuQuestionId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuQuestionnaireId = null;
          this.openMenuQuestionId = this.openMenuQuestionId === id ? null : id;
          this.renderView();
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-delete-question-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const questionId = Number.parseInt(button.dataset.deleteQuestionId ?? "", 10);
        if (Number.isNaN(questionId)) {
          return;
        }

        const question = this.findQuestionById(questionId);
        if (question === null) {
          return;
        }

        this.openMenuQuestionId = null;
        this.openMenuQuestionnaireId = null;
        this.isQuestionnaireModalOpen = false;
        this.deleteTarget = { kind: "question", questionId: question.id, label: question.label };
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-edit-question-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const questionId = Number.parseInt(button.dataset.editQuestionId ?? "", 10);
        if (Number.isNaN(questionId)) {
          return;
        }

        const question = this.findQuestionById(questionId);
        if (question === null) {
          return;
        }

        this.openMenuQuestionId = null;
        this.questionDraftMessage = "";
        this.questionDraft = this.createDraftFromQuestion(question);
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
        void this.confirmDelete();
      });
    }

    if (this.openMenuQuestionnaireId !== null || this.openMenuQuestionId !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(
          ".questionnaire-card-menu-wrap, .view-header-menu, .question-item-menu-wrap"
        );
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuQuestionnaireId = null;
          this.openMenuQuestionId = null;
          this.renderView();
        }
      });
    }

    this.bindQuestionDraftEvents();
    this.bindScrollTopButton();
  }

  private bindScrollTopButton(): void {
    const topButton = this.query<HTMLButtonElement>('[data-action="top"]');
    if (topButton !== null) {
      this.listen(topButton, "click", () => {
        this.query<HTMLElement>("#quiz-management-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  private bindQuestionDraftEvents(): void {
    const openDraft = this.query<HTMLButtonElement>("[data-open-question-draft]");
    if (openDraft !== null) {
      this.listen(openDraft, "click", () => {
        this.questionDraftMessage = "";
        this.questionDraft = this.createEmptyDraft();
        this.renderView();
      });
    }

    const cancelDraft = this.query<HTMLButtonElement>("[data-cancel-question-draft]");
    if (cancelDraft !== null) {
      this.listen(cancelDraft, "click", () => {
        if (!this.isSavingQuestion) {
          this.cancelQuestionDraft();
        }
      });
    }

    const saveDraft = this.query<HTMLButtonElement>("[data-save-question-draft]");
    if (saveDraft !== null) {
      this.listen(saveDraft, "click", () => {
        void this.saveQuestionDraft();
      });
    }

    const addProposition = this.query<HTMLButtonElement>("[data-add-proposition]");
    if (addProposition !== null) {
      this.listen(addProposition, "click", () => {
        this.syncQuestionDraftFromDom();
        this.addPropositionToDraft();
      });
    }

    this.queryAll<HTMLButtonElement>("[data-remove-proposition]").forEach((button) => {
      this.listen(button, "click", () => {
        const propositionId = button.dataset.removeProposition;
        if (propositionId !== undefined) {
          this.syncQuestionDraftFromDom();
          this.removePropositionFromDraft(propositionId);
        }
      });
    });

    this.queryAll<HTMLInputElement>("[data-proposition-correct]").forEach((input) => {
      this.listen(input, "change", () => {
        const propositionId = input.dataset.propositionCorrect;
        if (propositionId === undefined) {
          return;
        }

        this.syncQuestionDraftFromDom();
        this.setPropositionCorrect(propositionId, input.checked);
      });
    });
  }

  private createEmptyDraft(): QuestionDraft {
    return {
      questionId: null,
      label: "",
      propositions: [
        this.createDraftProposition(),
        this.createDraftProposition()
      ]
    };
  }

  private createDraftFromQuestion(question: QuizQuestionFull): QuestionDraft {
    return {
      questionId: question.id,
      label: question.label,
      propositions: question.options.map((option) => ({
        id: `prop-${option.id}`,
        label: option.label,
        isCorrect: option.isCorrect
      }))
    };
  }

  private createDraftProposition(): DraftProposition {
    return {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: "",
      isCorrect: false
    };
  }

  private cancelQuestionDraft(): void {
    this.questionDraft = null;
    this.questionDraftMessage = "";
    this.renderView();
  }

  private addPropositionToDraft(): void {
    if (this.questionDraft === null) {
      return;
    }

    this.questionDraft.propositions.push(this.createDraftProposition());
    this.renderView();
  }

  private removePropositionFromDraft(propositionId: string): void {
    if (this.questionDraft === null || this.questionDraft.propositions.length <= 2) {
      return;
    }

    this.questionDraft.propositions = this.questionDraft.propositions.filter(
      (proposition) => proposition.id !== propositionId
    );
    this.renderView();
  }

  private setPropositionCorrect(propositionId: string, isCorrect: boolean): void {
    if (this.questionDraft === null) {
      return;
    }

    const proposition = this.questionDraft.propositions.find((item) => item.id === propositionId);
    if (proposition !== undefined) {
      proposition.isCorrect = isCorrect;
    }

    this.renderView();
  }

  private syncQuestionDraftFromDom(): void {
    if (this.questionDraft === null) {
      return;
    }

    const labelInput = this.query<HTMLInputElement>("[data-question-draft-label]");
    if (labelInput !== null) {
      this.questionDraft.label = labelInput.value;
    }

    this.questionDraft.propositions.forEach((proposition) => {
      const labelField = this.query<HTMLInputElement>(`[data-proposition-label="${proposition.id}"]`);
      if (labelField !== null) {
        proposition.label = labelField.value;
      }

      const correctField = this.query<HTMLInputElement>(`[data-proposition-correct="${proposition.id}"]`);
      if (correctField !== null) {
        proposition.isCorrect = correctField.checked;
      }
    });
  }

  private async saveQuestionDraft(): Promise<void> {
    if (this.questionDraft === null || this.selectedQuestionnaireId === null || this.isSavingQuestion) {
      return;
    }

    this.syncQuestionDraftFromDom();
    const validationMessage = this.validateQuestionDraft(this.questionDraft);
    if (validationMessage !== null) {
      this.questionDraftMessage = validationMessage;
      this.renderView();
      return;
    }

    const draft = this.questionDraft;
    const quizId = this.selectedQuestionnaireId;
    const isEditing = draft.questionId !== null;

    this.isSavingQuestion = true;
    this.questionDraftMessage = "";
    this.renderView();

    try {
      const questionType = this.inferQuestionType(draft);
      const options = draft.propositions.map((proposition) => ({
        label: proposition.label.trim(),
        isCorrect: proposition.isCorrect
      }));

      if (isEditing && draft.questionId !== null) {
        await this.services.teacherQuizzes.updateQuestion(quizId, draft.questionId, {
          label: draft.label.trim(),
          type: questionType,
          options
        });
      } else {
        const questions = this.selectedQuizDetail !== null
          ? this.getDetailQuestions(this.selectedQuizDetail)
          : [];
        await this.services.teacherQuizzes.addQuestion(quizId, {
          label: draft.label.trim(),
          type: questionType,
          orderIndex: this.getNextOrderIndex(questions),
          options
        });
      }

      this.selectedQuizDetail = await this.services.teacherQuizzes.getQuizDetail(quizId);
      this.questionnaires = this.questionnaires.map((item) => (
        item.id === quizId
          ? { ...item, questionCount: this.selectedQuizDetail?.questionCount ?? item.questionCount }
          : item
      ));
      this.questionDraft = null;
      this.questionDraftMessage = "";
    } catch (error) {
      this.questionDraftMessage = error instanceof Error
        ? error.message
        : "Enregistrement impossible.";
    } finally {
      this.isSavingQuestion = false;
      this.renderView();
    }
  }

  private validateQuestionDraft(draft: QuestionDraft): string | null {
    const label = draft.label.trim();
    if (label.length === 0) {
      return "La question est obligatoire.";
    }

    if (label.length > 255) {
      return "La question ne peut pas depasser 255 caracteres.";
    }

    if (draft.propositions.length < 2) {
      return "Ajoutez au moins deux propositions.";
    }

    const correctCount = draft.propositions.filter((proposition) => proposition.isCorrect).length;
    if (correctCount === 0) {
      return "Selectionnez au moins une bonne reponse.";
    }

    for (const proposition of draft.propositions) {
      const propositionLabel = proposition.label.trim();
      if (propositionLabel.length === 0) {
        return "Chaque proposition doit avoir un libelle.";
      }
      if (propositionLabel.length > 255) {
        return "Une proposition ne peut pas depasser 255 caracteres.";
      }
    }

    return null;
  }

  private inferQuestionType(draft: QuestionDraft): Extract<QuizQuestionType, "radio" | "checkbox"> {
    const correctCount = draft.propositions.filter((proposition) => proposition.isCorrect).length;
    return correctCount === 1 ? "radio" : "checkbox";
  }

  private getNextOrderIndex(questions: QuizQuestionFull[]): number {
    if (questions.length === 0) {
      return 0;
    }

    return Math.max(...questions.map((question) => question.orderIndex)) + 1;
  }

  private getNextQuestionDisplayNumber(questions: QuizQuestionFull[]): number {
    return this.getNextOrderIndex(questions) + 1;
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
          if (!this.isDeleting) {
            this.closeDeleteModal();
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
    this.openMenuQuestionId = null;
    this.selectedQuestionnaireId = id;
    this.selectedQuizDetail = null;
    this.questionDraft = null;
    this.questionDraftMessage = "";
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

  private async confirmDelete(): Promise<void> {
    if (this.deleteTarget === null || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.listMessage = "";
    this.renderView();

    try {
      if (this.deleteTarget.kind === "questionnaire") {
        const targetId = this.deleteTarget.id;
        await this.services.teacherQuizzes.deleteQuiz(targetId);
        this.questionnaires = this.questionnaires.filter((item) => item.id !== targetId);
        if (this.selectedQuestionnaireId === targetId) {
          this.selectedQuestionnaireId = null;
          this.selectedQuizDetail = null;
          this.questionDraft = null;
          this.questionDraftMessage = "";
        }
      } else {
        const quizId = this.selectedQuestionnaireId;
        if (quizId === null) {
          return;
        }

        await this.services.teacherQuizzes.deleteQuestion(quizId, this.deleteTarget.questionId);
        this.selectedQuizDetail = await this.services.teacherQuizzes.getQuizDetail(quizId);
        this.questionnaires = this.questionnaires.map((item) => (
          item.id === quizId
            ? { ...item, questionCount: this.selectedQuizDetail?.questionCount ?? item.questionCount }
            : item
        ));
        this.openMenuQuestionId = null;
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
            ${this.questionnaireMenuTemplate(selected.id)}
          </div>
        `}
      </header>
      ${this.listMessage.length > 0 && !this.isQuestionnaireModalOpen && this.deleteTarget === null ? `
        <p class="list-message">${escapeHtml(this.listMessage)}</p>
      ` : ""}
      ${selected === null ? this.questionnaireListTemplate() : this.questionnaireDetailTemplate(selected)}
      ${this.isQuestionnaireModalOpen ? this.questionnaireModalTemplate() : ""}
      ${this.deleteTarget !== null ? this.deleteModalTemplate() : ""}
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

    return `
      <article class="questionnaire-card">
        <div class="questionnaire-card-menu-wrap">
          ${this.questionnaireMenuTemplate(questionnaire.id)}
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
                <span class="questionnaire-status">${escapeHtml(this.formatStatus(questionnaire.status))}</span>
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

  private questionnaireMenuTemplate(questionnaireId: number): string {
    const isOpen = this.openMenuQuestionnaireId === questionnaireId;

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
          <button
            class="questionnaire-menu-item questionnaire-menu-item-disabled"
            type="button"
            data-menu-action="submit"
            role="menuitem"
            disabled
            aria-disabled="true"
            title="Bientot disponible"
          >
            Soumettre
          </button>
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

  private deleteModalTemplate(): string {
    if (this.deleteTarget === null) {
      return "";
    }

    const isQuestion = this.deleteTarget.kind === "question";
    const title = isQuestion ? "Supprimer cette question ?" : "Supprimer ce questionnaire ?";
    const copy = isQuestion
      ? `La question <strong>${escapeHtml(this.deleteTarget.kind === "question" ? this.deleteTarget.label : "")}</strong> sera supprimee. Cette action est irreversible.`
      : `Le questionnaire <strong>${escapeHtml(this.deleteTarget.kind === "questionnaire" ? this.deleteTarget.title : "")}</strong> sera supprime avec toutes ses questions. Cette action est irreversible.`;

    return `
      <div class="create-modal delete-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-target-title">
          <header class="modal-header">
            <div>
              <p>Suppression</p>
              <h2 id="delete-target-title">${title}</h2>
            </div>
            <button class="modal-close" type="button" data-close-delete-modal aria-label="Fermer" ${this.isDeleting ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="delete-modal-copy">${copy}</p>
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
    const askAdmin = this.getAskAdmin(questionnaire);
    const questions = this.getDetailQuestions(questionnaire);

    return `
      <section class="detail-panel">
        <div class="detail-top">
          <article class="detail-stat">
            <span>Statut</span>
            <strong>${escapeHtml(this.formatStatus(questionnaire.status))}</strong>
          </article>
          <article class="detail-stat">
            <span>Questions</span>
            <strong>${questionnaire.questionCount}</strong>
          </article>
          <article class="detail-stat">
            <span>Creation</span>
            <strong>${escapeHtml(this.formatCreatedAt(questionnaire.createdAt))}</strong>
          </article>
          <article class="detail-stat">
            <span>Soumission</span>
            <strong>${askAdmin ? "Soumis" : "Non soumis"}</strong>
          </article>
        </div>
        ${description.length > 0 ? `<p class="detail-description">${escapeHtml(description)}</p>` : ""}
        ${this.questionsSectionTemplate(questions)}
      </section>
    `;
  }

  private getDetailQuestions(questionnaire: QuestionnaireView): QuizQuestionFull[] {
    if ("questions" in questionnaire && Array.isArray(questionnaire.questions)) {
      return [...questionnaire.questions].sort((left, right) => right.orderIndex - left.orderIndex);
    }

    return [];
  }

  private questionsSectionTemplate(questions: QuizQuestionFull[]): string {
    if (this.isLoadingDetail) {
      return `<p class="questions-loading">Chargement des questions...</p>`;
    }

    const nextQuestionNumber = this.getNextQuestionDisplayNumber(questions);
    const isCreatingQuestion = this.questionDraft !== null && this.questionDraft.questionId === null;
    const editingQuestionId = this.questionDraft?.questionId ?? null;

    return `
      <section class="questions-panel">
        <header class="questions-header">
          <div>
            <p>Contenu</p>
            <h2>Questions</h2>
          </div>
          <span class="questions-count">${questions.length}</span>
        </header>
        ${this.questionDraft === null ? `
          <button class="add-question-button" type="button" data-open-question-draft>
            ${icon("plus")} Ajouter une question
          </button>
        ` : isCreatingQuestion ? this.questionDraftTemplate(nextQuestionNumber) : ""}
        ${questions.length === 0 && this.questionDraft === null ? `
          <article class="questions-empty">
            ${icon("file")}
            <div>
              <h3>Aucune question pour le moment</h3>
              <p>Ajoutez votre premiere question avec le bouton ci-dessus.</p>
            </div>
          </article>
        ` : `
          <ol class="questions-list">
            ${questions.map((question) => (
              editingQuestionId === question.id
                ? `<li class="question-item question-item-editing">${this.questionDraftTemplate(question.orderIndex + 1)}</li>`
                : this.questionItemTemplate(question)
            )).join("")}
          </ol>
        `}
      </section>
    `;
  }

  private questionDraftTemplate(displayNumber: number): string {
    if (this.questionDraft === null) {
      return "";
    }

    const draft = this.questionDraft;
    const isEditing = draft.questionId !== null;

    return `
      <article class="question-draft">
        <div class="question-item-head">
          <span class="question-index question-index-draft">${displayNumber}</span>
          <div class="question-copy">
            <p class="question-draft-label">${isEditing ? "Modifier la question" : "Nouvelle question"}</p>
            <label class="question-draft-field">
              <span>Question</span>
              <input
                type="text"
                data-question-draft-label
                value="${escapeHtml(draft.label)}"
                placeholder="Saisissez l'enonce de la question"
                maxlength="255"
                ${this.isSavingQuestion ? "disabled" : ""}
              >
            </label>
          </div>
        </div>
        <div class="question-draft-propositions">
          <p class="question-draft-propositions-title">Propositions</p>
          <ul class="question-draft-options">
            ${draft.propositions.map((proposition) => this.propositionDraftTemplate(proposition)).join("")}
          </ul>
          <button
            class="add-proposition-button"
            type="button"
            data-add-proposition
            ${this.isSavingQuestion ? "disabled" : ""}
          >
            ${icon("plus")} Ajouter une proposition
          </button>
        </div>
        ${this.questionDraftMessage.length > 0 ? `
          <p class="question-draft-message">${escapeHtml(this.questionDraftMessage)}</p>
        ` : ""}
        <div class="question-draft-actions">
          <button
            class="question-draft-cancel"
            type="button"
            data-cancel-question-draft
            ${this.isSavingQuestion ? "disabled" : ""}
          >
            Annuler
          </button>
          <button
            class="question-draft-save"
            type="button"
            data-save-question-draft
            ${this.isSavingQuestion ? "disabled" : ""}
          >
            ${this.isSavingQuestion
              ? "Enregistrement..."
              : (isEditing ? `${icon("check")} Valider` : `${icon("check")} Enregistrer`)}
          </button>
        </div>
      </article>
    `;
  }

  private propositionDraftTemplate(proposition: DraftProposition): string {
    const canRemove = this.questionDraft !== null && this.questionDraft.propositions.length > 2;

    return `
      <li class="question-draft-option">
        <label class="question-draft-correct" title="Bonne reponse">
          <input
            type="checkbox"
            data-proposition-correct="${proposition.id}"
            ${proposition.isCorrect ? "checked" : ""}
            ${this.isSavingQuestion ? "disabled" : ""}
          >
          <span class="question-draft-correct-label">Bonne reponse</span>
        </label>
        <input
          type="text"
          class="question-draft-option-input"
          data-proposition-label="${proposition.id}"
          value="${escapeHtml(proposition.label)}"
          placeholder="Libelle de la proposition"
          maxlength="255"
          ${this.isSavingQuestion ? "disabled" : ""}
        >
        <button
          class="question-draft-remove"
          type="button"
          data-remove-proposition="${proposition.id}"
          aria-label="Supprimer la proposition"
          ${!canRemove || this.isSavingQuestion ? "disabled" : ""}
        >
          ${icon("trash")}
        </button>
      </li>
    `;
  }

  private questionItemTemplate(question: QuizQuestionFull): string {
    const displayIndex = question.orderIndex + 1;

    return `
      <li class="question-item">
        <div class="question-item-menu-wrap">
          ${this.questionMenuTemplate(question.id)}
        </div>
        <div class="question-item-head">
          <span class="question-index">${displayIndex}</span>
          <div class="question-copy">
            <h3>${escapeHtml(question.label)}</h3>
            <span class="question-type">${escapeHtml(this.formatQuestionType(question.type))}</span>
          </div>
        </div>
        <ul class="question-options">
          ${question.options.map((option) => `
            <li class="question-option${option.isCorrect ? " question-option-correct" : ""}">
              ${option.isCorrect ? icon("check") : ""}
              <span>${escapeHtml(option.label)}</span>
            </li>
          `).join("")}
        </ul>
      </li>
    `;
  }

  private questionMenuTemplate(questionId: number): string {
    const isOpen = this.openMenuQuestionId === questionId;

    return `
      <button
        class="questionnaire-menu-trigger"
        type="button"
        data-menu-question-id="${questionId}"
        aria-label="Actions de la question"
        aria-expanded="${isOpen ? "true" : "false"}"
      >
        ${icon("moreVertical")}
      </button>
      ${isOpen ? `
        <div class="questionnaire-menu" role="menu">
          <button
            class="questionnaire-menu-item"
            type="button"
            data-edit-question-id="${questionId}"
            role="menuitem"
          >
            Modifier
          </button>
          <button
            class="questionnaire-menu-item questionnaire-menu-item-danger"
            type="button"
            data-delete-question-id="${questionId}"
            role="menuitem"
          >
            Supprimer
          </button>
        </div>
      ` : ""}
    `;
  }

  private formatQuestionType(type: QuizQuestionType): string {
    switch (type) {
      case "radio":
        return "Choix unique";
      case "select":
        return "Liste deroulante";
      case "checkbox":
        return "Cases a cocher";
      default:
        return type;
    }
  }

  private getAskAdmin(questionnaire: QuestionnaireView): boolean {
    return "askAdmin" in questionnaire ? questionnaire.askAdmin : false;
  }

  private formatStatus(status: QuizStatus): string {
    return status === "public" ? "Public" : "Prive";
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
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
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

      :host .delete-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .delete-modal-copy strong {
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

      :host .questions-loading {
        margin: 0;
        padding: 18px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        color: rgba(250, 249, 246, 0.58);
        text-align: center;
      }

      :host .questions-panel {
        margin-top: 4px;
      }

      :host .questions-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      :host .questions-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .questions-header h2 {
        margin: 0;
        color: #fff;
        font-size: 1.35rem;
      }

      :host .questions-count {
        min-width: 38px;
        min-height: 38px;
        display: grid;
        place-items: center;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .questions-empty {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .questions-empty .icon {
        width: 34px;
        height: 34px;
        color: var(--matheo-gold);
        flex: none;
      }

      :host .questions-empty h3 {
        margin: 0 0 6px;
        color: #fff;
        font-size: 1.05rem;
      }

      :host .questions-empty p {
        margin: 0;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .questions-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      :host .question-item {
        position: relative;
        padding: 16px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host .question-item-editing {
        padding: 0;
        background: transparent;
      }

      :host .question-item-editing .question-draft {
        margin: 0;
      }

      :host .question-item:has(.questionnaire-menu-trigger[aria-expanded="true"]) {
        z-index: 4;
      }

      :host .question-item-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 3;
      }

      :host .question-item-head {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        margin-bottom: 12px;
        padding-right: 44px;
      }

      :host .question-index {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-weight: 900;
        flex: none;
      }

      :host .question-copy {
        min-width: 0;
      }

      :host .question-copy h3 {
        margin: 0 0 8px;
        color: #fff;
        font-size: 1rem;
        line-height: 1.45;
      }

      :host .question-type {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.68);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      :host .question-options {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      :host .question-option {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 0 12px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        color: rgba(250, 249, 246, 0.78);
      }

      :host .question-option .icon {
        width: 16px;
        height: 16px;
        flex: none;
        opacity: 0;
      }

      :host .question-option-correct {
        background: rgba(124, 242, 154, 0.12);
        color: #d9ffe4;
      }

      :host .question-option-correct .icon {
        opacity: 1;
        color: #7cf29a;
      }

      :host .add-question-button {
        width: 100%;
        margin-bottom: 16px;
      }

      :host .question-draft {
        margin-bottom: 16px;
        padding: 16px;
        border: 1px solid rgba(212, 175, 55, 0.42);
        border-radius: 12px;
        background: rgba(212, 175, 55, 0.08);
      }

      :host .question-index-draft {
        background: rgba(212, 175, 55, 0.24);
        color: #fff;
      }

      :host .question-draft-label {
        margin: 0 0 10px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .question-draft-field {
        display: grid;
        gap: 7px;
      }

      :host .question-draft-field span,
      :host .question-draft-propositions-title {
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .question-draft-field input,
      :host .question-draft-option-input {
        width: 100%;
        min-height: 44px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .question-draft-propositions {
        display: grid;
        gap: 10px;
      }

      :host .question-draft-propositions-title {
        margin: 0;
      }

      :host .question-draft-options {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      :host .question-draft-option {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
      }

      :host .question-draft-correct {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }

      :host .question-draft-correct-label {
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.72rem;
        font-weight: 800;
        white-space: nowrap;
      }

      :host .question-draft-correct input {
        width: 18px;
        height: 18px;
        accent-color: var(--matheo-gold);
      }

      :host .question-draft-remove {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.14);
        color: #fecaca;
        cursor: pointer;
      }

      :host .question-draft-remove:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      :host .question-draft-remove:not(:disabled):hover {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .add-proposition-button {
        justify-self: start;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        color: rgba(250, 249, 246, 0.82);
        font-weight: 800;
        cursor: pointer;
      }

      :host .add-proposition-button:hover:not(:disabled) {
        background: rgba(212, 175, 55, 0.12);
        color: #fff;
      }

      :host .question-draft-message {
        margin: 12px 0 0;
        color: var(--matheo-danger);
      }

      :host .question-draft-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      :host .question-draft-cancel {
        min-height: 44px;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.82);
        font-weight: 800;
        cursor: pointer;
      }

      :host .question-draft-save {
        min-height: 44px;
        padding: 0 16px;
        border: 0;
        border-radius: 10px;
        font-weight: 900;
        cursor: pointer;
      }

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
