import { BaseComponent } from "../../../BaseComponent.js";
import type { RegisterFormState, RegisterMode } from "../../../../models/Auth.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type { Router } from "../../../../router/Router.js";
import { registerStyles } from "./RegisterComponent.styles.js";
import { registerTemplate } from "./RegisterComponent.template.js";

const academicDomains = [
  "ac-aix-marseille.fr",
  "ac-amiens.fr",
  "ac-besancon.fr",
  "ac-bordeaux.fr",
  "ac-caen.fr",
  "ac-clermont.fr",
  "ac-corse.fr",
  "ac-creteil.fr",
  "ac-dijon.fr",
  "ac-grenoble.fr",
  "ac-guadeloupe.fr",
  "ac-guyane.fr",
  "ac-reunion.fr",
  "ac-lille.fr",
  "ac-limoges.fr",
  "ac-lyon.fr",
  "ac-martinique.fr",
  "ac-mayotte.fr",
  "ac-montpellier.fr",
  "ac-nancy-metz.fr",
  "ac-nantes.fr",
  "ac-nice.fr",
  "ac-noumea.nc",
  "ac-orleans-tours.fr",
  "ac-paris.fr",
  "ac-poitiers.fr",
  "ac-polynesie.pf",
  "ac-reims.fr",
  "ac-rennes.fr",
  "ac-rouen.fr",
  "ac-spm.fr",
  "ac-strasbourg.fr",
  "ac-toulouse.fr",
  "ac-versailles.fr",
  "ac-wf.wf"
] as const;

export class RegisterComponent extends BaseComponent {
  private activeMode: RegisterMode = "join_class";

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-register");
  }

  public init(): void {
    this.render(registerTemplate(), registerStyles());
    this.bindEvents();
    this.updateModeFields();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
      this.listen(button, "click", () => {
        const mode = button.dataset.mode;
        if (mode === "join_class" || mode === "signup") {
          this.activeMode = mode;
          this.updateModeFields();
        }
      });
    });

    const emailInput = this.query<HTMLInputElement>('input[name="email"]');
    if (emailInput !== null) {
      this.listen(emailInput, "input", () => {
        this.updateAcademicHint();
      });
    }

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

  private updateModeFields(): void {
    this.queryAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
      button.dataset.active = button.dataset.mode === this.activeMode ? "true" : "false";
    });

    const emailField = this.query<HTMLElement>('[data-field="email"]');
    const classCodeField = this.query<HTMLElement>('[data-field="classCode"]');
    const emailInput = this.query<HTMLInputElement>('input[name="email"]');
    const classInput = this.query<HTMLInputElement>('input[name="classCode"]');
    const note = this.query<HTMLParagraphElement>(".role-note");

    if (emailField !== null && emailInput !== null) {
      const isSignupMode = this.activeMode === "signup";
      emailField.hidden = !isSignupMode;
      emailInput.required = isSignupMode;
      emailInput.disabled = !isSignupMode;
      if (!isSignupMode) {
        emailInput.value = "";
      }
    }

    if (classCodeField !== null && classInput !== null) {
      const isJoinClassMode = this.activeMode === "join_class";
      classCodeField.hidden = !isJoinClassMode;
      classInput.required = isJoinClassMode;
      classInput.disabled = !isJoinClassMode;
      if (!isJoinClassMode) {
        classInput.value = "";
      }
    }

    if (note !== null) {
      if (this.activeMode === "join_class") {
        note.innerHTML = "Votre identifiant sera genere automatiquement au format prenom.nom1.";
      } else {
        note.innerHTML = "Un email academique cree automatiquement un compte enseignant.";
      }
    }

    this.updateAcademicHint();
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
      const user = state.mode === "join_class"
        ? await this.services.auth.registerStudent({
          firstName: state.firstName,
          lastName: state.lastName,
          password: state.password,
          classCode: state.classCode
        })
        : await this.services.auth.registerAccount({
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
          password: state.password
        });

      if (message !== null) {
        message.textContent = `Compte cree pour ${user.firstName}. Identifiant : ${user.username}.`;
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
      mode: this.activeMode,
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      classCode: String(formData.get("classCode") ?? "").trim()
    };
  }

  private updateAcademicHint(): void {
    const note = this.query<HTMLParagraphElement>(".academic-note");
    const emailInput = this.query<HTMLInputElement>('input[name="email"]');
    if (note === null || emailInput === null) {
      return;
    }

    note.hidden = this.activeMode !== "signup" || !this.isAcademicEmail(emailInput.value);
  }

  private isAcademicEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split("@")[1] ?? "";
    if (domain === "") {
      return false;
    }

    const normalizedDomain = domain.startsWith("www.") ? domain.slice(4) : domain;

    return academicDomains.includes(normalizedDomain as typeof academicDomains[number]);
  }
}
