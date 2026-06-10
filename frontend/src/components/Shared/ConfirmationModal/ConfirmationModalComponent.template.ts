import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";
import type {
  ConfirmationModalAction,
  ConfirmationModalActionType,
  ConfirmationModalConfig
} from "../../../models/components/ConfirmationModal.js";

function actionContent(action: ConfirmationModalAction, isProcessing: boolean): string {
  const label = isProcessing && action.processingLabel !== undefined
    ? action.processingLabel
    : action.label;
  const iconMarkup = action.iconName === undefined || isProcessing
    ? ""
    : icon(action.iconName);

  return `${iconMarkup}${escapeHtml(label)}`;
}

function actionButtonTemplate(
  actionType: ConfirmationModalActionType,
  action: ConfirmationModalAction | null,
  isProcessing: boolean
): string {
  if (action === null) {
    return "";
  }

  const isDanger = action.variant === "danger";
  const className = actionType === "confirm"
    ? `modal-submit${isDanger ? " modal-submit-danger" : ""}`
    : "modal-cancel";

  return `
    <button
      class="${className}"
      type="button"
      data-confirmation-modal-action="${actionType}"
      ${isProcessing ? "disabled" : ""}
    >
      ${actionContent(action, isProcessing)}
    </button>
  `;
}

export function confirmationModalTemplate(config: ConfirmationModalConfig): string {
  const isProcessing = config.isProcessing ?? false;
  const titleId = `${config.id}-title`;
  const cancelAction = config.cancelAction === undefined
    ? { label: "Annuler" }
    : config.cancelAction;
  const secondaryAction = config.secondaryAction ?? null;
  const confirmAction = config.confirmAction ?? null;
  const actionsClass = config.actionsLayout === "split"
    ? "modal-actions modal-actions-split"
    : "modal-actions";
  const overlayClass = config.overlayClass === undefined ? "" : ` ${config.overlayClass}`;
  const panelClass = config.panelClass === undefined ? "" : ` ${config.panelClass}`;

  return `
    <div class="create-modal confirmation-modal${overlayClass}" role="presentation" data-confirmation-modal-overlay>
      <section class="create-modal-panel${panelClass}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <header class="modal-header">
          <div>
            <p>${escapeHtml(config.eyebrow)}</p>
            <h2 id="${titleId}">${escapeHtml(config.title)}</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            data-confirmation-modal-action="cancel"
            aria-label="Fermer"
            ${isProcessing ? "disabled" : ""}
          >
            ${icon("x")}
          </button>
        </header>
        <div class="modal-copy">
          ${config.bodyHtml}
        </div>
        ${config.message !== undefined && config.message.trim().length > 0
          ? `<p class="modal-message">${escapeHtml(config.message)}</p>`
          : ""}
        <div class="${actionsClass}">
          ${actionButtonTemplate("cancel", cancelAction, isProcessing)}
          ${actionButtonTemplate("secondary", secondaryAction, isProcessing)}
          ${actionButtonTemplate("confirm", confirmAction, isProcessing)}
        </div>
      </section>
    </div>
  `;
}
