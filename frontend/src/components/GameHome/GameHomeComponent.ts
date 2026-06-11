import { BaseComponent } from "../BaseComponent.js";
import type { Chapter } from "../../models/Chapter.js";
import type { ChapterProgress } from "../../models/ChapterProgress.js";
import type {
  ChapterViewModel,
  GameHomeContentFilter,
  GameHomeTemplateState
} from "../../models/components/GameHome.js";
import {
  CONFIRMATION_MODAL_ACTION_EVENT,
  type ConfirmationModalActionDetail,
  type ConfirmationModalConfig
} from "../../models/components/ConfirmationModal.js";
import type { QuizSummary } from "../../models/Quiz.js";
import type { AppServices } from "../../models/services/AppServices.js";
import {
  formatExploredChapters,
  type ProgressMetricsWithTotal
} from "../../models/services/ProgressMetrics.js";
import type { Router } from "../../router/Router.js";
import { ConfirmationModalComponent } from "../Shared/ConfirmationModal/ConfirmationModalComponent.js";
import { bindFloatingTopButton } from "../Shared/FloatingTopButton/FloatingTopButton.js";
import { escapeHtml } from "../../utils/dom.js";
import { gameHomeStyles } from "./GameHomeComponent.styles.js";
import {
  gameHomeContentTemplate,
  gameHomeLoadingTemplate,
  gameHomeShellTemplate
} from "./GameHomeComponent.template.js";

