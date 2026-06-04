import { BaseComponent } from "../../../components/BaseComponent.js";
import type { DialogueLine, DialogueStep } from "../../../models/GameConfig.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";

export class DialogueBlockComponent extends BaseComponent {
  private index = 0;
  private history: DialogueLine[] = [];

  public constructor(
    container: HTMLElement,
    private readonly step: DialogueStep
  ) {
    super(container, "matheo-dialogue-block");
  }

  public init(): void {
    this.renderDialogue();
  }

  protected bindEvents(): void {
    const next = this.query<HTMLButtonElement>(".next-button");
    if (next !== null) {
      this.listen(next, "click", () => this.next());
    }

    const prev = this.query<HTMLButtonElement>(".prev-button");
    if (prev !== null) {
      this.listen(prev, "click", () => this.previous());
    }
  }

  private next(): void {
    const current = this.step.lines[this.index];
    if (current !== undefined) {
      this.history.push(current);
    }
    this.index += 1;
    if (this.index > this.step.lines.length) {
      this.emit("stepComplete");
      return;
    }
    this.renderDialogue();
  }

  private previous(): void {
    if (this.index === 0) {
      return;
    }
    this.index -= 1;
    this.history = this.history.slice(0, -1);
    this.renderDialogue();
  }

  private renderDialogue(): void {
    const current = this.step.lines[this.index] ?? null;
    const finished = current === null;
    this.render(`
      <div class="stars" aria-hidden="true"></div>
      <section class="dialogue-stage">
        <div class="history">
          ${this.history.map((line) => this.historyLine(line)).join("")}
        </div>
        <article class="dialogue-box ${current?.position === "right" ? "right" : "left"}">
          ${current !== null ? `<img src="${current.image ?? "./public/assets/characters/laurence.png"}" alt="${escapeHtml(current.speakerId)}">` : ""}
          <div class="dialogue-content">
            <h1>${current !== null ? escapeHtml(current.speakerId) : "Narrateur"}</h1>
            <p>${current !== null ? escapeHtml(current.text) : "Vous etes pret a commencer l'epreuve."}</p>
          </div>
          <div class="button-group">
            ${this.index > 0 && !finished ? `<button class="prev-button" type="button">${icon("arrowLeft")} Precedent</button>` : ""}
            <button class="next-button" type="button">${finished ? `Lancer le jeu ${icon("gamepad")}` : `Suivant ${icon("arrowRight")}`}</button>
          </div>
        </article>
      </section>
    `, `
      :host {
        min-height: 100%;
        display: block;
      }

      :host .dialogue-stage {
        min-height: calc(100vh - 72px);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        position: relative;
        overflow: hidden;
        padding: 36px 24px;
        background:
          radial-gradient(circle at 15% 10%, rgba(145, 215, 255, .25), transparent 28%),
          radial-gradient(circle at 80% 15%, rgba(255, 209, 102, .18), transparent 26%),
          linear-gradient(135deg, #07091c, #21134a);
      }

      :host .stars {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: radial-gradient(circle, rgba(255, 255, 255, .8) 1px, transparent 1px), radial-gradient(circle, rgba(255, 255, 255, .3) 1px, transparent 1px);
        background-size: 80px 80px, 150px 150px;
        opacity: .22;
      }

      :host .history {
        width: min(820px, 100%);
        max-height: 42vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 18px;
        position: relative;
        z-index: 1;
      }

      :host .history-item {
        width: fit-content;
        max-width: 85%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        background: rgba(20, 20, 20, 0.58);
        color: #bdc3c7;
      }

      :host .history-item img {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }

      :host .history-item strong {
        display: block;
        color: #91d7ff;
        margin-bottom: 4px;
      }

      :host .history-item p {
        margin: 0;
        line-height: 1.4;
      }

      :host .history-item.right {
        align-self: flex-end;
        flex-direction: row-reverse;
        text-align: right;
      }

      :host .dialogue-box {
        width: min(820px, 100%);
        display: flex;
        align-items: center;
        gap: 18px;
        position: relative;
        z-index: 1;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 12px;
        background: rgba(20, 20, 20, 0.42);
        backdrop-filter: blur(8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);
      }

      :host .dialogue-box.right {
        flex-direction: row-reverse;
        text-align: right;
      }

      :host .dialogue-box img {
        width: 104px;
        height: 104px;
        flex: none;
        border-radius: 50%;
        object-fit: cover;
      }

      :host .dialogue-content {
        min-width: 0;
        flex: 1;
      }

      :host h1 {
        margin: 0 0 8px;
        color: #91d7ff;
        font-size: 1.25rem;
      }

      :host .dialogue-content p {
        margin: 0;
        color: #fff;
        line-height: 1.55;
      }

      :host .button-group {
        display: flex;
        gap: 8px;
        align-self: flex-end;
        flex-wrap: wrap;
      }

      :host button {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        border-radius: 8px;
        color: #fff;
        font-weight: 900;
      }

      :host .next-button {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.15);
      }

      :host .prev-button {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: transparent;
      }

      :host .icon {
        width: 17px;
        height: 17px;
      }

      @media (max-width: 720px) {
        :host .dialogue-box,
        :host .dialogue-box.right {
          align-items: stretch;
          flex-direction: column;
          text-align: left;
        }
      }
    `);
    this.bindEvents();
  }

  private historyLine(line: DialogueLine): string {
    return `
      <div class="history-item ${line.position === "right" ? "right" : "left"}">
        <img src="${line.image ?? "./public/assets/characters/laurence.png"}" alt="${escapeHtml(line.speakerId)}">
        <div>
          <strong>${escapeHtml(line.speakerId)}</strong>
          <p>${escapeHtml(line.text)}</p>
        </div>
      </div>
    `;
  }
}
