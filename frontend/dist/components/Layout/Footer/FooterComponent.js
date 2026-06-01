import { BaseComponent } from "../../BaseComponent.js";
export class FooterComponent extends BaseComponent {
    constructor(container) {
        super(container, "matheo-shell-footer");
    }
    init() {
        this.render(`<span class="sr-only">Matheopolis persistent footer</span>`, `
      :host {
        display: none;
      }
    `);
        this.bindEvents();
    }
    bindEvents() { }
}
