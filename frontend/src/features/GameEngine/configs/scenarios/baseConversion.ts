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
    instruction: "Combien vaut 101010 en base 10 ?",
    expectedAnswer: "42",
    inputType: "number",
    completionMessage: "Exact : 32 + 8 + 2 = 42. Vous pouvez passer a l'epreuve.",
    errorMessage: "Additionnez les puissances de 2 actives.",
    hints: ["101010 = 1x32 + 0x16 + 1x8 + 0x4 + 1x2 + 0x1."]
  },
  {
    type: "riddle",
    gameId: "BaseConversion",
    title: "Conversion de base",
    instruction: "Transformez les nombres binaires en base 10.",
    completionMessage: "Epreuve terminee ! Toutes les conversions sont reussies.",
    gameParams: {
      questions: [
        { question: "101010", answer: "42", hint: "32 + 8 + 2", difficulty: 1 },
        { question: "1111", answer: "15", hint: "8 + 4 + 2 + 1", difficulty: 1 },
        { question: "100000", answer: "32", hint: "Une seule puissance de deux est active.", difficulty: 1 }
      ]
    }
  },
  {
    type: "info",
    title: "Code dechiffre",
    text: "Vous avez traverse les bases sans perdre le fil.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
