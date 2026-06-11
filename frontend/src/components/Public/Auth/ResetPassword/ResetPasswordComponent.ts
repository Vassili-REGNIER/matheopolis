import { BaseComponent } from "../../../BaseComponent.js";
import type { Router } from "../../../../router/Router.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class ResetPasswordComponent extends BaseComponent {
  private readonly resetToken: string | null;

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices,
    resetToken: string | null = null
  ) {
    super(container, "matheo-reset");
    this.resetToken = resetToken;
  }

  public init(): void {
    const hasToken = this.resetToken !== null && this.resetToken.trim() !== "";

    this.render(`
      <article class="reset-card">
        <button class="back-button" type="button">${icon("arrowLeft")} Retour</button>
        <div class="emblem">${icon("lock")}</div>
        <h1>${hasToken ? "Nouveau mot de passe" : "Récupération d'accès"}</h1>
        <form>
          ${hasToken
            ? `
              <label>
                <span>Nouveau mot de passe</span>
                <input name="password" type="password" autocomplete="new-password" minlength="8" required>
              </label>
            `
            : `
              <label>
                <span>Email</span>
                <input name="email" type="email" autocomplete="email" required>
              </label>
            `}
          <p class="message" role="status" aria-live="polite"></p>
          <button type="submit">${icon("arrowRight")} ${hasToken ? "Mettre à jour" : "Continuer"}</button>
        </form>
      </article>
    `, this.style());
    this.bindFormEvents(hasToken);
  }

  protected bindEvents(): void {
    // Route-specific listeners are attached in bindFormEvents().
  }

  private bindFormEvents(hasToken: boolean): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null) {
      this.listen(back, "click", () => this.router.navigate("/login"));
    }

    const form = this.query<HTMLFormElement>("form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        void this.submit(form, hasToken);
      });
    }
  }

  private async submit(form: HTMLFormElement, hasToken: boolean): Promise<void> {
    const message = this.query<HTMLParagraphElement>(".message");
    const submit = this.query<HTMLButtonElement>("button[type='submit']");
    const formData = new FormData(form);

    if (message !== null) {
      message.textContent = hasToken ? "Mise à jour en cours..." : "Envoi en cours...";
      message.dataset.tone = "info";
    }
    if (submit !== null) {
      submit.disabled = true;
    }

    try {
      if (hasToken) {
        const password = String(formData.get("password") ?? "");
        await this.services.auth.resetPassword(this.resetToken ?? "", password);
        this.router.clearTokenFromUrl();
        if (message !== null) {
          message.textContent = "Mot de passe mis à jour. Vous pouvez vous connecter.";
          message.dataset.tone = "good";
        }
        window.setTimeout(() => this.router.navigate("/login"), 1800);
        return;
      }

      const email = String(formData.get("email") ?? "").trim();
      await this.services.auth.requestPasswordReset(email);
      if (message !== null) {
        message.textContent = "Si un compte existe, un lien de réinitialisation a été envoyé.";
        message.dataset.tone = "good";
      }
    } catch (error) {
      if (message !== null) {
        message.textContent = error instanceof Error ? escapeHtml(error.message) : "Action impossible.";
        message.dataset.tone = "bad";
      }
    } finally {
      if (submit !== null) {
        submit.disabled = false;
      }
    }
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        overflow-x: hidden;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      }

      :host .reset-card {
        width: min(430px, 100%);
        max-height: calc(100dvh - 48px);
        overflow-y: auto;
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

      :host .message[data-tone="good"] {
        color: #86efac;
      }

      :host .message[data-tone="bad"] {
        color: #fca5a5;
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

      @media (max-width: 420px) {
        :host {
          padding: 16px;
        }

        :host .reset-card {
          max-height: calc(100dvh - 32px);
          padding: 24px 20px;
          border-radius: 18px;
        }

        :host h1 {
          font-size: 1.45rem;
        }
      }
    `;
  }
}
