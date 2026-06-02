import type { GameStep } from "../../../../models/GameConfig.js";

export const pianoScenario: GameStep[] = [
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
