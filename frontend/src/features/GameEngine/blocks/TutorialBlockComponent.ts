import { BaseComponent } from "../../../components/BaseComponent.js";
import type { TutorialStep } from "../../../models/GameConfig.js";
import { escapeHtml } from "../../../utils/dom.js";
import {
  bindStepInteractionChrome,
  renderStepInteractionChrome,
  setStepValidateVisible,
  showStepCompletion,
  stepInteractionChromeStyles
} from "./shared/stepInteractionChrome.js";

export class TutorialBlockComponent extends BaseComponent {
  private hintIndex = 0;
  private completed = false;

  public constructor(
    container: HTMLElement,
    private readonly step: TutorialStep
  ) {
    super(container, "matheo-tutorial-block");
  }

  public init(): void {
    this.renderTutorial("");
  }

  protected bindEvents(): void {
    const form = this.query<HTMLFormElement>("form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        this.submit(form);
      });
    }

    bindStepInteractionChrome(this.query.bind(this), this.listen.bind(this), {
      onHint: () => this.showHint(),
      onValidate: () => {
        const activeForm = this.query<HTMLFormElement>("form");
        if (activeForm !== null) {
          this.submit(activeForm);
        }
      },
      onNext: () => this.emit("stepComplete")
    });
  }

  private showHint(): void {
    if (this.completed) {
      return;
    }

    const hints = this.step.hints ?? [];
    const hint = hints[this.hintIndex % Math.max(hints.length, 1)] ?? this.step.errorMessage;
    this.hintIndex += 1;
    this.renderTutorial(hint);
    setStepValidateVisible(this.query.bind(this), true);
  }

  private submit(form: HTMLFormElement): void {
    if (this.completed) {
      return;
    }

    const value = String(new FormData(form).get("answer") ?? "").trim().toLowerCase();
    if (value === this.step.expectedAnswer.trim().toLowerCase()) {
      this.completed = true;
      this.renderTutorial("Bonne reponse !", true);
      showStepCompletion(this.query.bind(this), this.step.completionMessage);
      return;
    }

    this.renderTutorial(this.step.errorMessage);
    setStepValidateVisible(this.query.bind(this), true);
  }

  private renderTutorial(message: string, success = false): void {
    const inputDisabled = this.completed ? "disabled" : "";
    this.render(`
      <article class="tutorial-card">
        <p class="kicker">Tutoriel</p>
        <h1>${escapeHtml(this.step.title)}</h1>
        <p class="intro">${escapeHtml(this.step.text)}</p>
        <form>
          <label>
            <span>${escapeHtml(this.step.instruction)}</span>
            <input name="answer" type="${this.step.inputType ?? "text"}" autocomplete="off" required ${inputDisabled}>
          </label>
          <p class="message" data-success="${success ? "true" : "false"}">${escapeHtml(message)}</p>
          ${renderStepInteractionChrome()}
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

      :host input:disabled {
        opacity: 0.7;
      }

      :host .message {
        min-height: 22px;
        margin: 0;
        color: var(--matheo-danger);
      }

      :host .message[data-success="true"] {
        color: var(--matheo-green);
      }

      ${stepInteractionChromeStyles()}
    `);
    this.bindEvents();

    if (this.completed) {
      showStepCompletion(this.query.bind(this), this.step.completionMessage);
    } else {
      setStepValidateVisible(this.query.bind(this), true);
    }
  }
}
