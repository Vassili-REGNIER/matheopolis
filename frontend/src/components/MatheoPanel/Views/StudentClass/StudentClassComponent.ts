import { BaseComponent } from "../../../BaseComponent.js";
import type { User } from "../../../../models/User.js";
import { icon } from "../../../../utils/icons.js";

export class StudentClassComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly user: User
  ) {
    super(container, "matheo-student-class-view");
  }

  public init(): void {
    this.render(`
      <header class="view-header">
        <p>Classe</p>
        <h1>Mon espace classe</h1>
      </header>
      <article class="class-panel">
        ${icon("users")}
        <div>
          <span>Classe rattachee</span>
          <strong>${this.user.classId === null ? "Aucune classe pour le moment" : `Classe #${this.user.classId}`}</strong>
          <p>Votre enseignant peut suivre vos progressions depuis son espace MatheoPanel.</p>
        </div>
      </article>
    `, `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host .class-panel span {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .class-panel {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 24px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .icon {
        width: 48px;
        height: 48px;
        color: var(--matheo-gold);
      }

      :host strong {
        display: block;
        color: #fff;
        font-size: 1.25rem;
      }

      :host p {
        margin: 6px 0 0;
        color: rgba(250, 249, 246, 0.58);
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {}
}
