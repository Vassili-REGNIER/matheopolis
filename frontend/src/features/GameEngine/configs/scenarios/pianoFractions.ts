import type { GameStep } from "../../../../models/GameConfig.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";

const pianoNotes = [
  { note: "DO", fraction: "1", frequency: 261.63 },
  { note: "RE", fraction: "9/8", frequency: 294.33 },
  { note: "MI", fraction: "81/64", frequency: 331.12 },
  { note: "FA", fraction: "4/3", frequency: 348.84 },
  { note: "SOL", fraction: "3/2", frequency: 392.45 },
  { note: "LA", fraction: "27/16", frequency: 441.5 },
  { note: "SI", fraction: "243/128", frequency: 496.67 },
  { note: "DO+", fraction: "2", frequency: 523.25 }
] as const;

const practiceMelodyQuestions: RiddleQuestion[] = [
  { question: "2/2", answer: "SOL", hint: "2/2 se reduit en 1. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "1", targetFraction: "3/2" } },
  { question: "6/4", answer: "RE", hint: "6/4 se reduit en 3/2. Multipliez par 3/2 puis ramenez sous 2.", difficulty: 1, metadata: { reduced: "3/2", targetFraction: "9/8" } },
  { question: "18/16", answer: "LA", hint: "18/16 se reduit en 9/8. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "9/8", targetFraction: "27/16" } }
];

const challengeMelodyQuestions: RiddleQuestion[] = [
  { question: "2/2", answer: "SOL", hint: "2/2 se reduit en 1. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "1", targetFraction: "3/2" } },
  { question: "6/4", answer: "RE", hint: "6/4 se reduit en 3/2. Multipliez par 3/2 puis ramenez sous 2.", difficulty: 1, metadata: { reduced: "3/2", targetFraction: "9/8" } },
  { question: "18/16", answer: "LA", hint: "18/16 se reduit en 9/8. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "9/8", targetFraction: "27/16" } },
  { question: "54/32", answer: "MI", hint: "54/32 se reduit en 27/16. Multipliez par 3/2 puis ramenez sous 2.", difficulty: 1, metadata: { reduced: "27/16", targetFraction: "81/64" } },
  { question: "162/128", answer: "SI", hint: "162/128 se reduit en 81/64. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "81/64", targetFraction: "243/128" } },
  { question: "16/12", answer: "DO+", hint: "16/12 se reduit en 4/3. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "4/3", targetFraction: "2" } }
];

export const pianoScenario: GameStep[] = [
  {
    type: "dialogue",
    lines: [
      {
        speakerId: "Pape",
        text: "Regarde Laurence ! Pres de l'autel... C'est le grand Pythagore en personne !",
        image: "./public/assets/characters/pape_laurence2.png",
        position: "left"
      },
      {
        speakerId: "Pythagore",
        text: "Je t'attendais, Laurence. Ton pere travaillait sur l'Harmonie Universelle avant de disparaitre.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speakerId: "Pythagore",
        text: "Pour lui, un son est un nombre qui chante. Le DO est l'unite. Pour trouver sa quinte, on multiplie par 3/2.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speakerId: "Laurence",
        text: "Donc si le calcul depasse l'octave, je dois diviser par 2 pour revenir dans la bonne zone sonore ?",
        image: "./public/assets/characters/laurence.png",
        position: "left"
      }
    ]
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    mode: "practice",
    title: "Premieres quintes",
    introText: "Reduisez la fraction affichee, puis multipliez par 3/2 pour trouver sa quinte. Si le resultat depasse 2, divisez par 2.",
    instruction: "Cliquez sur la note qui correspond a la quinte de la fraction reduite.",
    completionMessage: "Bravo ! Vous avez assemble les trois premieres notes. Passez a l'epreuve pour completer la melodie.",
    questions: practiceMelodyQuestions,
    gameParams: {
      notes: [...pianoNotes]
    }
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    title: "Le piano de Pythagore",
    instruction: "Simplifiez la fraction affichee, puis trouvez la note qui correspond a sa quinte.",
    completionMessage: "Melodie terminee ! Laurence a resolu l'enigme des quintes.",
    questions: challengeMelodyQuestions,
    gameParams: {
      notes: [...pianoNotes]
    }
  },
  {
    type: "info",
    title: "Melodie reconstituee",
    text: "Les fractions ont chante juste. Laurence peut continuer son enquete.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
