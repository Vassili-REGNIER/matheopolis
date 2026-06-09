import type { Chapter } from "../Chapter.js";
import type { GameStep } from "../GameConfig.js";

export interface ChapterConfig {
  chapter: Chapter;
  scenario: GameStep[];
}
