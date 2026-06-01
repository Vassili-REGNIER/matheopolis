import { BaseComponent } from "../../components/BaseComponent.js";
import type { GameStep, StepCompleteDetail } from "../../models/GameConfig.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { icon } from "../../utils/icons.js";
import { DialogueBlockComponent } from "./blocks/DialogueBlockComponent.js";
import { InfoBlockComponent } from "./blocks/InfoBlockComponent.js";
import { RiddleBlockComponent } from "./blocks/RiddleBlockComponent.js";
import { TutorialBlockComponent } from "./blocks/TutorialBlockComponent.js";
import { getScenario } from "./configs/index.js";
import { SequenceManager } from "./core/SequenceManager.js";

export class GameContainerComponent extends BaseComponent {
  private brain: SequenceManager | null = null;
  private currentBlock: BaseComponent | null = null;
  private playToken = "";
  private score = 0;
  private ending = false;

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices,
    private readonly riddleId: number
  ) {
    super(container, "matheo-game-container");
  }

  public init(): void {
    this.renderShell("Chargement de l'epreuve...");
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

    const blockHost = this.query<HTMLElement>(".block-host");
    if (blockHost !== null) {
      this.listenTo(blockHost, "stepComplete", (event) => {
        const detail = (event as CustomEvent<StepCompleteDetail>).detail;
        void this.advance(detail);
      });
    }
  }

  private async start(): Promise<void> {
    const scenario = getScenario(this.riddleId);
    if (scenario === null) {
      this.renderShell("Cette epreuve n'est pas encore disponible.");
      return;
    }

    const start = await this.services.riddles.startRiddle(this.riddleId);
    this.playToken = start.playToken;
    this.brain = new SequenceManager(scenario);
    this.loadCurrentStep();
  }

  private async advance(detail?: StepCompleteDetail): Promise<void> {
    if (this.ending || this.brain === null) {
      return;
    }

    if (detail?.score !== undefined) {
      this.score += detail.score;
    }

    if (detail?.answer !== undefined) {
      await this.services.riddles.submitAttempt(this.riddleId, detail.answer, this.playToken);
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
    } else if (step.type === "tutorial") {
      this.currentBlock = new TutorialBlockComponent(host, step);
    } else if (step.type === "info") {
      this.currentBlock = new InfoBlockComponent(host, step);
    } else {
      this.currentBlock = new RiddleBlockComponent(host, step, {
        content: this.services.content
      });
    }

    this.currentBlock.init();
  }

  private async endGame(): Promise<void> {
    this.ending = true;
    await this.services.riddles.submitScore(this.riddleId, this.score, this.playToken);
    this.router.navigate("/game-home");
  }

  private renderShell(status: string): void {
    this.render(`
      <header class="game-header">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour a la carte</button>
        <div class="game-status">${icon("award")}<span>${status}</span></div>
      </header>
      <main class="block-host"></main>
    `, `
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
      :host .game-status {
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

      :host .game-status {
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
    `);
    this.bindEvents();
  }
}
