import { BaseComponent } from "../BaseComponent.js";
import type { Chapter } from "../../models/Chapter.js";
import type { ChapterProgress } from "../../models/ChapterProgress.js";
import type { QuizSummary } from "../../models/Quiz.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";

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
}

export class GameHomeComponent extends BaseComponent {
  private chapters: ChapterViewModel[] = [];
  private playerName = "";
  private isGuestMode = false;
  private exploredChapters = 0;
  private totalProgress = 0;

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
      this.listen(card, "click", () => {
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
  }

  private async load(): Promise<void> {
    const user = await this.services.auth.getMe();
    this.isGuestMode = user !== null && this.services.auth.isGuestUser(user);
    this.playerName = user === null ? "" : (user.firstName || user.username);

    const [catalog, quizzes] = await Promise.all([
      this.services.chapters.listChapters(),
      this.services.quizzes.listQuizzes()
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
    const quizCards = quizzes.map((quiz) => this.toQuizCard(quiz));
    this.chapters = this.isGuestMode ? chapterCards : [
      ...quizCards,
      ...chapterCards
    ];
    this.exploredChapters = this.chapters.filter((chapter) => chapter.progress > 0).length;
    this.totalProgress = this.chapters.length === 0
      ? 0
      : Math.round(this.chapters.reduce((total, chapter) => total + chapter.progress, 0) / this.chapters.length);
    this.renderGameHome();
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
    const answeredQuestions = quiz.progress?.currentQuestionIndex ?? 0;
    const progressPercent = quiz.questionCount === 0
      ? 0
      : Math.round((answeredQuestions / quiz.questionCount) * 100);

    return {
      id: quiz.id,
      title: quiz.title,
      subtitle: quiz.description ?? "",
      era: "Questionnaire",
      progress: progressPercent,
      progressLabel: `${answeredQuestions} / ${quiz.questionCount} questions`,
      enabled: true,
      status: quiz.progress?.status ?? "not_started",
      route: `/quiz/${quiz.id}`,
      kind: "quiz"
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

        <section class="timeline">
          <h1>${icon("map")} Votre Voyage a travers l'Histoire</h1>
          <div class="chapter-list">
            ${this.chapters.map((chapter, index) => this.chapterCard(chapter, index)).join("")}
          </div>
        </section>
      </main>
    `, this.style());
    this.bindEvents();
  }

  private chapterCard(chapter: ChapterViewModel, index: number): string {
    const enabled = chapter.enabled;
    const iconName = chapter.kind === "quiz" ? "file" : "book";
    const progressRow = this.isGuestMode ? "" : `
              <div class="progress-row">
                <div><span>${escapeHtml(chapter.progressLabel)}</span><span>${chapter.progress}%</span></div>
                <div class="bar"><span style="width: ${chapter.progress}%"></span></div>
              </div>
    `;

    return `
      <article class="chapter-wrap">
        ${index < this.chapters.length - 1 ? '<div class="connector"></div>' : ""}
        <div class="chapter-card ${enabled ? "" : "disabled"} ${this.isGuestMode ? "guest-card" : ""}" data-route-target="${escapeHtml(chapter.route)}" data-quiz-id="${chapter.kind === "quiz" ? chapter.id : ""}" data-enabled="${enabled ? "true" : "false"}" tabindex="${enabled ? "0" : "-1"}">
          <div class="chapter-icon">${enabled ? icon(iconName) : icon("lock")}</div>
          <div class="chapter-content">
            <div class="chapter-top">
              <div>
                <p class="era">${escapeHtml(chapter.era)}</p>
                <h2>${escapeHtml(chapter.title)}</h2>
                <p class="subtitle">${escapeHtml(chapter.subtitle)}</p>
              </div>
            </div>
            ${enabled ? progressRow : `
              <p class="locked-copy">Acces ferme par l'enseignant</p>
            `}
          </div>
        </div>
      </article>
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
        margin-bottom: 42px;
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
    `;
  }
}
