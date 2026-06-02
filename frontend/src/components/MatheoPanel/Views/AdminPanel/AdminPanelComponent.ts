import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { icon } from "../../../../utils/icons.js";

export class AdminPanelComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-admin-panel-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement de l'administration...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {}

  private async load(): Promise<void> {
    const teachers = await this.services.adminManagement.getTeachers();
    this.render(`
      <header class="view-header">
        <p>Administration</p>
        <h1>Gestion Enseignants</h1>
      </header>
      <section class="admin-panel">
        ${icon("graduation")}
        <div>
          <strong>${teachers.length}</strong>
          <span>enseignant(s) en attente de donnees backend stabilisees</span>
        </div>
      </section>
    `, this.style());
  }

  private style(): string {
    return `
      :host .view-loading {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p {
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

      :host .admin-panel {
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
        font-size: 2rem;
      }

      :host span {
        color: rgba(250, 249, 246, 0.62);
      }
    `;
  }
}
