import type {
  QuizQuestionFull,
  QuizQuestionType
} from "../../../../models/Quiz.js";
import type {
  DraftProposition,
  QuestionDraft,
  QuizQuestionsSectionBindContext,
  QuizQuestionsSectionConfig,
  QuizQuestionsSectionFeatures
} from "../../../../models/components/QuizQuestionsSection.js";
import type { ConfirmationModalConfig } from "../../../../models/components/ConfirmationModal.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class QuizQuestionsSectionController {
  public questionDraft: QuestionDraft | null = null;
  public questionDraftMessage = "";
  public openMenuQuestionId: number | null = null;
  public deleteTarget: { questionId: number; label: string } | null = null;
  public isSavingQuestion = false;
  public isDeletingQuestion = false;

  public reset(): void {
    this.questionDraft = null;
    this.questionDraftMessage = "";
    this.openMenuQuestionId = null;
    this.deleteTarget = null;
    this.isSavingQuestion = false;
    this.isDeletingQuestion = false;
  }

  public render(config: QuizQuestionsSectionConfig): string {
    if (config.isLoading) {
      return `<p class="questions-loading">Chargement des questions...</p>`;
    }

    const questions = this.sortQuestions(config.questions);
    const nextQuestionNumber = this.getNextQuestionDisplayNumber(questions);
    const isCreatingQuestion = this.questionDraft !== null && this.questionDraft.questionId === null;
    const editingQuestionId = this.questionDraft?.questionId ?? null;
    const showAddButton = config.features.canAdd && this.questionDraft === null;

    return `
      <section class="questions-panel">
        <header class="questions-header">
          <div>
            <p>Contenu</p>
            <h2>Questions</h2>
          </div>
          <span class="questions-count">${questions.length}</span>
        </header>
        ${showAddButton ? `
          <button class="add-question-button" type="button" data-open-question-draft>
            ${icon("plus")} Ajouter une question
          </button>
        ` : (isCreatingQuestion ? this.questionDraftTemplate(nextQuestionNumber) : "")}
        ${questions.length === 0 && this.questionDraft === null ? `
          <article class="questions-empty">
            ${icon("file")}
            <div>
              <h3>${escapeHtml(config.emptyState.title)}</h3>
              <p>${escapeHtml(config.emptyState.description)}</p>
            </div>
          </article>
        ` : `
          <ol class="questions-list">
            ${questions.map((question) => (
              editingQuestionId === question.id
                ? `<li class="question-item question-item-editing">${this.questionDraftTemplate(question.orderIndex + 1)}</li>`
                : this.questionItemTemplate(question, config.features)
            )).join("")}
          </ol>
        `}
      </section>
    `;
  }

  public getDeleteConfirmationConfig(): ConfirmationModalConfig | null {
    if (this.deleteTarget === null) {
      return null;
    }

    return {
      id: "delete-question",
      eyebrow: "Suppression",
      title: "Supprimer cette question ?",
      bodyHtml: `
        <p>
          La question <strong>${escapeHtml(this.deleteTarget.label)}</strong> sera supprimée.
          Cette action est irréversible.
        </p>
      `,
      isProcessing: this.isDeletingQuestion,
      overlayClass: "delete-modal question-delete-modal",
      confirmAction: {
        label: "Supprimer",
        processingLabel: "Suppression...",
        iconName: "trash",
        variant: "danger"
      }
    };
  }

  public bindEvents(context: QuizQuestionsSectionBindContext, config: QuizQuestionsSectionConfig): void {
    const { root, listen, onRender } = context;
    const query = <T extends HTMLElement>(selector: string): T | null =>
      root.querySelector<T>(selector);
    const queryAll = <T extends HTMLElement>(selector: string): T[] =>
      Array.from(root.querySelectorAll<T>(selector));

    queryAll<HTMLButtonElement>("[data-menu-question-id]").forEach((button) => {
      listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuQuestionId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuQuestionId = this.openMenuQuestionId === id ? null : id;
          onRender();
        }
      });
    });

    queryAll<HTMLButtonElement>("[data-edit-question-id]").forEach((button) => {
      listen(button, "click", (event) => {
        event.stopPropagation();
        if (!config.features.canEdit) {
          return;
        }

        const questionId = Number.parseInt(button.dataset.editQuestionId ?? "", 10);
        const question = config.findQuestionById(questionId);
        if (question === null) {
          return;
        }

        this.openMenuQuestionId = null;
        this.questionDraftMessage = "";
        this.questionDraft = this.createDraftFromQuestion(question);
        onRender();
      });
    });

    queryAll<HTMLButtonElement>("[data-delete-question-id]").forEach((button) => {
      listen(button, "click", (event) => {
        event.stopPropagation();
        if (!config.features.canDelete) {
          return;
        }

        const questionId = Number.parseInt(button.dataset.deleteQuestionId ?? "", 10);
        const question = config.findQuestionById(questionId);
        if (question === null) {
          return;
        }

        this.openMenuQuestionId = null;
        this.deleteTarget = { questionId: question.id, label: question.label };
        onRender();
      });
    });

    if (this.openMenuQuestionId !== null) {
      listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = queryAll<HTMLElement>(".question-item-menu-wrap");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuQuestionId = null;
          onRender();
        }
      });
    }

    const openDraft = query<HTMLButtonElement>("[data-open-question-draft]");
    if (openDraft !== null) {
      listen(openDraft, "click", () => {
        this.questionDraftMessage = "";
        this.questionDraft = this.createEmptyDraft();
        onRender();
      });
    }

    const cancelDraft = query<HTMLButtonElement>("[data-cancel-question-draft]");
    if (cancelDraft !== null) {
      listen(cancelDraft, "click", () => {
        if (!this.isSavingQuestion) {
          this.cancelQuestionDraft(onRender);
        }
      });
    }

    const saveDraft = query<HTMLButtonElement>("[data-save-question-draft]");
    if (saveDraft !== null) {
      listen(saveDraft, "click", () => {
        void this.saveQuestionDraft(root, config, onRender);
      });
    }

    queryAll<HTMLInputElement>("[data-proposition-label]").forEach((input) => {
      listen(input, "input", () => {
        this.syncQuestionDraftFromDom(root);
      });
    });

    queryAll<HTMLInputElement>("[data-proposition-correct]").forEach((input) => {
      listen(input, "change", () => {
        this.syncQuestionDraftFromDom(root);
        const propositionId = input.dataset.propositionCorrect ?? "";
        this.setPropositionCorrect(propositionId, input.checked, onRender);
      });
    });

    const addProposition = query<HTMLButtonElement>("[data-add-proposition]");
    if (addProposition !== null) {
      listen(addProposition, "click", () => {
        this.addPropositionToDraft(onRender);
      });
    }

    queryAll<HTMLButtonElement>("[data-remove-proposition]").forEach((button) => {
      listen(button, "click", () => {
        const propositionId = button.dataset.removeProposition ?? "";
        this.removePropositionFromDraft(propositionId, onRender);
      });
    });
  }

  private sortQuestions(questions: QuizQuestionFull[]): QuizQuestionFull[] {
    return [...questions].sort((left, right) => right.orderIndex - left.orderIndex);
  }

  private questionItemTemplate(question: QuizQuestionFull, features: QuizQuestionsSectionFeatures): string {
    const displayIndex = question.orderIndex + 1;
    const showMenu = features.canEdit || features.canDelete;

    return `
      <li class="question-item">
        ${showMenu ? `
          <div class="question-item-menu-wrap">
            ${this.questionMenuTemplate(question.id, features)}
          </div>
        ` : ""}
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

  private questionMenuTemplate(questionId: number, features: QuizQuestionsSectionFeatures): string {
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
          ${features.canEdit ? `
            <button
              class="questionnaire-menu-item"
              type="button"
              data-edit-question-id="${questionId}"
              role="menuitem"
            >
              Modifier
            </button>
          ` : ""}
          ${features.canDelete ? `
            <button
              class="questionnaire-menu-item questionnaire-menu-item-danger"
              type="button"
              data-delete-question-id="${questionId}"
              role="menuitem"
            >
              Supprimer
            </button>
          ` : ""}
        </div>
      ` : ""}
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
                placeholder="Saisissez l'énoncé de la question"
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
        <label class="question-draft-correct" title="Bonne réponse">
          <input
            type="checkbox"
            data-proposition-correct="${proposition.id}"
            ${proposition.isCorrect ? "checked" : ""}
            ${this.isSavingQuestion ? "disabled" : ""}
          >
          <span class="question-draft-correct-label">Bonne réponse</span>
        </label>
        <input
          type="text"
          class="question-draft-option-input"
          data-proposition-label="${proposition.id}"
          value="${escapeHtml(proposition.label)}"
          placeholder="Libellé de la proposition"
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

  private cancelQuestionDraft(onRender: () => void): void {
    this.questionDraft = null;
    this.questionDraftMessage = "";
    onRender();
  }

  private addPropositionToDraft(onRender: () => void): void {
    if (this.questionDraft === null) {
      return;
    }

    this.questionDraft.propositions.push(this.createDraftProposition());
    onRender();
  }

  private removePropositionFromDraft(propositionId: string, onRender: () => void): void {
    if (this.questionDraft === null || this.questionDraft.propositions.length <= 2) {
      return;
    }

    this.questionDraft.propositions = this.questionDraft.propositions.filter(
      (proposition) => proposition.id !== propositionId
    );
    onRender();
  }

  private setPropositionCorrect(propositionId: string, isCorrect: boolean, onRender: () => void): void {
    if (this.questionDraft === null) {
      return;
    }

    const proposition = this.questionDraft.propositions.find((item) => item.id === propositionId);
    if (proposition !== undefined) {
      proposition.isCorrect = isCorrect;
    }

    onRender();
  }

  private syncQuestionDraftFromDom(root: HTMLElement): void {
    if (this.questionDraft === null) {
      return;
    }

    const labelInput = root.querySelector<HTMLInputElement>("[data-question-draft-label]");
    if (labelInput !== null) {
      this.questionDraft.label = labelInput.value;
    }

    this.questionDraft.propositions.forEach((proposition) => {
      const labelField = root.querySelector<HTMLInputElement>(`[data-proposition-label="${proposition.id}"]`);
      if (labelField !== null) {
        proposition.label = labelField.value;
      }

      const correctField = root.querySelector<HTMLInputElement>(`[data-proposition-correct="${proposition.id}"]`);
      if (correctField !== null) {
        proposition.isCorrect = correctField.checked;
      }
    });
  }

  private async saveQuestionDraft(
    root: HTMLElement,
    config: QuizQuestionsSectionConfig,
    onRender: () => void
  ): Promise<void> {
    if (this.questionDraft === null || this.isSavingQuestion) {
      return;
    }

    this.syncQuestionDraftFromDom(root);
    const validationMessage = this.validateQuestionDraft(this.questionDraft);
    if (validationMessage !== null) {
      this.questionDraftMessage = validationMessage;
      onRender();
      return;
    }

    const draft = this.questionDraft;
    const isEditing = draft.questionId !== null;

    this.isSavingQuestion = true;
    this.questionDraftMessage = "";
    onRender();

    try {
      const questionType = this.inferQuestionType(draft);
      const options = draft.propositions.map((proposition) => ({
        label: proposition.label.trim(),
        isCorrect: proposition.isCorrect
      }));

      if (isEditing && draft.questionId !== null) {
        await config.actions.updateQuestion(draft.questionId, {
          label: draft.label.trim(),
          type: questionType,
          options
        });
      } else if (config.actions.addQuestion !== undefined) {
        const questions = this.sortQuestions(config.questions);
        await config.actions.addQuestion({
          label: draft.label.trim(),
          type: questionType,
          orderIndex: this.getNextOrderIndex(questions),
          options
        });
      }

      this.questionDraft = null;
      this.questionDraftMessage = "";
      await config.onChanged();
    } catch (error) {
      this.questionDraftMessage = error instanceof Error
        ? error.message
        : "Enregistrement impossible.";
    } finally {
      this.isSavingQuestion = false;
      onRender();
    }
  }

  public async confirmDelete(config: QuizQuestionsSectionConfig, onRender: () => void): Promise<void> {
    if (this.deleteTarget === null || this.isDeletingQuestion) {
      return;
    }

    this.isDeletingQuestion = true;
    onRender();

    try {
      await config.actions.deleteQuestion(this.deleteTarget.questionId);
      this.deleteTarget = null;
      this.openMenuQuestionId = null;
      await config.onChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression impossible.";
      config.onError?.(message);
      this.deleteTarget = null;
    } finally {
      this.isDeletingQuestion = false;
      onRender();
    }
  }

  public closeDeleteModal(onRender: () => void): void {
    this.deleteTarget = null;
    onRender();
  }

  private validateQuestionDraft(draft: QuestionDraft): string | null {
    const label = draft.label.trim();
    if (label.length === 0) {
      return "La question est obligatoire.";
    }

    if (label.length > 255) {
      return "La question ne peut pas dépasser 255 caractères.";
    }

    if (draft.propositions.length < 2) {
      return "Ajoutez au moins deux propositions.";
    }

    const correctCount = draft.propositions.filter((proposition) => proposition.isCorrect).length;
    if (correctCount === 0) {
      return "Sélectionnez au moins une bonne réponse.";
    }

    for (const proposition of draft.propositions) {
      const propositionLabel = proposition.label.trim();
      if (propositionLabel.length === 0) {
        return "Chaque proposition doit avoir un libellé.";
      }
      if (propositionLabel.length > 255) {
        return "Une proposition ne peut pas dépasser 255 caractères.";
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

  private formatQuestionType(type: QuizQuestionType): string {
    switch (type) {
      case "radio":
        return "Choix unique";
      case "select":
        return "Liste déroulante";
      case "checkbox":
        return "Cases à cocher";
      default:
        return type;
    }
  }
}

export function quizQuestionsSectionStyles(): string {
  return `
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
  `;
}
