import { BaseComponent } from "../../../components/BaseComponent.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";
export class TutorialBlockComponent extends BaseComponent {
    step;
    hintIndex = 0;
    constructor(container, step) {
        super(container, "matheo-tutorial-block");
        this.step = step;
    }
    init() {
        this.renderTutorial("");
    }
    bindEvents() {
        const form = this.query("form");
        if (form !== null) {
            this.listen(form, "submit", (event) => {
                event.preventDefault();
                this.submit(form);
            });
        }
        const hintButton = this.query(".hint-button");
        if (hintButton !== null) {
            this.listen(hintButton, "click", () => {
                const hints = this.step.hints ?? [];
                const hint = hints[this.hintIndex % Math.max(hints.length, 1)] ?? this.step.errorMessage;
                this.hintIndex += 1;
                this.renderTutorial(hint);
            });
        }
    }
    submit(form) {
        const value = String(new FormData(form).get("answer") ?? "").trim().toLowerCase();
        if (value === this.step.expectedAnswer.trim().toLowerCase()) {
            this.renderTutorial(this.step.successMessage, true);
            window.setTimeout(() => this.emit("stepComplete"), 550);
            return;
        }
        this.renderTutorial(this.step.errorMessage);
    }
    renderTutorial(message, success = false) {
        this.render(`
      <article class="tutorial-card">
        <p class="kicker">Tutoriel</p>
        <h1>${escapeHtml(this.step.title)}</h1>
        <p class="intro">${escapeHtml(this.step.text)}</p>
        <form>
          <label>
            <span>${escapeHtml(this.step.question)}</span>
            <input name="answer" type="${this.step.inputType ?? "text"}" autocomplete="off" required>
          </label>
          <p class="message" data-success="${success ? "true" : "false"}">${escapeHtml(message)}</p>
          <div class="actions">
            <button class="hint-button" type="button">${icon("help")} Indice</button>
            <button class="submit-button" type="submit">${icon("check")} Valider</button>
          </div>
        </form>
      </article>
    `, `
      :host {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      :host .tutorial-card {
        width: min(720px, 100%);
        padding: 30px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.84);
        box-shadow: var(--matheo-shadow);
      }

      :host .kicker,
      :host label span {
        margin: 0 0 8px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host h1 {
        margin: 0 0 12px;
        color: #fff;
        font-size: clamp(2rem, 5vw, 3rem);
      }

      :host .intro {
        color: rgba(250, 249, 246, 0.76);
        line-height: 1.6;
      }

      :host form,
      :host label {
        display: grid;
        gap: 12px;
      }

      :host input {
        height: 48px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }

      :host .message {
        min-height: 22px;
        margin: 0;
        color: var(--matheo-danger);
      }

      :host .message[data-success="true"] {
        color: var(--matheo-green);
      }

      :host .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }

      :host button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border-radius: 10px;
        font-weight: 900;
      }

      :host .hint-button {
        border: 1px solid rgba(212, 175, 55, 0.28);
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }

      :host .submit-button {
        border: 0;
        background: var(--matheo-gold);
        color: #0f172a;
      }

      :host .icon {
        width: 18px;
        height: 18px;
      }
    `);
        this.bindEvents();
    }
}
