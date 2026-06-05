import { BaseComponent } from "../../components/BaseComponent.js";
import type { GameStep, InfoStep, RiddleStep, StepCompleteDetail } from "../../models/GameConfig.js";
import { isPracticeRiddleStep } from "../../models/GameConfig.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { icon } from "../../utils/icons.js";
import { DialogueBlockComponent } from "./blocks/DialogueBlockComponent.js";
import { InfoBlockComponent } from "./blocks/InfoBlockComponent.js";
import { RiddleBlockComponent } from "./blocks/RiddleBlockComponent.js";
import { getScenario } from "./configs/index.js";
import { SequenceManager } from "./core/SequenceManager.js";

export class GameContainerComponent extends BaseComponent {
  private static readonly currentQuestionDifficulty = 1;
  private brain: SequenceManager | null = null;
  private currentBlock: BaseComponent | null = null;
  private lastCompletedInfoStep: InfoStep | null = null;
  private playToken = "";
  private score = 0;
  private ending = false;
  private viewingCourse = false;

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices,
    private readonly chapterId: number
  ) {
    super(container, "matheo-game-container");
  }

  public init(): void {
    this.renderShell();
    void this.start();
  }

  public override destroy(): void {
    this.currentBlock?.destroy();
    super.destroy();
  }

  protected bindEvents(): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null) {
      this.listen(back, "click", () => this.router.navigate("/game-home"));
    }

    const course = this.query<HTMLButtonElement>(".course-button");
    if (course !== null) {
      this.listen(course, "click", () => this.showLastCourse());
    }

    const blockHost = this.query<HTMLElement>(".block-host");
    if (blockHost !== null) {
      this.listenTo(blockHost, "stepComplete", (event) => {
        if (this.viewingCourse) {
          this.viewingCourse = false;
          this.loadCurrentStep();
          return;
        }

        const detail = (event as CustomEvent<StepCompleteDetail>).detail;
        void this.advance(detail);
      });
    }
  }

  private async start(): Promise<void> {
    const scenario = getScenario(this.chapterId);
    if (scenario === null) {
      this.renderUnavailable();
      return;
    }

    const start = await this.services.chapters.startChapter(this.chapterId);
    this.playToken = start.playToken;
    this.brain = new SequenceManager(this.filterScenarioQuestions(scenario));
    this.loadCurrentStep();
  }

  private filterScenarioQuestions(scenario: GameStep[]): GameStep[] {
    return scenario.map((step) => {
      if (step.type !== "riddle") {
        return step;
      }

      return this.filterRiddleQuestions(step);
    });
  }

  private filterRiddleQuestions(step: RiddleStep): RiddleStep {
    return {
      ...step,
      questions: step.questions.filter(
        (question) => question.difficulty === GameContainerComponent.currentQuestionDifficulty
      )
    };
  }

  private async advance(detail?: StepCompleteDetail): Promise<void> {
    if (this.ending || this.brain === null) {
      return;
    }

    const currentStep = this.brain.getCurrentStep();
    const practiceRiddle = currentStep !== null && isPracticeRiddleStep(currentStep);

    if (currentStep?.type === "info" && currentStep.theme !== "endChapter") {
      this.lastCompletedInfoStep = currentStep;
      this.updateCourseButton();
    }

    if (!practiceRiddle && detail?.score !== undefined) {
      this.score += detail.score;
    }

    if (!practiceRiddle && detail?.answer !== undefined) {
      await this.services.chapters.submitAttempt(this.chapterId, detail.answer, this.playToken);
    }

    this.currentBlock?.destroy();
    this.currentBlock = null;

    if (this.brain.advanceToNextStep()) {
      this.loadCurrentStep();
      return;
    }

    await this.endGame();
  }

  private loadCurrentStep(): void {
    if (this.brain === null) {
      return;
    }

    const step = this.brain.getCurrentStep();
    if (step === null) {
      void this.endGame();
      return;
    }

    this.mountBlock(step);
  }

  private mountBlock(step: GameStep): void {
    const host = this.query<HTMLElement>(".block-host");
    if (host === null) {
      return;
    }

    this.currentBlock?.destroy();
    host.innerHTML = "";

    if (step.type === "dialogue") {
      this.currentBlock = new DialogueBlockComponent(host, step);
    } else if (step.type === "info") {
      this.currentBlock = new InfoBlockComponent(host, step);
    } else {
      this.currentBlock = new RiddleBlockComponent(host, step, {
        content: this.services.content
      });
    }

    this.currentBlock.init();
    this.updateCourseButton();
  }

  private async endGame(): Promise<void> {
    this.ending = true;
    await this.services.chapters.submitScore(this.chapterId, this.score, this.playToken);
    this.router.navigate("/game-home");
  }

  private showLastCourse(): void {
    if (this.lastCompletedInfoStep === null || this.viewingCourse) {
      return;
    }

    const host = this.query<HTMLElement>(".block-host");
    if (host === null) {
      return;
    }

    this.viewingCourse = true;
    this.currentBlock?.destroy();
    host.innerHTML = "";
    this.currentBlock = new InfoBlockComponent(host, this.lastCompletedInfoStep);
    this.currentBlock.init();
    this.updateCourseButton();
  }

  private updateCourseButton(): void {
    const course = this.query<HTMLButtonElement>(".course-button");
    if (course === null) {
      return;
    }

    course.disabled = this.lastCompletedInfoStep === null || this.viewingCourse;
  }

  private renderUnavailable(): void {
    this.render(`
      <header class="game-header">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour a la carte</button>
      </header>
      <main class="block-host">
        <div class="game-unavailable">${icon("award")}<span>Cette epreuve n'est pas encore disponible.</span></div>
      </main>
    `, this.style());
    this.bindEvents();
  }

  private renderShell(): void {
    this.render(`
      <header class="game-header">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour a la carte</button>
        <button class="course-button" type="button" disabled>${icon("book")} Retour au cours</button>
      </header>
      <main class="block-host"></main>
    `, this.style());
    this.bindEvents();
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      }

      :host .game-header {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.22);
        background: rgba(15, 23, 42, 0.86);
        backdrop-filter: blur(12px);
      }

      :host .back-button,
      :host .course-button,
      :host .game-unavailable {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      :host .back-button {
        border: 0;
        background: transparent;
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .course-button {
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid rgba(212, 175, 55, 0.36);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.1);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .course-button:disabled {
        opacity: 0.42;
        cursor: not-allowed;
      }

      :host .game-unavailable {
        min-height: 100%;
        justify-content: center;
        color: rgba(250, 249, 246, 0.72);
        font-size: 0.92rem;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .block-host {
        flex: 1;
        min-height: 0;
      }

      @media (max-width: 640px) {
        :host .game-header {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `;
  }
}
