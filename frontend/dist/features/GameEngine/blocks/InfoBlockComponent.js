import { BaseComponent } from "../../../components/BaseComponent.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";
export class InfoBlockComponent extends BaseComponent {
    step;
    constructor(container, step) {
        super(container, "matheo-info-block");
        this.step = step;
    }
    init() {
        this.render(`
      <article class="info-card" data-theme="${this.step.theme ?? "default"}">
        <div class="info-icon">${icon(this.step.theme === "endChapter" ? "award" : "compass")}</div>
        <h1>${escapeHtml(this.step.title)}</h1>
        <p>${escapeHtml(this.step.text)}</p>
        <button type="button">${this.step.buttonText ?? "Continuer"} ${icon("arrowRight")}</button>
      </article>
    `, `
      :host {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      :host .info-card {
        width: min(720px, 100%);
        padding: 34px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.84);
        box-shadow: var(--matheo-shadow);
        text-align: center;
      }

      :host .info-icon {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        margin: 0 auto 18px;
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 100%;
        height: 100%;
      }

      :host h1 {
        margin: 0 0 14px;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(2.4rem, 7vw, 4.5rem);
      }

      :host p {
        margin: 0 auto 26px;
        color: rgba(250, 249, 246, 0.78);
        line-height: 1.65;
        max-width: 620px;
      }

      :host button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 20px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
      }

      :host button .icon {
        width: 18px;
        height: 18px;
      }
    `);
        this.bindEvents();
    }
    bindEvents() {
        const button = this.query("button");
        if (button !== null) {
            this.listen(button, "click", () => this.emit("stepComplete"));
        }
    }
}
