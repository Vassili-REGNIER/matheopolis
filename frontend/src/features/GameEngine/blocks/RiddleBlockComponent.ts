import { BaseComponent } from "../../../components/BaseComponent.js";
import type {
  GameCompletedDetail,
  GameProgressDetail,
  GameValidateDetail,
  GameWonDetail,
  RiddleStep,
  StepCompleteDetail
} from "../../../models/GameConfig.js";
import type { BaseGameContext } from "../../../models/game-engine/BaseGame.js";
import type { BaseGame } from "../games/BaseGame.js";
import { getGameConstructor } from "../games/index.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";
import {
  bindStepInteractionChrome,
  renderStepInteractionChrome,
  setStepValidateVisible,
  showStepCompletion,
  stepInteractionChromeStyles
} from "./shared/stepInteractionChrome.js";
import { riddleInstructionPanelStyles } from "./shared/riddleInstructionPanelStyles.js";

export class RiddleBlockComponent extends BaseComponent {
  private game: BaseGame | null = null;
  private score = 0;
  private mistakes = 0;
  private activeQuestionIndex = 0;
  private visibleHintQuestionIndex: number | null = null;

  public constructor(
    container: HTMLElement,
    private readonly step: RiddleStep,
    private readonly context: BaseGameContext,
    private readonly canReturnToCourse = false
  ) {
    super(container, "matheo-riddle-block");
  }

  private get isPractice(): boolean {
    return this.step.mode === "practice";
  }

  public init(): void {
    const GameClass = getGameConstructor(this.step.gameId);
    if (GameClass === null) {
      this.render(`
        <article class="missing-game">
          <h1>Mini-jeu introuvable</h1>
          <p>${escapeHtml(this.step.gameId)}</p>
          <button type="button">Continuer</button>
        </article>
      `, this.style());
      this.bindEvents();
      return;
    }

    this.render(`
      <div class="game-shell ${this.isPractice ? "game-shell--practice" : "game-shell--challenge"}">
        <header class="riddle-header">
          <div class="riddle-heading">
            <h1>${escapeHtml(this.step.title)}</h1>
          </div>
          ${this.renderHeaderAside()}
        </header>
        <div class="riddle-layout">
          <aside class="instructions-panel ${this.isPractice ? "instructions-panel--practice" : "instructions-panel--challenge"}">
            ${this.isPractice ? '<p class="panel-mode-tag">Etape d\'apprentissage</p>' : ""}
            ${this.renderIntroText()}
            ${this.renderScoringNotice()}
            ${this.renderCurrentTask()}
            ${this.renderInstructionActions()}
            <aside class="instruction-hint" data-hint-panel hidden>
              <strong>${icon("help")} Indice</strong>
              <p data-hint-message></p>
            </aside>
          </aside>
          <section class="interaction-panel ${this.isPractice ? "interaction-panel--practice" : "interaction-panel--challenge"}" aria-label="Zone de jeu">
            <div class="game-host"></div>
            ${renderStepInteractionChrome()}
          </section>
        </div>
      </div>
    `, this.style());

    const host = this.query<HTMLElement>(".game-host");
    if (host !== null) {
      const gameParams = {
        ...(this.step.gameParams ?? {}),
        questions: this.step.questions,
        mode: this.step.mode ?? "challenge",
        title: this.step.title,
        instruction: this.step.instruction,
        completionMessage: this.step.completionMessage
      };
      this.game = new GameClass(host, gameParams, this.context);
      this.listenTo(host, "gameWon", (event) => {
        const detail = (event as CustomEvent<GameWonDetail>).detail;
        this.emit<StepCompleteDetail>("stepComplete", {
          score: detail.score,
          answer: detail.answer
        });
      });
      this.listenTo(host, "gameProgress", (event) => {
        const detail = (event as CustomEvent<GameProgressDetail>).detail;
        this.updateProgress(detail.score, detail.mistakes, detail.currentQuestionIndex);
      });
      this.listenTo(host, "gameCompleted", (event) => {
        const detail = (event as CustomEvent<GameCompletedDetail>).detail;
        showStepCompletion(this.query.bind(this), detail.message);
      });
      this.listenTo(host, "gameValidate", (event) => {
        const detail = (event as CustomEvent<GameValidateDetail>).detail;
        setStepValidateVisible(this.query.bind(this), detail.visible, detail.enabled);
      });
      this.game.start();
    }

    this.bindEvents();
  }

  public override destroy(): void {
    this.game?.destroy();
    this.game = null;
    super.destroy();
  }

  protected bindEvents(): void {
    const missingButton = this.query<HTMLButtonElement>(".missing-game button");
    if (missingButton !== null) {
      this.listen(missingButton, "click", () => this.emit("stepComplete"));
      return;
    }

    bindStepInteractionChrome(this.query.bind(this), this.listen.bind(this), {
      onHint: () => this.showShellHint(),
      onValidate: () => this.game?.submitAnswer(),
      onNext: () => this.game?.proceedToNextStep()
    });

    const courseButton = this.query<HTMLButtonElement>(".riddle-course-button");
    if (courseButton !== null) {
      this.listen(courseButton, "click", () => this.emit("courseRequested"));
    }
  }

