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
    title: "Theoreme de Thales",
    instructions: "Retrouvez la longueur manquante dans deux triangles proportionnels.",
    gameParams: {
      questions: [
        {
          question: "6 / 4 = x / 6",
          answer: "9",
          hint: "Utilisez le rapport 6 / 4 = x / 6, donc x = 9.",
          difficulty: 1,
          metadata: {
            options: ["7.5", "8", "9", "12"],
            largeTriangle: { side: "6", unknown: "x" },
            smallTriangle: { side: "4", unknown: "6" }
          }
        }
      ]
    }
  },
  {
    type: "info",
    title: "Proportion retrouvee",
    text: "Les longueurs concordent. Le passage geometrique s'ouvre.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
