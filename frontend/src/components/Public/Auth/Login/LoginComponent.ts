import { ApiError } from "../../../../models/ApiEnvelopes.js";
import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type { Router } from "../../../../router/Router.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class LoginComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-login");
  }

  public init(): void {
    this.render(`
      <div class="auth-bg" aria-hidden="true">${this.pattern()}</div>
      <article class="auth-card">
        <button class="back-button" type="button" data-action="home">${icon("arrowLeft")} Retour &agrave; l'accueil</button>
        <div class="auth-heading">
          <div class="auth-emblem">${icon("graduation")}</div>
          <h1>Espace connexion</h1>
        </div>
        <form class="login-form">
          <label>
            <span>Email ou pseudo</span>
            <input name="identifier" autocomplete="username" required>
          </label>
          <label>
            <span>Mot de passe</span>
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          <p class="form-message" role="status" aria-live="polite"></p>
          <button class="submit-button" type="submit">${icon("compass")} Se connecter</button>
        </form>
        <div class="auth-links">
          <button type="button" data-action="register">Pas encore de compte ? Cr&eacute;er un acc&egrave;s</button>
          <button type="button" data-action="reset">Mot de passe oubli&eacute;</button>
        </div>
      </article>
    `, this.style());
    this.bindEvents();
  }

  protected bindEvents(): void {
    const form = this.query<HTMLFormElement>(".login-form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        void this.submit(form);
      });
    }

    this.queryAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      this.listen(button, "click", () => {
        const action = button.dataset.action;
        if (action === "home") {
          this.router.navigate("/");
        } else if (action === "register") {
          this.router.navigate("/register");
        } else if (action === "reset") {
          this.router.navigate("/reset-password");
        }
      });
    });
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    const message = this.query<HTMLParagraphElement>(".form-message");
    const submit = this.query<HTMLButtonElement>(".submit-button");
    const formData = new FormData(form);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (message !== null) {
      message.textContent = "Connexion en cours...";
      message.dataset.tone = "info";
    }
    if (submit !== null) {
      submit.disabled = true;
    }

    try {
      const user = await this.services.auth.login({ identifier, password });
      if (message !== null) {
        message.textContent = `Bienvenue ${user.firstName}.`;
        message.dataset.tone = "good";
      }
      this.router.navigate(user.role === "teacher" || user.role === "admin" ? "/panel" : "/game-home");
    } catch (error) {
      if (message !== null) {
        if (error instanceof ApiError && error.codeName === "EMAIL_NOT_VERIFIED") {
          message.textContent = "Confirmez d'abord votre adresse email via le lien reçu à l'inscription.";
        } else {
          message.textContent = error instanceof Error ? escapeHtml(error.message) : "Connexion impossible.";
        }
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
        position: relative;
        overflow: hidden;
        padding: 24px;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 52%, #312e81);
      }

      :host .auth-bg {
        position: absolute;
        inset: 0;
        opacity: 0.12;
        pointer-events: none;
      }

      :host .auth-card {
        position: relative;
        z-index: 1;
        width: min(440px, 100%);
        padding: 32px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 22px;
        background: rgba(15, 23, 42, 0.86);
        box-shadow: var(--matheo-shadow);
        backdrop-filter: blur(18px);
      }

      :host .icon {
        width: 18px;
        height: 18px;
      }

      :host .back-button,
      :host .auth-links button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0;
        border: 0;
        background: transparent;
        color: rgba(250, 249, 246, 0.44);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .back-button:hover,
      :host .auth-links button:hover {
        color: var(--matheo-gold);
      }

      :host .auth-heading {
        margin: 30px 0;
        text-align: center;
      }

      :host .auth-emblem {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        margin: 0 auto 16px;
        border-radius: 18px;
        background: var(--matheo-gold);
        color: #0f172a;
        box-shadow: 0 14px 35px rgba(212, 175, 55, 0.22);
      }

      :host .auth-emblem .icon {
        width: 40px;
        height: 40px;
      }

      :host h1 {
        margin: 0;
        color: #fff;
        font-size: 1.65rem;
      }

      :host form {
        display: grid;
        gap: 16px;
      }

      :host label {
        display: grid;
        gap: 8px;
      }

      :host label span {
        color: rgba(250, 249, 246, 0.7);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host input {
        width: 100%;
        height: 48px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        outline: none;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host input:focus {
        border-color: rgba(212, 175, 55, 0.72);
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
      }

      :host .form-message {
        min-height: 22px;
        margin: 0;
        color: rgba(250, 249, 246, 0.64);
        font-size: 0.9rem;
      }

      :host .form-message[data-tone="good"] {
        color: var(--matheo-green);
      }

      :host .form-message[data-tone="bad"] {
        color: var(--matheo-danger);
      }

      :host .submit-button {
        min-height: 50px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .submit-button:disabled {
        opacity: 0.55;
      }

      :host .auth-links {
        display: grid;
        justify-items: center;
        gap: 12px;
        margin-top: 26px;
        padding-top: 22px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
    `;
  }

  private pattern(): string {
    return `
      <svg viewBox="0 0 800 600" preserveAspectRatio="none">
        <defs>
          <pattern id="login-grid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M35 0v70M0 35h70M0 0l70 70M70 0 0 70" stroke="#d4af37" stroke-width="0.4"/>
            <circle cx="35" cy="35" r="18" fill="none" stroke="#5b21b6" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)"/>
      </svg>
    `;
  }
}
