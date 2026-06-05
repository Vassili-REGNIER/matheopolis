import { BaseComponent } from "../../../BaseComponent.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { icon } from "../../../../utils/icons.js";

const managedGames = [
  { id: 999, name: "L'Histoire de Laurence (QCM)", era: "Prologue" },
  { id: 0, name: "Conversion de base", era: "Numeration" },
  { id: 1, name: "Theoreme de Thales", era: "Geometrie" },
  { id: 2, name: "Fractions musicales", era: "Musique et fractions" }
];

export class StudentContentAccessComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-student-content-access-view");
  }

  public init(): void {
    this.renderView();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-game-id]").forEach((button) => {
      this.listen(button, "click", () => {
        const gameId = Number.parseInt(button.dataset.gameId ?? "", 10);
        if (!Number.isNaN(gameId)) {
          this.services.teacherQuizzes.setGameEnabled(gameId, !this.services.gameAccess.isEnabled(gameId));
          this.renderView();
        }
      });
    });
  }

  private renderView(): void {
    this.render(`
      <header class="view-header">
        <p>Jeux</p>
        <h1>Gestion des Acces aux Jeux</h1>
        <span>Cochez ou decochez les chapitres visibles dans l'interface eleve.</span>
      </header>
      <section class="settings-panel">
        <h2>${icon("gamepad")} Configuration de l'interface Eleve</h2>
        <div class="game-list">
          ${managedGames.map((game) => {
            const enabled = this.services.gameAccess.isEnabled(game.id);
            return `
              <article>
                <div>
                  <p>${game.era}</p>
                  <h3>${game.name}</h3>
                </div>
                <button type="button" data-game-id="${game.id}" data-enabled="${enabled ? "true" : "false"}" aria-label="${enabled ? "Desactiver" : "Activer"} ${game.name}">
                  <span></span>
                </button>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `, this.style());
    this.bindEvents();
  }

  private style(): string {
    return `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host article p {
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

      :host .view-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .settings-panel {
        width: min(760px, 100%);
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 20px;
        color: var(--matheo-gold);
        font-size: 1.25rem;
      }

      :host .icon {
        width: 22px;
        height: 22px;
      }

      :host .game-list {
        display: grid;
        gap: 12px;
      }

      :host article {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host article h3 {
        margin: 0;
        color: #fff;
      }

      :host article button {
        width: 54px;
        height: 28px;
        position: relative;
        flex: none;
        border: 0;
        border-radius: 999px;
        background: #4b5563;
      }

      :host article button[data-enabled="true"] {
        background: var(--matheo-gold);
      }

      :host article button span {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: transform 160ms ease;
      }

      :host article button[data-enabled="true"] span {
        transform: translateX(26px);
      }
    `;
  }
}
