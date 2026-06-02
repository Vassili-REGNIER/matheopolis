import type { GameStep } from "../../../../models/GameConfig.js";

export const thalesScenario: GameStep[] = [
  {
    type: "info",
    title: "Theoreme de Thales",
    text: "Dans la cite, les triangles alignes cachent des proportions.",
    buttonText: "Observer"
  },
  {
    type: "riddle",
    gameId: "ThalesRatio",
    difficulty: 1
  },
  {
    type: "info",
    title: "Proportion retrouvee",
    text: "Les longueurs concordent. Le passage geometrique s'ouvre.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
