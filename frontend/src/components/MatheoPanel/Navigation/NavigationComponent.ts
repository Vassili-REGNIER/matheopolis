import { BaseComponent } from "../../BaseComponent.js";
import type { PanelNavItem, PanelViewId } from "../../../models/components/MatheoPanel.js";
import type { UserRole } from "../../../models/User.js";
import { icon } from "../../../utils/icons.js";

const navItems: PanelNavItem[] = [
  { id: "profile", label: "Mon profil", icon: "user", roles: ["admin", "teacher", "student", "free_user"] },
  { id: "progress", label: "Ma progression", icon: "barChart", roles: ["admin", "teacher", "student", "free_user"] },
  { id: "student-class", label: "Ma classe", icon: "users", roles: ["student"] },
  { id: "classes", label: "Mes classes", icon: "users", roles: ["teacher"] },
  { id: "quiz-management", label: "Mes questionnaires", icon: "file", roles: ["teacher"] },
  { id: "student-content-management", label: "Gestion du contenu", icon: "settings", roles: ["teacher"] },
  { id: "admin", label: "Administration", icon: "graduation", roles: ["admin"] }
];

export class NavigationComponent extends BaseComponent {
  private activeView: PanelViewId;
  private isMenuOpen = false;

  public constructor(
    container: HTMLElement,
    private readonly role: UserRole,
    activeView: PanelViewId
  ) {
    super(container, "matheo-panel-nav");
    this.activeView = activeView;
  }

  public init(): void {
    this.renderNav();
  }

  public setActive(viewId: PanelViewId): void {
    this.activeView = viewId;
    this.renderNav();
  }

