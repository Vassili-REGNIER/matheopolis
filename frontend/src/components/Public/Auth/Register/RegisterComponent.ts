import { BaseComponent } from "../../../BaseComponent.js";
import type { RegisterFormState } from "../../../../models/Auth.js";
import type { UserRole } from "../../../../models/User.js";
import type { Router } from "../../../../router/Router.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { icon } from "../../../../utils/icons.js";

type RegisterRole = Extract<UserRole, "teacher" | "student" | "free_user">;

export class RegisterComponent extends BaseComponent {
  private activeRole: RegisterRole = "student";

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-register");
  }

  public init(): void {
    this.render(this.template(), this.style());
    this.bindEvents();
    this.updateRoleFields();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-role]").forEach((button) => {
      this.listen(button, "click", () => {
        const role = button.dataset.role;
        if (role === "teacher" || role === "student" || role === "free_user") {
          this.activeRole = role;
          this.updateRoleFields();
        }
      });
    });

    const form = this.query<HTMLFormElement>(".register-form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        void this.submit(form);
      });
    }

    this.queryAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      this.listen(button, "click", () => {
        if (button.dataset.action === "home") {
          this.router.navigate("/");
        } else if (button.dataset.action === "login") {
          this.router.navigate("/login");
        }
      });
    });
  }

  private template(): string {
    return `
      <div class="pattern" aria-hidden="true"></div>
      <article class="register-card">
        <button class="back-button" type="button" data-action="home">${icon("arrowLeft")} Retour &agrave; l'accueil</button>
        <div class="register-heading">
          <div class="emblem">${icon("compass")}</div>
          <h1>Portail Math&eacute;opolis</h1>
        </div>
        <div class="role-tabs" role="tablist" aria-label="Type de compte">
          <button type="button" data-role="student">Eleve</button>
          <button type="button" data-role="teacher">Enseignant</button>
          <button type="button" data-role="free_user">Libre</button>
        </div>
        <form class="register-form">
          <div class="two-cols">
            <label>
              <span>Nom</span>
              <input name="lastName" required placeholder="Dupont">
            </label>
            <label>
              <span>Pr&eacute;nom</span>
              <input name="firstName" required placeholder="Marc">
            </label>
          </div>
          <label>
            <span>Pseudo</span>
            <input name="username" required autocomplete="username" placeholder="Ton pseudo unique">
          </label>
          <label data-field="email">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" placeholder="adresse@mail.fr">
          </label>
          <label data-field="classCode">
            <span>Code de classe</span>
            <input name="classCode" placeholder="CLS-DEMO6A">
          </label>
          <label>
            <span>Mot de passe</span>
            <input name="password" type="password" autocomplete="new-password" minlength="8" required>
          </label>
          <p class="role-note"></p>
          <p class="form-message" role="status" aria-live="polite"></p>
          <button class="submit-button" type="submit">${icon("plus")} Creer mon compte</button>
        </form>
        <button class="login-link" type="button" data-action="login">J'ai deja un compte</button>
      </article>
    `;
  }

  private updateRoleFields(): void {
    this.queryAll<HTMLButtonElement>("[data-role]").forEach((button) => {
      button.dataset.active = button.dataset.role === this.activeRole ? "true" : "false";
    });

    const emailField = this.query<HTMLElement>('[data-field="email"]');
    const classCodeField = this.query<HTMLElement>('[data-field="classCode"]');
    const emailInput = this.query<HTMLInputElement>('input[name="email"]');
    const classInput = this.query<HTMLInputElement>('input[name="classCode"]');
    const note = this.query<HTMLParagraphElement>(".role-note");

    if (emailField !== null && emailInput !== null) {
      emailField.hidden = this.activeRole === "student";
      emailInput.required = this.activeRole === "teacher";
      emailInput.placeholder = this.activeRole === "teacher" ? "prenom.nom@ac-paris.fr" : "adresse@mail.fr";
    }

    if (classCodeField !== null && classInput !== null) {
      classCodeField.hidden = this.activeRole !== "student";
      classInput.required = false;
    }

    if (note !== null) {
      if (this.activeRole === "teacher") {
        note.innerHTML = "Les comptes enseignants utilisent un domaine academique valide.";
      } else if (this.activeRole === "student") {
        note.innerHTML = "Le code de classe est optionnel si votre professeur ne vous l'a pas encore transmis.";
      } else {
        note.innerHTML = "Le mode libre permet d'explorer sans rattachement a une classe.";
      }
    }
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    const message = this.query<HTMLParagraphElement>(".form-message");
    const submit = this.query<HTMLButtonElement>(".submit-button");
    const state = this.readFormState(form);

    if (message !== null) {
      message.textContent = "Creation du compte...";
      message.dataset.tone = "info";
    }
    if (submit !== null) {
      submit.disabled = true;
    }

    try {
      const user = state.role === "teacher"
        ? await this.services.auth.registerTeacher({
          firstName: state.firstName,
          lastName: state.lastName,
          username: state.username,
          email: state.email,
          password: state.password
        })
        : state.role === "student"
          ? await this.services.auth.registerStudent({
            firstName: state.firstName,
            lastName: state.lastName,
            username: state.username,
            password: state.password,
            classCode: state.classCode || null
          })
          : await this.services.auth.registerFreeUser({
            firstName: state.firstName,
            lastName: state.lastName,
            username: state.username,
            email: state.email || null,
            password: state.password
          });

      if (message !== null) {
        message.textContent = `Compte cree pour ${user.firstName}.`;
        message.dataset.tone = "good";
      }
      this.router.navigate(user.role === "teacher" ? "/panel" : "/intro");
    } catch (error) {
      if (message !== null) {
        message.textContent = error instanceof Error ? error.message : "Creation impossible.";
        message.dataset.tone = "bad";
      }
    } finally {
      if (submit !== null) {
        submit.disabled = false;
      }
    }
  }

  private readFormState(form: HTMLFormElement): RegisterFormState {
    const formData = new FormData(form);
    return {
      role: this.activeRole,
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      classCode: String(formData.get("classCode") ?? "").trim()
    };
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
        background: linear-gradient(135deg, #1e3a8a, #312e81 52%, #5b21b6);
      }

      :host .pattern {
        position: absolute;
        inset: 0;
        opacity: 0.1;
        background-image:
          linear-gradient(rgba(212, 175, 55, 0.28) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 175, 55, 0.28) 1px, transparent 1px);
        background-size: 64px 64px;
      }

      :host .register-card {
        position: relative;
        z-index: 1;
        width: min(520px, 100%);
        padding: 30px;
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
      :host .login-link {
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
      :host .login-link:hover {
        color: var(--matheo-gold);
      }

      :host .register-heading {
        margin: 28px 0 24px;
        text-align: center;
      }

      :host .emblem {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        color: var(--matheo-gold);
      }

      :host .emblem .icon {
        width: 52px;
        height: 52px;
      }

      :host h1 {
        margin: 0;
        color: #fff;
        font-size: 1.85rem;
      }

      :host .role-tabs {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      :host .role-tabs button {
        min-height: 38px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: rgba(255, 255, 255, 0.46);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host .role-tabs button[data-active="true"] {
        border-color: var(--matheo-gold);
        color: var(--matheo-gold);
      }

      :host form {
        display: grid;
        gap: 14px;
      }

      :host .two-cols {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      :host label {
        display: grid;
        gap: 7px;
      }

      :host label span {
        color: rgba(250, 249, 246, 0.7);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host input {
        width: 100%;
        height: 46px;
        padding: 0 13px;
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

      :host .role-note,
      :host .form-message {
        min-height: 20px;
        margin: 0;
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.86rem;
        line-height: 1.4;
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

      :host .login-link {
        margin: 22px auto 0;
        display: flex;
      }

      @media (max-width: 540px) {
        :host .two-cols {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
