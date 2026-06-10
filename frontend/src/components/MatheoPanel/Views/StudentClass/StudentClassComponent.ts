import { BaseComponent } from "../../../BaseComponent.js";
import type { User } from "../../../../models/User.js";
import { icon } from "../../../../utils/icons.js";

export class StudentClassComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    _user: User
  ) {
    super(container, "matheo-student-class-view");
  }

  public init(): void {
    this.render(`
      <header class="view-header">
        <p>Classe</p>
        <h1>Mon espace classe</h1>
        <span>Les informations de classe seront regroupées ici prochainement.</span>
      </header>
      <section class="student-class-section student-class-section-disabled" aria-label="Fonctionnalité à venir">
        <header class="student-class-section-header">
          <div>
            <p>Espace classe</p>
            <h2>Vie de classe</h2>
            <span>Retrouvez bientôt les informations partagées par votre enseignant.</span>
          </div>
          <span class="student-class-section-badge">Bientôt disponible</span>
        </header>
        <article class="student-class-placeholder">
          ${icon("users")}
          <div>
            <h3>Fonctionnalité à venir</h3>
            <p>Cette section accueillera prochainement les détails de votre classe et les informations utiles pour suivre le travail avec votre enseignant.</p>
          </div>
        </article>
      </section>
    `, `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host .student-class-section-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0 0 6px;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header span,
      :host .student-class-section-header span,
      :host .student-class-placeholder p {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .student-class-section {
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .student-class-section-disabled {
        opacity: 0.72;
      }

      :host .student-class-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      :host .student-class-section-header h2 {
        margin: 0 0 6px;
        color: #fff;
        font-size: 1.45rem;
      }

      :host .student-class-section-badge {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.78rem;
        font-weight: 800;
        white-space: nowrap;
      }

      :host .student-class-placeholder {
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 24px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .icon {
        width: 48px;
        height: 48px;
        flex: none;
        color: var(--matheo-gold);
      }

      :host .student-class-placeholder h3 {
        margin: 0 0 8px;
        color: #fff;
        font-size: 1.25rem;
      }

      :host .student-class-placeholder p {
        margin: 0;
        line-height: 1.6;
      }

      @media (max-width: 720px) {
        :host .student-class-section-header,
        :host .student-class-placeholder {
          flex-direction: column;
        }

        :host .student-class-section-badge {
          white-space: normal;
        }
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {}
}
