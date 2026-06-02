import { BaseComponent } from "../../BaseComponent.js";

export class FooterComponent extends BaseComponent {
  public constructor(container: HTMLElement) {
    super(container, "matheo-shell-footer");
  }

  public init(): void {
    this.render(`<span class="sr-only">Matheopolis persistent footer</span>`, `
      :host {
        display: none;
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {}
}
