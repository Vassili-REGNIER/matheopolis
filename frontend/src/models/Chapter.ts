import type { ChapterProgress } from "./ChapterProgress.js";
import type { GameStep } from "./GameConfig.js";

export interface Chapter {
  id: number;
  type?: "narrative";
  slug: string;
  title: string;
  statement: string;
  position: number;
  isActive?: boolean;
  progress?: ChapterProgress | null;
}

export interface ChapterListEnvelopeData {
  items: Chapter[];
}

export interface ChapterDetail extends Chapter {
  scenario: {
    steps: GameStep[];
  };
}
