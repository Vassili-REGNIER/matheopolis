import { BaseComponent } from "../../../components/BaseComponent.js";
import type { GameWonDetail, RiddleStep, StepCompleteDetail } from "../../../models/GameConfig.js";
import type { BaseGame } from "../games/BaseGame.js";
import type { BaseGameContext } from "../games/BaseGame.js";
import { getGameConstructor } from "../games/index.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";

export class RiddleBlockComponent extends BaseComponent {
  private game: BaseGame | null = null;
  private hintObserver: MutationObserver | null = null;

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
      <div class="game-shell">
        <div class="game-host"></div>
      </div>
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
      this.mountHintInCard(host);
    }

    this.bindEvents();
  }

  public override destroy(): void {
    this.hintObserver?.disconnect();
    this.hintObserver = null;
    this.game?.destroy();
    this.game = null;
    super.destroy();
  }

  protected bindEvents(): void {
    const missingButton = this.query<HTMLButtonElement>(".missing-game button");
    if (missingButton !== null) {
      this.listen(missingButton, "click", () => this.emit("stepComplete"));
    }
  }

  private mountHintInCard(host: HTMLElement): void {
    const ensureHintButton = (): void => {
      const actions = host.querySelector(".bc-actions");
      if (actions === null) {
        return;
      }

      let hintButton = actions.querySelector<HTMLButtonElement>(".hint-button");
      if (hintButton === null) {
        hintButton = document.createElement("button");
        hintButton.type = "button";
        hintButton.className = "hint-button";
        hintButton.innerHTML = `${icon("help")} Indice`;

        const submitButton = actions.querySelector(".submit-button");
        if (submitButton !== null) {
          actions.insertBefore(hintButton, submitButton);
        } else {
          actions.appendChild(hintButton);
        }

        this.listen(hintButton, "click", () => this.game?.showHint());
      }
    };

    ensureHintButton();
    this.hintObserver?.disconnect();
    this.hintObserver = new MutationObserver(ensureHintButton);
    this.hintObserver.observe(host, { childList: true, subtree: true });
  }

  private style(): string {
    return `
      :host {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      :host .game-shell {
        width: min(720px, 100%);
      }

      :host .game-host {
        width: 100%;
      }

      :host .game-host .bc-card {
        width: 100%;
        margin: 0;
        padding: 30px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.84);
        box-shadow: var(--matheo-shadow);
      }

      :host .game-host .bc-question {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
      }

      :host .game-host .bc-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }

      :host .game-host .bc-actions button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border-radius: 10px;
        font-weight: 900;
        cursor: pointer;
      }

      :host .game-host .bc-actions .hint-button {
        border: 1px solid rgba(212, 175, 55, 0.28);
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }

      :host .game-host .bc-actions .submit-button {
        border: 0;
        background: var(--matheo-gold);
        color: #0f172a;
      }

      :host .game-host .bc-actions button .icon {
        width: 18px;
        height: 18px;
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
