import { icon } from "../../../../utils/icons.js";

export function registerTemplate(): string {
  return `
      <div class="pattern" aria-hidden="true"></div>
      <article class="register-card">
        <button class="back-button" type="button" data-action="home">${icon("arrowLeft")} Retour &agrave; l'accueil</button>
        <div class="register-heading">
          <div class="emblem">${icon("compass")}</div>
          <h1>Portail Math&eacute;opolis</h1>
        </div>
        <div class="role-tabs" role="tablist" aria-label="Type d'inscription">
          <button type="button" data-mode="join_class">Rejoindre une classe</button>
          <button type="button" data-mode="signup">S'inscrire</button>
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
          <label data-field="email">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" placeholder="adresse@mail.fr">
          </label>
          <p class="academic-note" hidden>Email académique détecté : votre compte sera créé en tant qu'enseignant.</p>
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
          <button class="submit-button" type="submit">${icon("plus")} Créer mon compte</button>
        </form>
        <button class="login-link" type="button" data-action="login">J'ai déjà un compte</button>
      </article>
    `;
}
