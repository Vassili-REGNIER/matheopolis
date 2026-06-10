import type { GameStep } from "../../../../models/GameConfig.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";
import { fractalLuthierRulesStep } from "./courses/fractalLuthierRules.js";
import { fractalWorldCourseStep } from "./courses/fractalWorldCourse.js";
import { fractionPianoRulesStep } from "./courses/fractionPianoRules.js";
import { fractionReductionCourseStep } from "./courses/fractionReductionCourse.js";

const practiceMelodyQuestions: RiddleQuestion[] = [
  { question: "2/2,6/4,18/16", answer: "SOL,RE,LA", hint: "2/2 se réduit en 1. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "1", targetFraction: "3/2" } }
];

const challengeMelodyQuestions: RiddleQuestion[] = [
  { question: "2/2,6/4,18/16,54/32,162/128,16/12", answer: "SOL,RE,LA,MI,SI,DO+", hint: "2/2 se réduit en 1. Multipliez par 3/2.", difficulty: 1, metadata: { reduced: "1", targetFraction: "3/2" } }
];

const fractalLuthierQuestions: RiddleQuestion[] = [
  {
    question: "Une mélodie lente et grave dessine un arbre simple et très ouvert.",
    answer: "2:75",
    hint: "Cherchez une complexité basse et un angle très ouvert.",
    difficulty: 1,
    metadata: { targetDepth: 2, targetAngle: 75 }
  },
  {
    question: "Une pluie de notes rapides et aiguës forme une structure fine et très ramifiée.",
    answer: "6:15",
    hint: "La complexité doit monter, mais l'angle doit rester très serré.",
    difficulty: 1,
    metadata: { targetDepth: 6, targetAngle: 15 }
  },
  {
    question: "La dernière mélodie cherche un équilibre : ni trop large, ni trop serrée.",
    answer: "5:45",
    hint: "Visez le milieu : une complexité haute mais stable, avec un angle central.",
    difficulty: 1,
    metadata: { targetDepth: 5, targetAngle: 45 }
  }
];

const fractalLuthierPracticeQuestions: RiddleQuestion[] = [
  {
    question: "Pour vous entraîner, retrouvez un petit arbre musical de 3 branches, stable et bien ouvert.",
    answer: "3:45",
    hint: "Réglez la complexité sur 3, puis gardez un angle au milieu.",
    difficulty: 1,
    metadata: { targetDepth: 3, targetAngle: 45 }
  }
];

export const pianoScenario: GameStep[] = [
  {
    type: "dialogue",
    lines: [
      {
        speakerId: "Pape",
        text: "Regarde Laurence ! Près de l'autel... C'est le grand Pythagore en personne !",
        image: "./public/assets/characters/Pape-neutral.png",
        position: "left"
      },
      {
        speakerId: "Laurence",
        text: "Pythagore ? Peut-être saura-t-il quelque chose sur mon père.",
        image: "./public/assets/characters/Laurence-neutral.png",
        position: "left"
      },
      {
        speakerId: "Pythagore",
        text: "J'ai peut-être des informations sur ton père, Laurence. Mais je ne transmets pas mon savoir sans épreuve.",
        image: "./public/assets/characters/Pythagore-neutral.png",
        position: "right"
      },
      {
        speakerId: "Pythagore",
        text: "Avant de t'enseigner ce que je sais, je dois vérifier que tu es au niveau. Résous ma mélodie.",
        image: "./public/assets/characters/Pythagore-neutral.png",
        position: "right"
      },
      {
        speakerId: "Pythagore",
        text: "Réduis chaque fraction, multiplie-la par 3/2, puis divise par 2 si le résultat dépasse 2. La suite obtenue correspond aux touches du piano.",
        image: "./public/assets/characters/Pythagore-neutral.png",
        position: "right"
      }
    ]
  },
  fractionPianoRulesStep,
  fractionReductionCourseStep,
  {
    type: "riddle",
    gameId: "PianoFractions",
    mode: "practice",
    title: "Suite d'essai",
    introText: "Transformez les 3 fractions de la suite : réduisez, multipliez par 3/2, puis divisez par 2 si le résultat dépasse 2.",
    instruction: "Jouez les 3 notes obtenues dans le bon ordre, puis validez la mélodie.",
    completionMessage: "Bravo ! Vous avez assemblé la suite d'essai. Passez à l'épreuve pour compléter la mélodie.",
    questions: practiceMelodyQuestions
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    title: "La gamme de Pythagore",
    instruction: "Résoudre toute la suite, jouer la mélodie complète, puis valider.",
    completionMessage: "Mélodie terminée ! Laurence a prouvé qu'elle pouvait recevoir le savoir de Pythagore.",
    questions: challengeMelodyQuestions
  },
  {
    type: "dialogue",
    lines: [
      {
        speakerId: "Pythagore",
        text: "Je suis impressionné, Laurence. Tu as su entendre les nombres derrière la mélodie.",
        image: "./public/assets/characters/Pythagore-neutral.png",
        position: "right"
      },
      {
        speakerId: "Laurence",
        text: "Merci, Pythagore. Je n'avais jamais pensé que la musique et les maths pouvaient être liées.",
        image: "./public/assets/characters/Laurence-neutral.png",
        position: "left"
      },
      {
        speakerId: "Pape",
        text: "Alors, Pythagore ? Laurence a-t-elle le niveau pour apprendre ce que vous savez sur son père ?",
        image: "./public/assets/characters/Pape-neutral.png",
        position: "left"
      },
      {
        speakerId: "Pythagore",
        text: "Oui. Suivez-moi.",
        image: "./public/assets/characters/Pythagore-neutral.png",
        position: "right"
      }
    ]
  },
  fractalLuthierRulesStep,
  fractalWorldCourseStep,
  
  {
    type: "riddle",
    gameId: "FractalLuthier",
    mode: "practice",
    title: "Entraînement du luthier",
    introText: "Avant l'épreuve fractale, Laurence observe un arbre simple pour comprendre le lien entre forme et mélodie.",
    instruction: "Écoutez la cible, puis réglez la complexité sur un arbre de 3 branches avant de tester votre création.",
    completionMessage: "Bien joué ! Laurence comprend comment régler un arbre musical simple.",
    questions: fractalLuthierPracticeQuestions
  },
  {
    type: "riddle",
    gameId: "FractalLuthier",
    title: "Le luthier fractal",
    instruction: "Écoutez la mélodie cible, réglez la complexité et l'angle de l'arbre, puis testez votre création.",
    completionMessage: "Le luthier fractal est accordé ! Laurence a relié la forme, le nombre et le son.",
    questions: fractalLuthierQuestions
  },
  {
    type: "info",
    title: "Arbre reconstitué",
    text: "Les fractions et fractales ont chanté juste.",
    buttonText: "Retour à la carte",
  }
];
