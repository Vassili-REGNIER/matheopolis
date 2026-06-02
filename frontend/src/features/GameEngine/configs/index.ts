import type { GameStep } from "../../../models/GameConfig.js";

const pianoScenario: GameStep[] = [
  {
    type: "dialogue",
    backgroundStyle: "radial-gradient(circle at 15% 10%, rgba(145, 215, 255, .25), transparent 28%), radial-gradient(circle at 80% 15%, rgba(255, 209, 102, .18), transparent 26%), linear-gradient(135deg, #07091c, #21134a)",
    lines: [
      {
        speaker: "Pape",
        text: "Regarde Laurence ! Pres de l'autel... C'est le grand Pythagore en personne !",
        image: "./public/assets/characters/pape_laurence2.png",
        position: "left"
      },
      {
        speaker: "Pythagore",
        text: "Je t'attendais, Laurence. Ton pere travaillait sur l'Harmonie Universelle avant de disparaitre.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speaker: "Pythagore",
        text: "Pour lui, un son est un nombre qui chante. Le DO est l'unite. Pour trouver sa quinte, on multiplie par 3/2.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speaker: "Laurence",
        text: "Donc si le calcul depasse l'octave, je dois diviser par 2 pour revenir dans la bonne zone sonore ?",
        image: "./public/assets/characters/laurence.png",
        position: "left"
      }
    ]
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    difficulty: 2
  },
  {
    type: "info",
    title: "Melodie reconstituee",
    text: "Les fractions ont chante juste. Laurence peut continuer son enquete.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];

const baseConversionScenario: GameStep[] = [
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

const thalesScenario: GameStep[] = [
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

const quizScenario: GameStep[] = [
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

const configsRegistry: Record<string, GameStep[]> = {
  "999": quizScenario,
  "0": baseConversionScenario,
  "1": thalesScenario,
  "2": pianoScenario
};

export function getScenario(riddleId: number): GameStep[] | null {
  return configsRegistry[String(riddleId)] ?? null;
}
