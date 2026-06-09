import { BaseComponent } from "../../BaseComponent.js";
import type { AppServices } from "../../../models/services/AppServices.js";
import type { Router } from "../../../router/Router.js";
import { homeStyles } from "./HomeComponent.styles.js";
import { homeTemplate } from "./HomeComponent.template.js";

export class HomeComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-home");
  }

  public init(): void {
    this.render(homeTemplate(), homeStyles());
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      this.listen(button, "click", () => {
        const action = button.dataset.action;
        if (action === "register") {
          this.router.navigate("/register");
        } else if (action === "login") {
          this.router.navigate("/login");
        } else if (action === "guest") {
          this.services.auth.startGuestSession();
          this.router.navigate("/game-home");
        }
      });
    });
  }
}
