import type { IconName } from "./Icons.js";

export const CONFIRMATION_MODAL_ACTION_EVENT = "confirmationModalAction";

export type ConfirmationModalActionType = "cancel" | "secondary" | "confirm";
export type ConfirmationModalVariant = "default" | "danger";

export interface ConfirmationModalAction {
  label: string;
  processingLabel?: string;
  iconName?: IconName;
  variant?: ConfirmationModalVariant;
}

export interface ConfirmationModalConfig {
  id: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  message?: string;
  isProcessing?: boolean;
  overlayClass?: string;
  panelClass?: string;
  actionsLayout?: "default" | "split";
  cancelAction?: ConfirmationModalAction | null;
  secondaryAction?: ConfirmationModalAction | null;
  confirmAction?: ConfirmationModalAction | null;
}

export interface ConfirmationModalActionDetail {
  modalId: string;
  action: ConfirmationModalActionType;
}
