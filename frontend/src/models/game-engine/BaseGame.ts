import type { ContentService } from "../../services/ContentService.js";
import type { RiddleMode, RiddleQuestion } from "../GameConfig.js";

export interface BaseGameContext {
  content: ContentService;
}

export type BaseGameParams = {
  questions: RiddleQuestion[];
  completionMessage?: string;
  instruction?: string;
  mode?: RiddleMode;
  title?: string;
} & Record<string, unknown>;