  protected bindEvents(): void {
    const toggleButton = this.query<HTMLButtonElement>("[data-action='toggle-menu']");
    if (toggleButton !== null) {
      this.listen(toggleButton, "click", (event) => {
        event.stopPropagation();
        this.isMenuOpen = !this.isMenuOpen;
        this.renderNav();
      });
    }

    const menu = this.query<HTMLElement>(".nav-menu");
    if (menu !== null) {
      this.listen(menu, "click", (event) => {
        event.stopPropagation();
      });
    }

    this.queryAll<HTMLButtonElement>("[data-view]").forEach((button) => {
      this.listen(button, "click", () => {
        const view = button.dataset.view as PanelViewId | undefined;
        if (view !== undefined) {
          this.closeMenu();
          this.emit("panel:navigate", { view });
        }
      });
    });

    const gameButton = this.query<HTMLButtonElement>('[data-action="game"]');
    if (gameButton !== null) {
      this.listen(gameButton, "click", () => {
        this.closeMenu();
        this.emit("panel:game");
      });
    }

    const logoutButton = this.query<HTMLButtonElement>('[data-action="logout"]');
    if (logoutButton !== null) {
      this.listen(logoutButton, "click", () => {
        this.closeMenu();
        this.emit("panel:logout");
      });
    }

    if (this.isMenuOpen) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (target instanceof Node && this.root?.contains(target) === true) {
          return;
        }
        this.closeMenu(true);
      });

      this.listen(document, "keydown", (event) => {
        if (event.key === "Escape") {
          this.closeMenu(true);
        }
      });
    }
  }

  private renderNav(): void {
    const items = navItems.filter((item) => item.roles.includes(this.role));
    this.render(`
      <div class="nav-brand">
        <div class="brand-identity">
          <div class="brand-mark">${icon("graduation")}</div>
          <span>MATHEOPANEL</span>
        </div>
        <button
          class="nav-toggle"
          type="button"
          data-action="toggle-menu"
          aria-controls="matheo-panel-menu"
          aria-expanded="${this.isMenuOpen ? "true" : "false"}"
          aria-label="${this.isMenuOpen ? "Fermer le menu du panel" : "Ouvrir le menu du panel"}"
        >
          ${icon(this.isMenuOpen ? "x" : "menu")}
          <span>Menu</span>
        </button>
      </div>
      <div class="nav-menu" id="matheo-panel-menu" data-open="${this.isMenuOpen ? "true" : "false"}">
        <nav class="nav-list" aria-label="Navigation du panel">
          ${items.map((item) => `
            <button type="button" data-view="${item.id}" data-active="${item.id === this.activeView ? "true" : "false"}">
              ${icon(item.icon)}
              <span>${item.label}</span>
            </button>
          `).join("")}
          <button type="button" data-action="game" class="game-button">
            ${icon("gamepad")}
            <span>Retourner au jeu</span>
          </button>
        </nav>
        <div class="nav-footer">
          <button type="button" data-action="logout" class="logout-button">${icon("logOut")}<span>Déconnexion</span></button>
        </div>
      </div>
    `, `
      :host {
        min-height: 100vh;
        height: 100%;
        min-width: 0;
        max-width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        background: rgba(15, 23, 42, 0.68);
        color: #fff;
      }

      :host .icon {
        width: 20px;
        height: 20px;
        flex: none;
      }

      :host .nav-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 24px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        font-weight: 900;
        letter-spacing: 0.04em;
        min-width: 0;
      }

      :host .brand-identity {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      :host .brand-mark {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
      }

      :host .nav-toggle {
        display: none;
      }

      :host .nav-menu {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      :host .nav-list {
        flex: 1;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 22px 16px;
        overflow: auto;
        min-width: 0;
      }

      :host button {
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 0 14px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: rgba(250, 249, 246, 0.76);
        font-weight: 800;
        text-align: left;
      }

      :host button:hover,
      :host button[data-active="true"] {
        background: rgba(212, 175, 55, 0.1);
        color: var(--matheo-gold);
      }

      :host .game-button {
        margin-top: 10px;
        color: #7cf29a;
      }

      :host .game-button:hover {
        background: rgba(124, 242, 154, 0.1);
        color: #98ffb0;
      }

      :host .nav-footer {
        padding: 16px;
        border-top: 1px solid rgba(212, 175, 55, 0.2);
      }

      :host .logout-button {
        color: #ff8fa3;
      }

      :host .logout-button:hover {
        background: rgba(255, 111, 143, 0.1);
        color: #ffb0bf;
      }

      @media (max-width: 860px) {
        :host {
          min-height: auto;
          height: auto;
        }

        :host .nav-brand {
          padding: 14px 18px 10px;
        }

        :host .brand-identity span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        :host .brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 9px;
        }

        :host .nav-toggle {
          width: auto;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
          padding: 0 12px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          background: rgba(212, 175, 55, 0.1);
          color: var(--matheo-gold);
          text-align: center;
        }

        :host .nav-toggle:hover,
        :host .nav-toggle[aria-expanded="true"] {
          background: rgba(212, 175, 55, 0.18);
          color: #fff;
        }

        :host .nav-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 35;
          display: none;
          max-height: calc(100dvh - 64px);
          overflow-y: auto;
          border-bottom: 1px solid rgba(212, 175, 55, 0.22);
          background: rgba(15, 23, 42, 0.98);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.34);
        }

        :host .nav-menu[data-open="true"] {
          display: grid;
        }

        :host .nav-list {
          display: grid;
          align-items: stretch;
          gap: 8px;
          padding: 12px 14px;
          overflow: visible;
        }

        :host .nav-list button {
          width: 100%;
          min-width: 0;
          white-space: normal;
        }

        :host .game-button {
          margin-top: 0;
        }

        :host .nav-footer {
          padding: 0 14px 14px;
          border-top: 0;
        }

        :host .logout-button {
          width: 100%;
        }
      }

      @media (max-width: 520px) {
        :host .nav-brand {
          padding-inline: 14px;
        }

        :host .nav-list {
          padding-inline: 10px;
        }

        :host .nav-toggle span {
          display: none;
        }

        :host button {
          min-height: 44px;
          padding: 0 12px;
          font-size: 0.92rem;
        }
      }
    `);
    this.bindEvents();
  }

  private closeMenu(shouldRender = false): void {
    if (!this.isMenuOpen) {
      return;
    }

    this.isMenuOpen = false;
    if (shouldRender) {
      this.renderNav();
    }
  }
}
