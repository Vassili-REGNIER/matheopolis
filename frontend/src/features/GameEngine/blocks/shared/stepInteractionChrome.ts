import type {
  StepInteractionHandlers,
  StepListen,
  StepQuery
} from "../../../../models/game-engine/StepInteractionChrome.js";
import { icon } from "../../../../utils/icons.js";

export function renderStepInteractionChrome(): string {
  return `
    <div class="completion-banner" data-completion-banner hidden>
      <p data-completion-message></p>
    </div>
    <div class="step-actions">
      <button type="button" class="validate-button" data-validate hidden>${icon("check")} Valider</button>
      <button type="button" class="next-button" data-next hidden>Suivant</button>
    </div>
  `;
}

export function stepInteractionChromeStyles(): string {
  return `
    :host .completion-banner {
      min-height: 40px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border: 1px solid rgba(124, 242, 154, 0.32);
      border-radius: 10px;
      background: rgba(124, 242, 154, 0.1);
      color: #fff;
    }

    :host .completion-banner[hidden] {
      display: none;
    }

    :host .completion-banner p {
      margin: 0;
      font-weight: 900;
      line-height: 1.3;
      color: #7cf29a;
      overflow-wrap: anywhere;
    }

    :host .step-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }

    :host .step-actions button {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 16px;
      border-radius: 10px;
      font-weight: 900;
      cursor: pointer;
    }

    :host .step-actions button[hidden] {
      display: none;
    }

    :host .validate-button,
    :host .next-button {
      border: 0;
      background: var(--matheo-gold);
      color: #0f172a;
    }

    :host .validate-button {
      min-height: 44px;
      padding: 0 12px;
    }

    :host .next-button {
      min-height: 44px;
    }

    :host .validate-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    :host .step-actions button .icon {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 520px) {
      :host .step-actions,
      :host .step-actions button {
        width: 100%;
      }

      :host .completion-banner {
        padding: 10px 12px;
      }
    }
  `;
}

export function bindStepInteractionChrome(
  query: StepQuery,
  listen: StepListen,
  handlers: StepInteractionHandlers
): void {
  const hintButton = query<HTMLButtonElement>(".hint-button");
  if (hintButton !== null) {
    listen(hintButton, "click", handlers.onHint);
  }

  const validateButton = query<HTMLButtonElement>("[data-validate]");
  if (validateButton !== null) {
    listen(validateButton, "click", handlers.onValidate);
  }

  const nextButton = query<HTMLButtonElement>("[data-next]");
  if (nextButton !== null) {
    listen(nextButton, "click", handlers.onNext);
  }
}

export function showStepCompletion(query: StepQuery, message: string): void {
  const banner = query<HTMLElement>("[data-completion-banner]");
  const messageNode = query<HTMLElement>("[data-completion-message]");
  if (banner !== null) {
    banner.hidden = false;
  }
  if (messageNode !== null) {
    messageNode.textContent = message;
  }

  setStepValidateVisible(query, false);

  const hintButton = query<HTMLButtonElement>("[data-hint]");
  if (hintButton !== null) {
    hintButton.hidden = true;
  }

  const nextButton = query<HTMLButtonElement>("[data-next]");
  if (nextButton !== null) {
    nextButton.hidden = false;
  }
}

export function setStepValidateVisible(
  query: StepQuery,
  visible: boolean,
  enabled = true
): void {
  const validateButton = query<HTMLButtonElement>("[data-validate]");
  if (validateButton === null) {
    return;
  }

  validateButton.hidden = !visible;
  validateButton.disabled = !enabled;
}
