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
    title: "QCM Matheopolis",
    instructions: "Repondez aux questions chargees depuis le contenu du livre.",
    gameParams: {
      questions: []
    }
  },
  {
    type: "info",
    title: "Bilan enregistre",
    text: "Votre score est pret a etre transmis a la progression.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
