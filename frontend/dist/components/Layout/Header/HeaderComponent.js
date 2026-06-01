import { BaseComponent } from "../../BaseComponent.js";
export class HeaderComponent extends BaseComponent {
    services;
    constructor(container, services) {
        super(container, "matheo-shell-header");
        this.services = services;
    }
    init() {
        this.render(`<span class="sr-only">Matheopolis application shell</span>`, `
      :host {
        display: none;
      }
    `);
        this.bindEvents();
    }
    refresh() {
        void this.services.auth.getMe();
    }
    bindEvents() { }
}
