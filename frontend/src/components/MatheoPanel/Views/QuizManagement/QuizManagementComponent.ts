import { BaseComponent } from "../../../BaseComponent.js";
import type {
  QuestionnaireDeleteTarget,
  QuestionnaireModalMode,
  QuestionnaireView,
  QuizManagementTemplateData,
  SubmitTarget
} from "../../../../models/components/QuizManagement.js";
import {
  CONFIRMATION_MODAL_ACTION_EVENT,
  type ConfirmationModalActionDetail,
  type ConfirmationModalConfig
} from "../../../../models/components/ConfirmationModal.js";
import type { QuizQuestionsSectionConfig } from "../../../../models/components/QuizQuestionsSection.js";
import type { QuizDetail, QuizQuestionFull, QuizSummary } from "../../../../models/Quiz.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import {
  QuizQuestionsSectionController
} from "../shared/QuizQuestionsSection.js";
import { ConfirmationModalComponent } from "../../../Shared/ConfirmationModal/ConfirmationModalComponent.js";
import { bindFloatingTopButton } from "../../../Shared/FloatingTopButton/FloatingTopButton.js";
import { buildQuizManagementConfirmationConfigs } from "./utils/QuizManagement.confirmations.js";
import {
  buildCreateQuestionnaireRequest,
  buildUpdateQuestionnaireRequest,
  readQuestionnaireForm
} from "./utils/QuizManagement.form.js";
import {
  canSubmitQuestionnaire,
  getQuestionnaireQuestions,
  isSubmissionPending,
  toQuestionnaireSummary
} from "./utils/QuizManagement.rules.js";
import { quizManagementStyles } from "./styles/QuizManagementComponent.styles.js";
import {
  quizManagementLoadingTemplate,
  quizManagementViewTemplate
} from "./templates/QuizManagementComponent.template.js";

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
  private readonly confirmationModals: ConfirmationModalComponent[] = [];

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-quiz-management-view");
  }

  public init(): void {
    this.render(quizManagementLoadingTemplate(), quizManagementStyles());
    void this.load();
  }

  public override destroy(): void {
    this.clearConfirmationModals();
    super.destroy();
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
        if (questionnaire === null || !canSubmitQuestionnaire(questionnaire)) {
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
        if (questionnaire === null || !isSubmissionPending(questionnaire)) {
          return;
        }

        void this.cancelSubmissionQuestionnaire(id);
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
        this.questionsSection.deleteTarget = null;
        this.deleteTarget = { id: questionnaire.id, title: questionnaire.title };
        this.listMessage = "";
        this.renderView();
      });
    });

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
    bindFloatingTopButton(
      this.root,
      (target, type, listener) => this.listen(target, type, listener),
      "#quiz-management-top"
    );
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
    const questions = questionnaire !== null ? getQuestionnaireQuestions(questionnaire) : [];

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

        this.closeQuestionnaireModal();
      });
    });
  }

  private mountConfirmationModals(): void {
    const host = this.query<HTMLElement>("[data-confirmation-modals]");
    if (host === null) {
      return;
    }

    this.buildConfirmationModalConfigs().forEach((config) => {
      this.mountConfirmationModal(host, config);
    });
  }

  private buildConfirmationModalConfigs(): ConfirmationModalConfig[] {
    return buildQuizManagementConfirmationConfigs({
      submitTarget: this.submitTarget,
      deleteTarget: this.deleteTarget,
      listMessage: this.listMessage,
      isSubmittingQuestionnaire: this.isSubmittingQuestionnaire(),
      isDeletingQuestionnaire: this.isDeleting,
      questionDeleteConfig: this.questionsSection.getDeleteConfirmationConfig()
    });
  }

  private mountConfirmationModal(host: HTMLElement, config: ConfirmationModalConfig): void {
    const container = document.createElement("div");
    host.append(container);

    const modal = new ConfirmationModalComponent(container, config);
    this.confirmationModals.push(modal);
    this.listenTo(container, CONFIRMATION_MODAL_ACTION_EVENT, (event) => {
      const detail = (event as CustomEvent<ConfirmationModalActionDetail>).detail;
      this.handleConfirmationModalAction(detail);
    });
    modal.init();
  }

  private handleConfirmationModalAction(detail: ConfirmationModalActionDetail): void {
    if (detail.modalId === "submit-questionnaire") {
      if (detail.action === "confirm") {
        void this.confirmSubmitQuestionnaire();
      } else {
        this.closeSubmitModal();
      }
      return;
    }

    if (detail.modalId === "delete-questionnaire") {
      if (detail.action === "confirm") {
        void this.confirmDeleteQuestionnaire();
      } else if (!this.isDeleting) {
        this.closeDeleteModal();
      }
      return;
    }

    if (detail.modalId === "delete-question") {
      if (detail.action === "confirm" && this.selectedQuestionnaireId !== null) {
        void this.questionsSection.confirmDelete(
          this.buildQuestionsSectionConfig(),
          () => {
            this.renderView();
          }
        );
      } else if (!this.questionsSection.isDeletingQuestion) {
        this.questionsSection.closeDeleteModal(() => {
          this.renderView();
        });
      }
    }
  }

  private clearConfirmationModals(): void {
    while (this.confirmationModals.length > 0) {
      this.confirmationModals.pop()?.destroy();
    }
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

  private closeDeleteModal(): void {
    this.deleteTarget = null;
    this.renderView();
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
    const result = readQuestionnaireForm(form);
    if (!result.ok) {
      this.listMessage = result.message;
      this.renderView();
      return;
    }

    this.isSavingQuestionnaire = true;
    this.renderView();

    try {
      const created = await this.services.teacherQuizzes.createQuiz(
        buildCreateQuestionnaireRequest(result.values)
      );

      const summary = toQuestionnaireSummary(created);
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

    const result = readQuestionnaireForm(form);
    if (!result.ok) {
      this.listMessage = result.message;
      this.renderView();
      return;
    }

    const quizId = this.editingQuestionnaireId;
    this.isSavingQuestionnaire = true;
    this.renderView();

    try {
      const updated = await this.services.teacherQuizzes.updateQuiz(
        quizId,
        buildUpdateQuestionnaireRequest(result.values)
      );

      this.questionnaires = this.questionnaires.map((item) => (
        item.id === quizId ? toQuestionnaireSummary(updated) : item
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
    this.clearConfirmationModals();
    this.render(quizManagementViewTemplate(this.templateData()), quizManagementStyles());
    this.bindEvents();
    this.mountConfirmationModals();
  }

  private templateData(): QuizManagementTemplateData {
    const selected = this.getSelectedQuestionnaire();
    const editingQuestionnaire = this.editingQuestionnaireId === null
      ? null
      : this.findQuestionnaireById(this.editingQuestionnaireId);

    return {
      selected,
      questionnaires: this.questionnaires,
      openMenuQuestionnaireId: this.openMenuQuestionnaireId,
      isQuestionnaireModalOpen: this.isQuestionnaireModalOpen,
      questionnaireModalMode: this.questionnaireModalMode,
      editingQuestionnaire,
      isSavingQuestionnaire: this.isSavingQuestionnaire,
      isDeleting: this.isDeleting,
      listMessage: this.questionsSection.deleteTarget === null ? this.listMessage : "",
      deleteTarget: this.deleteTarget,
      submitTarget: this.submitTarget,
      isSubmittingQuestionnaire: this.isSubmittingQuestionnaire(),
      cancellingSubmissionQuestionnaireId: this.cancellingSubmissionQuestionnaireId,
      questionsSectionHtml: selected === null ? "" : this.questionsSection.render(this.buildQuestionsSectionConfig()),
      showFloatingTopButton: selected !== null
    };
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
}