  private updateProgress(score: number, mistakes: number, currentQuestionIndex?: number): void {
    if (this.isPractice) {
      if (currentQuestionIndex !== undefined) {
        this.activeQuestionIndex = currentQuestionIndex;
        this.updateCurrentQuestion();
      }
      return;
    }

    this.score = score;
    this.mistakes = mistakes;
    if (currentQuestionIndex !== undefined) {
      this.activeQuestionIndex = currentQuestionIndex;
    }

    const scoreNode = this.query<HTMLElement>("[data-score]");
    if (scoreNode !== null) {
      scoreNode.textContent = String(this.score);
    }

    const mistakesNode = this.query<HTMLElement>("[data-mistakes]");
    if (mistakesNode !== null) {
      mistakesNode.textContent = String(this.mistakes);
    }

    this.updateCurrentQuestion();
  }

  private renderHeaderAside(): string {
    if (this.isPractice) {
      return `
        <aside class="mode-indicator mode-indicator--practice" aria-label="Indicateurs du tutoriel">
          <span class="mode-indicator-label">Mode tutoriel</span>
          <ul class="mode-indicator-list">
            <li>Sans score</li>
            <li>Essais illimites</li>
          </ul>
        </aside>
      `;
    }

    return `
      <dl class="riddle-stats mode-indicator--challenge" aria-label="Progression de l'epreuve">
        <div>
          <dt>Score</dt>
          <dd data-score>0</dd>
        </div>
        <div>
          <dt>Erreurs</dt>
          <dd data-mistakes>0</dd>
        </div>
      </dl>
    `;
  }

  private renderIntroText(): string {
    if (this.step.introText === undefined || this.step.introText === "") {
      return "";
    }

    return `<p class="intro-text">${escapeHtml(this.step.introText)}</p>`;
  }

  private renderScoringNotice(): string {
    if (this.isPractice) {
      return "";
    }

    return `
      <p class="score-notice">
        ${icon("award")}
        <span>Épreuve scorée : le score et les erreurs sont pris en compte.</span>
      </p>
    `;
  }

  private renderCurrentTask(): string {
    if (this.step.questions.length === 0) {
      return `
        <section class="current-task" aria-label="Consigne">
          <h2>Consigne</h2>
          <p>${escapeHtml(this.step.instruction)}</p>
        </section>
      `;
    }

    const currentQuestion = this.step.questions[this.activeQuestionIndex] ?? this.step.questions[0];
    if (currentQuestion === undefined) {
      return "";
    }

    const showQuestionCount = !(this.isPractice && this.step.questions.length === 1);

    return `
      <section class="current-task" aria-label="Consigne">
        <h2>Consigne</h2>
        <article class="current-question">
          ${showQuestionCount ? `<span data-question-count>${this.activeQuestionIndex + 1} / ${this.step.questions.length}</span>` : ""}
          <p data-current-prompt>${escapeHtml(this.taskPrompt())}</p>
          <strong data-current-question>${escapeHtml(currentQuestion.question)}</strong>
        </article>
      </section>
    `;
  }

  private renderInstructionActions(): string {
    const layoutClass = this.canReturnToCourse ? "instruction-actions--dual" : "";

    return `
      <div class="instruction-actions ${layoutClass}">
        ${this.canReturnToCourse ? `<button class="riddle-course-button" type="button">${icon("book")} Leçon</button>` : ""}
        <button type="button" class="hint-button" data-hint>${icon("help")} Indice</button>
      </div>
    `;
  }

  private taskPrompt(): string {
    if (this.step.gameId === "PianoFractions") {
      return "Transforme la fraction suivante :";
    }

    if (this.step.gameId === "FractalLuthier") {
      return "Reproduis la cible suivante :";
    }

    return "Convertis la valeur suivante :";
  }

  private updateCurrentQuestion(): void {
    const currentQuestion = this.step.questions[this.activeQuestionIndex];
    if (currentQuestion === undefined) {
      return;
    }

    const questionNode = this.query<HTMLElement>("[data-current-question]");
    if (questionNode !== null) {
      questionNode.textContent = currentQuestion.question;
    }

    const promptNode = this.query<HTMLElement>("[data-current-prompt]");
    if (promptNode !== null) {
      promptNode.textContent = this.taskPrompt();
    }

    const countNode = this.query<HTMLElement>("[data-question-count]");
    if (countNode !== null) {
      countNode.textContent = `${this.activeQuestionIndex + 1} / ${this.step.questions.length}`;
    }

    this.syncHintPanel();
  }

