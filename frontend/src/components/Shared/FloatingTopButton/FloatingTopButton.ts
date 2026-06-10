import { icon } from "../../../utils/icons.js";

type ClickListener = (event: MouseEvent) => void;

type RegisterClickListener = (
  target: HTMLElement,
  type: "click",
  listener: ClickListener
) => void;

const FLOATING_TOP_BUTTON_SELECTOR = '[data-action="top"]';

export function floatingTopButtonTemplate(): string {
  return `
    <button class="top-button floating-top-button" type="button" data-action="top" aria-label="Haut de page">
      ${icon("arrowUp")} Haut de page
    </button>
  `;
}

export function floatingTopButtonStyles(): string {
  return `
    :host .top-button {
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 1px solid rgba(212, 175, 55, 0.38);
      border-radius: 10px;
      padding: 0 14px;
      background: rgba(15, 23, 42, 0.54);
      color: var(--matheo-gold);
      font-weight: 900;
      cursor: pointer;
    }

    :host .top-button:disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }

    :host .floating-top-button {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 40;
      box-shadow: 0 16px 38px rgba(2, 6, 23, 0.28);
    }

    @media (max-width: 780px) {
      :host .floating-top-button {
        right: 14px;
        bottom: 14px;
      }
    }
  `;
}

export function bindFloatingTopButton(
  root: HTMLElement | null,
  registerClickListener: RegisterClickListener,
  targetSelector: string
): void {
  if (root === null) {
    return;
  }

  const topButton = root.querySelector<HTMLButtonElement>(FLOATING_TOP_BUTTON_SELECTOR);
  if (topButton === null) {
    return;
  }

  registerClickListener(topButton, "click", () => {
    root.querySelector<HTMLElement>(targetSelector)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}
