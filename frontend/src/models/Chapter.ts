import type { GameStep } from "./GameConfig.js";
import type { ChapterProgress } from "./ChapterProgress.js";

export interface Chapter {
  id: number;
  type?: "narrative";
  slug: string;
  title: string;
  statement: string;
  position: number;
  stepCount?: number | null;
  isActive?: boolean;
  progress?: ChapterProgress | null;
}

export interface ChapterListEnvelopeData {
  items: Chapter[];
}

export interface ChapterScenario {
  steps: GameStep[];
}

export interface ChapterDetail extends Chapter {
  scenario: ChapterScenario;
}
