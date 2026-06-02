import type { GameStep } from "../../../../models/GameConfig.js";

export const quizScenario: GameStep[] = [
  {
    type: "info",
    title: "L'Histoire de Laurence",
    text: "Un QCM pour verifier les souvenirs du livre et mesurer la progression.",
    buttonText: "Lancer le QCM"
  },
  {
    type: "riddle",
    gameId: "MatheopolisQuiz",
    difficulty: 1
  },
  {
    type: "info",
    title: "Bilan enregistre",
    text: "Votre score est pret a etre transmis a la progression.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
