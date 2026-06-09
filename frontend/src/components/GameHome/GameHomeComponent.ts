import { BaseComponent } from "../BaseComponent.js";
import type { Chapter } from "../../models/Chapter.js";
import type { ChapterProgress } from "../../models/ChapterProgress.js";
import type {
  ChapterViewModel,
  GameHomeContentFilter,
  GameHomeModalTemplateData,
  GameHomeTemplateState
} from "../../models/components/GameHome.js";
import type { QuizSummary } from "../../models/Quiz.js";
import type { AppServices } from "../../models/services/AppServices.js";
import type { Router } from "../../router/Router.js";
import { gameHomeStyles } from "./GameHomeComponent.styles.js";
import {
  gameHomeContentTemplate,
  gameHomeLoadingTemplate,
  gameHomeModalsTemplate,
  gameHomeShellTemplate
} from "./GameHomeComponent.template.js";

export class GameHomeComponent extends BaseComponent {
  private publicQuizzes: ChapterViewModel[] = [];
  private privateQuizzes: ChapterViewModel[] = [];
  private chapters: ChapterViewModel[] = [];
  private playerName = "";
  private isGuestMode = false;
  private quizRestartTarget: { quizId: number; title: string } | null = null;
  private isProcessingQuizRestart = false;
  private quizRestartMessage = "";
  private exploredChapters = 0;
  private totalProgress = 0;
  private searchQuery = "";
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

    const closeQuizRestart = target.closest("[data-close-quiz-restart-modal]");
    if (closeQuizRestart instanceof HTMLButtonElement && !this.isProcessingQuizRestart) {
      event.stopPropagation();
      this.closeQuizRestartModal();
      return;
    }

    const quizRestartAction = target.closest("[data-quiz-restart-action]");
    if (quizRestartAction instanceof HTMLButtonElement && !this.isProcessingQuizRestart) {
      event.stopPropagation();
      const action = quizRestartAction.dataset.quizRestartAction;
      await this.handleQuizRestartChoice(action === "restart");
      return;
    }

    const quizRestartOverlay = target.closest(".quiz-restart-modal");
    if (quizRestartOverlay instanceof HTMLElement && !this.isProcessingQuizRestart) {
      const panel = quizRestartOverlay.querySelector(".create-modal-panel");
      if (panel === null || !panel.contains(target)) {
        this.closeQuizRestartModal();
      }
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
    if (!Number.isNaN(quizId) && card.dataset.enabled === "true") {
      await this.openQuiz(quizId);
      return;
    }

    const route = card.dataset.routeTarget;
    if (route !== undefined && card.dataset.enabled === "true") {
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

  private openQuizRestartModal(quizId: number, title: string): void {
    this.quizRestartTarget = { quizId, title };
    this.quizRestartMessage = "";
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
    const progressPairs = catalog.map((chapter) => ({
      chapter,
      progress: chapter.progress ?? this.emptyProgress(chapter.id)
    }));
    const chapterCards = progressPairs.map(({ chapter, progress }) => this.toChapterCard(chapter, progress));
    const sortedQuizzes = [...quizzes].sort(this.compareQuizPosition);
    this.publicQuizzes = sortedQuizzes
      .filter((quiz) => quiz.status === "public")
      .map((quiz) => this.toQuizCard(quiz));
    this.privateQuizzes = sortedQuizzes
      .filter((quiz) => quiz.status === "private")
      .map((quiz) => this.toQuizCard(quiz));
    this.chapters = chapterCards;

    const allCards = [...this.chapters, ...this.privateQuizzes, ...this.publicQuizzes];
    this.exploredChapters = allCards.filter((item) => item.progress > 0).length;
    this.totalProgress = allCards.length === 0
      ? 0
      : Math.round(allCards.reduce((total, item) => total + item.progress, 0) / allCards.length);
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

  private toChapterCard(chapter: Chapter, progress: ChapterProgress): ChapterViewModel {
    const completion = this.services.progressMetrics.progressPercent(progress);

    return {
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.statement,
      era: "Enigme",
      progress: completion,
      progressLabel: "Progression",
      enabled: this.services.gameAccess.isEnabled(chapter.id),
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
      era: isPublic ? "Questionnaire officiel" : "Questionnaire prive",
      progress: progressPercent,
      progressLabel: `${answeredQuestions} / ${quiz.questionCount} questions`,
      enabled: true,
      status: quiz.progress?.status ?? "not_started",
      route: `/quiz/${quiz.id}`,
      kind: "quiz",
      visibility: quiz.status
    };
  }

  private emptyProgress(chapterId: number): ChapterProgress {
    return {
      chapterId,
      studentId: 0,
      status: "not_started",
      attemptCount: 0,
      startedAt: null,
      completedAt: null,
      lastAttemptAt: null
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

    this.updateRegion("[data-game-home-modals]", gameHomeModalsTemplate(this.modalTemplateData()));
  }

  private templateState(): GameHomeTemplateState {
    return {
      isGuestMode: this.isGuestMode,
      playerName: this.playerName,
      exploredChapters: this.exploredChapters,
      chapterCount: this.chapters.length,
      totalProgress: this.totalProgress,
      searchQuery: this.searchQuery,
      activeContentFilters: this.activeContentFilters
    };
  }

  private modalTemplateData(): GameHomeModalTemplateData {
    return {
      quizRestartTarget: this.quizRestartTarget,
      quizRestartMessage: this.quizRestartMessage,
      isProcessingQuizRestart: this.isProcessingQuizRestart
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
}
