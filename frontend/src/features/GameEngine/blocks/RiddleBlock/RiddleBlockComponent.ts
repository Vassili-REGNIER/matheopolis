import { BaseComponent } from "../../../../components/BaseComponent.js";
import type {
  GameCompletedDetail,
  GameProgressDetail,
  GameValidateDetail,
  GameWonDetail,
  RiddleStep,
  StepCompleteDetail
} from "../../../../models/GameConfig.js";
import type { BaseGameContext } from "../../../../models/game-engine/BaseGame.js";
import type { BaseGame } from "../../games/BaseGame.js";
import { getGameConstructor } from "../../games/index.js";
import { riddleBlockStyles } from "./RiddleBlockComponent.styles.js";
import {
  missingGameTemplate,
  riddleBlockTemplate
} from "./RiddleBlockComponent.template.js";
import {
  bindStepInteractionChrome,
  setStepValidateVisible,
  showStepCompletion
} from "../shared/stepInteractionChrome.js";

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
      this.render(missingGameTemplate(this.step.gameId), riddleBlockStyles());
      this.bindEvents();
      return;
    }

    this.render(riddleBlockTemplate({
      step: this.step,
      isPractice: this.isPractice,
      canReturnToCourse: this.canReturnToCourse,
      activeQuestionIndex: this.activeQuestionIndex,
      taskPrompt: this.taskPrompt()
    }), riddleBlockStyles());

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
        this.updateProgress(detail.score, this.mistakes);
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
      onValidate: () => {
        void this.game?.submitAnswer();
      },
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
      messageNode.textContent = isVisible ? currentQuestion.hint ?? "Aucun indice disponible pour cette question." : "";
    }
  }
}
