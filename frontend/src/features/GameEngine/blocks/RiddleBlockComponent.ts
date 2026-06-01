import { BaseComponent } from "../../../components/BaseComponent.js";
import type { GameWonDetail, RiddleStep, StepCompleteDetail } from "../../../models/GameConfig.js";
import type { BaseGame } from "../games/BaseGame.js";
import type { BaseGameContext } from "../games/BaseGame.js";
import { getGameConstructor } from "../games/index.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";

export class RiddleBlockComponent extends BaseComponent {
  private game: BaseGame | null = null;

  public constructor(
    container: HTMLElement,
    private readonly step: RiddleStep,
    private readonly context: BaseGameContext
  ) {
    super(container, "matheo-riddle-block");
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
      <div class="riddle-toolbar">
        <div>${icon("gamepad")}<span>Epreuve mathematique</span></div>
        <button class="hint-button" type="button">${icon("help")} Indice</button>
      </div>
      <div class="game-host"></div>
    `, this.style());

    const host = this.query<HTMLElement>(".game-host");
    if (host !== null) {
      this.game = new GameClass(host, this.step.difficulty, this.step.gameParams, this.context);
      this.listenTo(host, "gameWon", (event) => {
        const detail = (event as CustomEvent<GameWonDetail>).detail;
        this.emit<StepCompleteDetail>("stepComplete", {
          score: detail.score,
          answer: detail.answer
        });
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
    }

    const hintButton = this.query<HTMLButtonElement>(".hint-button");
    if (hintButton !== null) {
      this.listen(hintButton, "click", () => this.game?.showHint());
    }
  }

  private style(): string {
    return `
      :host {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      }

      :host .riddle-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.22);
        background: rgba(15, 23, 42, 0.82);
      }

      :host .riddle-toolbar div,
      :host button {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      :host .riddle-toolbar div {
        color: #fff;
        font-weight: 900;
      }

      :host button {
        min-height: 40px;
        justify-content: center;
        padding: 0 14px;
        border: 1px solid rgba(212, 175, 55, 0.36);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.1);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .game-host {
        flex: 1;
        padding: 24px;
        overflow: auto;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .missing-game {
        width: min(560px, 100%);
        margin: auto;
        padding: 28px;
        text-align: center;
      }
    `;
  }
}
