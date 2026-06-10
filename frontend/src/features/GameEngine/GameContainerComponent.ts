import { BaseComponent } from "../../components/BaseComponent.js";
import type { GameStep, InfoNavigateDetail, InfoStep, RiddleQuestion, RiddleStep, StepCompleteDetail } from "../../models/GameConfig.js";
import { isPracticeRiddleStep } from "../../models/GameConfig.js";
import type { RiddleAnswerValidationRequest, RiddleAnswerValidationResult } from "../../models/game-engine/BaseGame.js";
import type { AppServices } from "../../models/services/AppServices.js";
import type { Router } from "../../router/Router.js";
import { backToMapButtonStyles, backToMapButtonTemplate, BACK_TO_MAP_SELECTOR } from "../../components/Shared/BackToMapButton/BackToMapButton.js";
import { icon } from "../../utils/icons.js";
import { DialogueBlockComponent } from "./blocks/DialogueBlock/DialogueBlockComponent.js";
import { InfoBlockComponent } from "./blocks/InfoBlock/InfoBlockComponent.js";
import { RiddleBlockComponent } from "./blocks/RiddleBlock/RiddleBlockComponent.js";
import { SequenceManager } from "./core/SequenceManager.js";

export class GameContainerComponent extends BaseComponent {
  private static readonly currentQuestionDifficulty = 1;
  private brain: SequenceManager | null = null;
  private currentBlock: BaseComponent | null = null;
  private scenarioSteps: GameStep[] = [];
  private lastCompletedInfoStep: InfoStep | null = null;
  private playToken = "";
  private score = 0;
  private ending = false;
  private viewingCourse = false;
  private isLocalOnlyRun = false;

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
    const back = this.query<HTMLButtonElement>(BACK_TO_MAP_SELECTOR);
    if (back !== null) {
      this.listen(back, "click", () => this.router.navigate("/game-home"));
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

      this.listenTo(blockHost, "infoNavigate", (event) => {
        const detail = (event as CustomEvent<InfoNavigateDetail>).detail;
        this.showInfoStepByContentId(detail.targetContentId);
      });

      this.listenTo(blockHost, "courseRequested", () => this.showLastCourse());
    }
  }

  private async start(): Promise<void> {
    const user = await this.services.auth.getMe();
    this.isLocalOnlyRun = user !== null && this.services.auth.isLocalOnlyUser(user);

    const chapter = await this.services.chapters.getChapter(this.chapterId);
    const scenario = this.normalizeScenario(chapter.scenario.steps);
    if (scenario.length === 0) {
      this.renderUnavailable();
      return;
    }

    const start = await this.services.chapters.startChapter(this.chapterId);
    this.playToken = start.playToken;
    this.scenarioSteps = this.filterScenarioQuestions(scenario);
    this.brain = new SequenceManager(this.scenarioSteps);
    this.loadCurrentStep();
  }

  private normalizeScenario(scenario: GameStep[]): GameStep[] {
    return scenario.map((step) => {
      if (step.type !== "riddle") {
        return step;
      }

      const stepQuestions = Array.isArray(step.questions) ? step.questions : [];
      const gameParamsQuestions = step.gameParams?.questions;
      const questions = stepQuestions.length > 0
        ? stepQuestions
        : this.toRiddleQuestions(gameParamsQuestions);

      return {
        ...step,
        questions,
        gameParams: {
          ...(step.gameParams ?? {}),
          questions
        }
      };
    });
  }

  private toRiddleQuestions(value: unknown): RiddleQuestion[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is Partial<RiddleQuestion> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: typeof item.id === "number" ? item.id : undefined,
        question: typeof item.question === "string" ? item.question : "",
        answer: typeof item.answer === "string" ? item.answer : undefined,
        hint: typeof item.hint === "string" ? item.hint : undefined,
        difficulty: typeof item.difficulty === "number" ? item.difficulty : 1,
        metadata: typeof item.metadata === "object" && item.metadata !== null && !Array.isArray(item.metadata)
          ? item.metadata as Record<string, unknown>
          : undefined
      }))
      .filter((question) => question.question !== "");
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
    }

    if (!practiceRiddle && detail?.score !== undefined) {
      this.score += detail.score;
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

    void this.mountBlock(step);
  }

  private async mountBlock(step: GameStep): Promise<void> {
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
    } else if (step.type === "riddle") {
      const riddleStep = step as RiddleStep;
      if (!this.isLocalOnlyRun && riddleStep.mode !== "practice" && riddleStep.riddleId !== undefined) {
        await this.services.chapters.startRiddle(riddleStep.riddleId);
      }

      this.currentBlock = new RiddleBlockComponent(host, riddleStep, {
        content: this.services.content,
        validateAnswer: (request) => this.validateRiddleAnswer(riddleStep, request)
      }, this.lastCompletedInfoStep !== null);
    } else {
      return;
    }

    this.currentBlock.init();
  }

  private async validateRiddleAnswer(
    step: RiddleStep,
    request: RiddleAnswerValidationRequest
  ): Promise<RiddleAnswerValidationResult> {
    if (this.isLocalOnlyRun || step.riddleId === undefined) {
      const expectedAnswer = request.question.answer ?? this.readMetadataAnswer(request.question.metadata);
      const isCorrect = expectedAnswer !== null
        && this.normalizeAnswer(request.answer) === this.normalizeAnswer(expectedAnswer);
      return {
        isCorrect,
        currentQuestionIndex: isCorrect ? request.questionIndex + 1 : request.questionIndex,
        score: null,
        completed: isCorrect && request.questionIndex >= step.questions.length - 1
      };
    }

    const result = await this.services.chapters.submitRiddleResponse(step.riddleId, {
      questionId: request.question.id,
      questionIndex: request.question.id === undefined ? request.questionIndex : undefined,
      answer: request.answer
    });

    return {
      isCorrect: result.isCorrect,
      currentQuestionIndex: result.progress?.currentQuestionIndex
        ?? (result.isCorrect ? request.questionIndex + 1 : request.questionIndex),
      score: result.progress?.score ?? null,
      completed: result.progress?.status === "completed"
        || (result.isCorrect && request.questionIndex >= step.questions.length - 1)
    };
  }

  private normalizeAnswer(answer: string): string {
    return answer.trim().toUpperCase();
  }

  private readMetadataAnswer(metadata: Record<string, unknown> | undefined): string | null {
    if (metadata === undefined) {
      return null;
    }

    const targetDepth = metadata.targetDepth;
    const targetAngle = metadata.targetAngle;
    if (typeof targetDepth === "number" && typeof targetAngle === "number") {
      return `${targetDepth}:${targetAngle}`;
    }

    return null;
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

    this.showTemporaryInfoStep(this.lastCompletedInfoStep);
  }

  private showInfoStepByContentId(targetContentId: string | number): void {
    const targetStep = this.scenarioSteps.find((step): step is InfoStep => {
      return step.type === "info" && !Array.isArray(step.content) && step.content?.id === targetContentId;
    });

    if (targetStep === undefined) {
      return;
    }

    this.showTemporaryInfoStep(targetStep);
  }

  private showTemporaryInfoStep(step: InfoStep): void {
    const host = this.query<HTMLElement>(".block-host");
    if (host === null) {
      return;
    }

    this.viewingCourse = true;
    this.currentBlock?.destroy();
    host.innerHTML = "";
    this.currentBlock = new InfoBlockComponent(host, step);
    this.currentBlock.init();
  }

  private renderUnavailable(): void {
    this.render(`
      <header class="game-header">
        ${backToMapButtonTemplate()}
      </header>
      <main class="block-host">
        <div class="game-unavailable">${icon("award")}<span>Cette épreuve n'est pas encore disponible.</span></div>
      </main>
    `, this.style());
    this.bindEvents();
  }

  private renderShell(): void {
    this.render(`
      ${backToMapButtonTemplate("back-button--floating")}
      <main class="block-host"></main>
    `, this.style());
    this.bindEvents();
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: grid;
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
      :host .game-unavailable {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      ${backToMapButtonStyles()}

      :host .back-button--floating {
        position: fixed;
        top: 16px;
        left: 18px;
        z-index: 20;
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid rgba(212, 175, 55, 0.32);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(12px);
        box-shadow: 0 12px 30px rgba(4, 8, 24, 0.28);
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
        width: 100%;
        min-height: 0;
      }

      @media (max-width: 640px) {
        :host .game-header {
          align-items: flex-start;
          flex-direction: column;
        }

        :host .back-button--floating {
          top: 10px;
          left: 10px;
        }
      }
    `;
  }
}
