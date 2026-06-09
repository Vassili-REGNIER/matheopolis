import type { StudentProgressViewContext } from "../ClassManagement.js";

export interface ProgressComponentOptions {
  studentContext?: StudentProgressViewContext;
  onBack?: () => void;
}
