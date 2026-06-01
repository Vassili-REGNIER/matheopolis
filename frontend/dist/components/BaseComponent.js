export class BaseComponent {
    container;
    componentId;
    root = null;
    styleElement = null;
    disposers = [];
    constructor(container, componentId) {
        this.container = container;
        this.componentId = componentId;
    }
    destroy() {
        this.clearListeners();
        if (this.styleElement !== null) {
            this.styleElement.remove();
            this.styleElement = null;
        }
        if (this.root !== null && this.root.parentElement === this.container) {
            this.root.remove();
        }
        this.root = null;
    }
    render(htmlTemplate, componentStyle) {
        this.clearListeners();
        if (this.styleElement !== null) {
            this.styleElement.remove();
            this.styleElement = null;
        }
        this.container.innerHTML = `<section class="${this.componentId}" data-component="${this.componentId}">${htmlTemplate}</section>`;
        const root = this.container.firstElementChild;
        this.root = root instanceof HTMLElement ? root : null;
        if (componentStyle !== undefined && componentStyle.trim().length > 0) {
            this.injectStyle(componentStyle);
        }
    }
    query(selector) {
        return this.root?.querySelector(selector) ?? null;
    }
    queryAll(selector) {
        return Array.from(this.root?.querySelectorAll(selector) ?? []);
    }
    listen(target, type, listener) {
        target.addEventListener(type, listener);
        this.disposers.push(() => target.removeEventListener(type, listener));
    }
    listenTo(target, type, listener) {
        target.addEventListener(type, listener);
        this.disposers.push(() => target.removeEventListener(type, listener));
    }
    emit(name, detail) {
        this.container.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            detail
        }));
    }
    clearListeners() {
        while (this.disposers.length > 0) {
            const dispose = this.disposers.pop();
            if (dispose !== undefined) {
                dispose();
            }
        }
    }
    injectStyle(cssContent) {
        const style = document.createElement("style");
        style.dataset.component = this.componentId;
        style.textContent = cssContent.replaceAll(":host", `.${this.componentId}`);
        document.head.appendChild(style);
        this.styleElement = style;
    }
}