export class GameHomeComponent extends BaseComponent {
  private publicQuizzes: ChapterViewModel[] = [];
  private privateQuizzes: ChapterViewModel[] = [];
  private chapters: ChapterViewModel[] = [];
  private playerName = "";
  private isGuestMode = false;
  private quizRestartTarget: { quizId: number; title: string } | null = null;
  private chapterRestartTarget: { chapterId: number; title: string } | null = null;
  private isProcessingQuizRestart = false;
  private isProcessingChapterRestart = false;
  private quizRestartMessage = "";
  private chapterRestartMessage = "";
  private chapterMetrics: ProgressMetricsWithTotal = {
    exploredChapters: 0,
    totalChapters: 0,
    totalProgress: 0
  };
  private searchQuery = "";
  private readonly confirmationModals: ConfirmationModalComponent[] = [];
  private readonly confirmationModalDisposers: Array<() => void> = [];
  private readonly activeContentFilters = new Set<GameHomeContentFilter>([
    "chapters",
    "private_quizzes",
    "public_quizzes"
  ]);

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-game-home");
  }

  public init(): void {
    this.renderLoading();
    void this.load();
  }

  public override destroy(): void {
    this.clearConfirmationModals();
    super.destroy();
  }

  protected bindEvents(): void {
    const homeButton = this.query<HTMLButtonElement>('[data-action="home"]');
    if (homeButton !== null) {
      this.listen(homeButton, "click", () => {
        this.services.auth.endGuestSession();
        this.router.navigate("/");
      });
    }

    this.queryAll<HTMLButtonElement>("[data-route]").forEach((button) => {
      this.listen(button, "click", () => {
        const route = button.dataset.route;
        if (route !== undefined) {
          this.router.navigate(route);
        }
      });
    });

    const searchInput = this.query<HTMLInputElement>("[data-content-search]");
    if (searchInput !== null) {
      this.listen(searchInput, "input", () => {
        this.searchQuery = searchInput.value;
        this.renderContentArea();
      });
    }

    bindFloatingTopButton(
      this.root,
      (target, type, listener) => this.listen(target, type, listener),
      "#game-home-top"
    );

    const root = this.root;
    if (root !== null) {
      this.listen(root, "click", (event) => {
        void this.handleRootClick(event);
      });
    }
  }

  private async handleRootClick(event: Event): Promise<void> {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const filterButton = target.closest("[data-content-filter]");
    if (filterButton instanceof HTMLButtonElement) {
      event.stopPropagation();
      const filter = filterButton.dataset.contentFilter as GameHomeContentFilter | undefined;
      if (filter === undefined) {
        return;
      }

      if (this.activeContentFilters.has(filter)) {
        if (this.activeContentFilters.size > 1) {
          this.activeContentFilters.delete(filter);
        }
      } else {
        this.activeContentFilters.add(filter);
      }

      this.syncFilterChips();
      this.renderContentArea();
      return;
    }

    const card = target.closest<HTMLElement>("[data-route-target]");
    if (card === null) {
      return;
    }

    const quizId = Number.parseInt(card.dataset.quizId ?? "", 10);
    if (!Number.isNaN(quizId)) {
      await this.openQuiz(quizId);
      return;
    }

    const chapterId = Number.parseInt(card.dataset.chapterId ?? "", 10);
    if (!Number.isNaN(chapterId)) {
      await this.openChapter(chapterId);
      return;
    }

    const route = card.dataset.routeTarget;
    if (route !== undefined) {
      this.router.navigate(route);
    }
  }

  private syncFilterChips(): void {
    this.queryAll<HTMLButtonElement>("[data-content-filter]").forEach((button) => {
      const filter = button.dataset.contentFilter as GameHomeContentFilter | undefined;
      if (filter === undefined) {
        return;
      }

      const isActive = this.activeContentFilters.has(filter);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  private closeQuizRestartModal(): void {
    this.quizRestartTarget = null;
    this.quizRestartMessage = "";
    this.renderModalsArea();
  }

  private closeChapterRestartModal(): void {
    this.chapterRestartTarget = null;
    this.chapterRestartMessage = "";
    this.renderModalsArea();
  }

  private openQuizRestartModal(quizId: number, title: string): void {
    this.quizRestartTarget = { quizId, title };
    this.quizRestartMessage = "";
    this.renderModalsArea();
  }

  private openChapterRestartModal(chapterId: number, title: string): void {
    this.chapterRestartTarget = { chapterId, title };
    this.chapterRestartMessage = "";
    this.renderModalsArea();
  }

  private async handleQuizRestartChoice(restart: boolean): Promise<void> {
    if (this.quizRestartTarget === null || this.isProcessingQuizRestart) {
      return;
    }

    const { quizId } = this.quizRestartTarget;

    if (!restart) {
      this.closeQuizRestartModal();
      this.router.navigate(`/quiz/${quizId}/results`);
      return;
    }

    this.isProcessingQuizRestart = true;
    this.quizRestartMessage = "";
    this.renderModalsArea();

    try {
      await this.services.quizzes.startAttempt(quizId);
      this.quizRestartTarget = null;
      this.quizRestartMessage = "";
      this.router.navigate(`/quiz/${quizId}`);
    } catch (error) {
      this.quizRestartMessage = error instanceof Error ? error.message : "Impossible de recommencer.";
      this.isProcessingQuizRestart = false;
      this.renderModalsArea();
    }
  }

  private async handleChapterRestart(): Promise<void> {
    if (this.chapterRestartTarget === null || this.isProcessingChapterRestart) {
      return;
    }

    const { chapterId } = this.chapterRestartTarget;
    this.isProcessingChapterRestart = true;
    this.chapterRestartMessage = "";
    this.renderModalsArea();

    try {
      await this.services.chapters.startChapter(chapterId);
      this.chapterRestartTarget = null;
      this.chapterRestartMessage = "";
      this.router.navigate(`/game/${chapterId}`);
    } catch (error) {
      this.chapterRestartMessage = error instanceof Error ? error.message : "Impossible de recommencer.";
      this.isProcessingChapterRestart = false;
      this.renderModalsArea();
    }
  }

  private async load(): Promise<void> {
    const user = await this.services.auth.getMe();
    this.isGuestMode = user !== null && this.services.auth.isGuestUser(user);
    this.playerName = user === null ? "" : (user.firstName || user.username);

    const canListQuizzes = user !== null && !this.isGuestMode;
    const [catalog, quizzes] = await Promise.all([
      this.services.chapters.listChapters(),
      canListQuizzes
        ? this.services.quizzes.listQuizzes().catch(() => [])
        : Promise.resolve([])
    ]);
    const progressPairs = await Promise.all(
      catalog.map(async (chapter) => ({
        chapter,
        progress: this.isGuestMode
          ? this.emptyProgress(chapter.id)
          : chapter.progress ?? this.emptyProgress(chapter.id)
      }))
    );
    const chapterCards = progressPairs.map(({ chapter, progress }) => this.toChapterCard(chapter, progress));
    const sortedQuizzes = [...quizzes].sort(this.compareQuizPosition);
    this.publicQuizzes = sortedQuizzes
      .filter((quiz) => quiz.status === "public")
      .map((quiz) => this.toQuizCard(quiz));
    this.privateQuizzes = sortedQuizzes
      .filter((quiz) => quiz.status === "private")
      .map((quiz) => this.toQuizCard(quiz));
    this.chapters = chapterCards;

    this.chapterMetrics = this.services.progressMetrics.fromChapterProgress(
      progressPairs.map(({ chapter, progress }) => ({
        progress,
        stepCount: chapter.stepCount
      })),
      catalog.length
    );
    this.renderFull();
  }

  private compareQuizPosition(left: QuizSummary, right: QuizSummary): number {
    const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;
    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }

    return left.id - right.id;
  }

  private async openQuiz(quizId: number): Promise<void> {
    const progress = await this.services.quizzes.getProgress(quizId);
    if (progress.status === "completed") {
      const quiz = [...this.privateQuizzes, ...this.publicQuizzes].find((item) => item.id === quizId);
      this.openQuizRestartModal(quizId, quiz?.title ?? "Ce questionnaire");
      return;
    }

    this.router.navigate(`/quiz/${quizId}`);
  }

  private async openChapter(chapterId: number): Promise<void> {
    const chapter = this.chapters.find((item) => item.id === chapterId);
    if (chapter?.status === "completed") {
      this.openChapterRestartModal(chapterId, chapter.title);
      return;
    }

    this.router.navigate(`/game/${chapterId}`);
  }

  private toChapterCard(chapter: Chapter, progress: ChapterProgress): ChapterViewModel {
    const stepCount = chapter.stepCount ?? 0;
    const completion = this.services.progressMetrics.progressPercent(progress, stepCount);
    const completedSteps = progress.status === "completed"
      ? stepCount
      : Math.min(progress.currentStepIndex, stepCount);

    return {
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.statement,
      era: "Énigme",
      progress: completion,
      progressLabel: stepCount > 0 ? `${completedSteps} / ${stepCount} étapes` : "Progression",
      status: progress.status,
      route: `/game/${chapter.id}`,
      kind: "chapter"
    };
  }

  private toQuizCard(quiz: QuizSummary): ChapterViewModel {
    const answeredQuestions = quiz.progress?.status === "completed"
      ? quiz.questionCount
      : (quiz.progress?.currentQuestionIndex ?? 0);
    const progressPercent = quiz.questionCount === 0
      ? 0
      : Math.round((answeredQuestions / quiz.questionCount) * 100);
    const isPublic = quiz.status === "public";

    return {
      id: quiz.id,
      title: quiz.title,
      subtitle: quiz.description ?? "",
      era: isPublic ? "Questionnaire officiel" : "Questionnaire privé",
      progress: progressPercent,
      progressLabel: `${answeredQuestions} / ${quiz.questionCount} questions`,
      status: quiz.progress?.status ?? "not_started",
      route: `/quiz/${quiz.id}`,
      kind: "quiz",
      visibility: quiz.status
    };
  }

  private emptyProgress(chapterId: number): ChapterProgress {
    return {
      chapterId,
      userId: 0,
      status: "not_started",
      currentStepIndex: 0,
      score: null,
      startedAt: null,
      completedAt: null
    };
  }

  private renderLoading(): void {
    this.render(gameHomeLoadingTemplate(), gameHomeStyles());
  }

  private renderFull(): void {
    this.render(gameHomeShellTemplate(this.templateState()), gameHomeStyles());
    this.renderContentArea();
    this.renderModalsArea();
    this.bindEvents();
  }

  private renderContentArea(): void {
    if (this.root === null) {
      return;
    }

    this.updateRegion("[data-game-home-content]", gameHomeContentTemplate({
      state: this.templateState(),
      chapters: this.getVisibleChapters(),
      privateQuizzes: this.getVisiblePrivateQuizzes(),
      publicQuizzes: this.getVisiblePublicQuizzes(),
      showEmptyFilterState: this.shouldRenderEmptyFilterState()
    }));
  }

  private renderModalsArea(): void {
    if (this.root === null) {
      return;
    }

    this.clearConfirmationModals();

    const host = this.query<HTMLElement>("[data-game-home-modals]");
    if (host === null) {
      return;
    }

    host.innerHTML = "";
    [
      this.buildQuizRestartConfirmationConfig(),
      this.buildChapterRestartConfirmationConfig()
    ].forEach((config) => {
      if (config !== null) {
        this.mountConfirmationModal(host, config);
      }
    });
  }

  private templateState(): GameHomeTemplateState {
    return {
      isGuestMode: this.isGuestMode,
      playerName: this.playerName,
      exploredChaptersLabel: formatExploredChapters(this.chapterMetrics),
      totalProgress: this.chapterMetrics.totalProgress,
      searchQuery: this.searchQuery,
      activeContentFilters: this.activeContentFilters
    };
  }

  private getVisibleChapters(): ChapterViewModel[] {
    if (!this.activeContentFilters.has("chapters")) {
      return [];
    }

    return this.filterBySearch(this.chapters);
  }

  private getVisiblePrivateQuizzes(): ChapterViewModel[] {
    if (!this.activeContentFilters.has("private_quizzes")) {
      return [];
    }

    return this.filterBySearch(this.privateQuizzes);
  }

  private getVisiblePublicQuizzes(): ChapterViewModel[] {
    if (!this.activeContentFilters.has("public_quizzes")) {
      return [];
    }

    return this.filterBySearch(this.publicQuizzes);
  }

  private filterBySearch(items: ChapterViewModel[]): ChapterViewModel[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (query.length === 0) {
      return items;
    }

    return items.filter((item) => item.title.toLowerCase().includes(query));
  }

  private shouldRenderEmptyFilterState(): boolean {
    if (this.hasVisibleContent()) {
      return false;
    }

    return this.chapters.length > 0
      || this.privateQuizzes.length > 0
      || this.publicQuizzes.length > 0;
  }

  private hasVisibleContent(): boolean {
    return this.getVisibleChapters().length > 0
      || this.getVisiblePrivateQuizzes().length > 0
      || this.getVisiblePublicQuizzes().length > 0;
  }

  private buildQuizRestartConfirmationConfig(): ConfirmationModalConfig | null {
    if (this.quizRestartTarget === null) {
      return null;
    }

    return {
      id: "quiz-restart",
      eyebrow: "Questionnaire terminé",
      title: "Que souhaitez-vous faire ?",
      bodyHtml: `
        <p>
          Le questionnaire <strong>${escapeHtml(this.quizRestartTarget.title)}</strong> est déjà terminé.
          Vous pouvez recommencer une nouvelle tentative ou consulter vos résultats précédents.
        </p>
      `,
      message: this.quizRestartMessage,
      isProcessing: this.isProcessingQuizRestart,
      overlayClass: "quiz-restart-modal",
      actionsLayout: "split",
      cancelAction: null,
      secondaryAction: {
        label: "Voir les résultats",
        iconName: "award"
      },
      confirmAction: {
        label: "Recommencer",
        processingLabel: "Démarrage...",
        iconName: "arrowRight"
      }
    };
  }

  private buildChapterRestartConfirmationConfig(): ConfirmationModalConfig | null {
    if (this.chapterRestartTarget === null) {
      return null;
    }

    return {
      id: "chapter-restart",
      eyebrow: "Chapitre terminé",
      title: "Recommencer le chapitre ?",
      bodyHtml: `
        <p>
          Le chapitre <strong>${escapeHtml(this.chapterRestartTarget.title)}</strong> est déjà terminé.
          Vous pouvez démarrer une nouvelle tentative depuis le début.
        </p>
      `,
      message: this.chapterRestartMessage,
      isProcessing: this.isProcessingChapterRestart,
      overlayClass: "chapter-restart-modal",
      actionsLayout: "split",
      cancelAction: {
        label: "Annuler"
      },
      confirmAction: {
        label: "Recommencer",
        processingLabel: "Démarrage...",
        iconName: "arrowRight"
      }
    };
  }

  private mountConfirmationModal(host: HTMLElement, config: ConfirmationModalConfig): void {
    const container = document.createElement("div");
    host.append(container);

    const modal = new ConfirmationModalComponent(container, config);
    this.confirmationModals.push(modal);

    const listener = (event: Event): void => {
      const detail = (event as CustomEvent<ConfirmationModalActionDetail>).detail;
      this.handleConfirmationModalAction(detail);
    };
    container.addEventListener(CONFIRMATION_MODAL_ACTION_EVENT, listener);
    this.confirmationModalDisposers.push(() => {
      container.removeEventListener(CONFIRMATION_MODAL_ACTION_EVENT, listener);
    });

    modal.init();
  }

  private handleConfirmationModalAction(detail: ConfirmationModalActionDetail): void {
    if (detail.modalId === "quiz-restart") {
      if (detail.action === "confirm") {
        void this.handleQuizRestartChoice(true);
        return;
      }

      if (detail.action === "secondary") {
        void this.handleQuizRestartChoice(false);
        return;
      }

      this.closeQuizRestartModal();
      return;
    }

    if (detail.modalId === "chapter-restart") {
      if (detail.action === "confirm") {
        void this.handleChapterRestart();
        return;
      }

      this.closeChapterRestartModal();
    }
  }

  private clearConfirmationModals(): void {
    while (this.confirmationModalDisposers.length > 0) {
      this.confirmationModalDisposers.pop()?.();
    }

    while (this.confirmationModals.length > 0) {
      this.confirmationModals.pop()?.destroy();
    }
  }
}
