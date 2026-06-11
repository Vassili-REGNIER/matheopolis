import { icon } from "../../../utils/icons.js";

export const BACK_TO_MAP_SELECTOR = '[data-action="back-to-map"]';

export function backToMapButtonTemplate(className = ""): string {
  const classes = ["back-button", className].filter((item) => item.length > 0).join(" ");

  return `
    <button class="${classes}" type="button" data-action="back-to-map">
      ${icon("arrowLeft")} Retour à la carte
    </button>
  `;
}

export function backToMapButtonStyles(): string {
  return `
    :host .back-button {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      max-width: 100%;
      border: 1px solid rgba(212, 175, 55, 0.38);
      border-radius: 10px;
      padding: 0 14px;
      background: rgba(15, 23, 42, 0.54);
      color: var(--matheo-gold);
      font-weight: 900;
      white-space: normal;
      text-align: center;
    }

    :host .back-button:hover {
      background: var(--matheo-gold);
      color: #0f172a;
    }
  `;
}
