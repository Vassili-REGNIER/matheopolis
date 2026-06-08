import { BaseComponent } from "../BaseComponent.js";
import type { Chapter } from "../../models/Chapter.js";
import type { ChapterProgress } from "../../models/ChapterProgress.js";
import type { QuizSummary } from "../../models/Quiz.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon, type IconName } from "../../utils/icons.js";

interface ChapterViewModel {
  id: number;
  title: string;
  subtitle: string;
  era: string;
  progress: number;
  progressLabel: string;
  enabled: boolean;
  status: string;
  route: string;
  kind: "chapter" | "quiz";
  visibility?: "public" | "private";
}

interface AdminMenuItem {
  action: "edit-quiz" | "publish-quiz" | "unpublish-quiz" | "delete-quiz" | "delete-chapter";
  label: string;
  danger?: boolean;
}

interface AdminConfirmTarget {
  action: AdminMenuItem["action"];
  id: number;
  title: string;
  kind: ChapterViewModel["kind"];
}

type GameHomeContentFilter = "chapters" | "private_quizzes" | "public_quizzes";

export class GameHomeComponent extends BaseComponent {
  private static readonly adminOpenQuizStorageKey = "matheopolis.admin.openQuizId";

  private publicQuizzes: ChapterViewModel[] = [];
  private privateQuizzes: ChapterViewModel[] = [];
  private chapters: ChapterViewModel[] = [];
  private playerName = "";
  private isGuestMode = false;
  private isAdmin = false;
  private openAdminMenuKey: string | null = null;
  private adminConfirmTarget: AdminConfirmTarget | null = null;
  private isProcessingAdminAction = false;
  private adminActionMessage = "";
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

