import { BaseComponent } from "../../../BaseComponent.js";
import type { Router } from "../../../../router/Router.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class VerifyEmailComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices,
    private readonly token: string | null
  ) {
    super(container, "matheo-verify-email");
  }

  public init(): void {
    this.render(`
      <article class="verify-card">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour a la connexion</button>
        <div class="emblem">${icon("mail")}</div>
        <h1>Confirmation d'email</h1>
        <p class="message" role="status" aria-live="polite">Verification en cours...</p>
      </article>
    `, this.style());
    this.bindEvents();
    void this.verify();
  }

  protected bindEvents(): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null) {
      this.listen(back, "click", () => this.router.navigate("/login"));
    }
  }

  private async verify(): Promise<void> {
    const message = this.query<HTMLParagraphElement>(".message");
    if (message === null) {
      return;
    }

    if (this.token === null || this.token.trim() === "") {
      message.textContent = "Lien de verification invalide ou incomplet.";
      message.dataset.tone = "bad";
      return;
    }

    try {
      await this.services.auth.verifyEmail(this.token.trim());
      this.router.clearTokenFromUrl();
      message.textContent = "Adresse confirmee. Vous pouvez maintenant vous connecter.";
      message.dataset.tone = "good";
      window.setTimeout(() => this.router.navigate("/login"), 1800);
    } catch (error) {
      message.textContent = error instanceof Error
        ? escapeHtml(error.message)
        : "Verification impossible.";
      message.dataset.tone = "bad";
    }
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      }

      :host .verify-card {
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
        margin: 0 0 16px;
        text-align: center;
        color: #fff;
      }

      :host .message {
        min-height: 20px;
        margin: 0;
        text-align: center;
        color: var(--matheo-gold);
      }

      :host .message[data-tone="good"] {
        color: #86efac;
      }

      :host .message[data-tone="bad"] {
        color: #fca5a5;
      }
    `;
  }
}
