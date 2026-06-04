import type { GameStep } from "../../../models/GameConfig.js";
import type { Chapter } from "../../../models/Chapter.js";
import { baseConversionScenario } from "./scenarios/baseConversion.js";
import { pianoScenario } from "./scenarios/pianoFractions.js";
import { thalesScenario } from "./scenarios/thales.js";

interface ChapterConfig {
  chapter: Chapter;
  scenario: GameStep[];
}

const chapterConfigs: ChapterConfig[] = [
  {
    chapter: {
      id: 0,
      slug: "base-conversion",
      title: "Conversion de base",
      statement: "Passer d'une base a l'autre.",
      position: 1,
      isActive: true
    },
    scenario: baseConversionScenario
  },
  {
    chapter: {
      id: 1,
      slug: "thales-ratio",
      title: "Theoreme de Thales",
      statement: "Triangles et proportionnalite.",
      position: 2,
      isActive: true
    },
    scenario: thalesScenario
  },
  {
    chapter: {
      id: 2,
      slug: "piano-fractions",
      title: "Fractions musicales",
      statement: "La lecon de piano.",
      position: 3,
      isActive: true
    },
    scenario: pianoScenario
  }
];

export function listConfiguredChapters(): Chapter[] {
  return chapterConfigs
    .map((config) => config.chapter)
    .sort((left, right) => left.position - right.position);
}

export function getScenario(chapterId: number): GameStep[] | null {
  const config = chapterConfigs.find((item) => item.chapter.id === chapterId);
  return config?.scenario ?? null;
}
