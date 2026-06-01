export abstract class BaseComponent {
  protected container: HTMLElement;
  protected readonly componentId: string;
  protected root: HTMLElement | null = null;

  private styleElement: HTMLStyleElement | null = null;
  private readonly disposers: Array<() => void> = [];

  public constructor(container: HTMLElement, componentId: string) {
    this.container = container;
    this.componentId = componentId;
  }

  public abstract init(): void;

  public destroy(): void {
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

  protected render(htmlTemplate: string, componentStyle?: string): void {
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

  protected abstract bindEvents(): void;

  protected query<TElement extends HTMLElement>(selector: string): TElement | null {
    return this.root?.querySelector<TElement>(selector) ?? null;
  }

  protected queryAll<TElement extends HTMLElement>(selector: string): TElement[] {
    return Array.from(this.root?.querySelectorAll<TElement>(selector) ?? []);
  }

  protected listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window | Document,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ): void {
    target.addEventListener(type, listener as EventListener);
    this.disposers.push(() => target.removeEventListener(type, listener as EventListener));
  }

  protected listenTo(target: EventTarget, type: string, listener: (event: Event) => void): void {
    target.addEventListener(type, listener);
    this.disposers.push(() => target.removeEventListener(type, listener));
  }

  protected emit<TDetail>(name: string, detail?: TDetail): void {
    this.container.dispatchEvent(new CustomEvent<TDetail>(name, {
      bubbles: true,
      detail
    }));
  }

  protected clearListeners(): void {
    while (this.disposers.length > 0) {
      const dispose = this.disposers.pop();
      if (dispose !== undefined) {
        dispose();
      }
    }
  }

  private injectStyle(cssContent: string): void {
    const style = document.createElement("style");
    style.dataset.component = this.componentId;
    style.textContent = cssContent.replaceAll(":host", `.${this.componentId}`);
    document.head.appendChild(style);
    this.styleElement = style;
  }
}
