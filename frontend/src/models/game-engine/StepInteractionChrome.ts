export type StepQuery = <T extends HTMLElement>(selector: string) => T | null;
export type StepListen = (target: HTMLElement, type: "click", listener: () => void) => void;

export interface StepInteractionHandlers {
  onHint: () => void;
  onValidate: () => void;
  onNext: () => void;
}