    this.queryAll<HTMLElement>("[data-route-target]").forEach((card) => {
      this.listen(card, "click", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest(".card-menu-wrap")) {
          return;
        }

        const route = card.dataset.routeTarget;
        const quizId = Number.parseInt(card.dataset.quizId ?? "", 10);
        if (!Number.isNaN(quizId) && card.dataset.enabled === "true") {
          void this.openQuiz(quizId);
          return;
        }

        if (route !== undefined && card.dataset.enabled === "true") {
          this.router.navigate(route);
        }
      });
    });

    this.bindAdminMenuEvents();
    this.bindAdminConfirmModalEvents();
    this.bindSearchAndFilterEvents();
  }

  private bindSearchAndFilterEvents(): void {
    const searchInput = this.query<HTMLInputElement>("[data-content-search]");
    if (searchInput !== null) {
      this.listen(searchInput, "input", () => {
        this.searchQuery = searchInput.value;
        const selectionStart = searchInput.selectionStart;
        const selectionEnd = searchInput.selectionEnd;
        this.renderGameHome();
        requestAnimationFrame(() => {
          const nextInput = this.query<HTMLInputElement>("[data-content-search]");
          if (nextInput === null) {
            return;
          }

          nextInput.focus();
          if (selectionStart !== null && selectionEnd !== null) {
            nextInput.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      });
    }

    this.queryAll<HTMLButtonElement>("[data-content-filter]").forEach((button) => {
      this.listen(button, "click", () => {
        const filter = button.dataset.contentFilter as GameHomeContentFilter | undefined;
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

        this.renderGameHome();
      });
    });
  }

  private bindAdminConfirmModalEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-close-admin-modal]").forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isProcessingAdminAction) {
          this.closeAdminConfirmModal();
        }
      });
    });

    const confirmButton = this.query<HTMLButtonElement>("[data-confirm-admin-action]");
    if (confirmButton !== null) {
      this.listen(confirmButton, "click", () => {
        void this.confirmAdminAction();
      });
    }

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

        if (!this.isProcessingAdminAction) {
          this.closeAdminConfirmModal();
        }
      });
    });
  }

  private closeAdminConfirmModal(): void {
    this.adminConfirmTarget = null;
    this.adminActionMessage = "";
    this.renderGameHome();
  }

  private openAdminConfirmModal(target: AdminConfirmTarget): void {
    this.adminConfirmTarget = target;
    this.adminActionMessage = "";
    this.renderGameHome();
  }

  private async confirmAdminAction(): Promise<void> {
    if (this.adminConfirmTarget === null || this.isProcessingAdminAction) {
      return;
    }

    const target = this.adminConfirmTarget;
    this.isProcessingAdminAction = true;
    this.adminActionMessage = "";
    this.renderGameHome();

    try {
      if (target.action === "publish-quiz") {
        await this.services.adminQuizzes.publishQuiz(target.id);
      } else if (target.action === "unpublish-quiz") {
        await this.services.adminQuizzes.unpublishQuiz(target.id);
      } else if (target.action === "delete-quiz") {
        await this.services.adminQuizzes.deleteQuiz(target.id);
      } else if (target.action === "delete-chapter") {
        this.services.gameAccess.setEnabled(target.id, false);
      }

      this.adminConfirmTarget = null;
      this.adminActionMessage = "";
      await this.load();
    } catch (error) {
      this.adminActionMessage = error instanceof Error ? error.message : "Action impossible.";
    } finally {
      this.isProcessingAdminAction = false;
      this.renderGameHome();
    }
  }

  private bindAdminMenuEvents(): void {
    if (!this.isAdmin) {
      return;
    }

    this.queryAll<HTMLButtonElement>("[data-admin-menu-key]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const menuKey = button.dataset.adminMenuKey;
        if (menuKey === undefined) {
          return;
        }

        this.openAdminMenuKey = this.openAdminMenuKey === menuKey ? null : menuKey;
        this.renderGameHome();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-admin-menu-action]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        void this.handleAdminMenuAction(button);
      });
    });

    if (this.openAdminMenuKey !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(".card-menu-wrap");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openAdminMenuKey = null;
          this.renderGameHome();
        }
      });
    }
  }

  private async handleAdminMenuAction(button: HTMLButtonElement): Promise<void> {
    const action = button.dataset.adminMenuAction as AdminMenuItem["action"] | undefined;
    const itemKind = button.dataset.adminItemKind as ChapterViewModel["kind"] | undefined;
    const itemId = Number.parseInt(button.dataset.adminItemId ?? "", 10);
    if (action === undefined || itemKind === undefined || Number.isNaN(itemId)) {
      return;
    }

    const item = this.findCardItem(itemKind, itemId);
    const itemTitle = item?.title ?? "cet element";
    this.openAdminMenuKey = null;

    if (action === "edit-quiz") {
      window.sessionStorage.setItem(GameHomeComponent.adminOpenQuizStorageKey, String(itemId));
      this.router.navigate("/panel");
      return;
    }

    this.openAdminConfirmModal({
      action,
      id: itemId,
      title: itemTitle,
      kind: itemKind
    });
  }

  private async load(): Promise<void> {
    const user = await this.services.auth.getMe();
    this.isGuestMode = user !== null && this.services.auth.isGuestUser(user);
    this.isAdmin = user?.role === "admin";
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
          : await this.services.chapters.getProgress(chapter.id)
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

    const allCards = [...this.chapters, ...this.privateQuizzes, ...this.publicQuizzes];
    this.exploredChapters = allCards.filter((item) => item.progress > 0).length;
    this.totalProgress = allCards.length === 0
      ? 0
      : Math.round(allCards.reduce((total, item) => total + item.progress, 0) / allCards.length);
    this.renderGameHome();
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
      const restart = window.confirm(
        "Ce questionnaire est deja termine. OK : recommencer. Annuler : voir les anciens resultats."
      );
      if (restart) {
        await this.services.quizzes.startAttempt(quizId);
        this.router.navigate(`/quiz/${quizId}`);
      } else {
        this.router.navigate(`/quiz/${quizId}/results`);
      }
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
    this.render(`
      <div class="loading-shell">
        <div class="loading-icon">${icon("map")}</div>
        <p>Chargement de la carte...</p>
      </div>
    `, this.style());
  }

  private renderGameHome(): void {
    const explored = this.exploredChapters;
    const totalProgress = this.totalProgress;
    const mapTitle = this.isGuestMode ? "Carte d'aventure" : "Carte de Progression";
    const playerBox = this.isGuestMode
      ? `<span class="player-mode">Mode invit&eacute;</span>`
      : `<strong>${escapeHtml(this.playerName)}</strong>`;
    const headerAction = this.isGuestMode
      ? `<button class="home-button" type="button" data-action="home">${icon("home")} Retour &agrave; l'accueil</button>`
      : `<button class="panel-button" type="button" data-route="/panel">${icon("graduation")} Math&eacute;oPanel</button>`;
    const statsGrid = this.isGuestMode ? "" : `
        <section class="stats-grid" aria-label="Progression">
          <article>${icon("book")}<div><strong>${explored} / ${this.chapters.length}</strong><span>Chapitres explores</span></div></article>
          <article>${icon("map")}<div><strong>${totalProgress}%</strong><span>Progression totale</span></div></article>
        </section>
    `;

    this.render(`
      <header class="map-header">
        <div class="header-inner">
          <div class="map-title">${icon("map")}<span>${mapTitle}</span></div>
          <div class="header-actions">
            <div class="player-box">
              <div>
                ${playerBox}
              </div>
              <div class="avatar">${icon("user")}</div>
            </div>
            ${headerAction}
          </div>
        </div>
      </header>

      <main class="map-main">
        ${this.isGuestMode ? `
          <section class="guest-banner">
            ${icon("sparkles")}
            <div>
              <h2>Mode Invit&eacute;</h2>
              <p>D&eacute;couvrez l'univers de Math&eacute;opolis. Cr&eacute;ez un compte pour retrouver votre aventure plus tard.</p>
            </div>
          </section>
        ` : ""}

        ${statsGrid}

        ${this.contentToolbarTemplate()}

        ${this.renderChaptersSection(this.getVisibleChapters())}
        ${this.renderQuizSection("Questionnaires prives", "lock", this.getVisiblePrivateQuizzes())}
        ${this.renderQuizSection("Questionnaires officiels", "file", this.getVisiblePublicQuizzes())}
        ${this.renderEmptyFilterState()}
      </main>
      ${this.adminConfirmModalTemplate()}
    `, this.style());
    this.bindEvents();
  }

  private contentToolbarTemplate(): string {
    const filters: Array<{ id: GameHomeContentFilter; label: string; iconName: IconName }> = [
      { id: "chapters", label: "Chapitres", iconName: "book" },
      { id: "private_quizzes", label: "Questionnaires prives", iconName: "lock" },
      { id: "public_quizzes", label: "Questionnaires publics", iconName: "file" }
    ];

    return `
      <section class="content-toolbar" aria-label="Recherche et filtres">
        <label class="search-field">
          <span class="search-icon" aria-hidden="true">${icon("search")}</span>
          <input
            type="search"
            data-content-search
            placeholder="Rechercher par titre..."
            value="${escapeHtml(this.searchQuery)}"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <div class="content-filters" role="group" aria-label="Filtrer par type de contenu">
          ${filters.map((filter) => {
            const isActive = this.activeContentFilters.has(filter.id);
            return `
              <button
                class="filter-chip${isActive ? " is-active" : ""}"
                type="button"
                data-content-filter="${filter.id}"
                aria-pressed="${isActive ? "true" : "false"}"
              >
                ${icon(filter.iconName)}
                ${escapeHtml(filter.label)}
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
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

  private hasVisibleContent(): boolean {
    return this.getVisibleChapters().length > 0
      || this.getVisiblePrivateQuizzes().length > 0
      || this.getVisiblePublicQuizzes().length > 0;
  }

  private renderEmptyFilterState(): string {
    if (this.hasVisibleContent()) {
      return "";
    }

    const hasAnyContent = this.chapters.length > 0
      || this.privateQuizzes.length > 0
      || this.publicQuizzes.length > 0;

    if (!hasAnyContent) {
      return "";
    }

    return `
      <p class="empty-filter-copy">
        Aucun contenu ne correspond a votre recherche ou a vos filtres.
      </p>
    `;
  }

  private renderChaptersSection(items: ChapterViewModel[]): string {
    if (items.length === 0) {
      return "";
    }

    return `
        <section class="timeline">
          <h1>${icon("map")} Votre Voyage a travers l'Histoire</h1>
          <div class="chapter-list">
            ${items.map((chapter, index) => this.chapterCard(chapter, index, items.length)).join("")}
          </div>
        </section>
    `;
  }

  private renderQuizSection(title: string, titleIcon: IconName, items: ChapterViewModel[]): string {
    if (items.length === 0) {
      return "";
    }

    return `
        <section class="timeline quiz-section">
          <h1>${icon(titleIcon)} ${title}</h1>
          <div class="chapter-list">
            ${items.map((item, index) => this.chapterCard(item, index, items.length)).join("")}
          </div>
        </section>
    `;
  }

  private chapterCard(chapter: ChapterViewModel, index: number, listLength: number): string {
    const enabled = chapter.enabled;
    const iconName = chapter.kind === "chapter"
      ? "book"
      : chapter.visibility === "private"
        ? "lock"
        : "file";
    const visibilityBadge = chapter.visibility === undefined
      ? ""
      : `<span class="visibility-badge ${chapter.visibility}">${chapter.visibility === "public" ? "Officiel" : "Prive"}</span>`;
    const progressRow = this.isGuestMode ? "" : `
              <div class="progress-row">
                <div><span>${escapeHtml(chapter.progressLabel)}</span><span>${chapter.progress}%</span></div>
                <div class="bar"><span style="width: ${chapter.progress}%"></span></div>
              </div>
    `;

    return `
      <article class="chapter-wrap">
        ${index < listLength - 1 ? '<div class="connector"></div>' : ""}
        <div class="chapter-card ${enabled ? "" : "disabled"} ${this.isGuestMode ? "guest-card" : ""}" data-route-target="${escapeHtml(chapter.route)}" data-quiz-id="${chapter.kind === "quiz" ? chapter.id : ""}" data-enabled="${enabled ? "true" : "false"}" tabindex="${enabled ? "0" : "-1"}">
          <div class="chapter-icon">${enabled ? icon(iconName) : icon("lock")}</div>
          <div class="chapter-content">
            <div class="chapter-top">
              <div>
                <div class="era-row">
                  <p class="era">${escapeHtml(chapter.era)}</p>
                  ${visibilityBadge}
                </div>
                <h2>${escapeHtml(chapter.title)}</h2>
                <p class="subtitle">${escapeHtml(chapter.subtitle)}</p>
              </div>
              ${this.adminMenuTemplate(chapter)}
            </div>
            ${enabled ? progressRow : `
              <p class="locked-copy">Acces ferme par l'enseignant</p>
            `}
          </div>
        </div>
      </article>
    `;
  }

  private adminConfirmModalTemplate(): string {
    if (this.adminConfirmTarget === null) {
      return "";
    }

    const target = this.adminConfirmTarget;
    const copy = this.adminConfirmModalCopy(target);
    const isDanger = target.action === "delete-quiz" || target.action === "delete-chapter";
    const confirmIcon = isDanger ? icon("trash") : target.action === "unpublish-quiz" ? icon("lock") : icon("check");
    const confirmLabel = this.adminConfirmSubmitLabel(target.action);

    return `
      <div class="create-modal admin-action-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="admin-action-title">
          <header class="modal-header">
            <div>
              <p>${escapeHtml(copy.eyebrow)}</p>
              <h2 id="admin-action-title">${escapeHtml(copy.title)}</h2>
            </div>
            <button class="modal-close" type="button" data-close-admin-modal aria-label="Fermer" ${this.isProcessingAdminAction ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="admin-action-copy">${copy.body}</p>
          ${this.adminActionMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.adminActionMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-admin-modal ${this.isProcessingAdminAction ? "disabled" : ""}>
              Annuler
            </button>
            <button
              class="modal-submit${isDanger ? " modal-submit-danger" : ""}"
              type="button"
              data-confirm-admin-action
              ${this.isProcessingAdminAction ? "disabled" : ""}
            >
              ${this.isProcessingAdminAction ? `${copy.processingLabel}...` : `${confirmIcon} ${confirmLabel}`}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private adminConfirmModalCopy(target: AdminConfirmTarget): {
    eyebrow: string;
    title: string;
    body: string;
    processingLabel: string;
  } {
    const title = escapeHtml(target.title);

    if (target.action === "publish-quiz") {
      return {
        eyebrow: "Publication",
        title: "Publier ce questionnaire ?",
        body: `Le questionnaire <strong>${title}</strong> sera rendu public et visible selon les regles d'acces de la plateforme.`,
        processingLabel: "Publication"
      };
    }

    if (target.action === "unpublish-quiz") {
      return {
        eyebrow: "Depublication",
        title: "Depublier ce questionnaire ?",
        body: `Le questionnaire <strong>${title}</strong> passera en acces restreint (prive) et ne sera plus visible comme questionnaire officiel.`,
        processingLabel: "Depublication"
      };
    }

    if (target.action === "delete-quiz") {
      return {
        eyebrow: "Suppression",
        title: "Supprimer ce questionnaire ?",
        body: `Le questionnaire <strong>${title}</strong> sera supprime avec toutes ses questions. Cette action est irreversible.`,
        processingLabel: "Suppression"
      };
    }

    return {
      eyebrow: "Retrait",
      title: "Retirer ce chapitre de la carte ?",
      body: `Le chapitre <strong>${title}</strong> sera masque sur la carte. Les eleves ne pourront plus y acceder.`,
      processingLabel: "Retrait"
    };
  }

  private adminConfirmSubmitLabel(action: AdminConfirmTarget["action"]): string {
    if (action === "publish-quiz") {
      return "Confirmer la publication";
    }

    if (action === "unpublish-quiz") {
      return "Confirmer la depublication";
    }

    if (action === "delete-quiz") {
      return "Supprimer";
    }

    return "Retirer de la carte";
  }

  private adminMenuKey(item: ChapterViewModel): string {
    return `${item.kind}:${item.id}`;
  }

  private findCardItem(kind: ChapterViewModel["kind"], id: number): ChapterViewModel | undefined {
    return [...this.chapters, ...this.privateQuizzes, ...this.publicQuizzes]
      .find((item) => item.kind === kind && item.id === id);
  }

  private adminMenuItems(item: ChapterViewModel): AdminMenuItem[] {
    if (item.kind === "chapter") {
      return [{ action: "delete-chapter", label: "Supprimer", danger: true }];
    }

    if (item.visibility === "public") {
      return [
        { action: "edit-quiz", label: "Modifier" },
        { action: "unpublish-quiz", label: "D\u00e9publier" },
        { action: "delete-quiz", label: "Supprimer", danger: true }
      ];
    }

    return [
      { action: "edit-quiz", label: "Modifier" },
      { action: "publish-quiz", label: "Publier" },
      { action: "delete-quiz", label: "Supprimer", danger: true }
    ];
  }

  private adminMenuTemplate(item: ChapterViewModel): string {
    if (!this.isAdmin) {
      return "";
    }

    const menuKey = this.adminMenuKey(item);
    const isOpen = this.openAdminMenuKey === menuKey;
    const menuItems = this.adminMenuItems(item);

    return `
      <div class="card-menu-wrap">
        <button
          class="card-menu-trigger"
          type="button"
          data-admin-menu-key="${menuKey}"
          aria-label="Actions de l'element"
          aria-expanded="${isOpen ? "true" : "false"}"
        >
          ${icon("moreVertical")}
        </button>
        ${isOpen ? `
          <div class="card-menu" role="menu">
            ${menuItems.map((menuItem) => `
              <button
                class="card-menu-item${menuItem.danger === true ? " card-menu-item-danger" : ""}"
                type="button"
                role="menuitem"
                data-admin-menu-action="${menuItem.action}"
                data-admin-item-kind="${item.kind}"
                data-admin-item-id="${item.id}"
              >
                ${menuItem.label}
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: block;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
        color: var(--matheo-parchment);
      }

      :host .icon {
        width: 1.2em;
        height: 1.2em;
        flex: none;
      }

      :host .loading-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        gap: 12px;
        color: rgba(250, 249, 246, 0.72);
        text-align: center;
      }

      :host .loading-icon {
        width: 64px;
        height: 64px;
        color: var(--matheo-gold);
      }

      :host .loading-icon .icon {
        width: 100%;
        height: 100%;
      }

      :host .map-header {
        position: sticky;
        top: 0;
        z-index: 30;
        border-bottom: 1px solid rgba(212, 175, 55, 0.22);
        background: rgba(15, 23, 42, 0.86);
        backdrop-filter: blur(12px);
      }

      :host .header-inner {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }

      :host .map-title {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-size: 1.25rem;
        font-weight: 900;
      }

      :host .map-title .icon,
      :host .panel-button .icon,
      :host .home-button .icon,
      :host .stats-grid .icon,
      :host .timeline h1 .icon,
      :host .chapter-icon .icon,
      :host .guest-banner .icon {
        color: var(--matheo-gold);
      }

      :host .header-actions,
      :host .player-box,
      :host .panel-button,
      :host .home-button {
        display: flex;
        align-items: center;
      }

      :host .header-actions {
        gap: 18px;
      }

      :host .player-box {
        gap: 12px;
        padding-right: 18px;
        border-right: 1px solid rgba(255, 255, 255, 0.12);
        justify-content: center;
        text-align: center;
      }

      :host .player-box strong {
        display: block;
        color: #fff;
      }

      :host .player-box .player-mode {
        color: var(--matheo-gold);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .avatar {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border: 2px solid var(--matheo-gold);
        border-radius: 50%;
        background: linear-gradient(135deg, #6b21a8, #5b21b6);
      }

      :host .panel-button,
      :host .home-button {
        min-height: 42px;
        gap: 10px;
        padding: 0 16px;
        border: 1px solid rgba(212, 175, 55, 0.42);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.1);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .panel-button:hover,
      :host .home-button:hover {
        background: var(--matheo-gold);
        color: #0f172a;
      }

      :host .progress-row > div:first-child {
        display: flex;
        justify-content: space-between;
        margin-bottom: 7px;
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
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
        border-radius: inherit;
        background: linear-gradient(90deg, #d4af37, #ffd166);
      }

      :host .map-main {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 42px 24px 64px;
      }

      :host .guest-banner {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 34px;
        padding: 20px;
        border-left: 4px solid var(--matheo-gold);
        border-radius: 0 14px 14px 0;
        background: linear-gradient(90deg, rgba(212, 175, 55, 0.18), transparent);
      }

      :host .guest-banner .icon {
        width: 38px;
        height: 38px;
      }

      :host .guest-banner h2,
      :host .guest-banner p {
        margin: 0;
      }

      :host .guest-banner p {
        margin-top: 4px;
        color: rgba(250, 249, 246, 0.76);
      }

      :host .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 28px;
      }

      :host .content-toolbar {
        display: grid;
        gap: 14px;
        margin-bottom: 34px;
        padding: 18px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.58);
      }

      :host .search-field {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 0 16px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.72);
      }

      :host .search-icon {
        display: grid;
        place-items: center;
        color: var(--matheo-gold);
      }

      :host .search-icon .icon {
        width: 18px;
        height: 18px;
      }

      :host .search-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        background: transparent;
        color: #fff;
        font-size: 0.95rem;
        outline: none;
      }

      :host .search-field input::placeholder {
        color: rgba(250, 249, 246, 0.42);
      }

      :host .content-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      :host .filter-chip {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        color: rgba(250, 249, 246, 0.72);
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }

      :host .filter-chip .icon {
        width: 16px;
        height: 16px;
      }

      :host .filter-chip.is-active {
        border-color: var(--matheo-gold);
        background: rgba(212, 175, 55, 0.16);
        color: #fff;
      }

      :host .filter-chip.is-active .icon {
        color: var(--matheo-gold);
      }

      :host .empty-filter-copy {
        margin: 0 0 24px;
        padding: 18px 20px;
        border: 1px dashed rgba(212, 175, 55, 0.28);
        border-radius: 12px;
        color: rgba(250, 249, 246, 0.66);
        text-align: center;
      }

      :host .stats-grid article {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.58);
        box-shadow: 0 16px 40px rgba(2, 6, 23, 0.16);
      }

      :host .stats-grid article > .icon {
        width: 42px;
        height: 42px;
        padding: 8px;
        border-radius: 10px;
        background: rgba(107, 33, 168, 0.28);
      }

      :host .stats-grid strong {
        display: block;
        color: #fff;
        font-size: 1.55rem;
      }

      :host .stats-grid span {
        color: rgba(250, 249, 246, 0.48);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .timeline h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 26px;
        color: #fff;
        font-size: 1.65rem;
      }

      :host .timeline,
      :host .quiz-section {
        margin-bottom: 42px;
      }

      :host .era-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 5px;
      }

      :host .era-row .era {
        margin: 0;
      }

      :host .visibility-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .visibility-badge.public {
        border: 1px solid rgba(212, 175, 55, 0.45);
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
      }

      :host .visibility-badge.private {
        border: 1px solid rgba(167, 139, 250, 0.45);
        background: rgba(107, 33, 168, 0.24);
        color: #ddd6fe;
      }

      :host .chapter-list {
        display: grid;
        gap: 16px;
      }

      :host .chapter-wrap {
        position: relative;
      }

      :host .connector {
        position: absolute;
        left: 39px;
        top: 88px;
        width: 4px;
        height: 28px;
        border-radius: 999px;
        background: rgba(212, 175, 55, 0.12);
      }

      :host .chapter-card {
        position: relative;
        display: flex;
        gap: 22px;
        padding: 22px;
        border: 2px solid rgba(212, 175, 55, 0.3);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.58);
        transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
      }

      :host .chapter-card[data-enabled="true"] {
        cursor: pointer;
      }

      :host .chapter-card[data-enabled="true"]:hover {
        border-color: var(--matheo-gold);
        transform: translateY(-1px);
        background: rgba(15, 23, 42, 0.74);
      }

      :host .chapter-card:has(.card-menu-trigger[aria-expanded="true"]) {
        border-color: rgba(212, 175, 55, 0.55);
      }

      :host .chapter-card.disabled {
        opacity: 0.52;
        filter: grayscale(0.75);
      }

      :host .chapter-card.guest-card[data-enabled="true"] .chapter-top {
        margin-bottom: 0;
      }

      :host .chapter-icon {
        width: 80px;
        height: 80px;
        display: grid;
        place-items: center;
        flex: none;
        border: 2px solid var(--matheo-gold);
        border-radius: 50%;
        background: linear-gradient(135deg, #6b21a8, #5b21b6);
      }

      :host .chapter-icon .icon {
        width: 34px;
        height: 34px;
      }

      :host .chapter-content {
        min-width: 0;
        flex: 1;
      }

      :host .chapter-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }

      :host .card-menu-wrap {
        position: relative;
        flex: none;
      }

      :host .card-menu-trigger {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(212, 175, 55, 0.32);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.72);
        color: var(--matheo-gold);
        cursor: pointer;
      }

      :host .card-menu-trigger .icon {
        width: 18px;
        height: 18px;
      }

      :host .card-menu-trigger:hover,
      :host .card-menu-trigger[aria-expanded="true"] {
        border-color: var(--matheo-gold);
        background: rgba(212, 175, 55, 0.14);
      }

      :host .card-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 20;
        min-width: 168px;
        overflow: hidden;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 16px 40px rgba(2, 6, 23, 0.32);
      }

      :host .card-menu-item {
        display: block;
        width: 100%;
        padding: 11px 14px;
        border: 0;
        background: transparent;
        color: rgba(250, 249, 246, 0.88);
        font-size: 0.84rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      :host .card-menu-item + .card-menu-item {
        border-top: 1px solid rgba(250, 249, 246, 0.08);
      }

      :host .card-menu-item:hover {
        background: rgba(212, 175, 55, 0.1);
      }

      :host .card-menu-item-danger {
        color: #ff8fa8;
      }

      :host .card-menu-item-danger:hover {
        background: rgba(255, 111, 143, 0.12);
      }

      :host .era {
        margin: 0 0 5px;
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .chapter-top h2 {
        margin: 0 0 5px;
        color: #fff;
        font-size: 1.35rem;
      }

      :host .subtitle,
      :host .locked-copy {
        margin: 0;
        color: rgba(250, 249, 246, 0.6);
      }

      @media (max-width: 780px) {
        :host .header-inner,
        :host .header-actions,
        :host .chapter-top {
          align-items: stretch;
          flex-direction: column;
        }

        :host .player-box {
          justify-content: space-between;
          padding-right: 0;
          border-right: 0;
          text-align: center;
        }

        :host .stats-grid {
          grid-template-columns: 1fr;
        }

        :host .chapter-card {
          flex-direction: column;
        }

        :host .connector {
          display: none;
        }
      }

      :host .create-modal {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(4px);
      }

      :host .create-modal-panel {
        width: min(520px, 100%);
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      :host .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      :host .modal-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .modal-header h2 {
        margin: 0;
        color: #fff;
        font-size: 1.55rem;
        line-height: 1.2;
      }

      :host .admin-action-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .admin-action-copy strong {
        color: #fff;
      }

      :host .modal-message {
        margin: 0 0 18px;
        color: var(--matheo-danger, #ff8fa8);
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

      :host .modal-submit-danger {
        background: #dc2626;
        color: #fff;
      }

      :host .modal-submit:disabled,
      :host .modal-cancel:disabled,
      :host .modal-close:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    `;
  }
}