  private showShellHint(): void {
    if (this.step.questions.length === 0) {
      return;
    }

    this.visibleHintQuestionIndex = this.activeQuestionIndex;
    this.syncHintPanel();
  }

  private syncHintPanel(): void {
    const panel = this.query<HTMLElement>("[data-hint-panel]");
    const messageNode = this.query<HTMLElement>("[data-hint-message]");
    const currentQuestion = this.step.questions[this.activeQuestionIndex];
    const isVisible = this.visibleHintQuestionIndex === this.activeQuestionIndex && currentQuestion !== undefined;

    if (panel !== null) {
      panel.hidden = !isVisible;
    }

    if (messageNode !== null) {
      messageNode.textContent = isVisible ? currentQuestion.hint : "";
    }
  }

  private style(): string {
    return `
      :host {
        min-height: 100%;
        display: grid;
        align-items: start;
        padding: 24px;
      }

      :host .game-shell {
        width: min(1180px, 100%);
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto;
        gap: 16px;
        border-radius: 12px;
        overflow: hidden;
      }

      :host .game-shell--practice {
        border: 1px solid rgba(94, 234, 212, 0.42);
        box-shadow:
          0 0 0 1px rgba(94, 234, 212, 0.12),
          0 18px 40px rgba(8, 47, 73, 0.28);
      }

      :host .game-shell--challenge {
        border: 1px solid rgba(212, 175, 55, 0.38);
        box-shadow:
          0 0 0 1px rgba(212, 175, 55, 0.1),
          0 18px 40px rgba(0, 0, 0, 0.22);
      }

      :host .riddle-header {
        min-height: 58px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 10px 16px;
        background: rgba(15, 23, 42, 0.9);
      }

      :host .game-shell--practice .riddle-header {
        border-bottom: 1px solid rgba(94, 234, 212, 0.14);
      }

      :host .game-shell--challenge .riddle-header {
        border-bottom: 1px solid rgba(212, 175, 55, 0.18);
      }

      :host .riddle-header h1 {
        margin: 0;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(1.55rem, 3vw, 2.35rem);
        line-height: 1.05;
      }

      :host .riddle-heading {
        display: grid;
        gap: 6px;
      }

      :host .mode-indicator {
        min-width: 168px;
        padding: 10px 12px;
        border-radius: 10px;
      }

      :host .mode-indicator--practice {
        border: 1px solid rgba(94, 234, 212, 0.34);
        background: rgba(13, 148, 136, 0.16);
      }

      :host .mode-indicator-label {
        display: block;
        margin-bottom: 8px;
        color: #99f6e4;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host .mode-indicator-list {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
        color: rgba(250, 249, 246, 0.86);
        font-size: 0.88rem;
        font-weight: 700;
      }

      :host .mode-indicator-list li {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      :host .mode-indicator-list li::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #5eead4;
        box-shadow: 0 0 8px rgba(94, 234, 212, 0.55);
      }

      :host .riddle-stats {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }

      :host .riddle-stats div {
        min-width: 92px;
        padding: 7px 10px;
        border: 1px solid rgba(212, 175, 55, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      :host .riddle-stats dt {
        color: rgba(250, 249, 246, 0.68);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      :host .riddle-stats dd {
        margin: 0;
        color: var(--matheo-gold);
        font-size: 1.25rem;
        font-weight: 900;
      }

      :host .riddle-layout {
        display: grid;
        grid-template-columns: minmax(220px, 0.8fr) minmax(0, 2fr);
        align-items: stretch;
        gap: 16px;
        min-height: 0;
        padding: 0 16px 16px;
      }

      :host .instructions-panel,
      :host .interaction-panel {
        min-width: 0;
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.78);
      }

      :host .instructions-panel--practice,
      :host .interaction-panel--practice {
        border: 1px solid rgba(94, 234, 212, 0.22);
      }

      :host .instructions-panel--challenge,
      :host .interaction-panel--challenge {
        border: 1px solid rgba(212, 175, 55, 0.24);
      }

      ${riddleInstructionPanelStyles()}

      :host .interaction-panel {
        display: grid;
        grid-template-rows: auto auto auto;
        align-content: start;
        gap: 12px;
        padding: 18px;
        overflow: visible;
      }

      :host .game-host {
        width: 100%;
        min-height: 0;
        min-width: 0;
      }

      ${stepInteractionChromeStyles()}

      :host .missing-game {
        width: min(560px, 100%);
        margin: auto;
        padding: 28px;
        text-align: center;
      }

      @media (max-width: 900px) {
        :host {
          padding: 16px;
        }

        :host .riddle-header,
        :host .riddle-stats,
        :host .mode-indicator {
          align-items: stretch;
          flex-direction: column;
        }

        :host .mode-indicator,
        :host .riddle-stats {
          width: 100%;
        }

        :host .riddle-layout {
          grid-template-columns: 1fr;
        }

        :host .riddle-stats {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
  }
}
