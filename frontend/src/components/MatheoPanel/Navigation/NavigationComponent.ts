import { BaseComponent } from "../../BaseComponent.js";
import type { UserRole } from "../../../models/User.js";
import { icon, type IconName } from "../../../utils/icons.js";

export type PanelViewId = "profile" | "progress" | "student-class" | "classes" | "quiz-management" | "student-content-management" | "admin";

export interface PanelNavItem {
  id: PanelViewId;
  label: string;
  icon: IconName;
  roles: UserRole[];
}

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
    this.queryAll<HTMLButtonElement>("[data-view]").forEach((button) => {
      this.listen(button, "click", () => {
        const view = button.dataset.view as PanelViewId | undefined;
        if (view !== undefined) {
          this.emit("panel:navigate", { view });
        }
      });
    });

    const gameButton = this.query<HTMLButtonElement>('[data-action="game"]');
    if (gameButton !== null) {
      this.listen(gameButton, "click", () => this.emit("panel:game"));
    }

    const logoutButton = this.query<HTMLButtonElement>('[data-action="logout"]');
    if (logoutButton !== null) {
      this.listen(logoutButton, "click", () => this.emit("panel:logout"));
    }
  }

  private renderNav(): void {
    const items = navItems.filter((item) => item.roles.includes(this.role));
    this.render(`
      <div class="nav-brand">
        <div class="brand-mark">${icon("graduation")}</div>
        <span>MATHEOPANEL</span>
      </div>
      <nav class="nav-list">
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
        <button type="button" data-action="logout" class="logout-button">${icon("logOut")}<span>Deconnexion</span></button>
      </div>
    `, `
      :host {
        min-height: 100vh;
        height: 100%;
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
        gap: 12px;
        padding: 24px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        font-weight: 900;
        letter-spacing: 0.04em;
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

      :host .nav-list {
        flex: 1;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 22px 16px;
        overflow: auto;
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
    `);
    this.bindEvents();
  }
}
