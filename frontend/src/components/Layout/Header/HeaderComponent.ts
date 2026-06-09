import { BaseComponent } from "../../BaseComponent.js";
import type { AppServices } from "../../../models/services/AppServices.js";

export class HeaderComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-shell-header");
  }

  public init(): void {
    this.render(`<span class="sr-only">Matheopolis application shell</span>`, `
      :host {
        display: none;
      }
    `);
    this.bindEvents();
  }

  public refresh(): void {
    void this.services.auth.getMe();
  }

  protected bindEvents(): void {}
}
