import type { GameStep } from "../../../models/GameConfig.js";
import type { Puzzle } from "../../../models/Progress.js";
import { baseConversionScenario } from "./scenarios/baseConversion.js";
import { pianoScenario } from "./scenarios/pianoFractions.js";
import { quizScenario } from "./scenarios/quiz.js";
import { thalesScenario } from "./scenarios/thales.js";

interface PuzzleConfig {
  puzzle: Puzzle;
  scenario: GameStep[];
}

const puzzleConfigs: PuzzleConfig[] = [
  {
    puzzle: {
      id: 999,
      slug: "matheopolis-quiz",
      title: "L'Histoire de Laurence",
      statement: "Testez vos connaissances sur le livre.",
      position: 0,
      isActive: true
    },
    scenario: quizScenario
  },
  {
    puzzle: {
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
    puzzle: {
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
    puzzle: {
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

export function listConfiguredPuzzles(): Puzzle[] {
  return puzzleConfigs
    .map((config) => config.puzzle)
    .sort((left, right) => left.position - right.position);
}

export function getScenario(riddleId: number): GameStep[] | null {
  const config = puzzleConfigs.find((item) => item.puzzle.id === riddleId);
  return config?.scenario ?? null;
}
