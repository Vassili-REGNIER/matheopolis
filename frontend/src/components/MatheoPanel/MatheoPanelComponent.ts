import { BaseComponent } from "../BaseComponent.js";
import type { User, UserRole } from "../../models/User.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { AdminPanelComponent } from "./Views/AdminPanel/AdminPanelComponent.js";
import { ClassManagementComponent } from "./Views/ClassManagement/ClassManagementComponent.js";
import { ProfileComponent } from "./Views/Profile/ProfileComponent.js";
import { ProgressComponent } from "./Views/Progress/ProgressComponent.js";
import { QuizManagementComponent } from "./Views/QuizManagement/QuizManagementComponent.js";
import { StudentClassComponent } from "./Views/StudentClass/StudentClassComponent.js";
import { NavigationComponent, type PanelViewId } from "./Navigation/NavigationComponent.js";

interface PanelNavigateDetail {
  view: PanelViewId;
}

export class MatheoPanelComponent extends BaseComponent {
  private navigation: NavigationComponent | null = null;
  private activeView: BaseComponent | null = null;
  private user: User | null = null;
  private currentView: PanelViewId = "profile";

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-panel");
  }

  public init(): void {
    this.render(`
      <aside class="panel-sidebar" data-panel-nav></aside>
      <main class="panel-main">
        <div class="panel-loading">Chargement du panel...</div>
      </main>
    `, this.style());
    this.bindEvents();
    void this.load();
  }

  public override destroy(): void {
    this.navigation?.destroy();
    this.activeView?.destroy();
    super.destroy();
  }

  protected bindEvents(): void {
    const navHost = this.query<HTMLElement>("[data-panel-nav]");
    if (navHost !== null) {
      this.listenTo(navHost, "panel:navigate", (event) => {
        const detail = (event as CustomEvent<PanelNavigateDetail>).detail;
        this.mountView(detail.view);
      });
      this.listenTo(navHost, "panel:game", () => this.router.navigate("/game-home"));
      this.listenTo(navHost, "panel:logout", () => {
        void this.services.auth.logout().then(() => this.router.navigate("/"));
      });
    }
  }

  private async load(): Promise<void> {
    this.user = await this.services.auth.getMe();
    if (this.user === null) {
      this.router.navigate("/login");
      return;
    }

    this.currentView = this.defaultViewForRole(this.user.role);
    const navHost = this.query<HTMLElement>("[data-panel-nav]");
    if (navHost !== null) {
      this.navigation = new NavigationComponent(navHost, this.user.role, this.currentView);
      this.navigation.init();
    }
    this.mountView(this.currentView);
  }

  private mountView(viewId: PanelViewId): void {
    if (this.user === null) {
      return;
    }

    const host = this.query<HTMLElement>(".panel-main");
    if (host === null) {
      return;
    }

    this.activeView?.destroy();
    host.innerHTML = "";
    this.currentView = viewId;
    this.navigation?.setActive(viewId);

    if (viewId === "profile") {
      this.activeView = new ProfileComponent(host, this.services);
    } else if (viewId === "progress") {
      this.activeView = new ProgressComponent(host, this.services);
    } else if (viewId === "student-class") {
      this.activeView = new StudentClassComponent(host, this.user);
    } else if (viewId === "classes") {
      this.activeView = new ClassManagementComponent(host, this.services);
    } else if (viewId === "quiz-management") {
      this.activeView = new QuizManagementComponent(host, this.services);
    } else {
      this.activeView = new AdminPanelComponent(host, this.services);
    }

    this.activeView.init();
  }

  private defaultViewForRole(role: UserRole): PanelViewId {
    if (role === "teacher") {
      return "classes";
    }
    if (role === "admin") {
      return "admin";
    }
    return "profile";
  }

  private style(): string {
    return `
      :host {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 264px minmax(0, 1fr);
        background: #0f172a;
        color: #fff;
      }

      :host .panel-sidebar {
        min-height: 100vh;
        border-right: 1px solid rgba(212, 175, 55, 0.2);
      }

      :host .panel-main {
        min-width: 0;
        padding: 32px;
        overflow: auto;
        background: linear-gradient(135deg, #0f172a, rgba(30, 58, 138, 0.22));
      }

      :host .panel-loading {
        color: rgba(250, 249, 246, 0.62);
      }

      @media (max-width: 860px) {
        :host {
          grid-template-columns: 1fr;
        }

        :host .panel-sidebar {
          min-height: auto;
          border-right: 0;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        :host .panel-main {
          padding: 22px;
        }
      }
    `;
  }
}
