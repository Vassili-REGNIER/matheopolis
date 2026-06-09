import type { DialogueLine } from "../GameConfig.js";

export interface DialogueBlockTemplateModel {
  current: DialogueLine | null;
  currentText: string;
  finished: boolean;
  history: DialogueLine[];
  wrapperClass: "left" | "right" | "narrator";
  stageStyle: string;
  showPrevious: boolean;
}
