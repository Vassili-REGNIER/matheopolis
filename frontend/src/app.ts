import { FooterComponent } from "./components/Layout/Footer/FooterComponent.js";
import { HeaderComponent } from "./components/Layout/Header/HeaderComponent.js";
import { GameHomeComponent } from "./components/GameHome/GameHomeComponent.js";
import { MatheoPanelComponent } from "./components/MatheoPanel/MatheoPanelComponent.js";
import { LoginComponent } from "./components/Public/Auth/Login/LoginComponent.js";
import { RegisterComponent } from "./components/Public/Auth/Register/RegisterComponent.js";
import { ResetPasswordComponent } from "./components/Public/Auth/ResetPassword/ResetPasswordComponent.js";
import { HomeComponent } from "./components/Public/Home/HomeComponent.js";
import { StudentIntroComponent } from "./components/Public/StudentIntro/StudentIntroComponent.js";
import { StaticQuizComponent } from "./components/Quiz/StaticQuizComponent.js";
import { NotFoundComponent } from "./components/Shared/NotFoundComponent.js";
import { GameContainerComponent } from "./features/GameEngine/GameContainerComponent.js";
import { Router } from "./router/Router.js";
import { createAppServices, type AppServices } from "./services/AppServices.js";
import { parseIntegerParam } from "./utils/dom.js";

export class App {
  private readonly services: AppServices;
  private router: Router | null = null;
  private header: HeaderComponent | null = null;
  private footer: FooterComponent | null = null;

  public constructor() {
    this.services = createAppServices();
  }

  public init(): void {
    const root = document.getElementById("app");
    if (!(root instanceof HTMLElement)) {
      throw new Error("Application root was not found.");
    }

    root.innerHTML = `
      <div class="app-shell">
        <header id="app-header"></header>
        <main id="main-content"></main>
        <footer id="app-footer"></footer>
      </div>
    `;

    const headerRoot = document.getElementById("app-header");
    const footerRoot = document.getElementById("app-footer");
    if (!(headerRoot instanceof HTMLElement) || !(footerRoot instanceof HTMLElement)) {
      throw new Error("Application shell was not mounted correctly.");
    }

    this.header = new HeaderComponent(headerRoot, this.services);
    this.footer = new FooterComponent(footerRoot);
    this.header.init();
    this.footer.init();

    this.router = new Router("main-content", this.services);
    this.setupRoutes(this.router);
    this.bindEvents();
    this.router.start();
  }

  private setupRoutes(router: Router): void {
    router.addRoute("/", () => new HomeComponent(this.mainContainer(), router, this.services));
    router.addRoute("/login", () => new LoginComponent(this.mainContainer(), router, this.services));
    router.addRoute("/register", () => new RegisterComponent(this.mainContainer(), router, this.services));
    router.addRoute("/reset-password", () => new ResetPasswordComponent(this.mainContainer(), router));
    router.addRoute("/intro", () => new StudentIntroComponent(this.mainContainer(), router), { protectedRoute: true });
    router.addRoute("/game-home", () => new GameHomeComponent(this.mainContainer(), router, this.services), { protectedRoute: true });
    router.addRoute("/panel", () => new MatheoPanelComponent(this.mainContainer(), router, this.services), { protectedRoute: true, allowGuest: false });
    router.addRoute("/quiz/matheopolis", () => new StaticQuizComponent(this.mainContainer(), router, this.services), { protectedRoute: true, allowGuest: false });
    router.addRoute("/game/:chapterId", (params) => new GameContainerComponent(
      this.mainContainer(),
      router,
      this.services,
      parseIntegerParam(params.chapterId, 2)
    ), { protectedRoute: true });
    router.setNotFound((params) => new NotFoundComponent(this.mainContainer(), router, params.path ?? "/"));
  }

  private bindEvents(): void {
    window.addEventListener("auth:changed", () => this.header?.refresh());
  }

  private mainContainer(): HTMLElement {
    const main = document.getElementById("main-content");
    if (!(main instanceof HTMLElement)) {
      throw new Error("Main container was not found.");
    }
    return main;
  }
}
