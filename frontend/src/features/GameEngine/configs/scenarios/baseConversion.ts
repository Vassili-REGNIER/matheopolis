import type { GameStep } from "../../../../models/GameConfig.js";

export const baseConversionScenario: GameStep[] = [
  {
    type: "info",
    title: "Conversion de base",
    text: "Chaque civilisation a invente ses propres facons d'ecrire les nombres. A vous de decoder.",
    buttonText: "Commencer"
  },
  {
    type: "tutorial",
    title: "Lire en base 2",
    text: "En base 2, chaque position vaut une puissance de 2.",
    question: "Combien vaut 101010 en base 10 ?",
    expectedAnswer: "42",
    inputType: "number",
    successMessage: "Exact : 32 + 8 + 2 = 42.",
    errorMessage: "Additionnez les puissances de 2 actives.",
    hints: ["101010 = 1x32 + 0x16 + 1x8 + 0x4 + 1x2 + 0x1."]
  },
  {
    type: "riddle",
    gameId: "BaseConversion",
    difficulty: 1
  },
  {
    type: "info",
    title: "Code dechiffre",
    text: "Vous avez traverse les bases sans perdre le fil.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
