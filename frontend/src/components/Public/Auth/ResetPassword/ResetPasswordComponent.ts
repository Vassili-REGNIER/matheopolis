import { BaseComponent } from "../../../BaseComponent.js";
import type { Router } from "../../../../router/Router.js";
import { icon } from "../../../../utils/icons.js";

export class ResetPasswordComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router
  ) {
    super(container, "matheo-reset");
  }

  public init(): void {
    this.render(`
      <article class="reset-card">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour</button>
        <div class="emblem">${icon("lock")}</div>
        <h1>Recuperation d'acces</h1>
        <form>
          <label>
            <span>Email ou pseudo</span>
            <input required autocomplete="username">
          </label>
          <p class="message" role="status" aria-live="polite"></p>
          <button type="submit">${icon("arrowRight")} Continuer</button>
        </form>
      </article>
    `, `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      }

      :host .reset-card {
        width: min(430px, 100%);
        padding: 32px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 22px;
        background: rgba(15, 23, 42, 0.86);
        box-shadow: var(--matheo-shadow);
      }

      :host .icon {
        width: 18px;
        height: 18px;
      }

      :host .back-button {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        padding: 0;
        border: 0;
        background: transparent;
        color: rgba(250, 249, 246, 0.48);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .emblem {
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        margin: 28px auto 14px;
        border-radius: 18px;
        background: rgba(212, 175, 55, 0.16);
        color: var(--matheo-gold);
      }

      :host .emblem .icon {
        width: 32px;
        height: 32px;
      }

      :host h1 {
        margin: 0 0 24px;
        text-align: center;
        color: #fff;
      }

      :host form,
      :host label {
        display: grid;
        gap: 12px;
      }

      :host label span {
        color: rgba(250, 249, 246, 0.7);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host input {
        height: 46px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .message {
        min-height: 20px;
        margin: 0;
        color: var(--matheo-gold);
      }

      :host form button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null) {
      this.listen(back, "click", () => this.router.navigate("/login"));
    }

    const form = this.query<HTMLFormElement>("form");
    const message = this.query<HTMLParagraphElement>(".message");
    if (form !== null && message !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        message.textContent = "Si un compte existe, la demande de recuperation sera traitee.";
      });
    }
  }
}
