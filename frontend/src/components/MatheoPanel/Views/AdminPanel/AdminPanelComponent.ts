import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type {
  AdminSectionConfig,
  ReviewActionTarget
} from "../../../../models/components/AdminPanel.js";
import {
  CONFIRMATION_MODAL_ACTION_EVENT,
  type ConfirmationModalActionDetail,
  type ConfirmationModalConfig
} from "../../../../models/components/ConfirmationModal.js";
import type { QuizQuestionsSectionConfig } from "../../../../models/components/QuizQuestionsSection.js";
import type {
  QuizDetail,
  QuizQuestionFull,
  QuizSummary
} from "../../../../models/Quiz.js";
import { QuizQuestionsSectionController } from "../shared/QuizQuestionsSection.js";
import { ConfirmationModalComponent } from "../../../Shared/ConfirmationModal/ConfirmationModalComponent.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { adminPanelStyles } from "./AdminPanelComponent.styles.js";
import {
  adminPanelLoadingTemplate,
  adminPanelViewTemplate
} from "./AdminPanelComponent.template.js";

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
  private readonly confirmationModals: ConfirmationModalComponent[] = [];

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
    this.render(adminPanelLoadingTemplate(), adminPanelStyles());
    void this.load();
  }

  public override destroy(): void {
    this.clearConfirmationModals();
    super.destroy();
  }

  protected bindEvents(): void {
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

    this.queryAll<HTMLButtonElement>("[data-unpublish-quiz-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        this.openReviewAction("unpublish", button.dataset.unpublishQuizId ?? "");
      });
    });

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
      this.openPendingQuizFromStorage();
    }
  }

  private openPendingQuizFromStorage(): void {
    const pendingQuizId = window.sessionStorage.getItem("matheopolis.admin.openQuizId");
    if (pendingQuizId === null) {
      return;
    }

    window.sessionStorage.removeItem("matheopolis.admin.openQuizId");
    const quizId = Number.parseInt(pendingQuizId, 10);
    if (!Number.isNaN(quizId)) {
      void this.openQuiz(quizId);
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
    this.questionsSection.deleteTarget = null;
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
        this.publicationRequests = this.publicationRequests.filter((item) => item.id !== target.id);
        this.reviewActionTarget = null;
        this.closeQuizDetail();
      } else if (target.kind === "unpublish") {
        await this.services.adminQuizzes.unpublishQuiz(target.id);
        this.reviewActionTarget = null;
        if (this.selectedQuizId === target.id) {
          this.selectedQuizDetail = await this.services.adminQuizzes.getQuizDetail(target.id);
        }
      } else {
        await this.services.adminQuizzes.rejectPublicationRequest(target.id);
        this.publicationRequests = this.publicationRequests.filter((item) => item.id !== target.id);
        this.reviewActionTarget = null;
        this.closeQuizDetail();
      }

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
    this.clearConfirmationModals();
    this.render(adminPanelViewTemplate({
      sections: this.sections,
      publicationRequests: this.publicationRequests,
      creatorLabels: this.creatorLabels,
      selectedQuizId: this.selectedQuizId,
      selectedQuizDetail: this.selectedQuizDetail,
      reviewActionTarget: this.reviewActionTarget,
      isProcessingReviewAction: this.isProcessingReviewAction,
      isLoading: this.isLoading,
      isLoadingDetail: this.isLoadingDetail,
      listMessage: this.listMessage,
      questionDeleteTargetExists: this.questionsSection.deleteTarget !== null,
      questionsSectionHtml: this.selectedQuizId !== null && this.selectedQuizDetail !== null && !this.isLoadingDetail
        ? this.questionsSection.render(this.buildQuestionsSectionConfig())
        : ""
    }), adminPanelStyles());
    this.bindEvents();
    this.mountConfirmationModals();
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
    const configs: ConfirmationModalConfig[] = [];
    const reviewConfig = this.buildReviewConfirmationConfig();
    if (reviewConfig !== null) {
      configs.push(reviewConfig);
    }

    const questionDeleteConfig = this.questionsSection.getDeleteConfirmationConfig();
    if (questionDeleteConfig !== null) {
      configs.push(questionDeleteConfig);
    }

    return configs;
  }

  private buildReviewConfirmationConfig(): ConfirmationModalConfig | null {
    if (this.reviewActionTarget === null) {
      return null;
    }

    const isPublish = this.reviewActionTarget.kind === "publish";
    const isUnpublish = this.reviewActionTarget.kind === "unpublish";
    const title = isPublish
      ? "Publier ce questionnaire ?"
      : isUnpublish
        ? "Depublier ce questionnaire ?"
        : "Refuser cette publication ?";
    const eyebrow = isPublish ? "Publication" : isUnpublish ? "Depublication" : "Refus";
    const copy = isPublish
      ? `Le questionnaire <strong>${escapeHtml(this.reviewActionTarget.title)}</strong> sera rendu public et visible selon les regles d'acces de la plateforme.`
      : isUnpublish
        ? `Le questionnaire <strong>${escapeHtml(this.reviewActionTarget.title)}</strong> passera en acces restreint (prive) et ne sera plus visible comme questionnaire officiel.`
        : `Le questionnaire <strong>${escapeHtml(this.reviewActionTarget.title)}</strong> restera prive. L'enseignant pourra le modifier et le soumettre a nouveau.`;
    const confirmLabel = isPublish
      ? "Confirmer la publication"
      : isUnpublish
        ? "Confirmer la depublication"
        : "Confirmer le refus";
    const processingLabel = isPublish ? "Publication..." : isUnpublish ? "Depublication..." : "Refus...";
    const iconName = isPublish ? "check" : isUnpublish ? "lock" : "x";

    return {
      id: "review-action",
      eyebrow,
      title,
      bodyHtml: `<p>${copy}</p>`,
      message: this.listMessage,
      isProcessing: this.isProcessingReviewAction,
      overlayClass: "review-modal",
      confirmAction: {
        label: confirmLabel,
        processingLabel,
        iconName,
        variant: isPublish || isUnpublish ? "default" : "danger"
      }
    };
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
    if (detail.modalId === "review-action") {
      if (detail.action === "confirm") {
        void this.confirmReviewAction();
      } else if (!this.isProcessingReviewAction) {
        this.closeReviewModal();
      }
      return;
    }

    if (detail.modalId === "delete-question") {
      if (detail.action === "confirm" && this.selectedQuizId !== null) {
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

  private formatQuizTitleWithCreator(title: string, creatorId: number): string {
    const creatorLabel = this.creatorLabels.get(creatorId) ?? `Enseignant #${creatorId}`;
    return `${title} - ${creatorLabel}`;
  }
}
