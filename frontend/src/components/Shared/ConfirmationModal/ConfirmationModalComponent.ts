import { BaseComponent } from "../../BaseComponent.js";
import {
  CONFIRMATION_MODAL_ACTION_EVENT,
  type ConfirmationModalActionDetail,
  type ConfirmationModalActionType,
  type ConfirmationModalConfig
} from "../../../models/components/ConfirmationModal.js";
import { confirmationModalStyles } from "./ConfirmationModalComponent.styles.js";
import { confirmationModalTemplate } from "./ConfirmationModalComponent.template.js";

export class ConfirmationModalComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly config: ConfirmationModalConfig
  ) {
    super(container, "matheo-confirmation-modal");
  }

  public init(): void {
    this.render(confirmationModalTemplate(this.config), confirmationModalStyles());
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-confirmation-modal-action]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const action = button.dataset.confirmationModalAction as ConfirmationModalActionType | undefined;
        if (action !== undefined) {
          this.emitAction(action);
        }
      });
    });

    const overlay = this.query<HTMLElement>("[data-confirmation-modal-overlay]");
    if (overlay !== null) {
      this.listen(overlay, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const panel = overlay.querySelector(".create-modal-panel");
        if (panel !== null && panel.contains(target)) {
          return;
        }

        event.stopPropagation();
        this.emitAction("cancel");
      });
    }

    this.listen(document, "keydown", (event) => {
      if (event.key === "Escape") {
        this.emitAction("cancel");
      }
    });
  }

  private emitAction(action: ConfirmationModalActionType): void {
    if (this.config.isProcessing === true) {
      return;
    }

    this.emit<ConfirmationModalActionDetail>(CONFIRMATION_MODAL_ACTION_EVENT, {
      modalId: this.config.id,
      action
    });
  }
}
