import { BaseComponent } from "../BaseComponent.js";
import type { Router } from "../../router/Router.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";

export class NotFoundComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly path: string
  ) {
    super(container, "matheo-not-found");
  }

  public init(): void {
    this.render(`
      <div class="nf-shell">
        <div class="nf-panel">
          <div class="nf-icon">${icon("compass")}</div>
          <p class="nf-kicker">Route inconnue</p>
          <h1>Cette porte ne mène nulle part</h1>
          <p class="nf-copy">La route <strong>${escapeHtml(this.path)}</strong> n'existe pas dans Math&eacute;opolis.</p>
          <button class="nf-home" type="button">${icon("home")} Retour à l'accueil</button>
        </div>
      </div>
    `, `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 58%, #312e81);
      }

      :host .nf-panel {
        width: min(560px, 100%);
        padding: 32px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.82);
        box-shadow: var(--matheo-shadow);
        text-align: center;
      }

      :host .nf-icon {
        width: 58px;
        height: 58px;
        margin: 0 auto 16px;
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 100%;
        height: 100%;
      }

      :host .nf-kicker {
        color: var(--matheo-gold);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      :host h1 {
        margin: 0 0 12px;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(2rem, 6vw, 3.2rem);
      }

      :host .nf-copy {
        color: rgba(250, 249, 246, 0.74);
      }

      :host .nf-home {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 46px;
        margin-top: 18px;
        padding: 0 18px;
        border: 1px solid var(--matheo-gold);
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
      }

      :host .nf-home .icon {
        width: 18px;
        height: 18px;
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {
    const button = this.query<HTMLButtonElement>(".nf-home");
    if (button !== null) {
      this.listen(button, "click", () => this.router.navigate("/"));
    }
  }
}
