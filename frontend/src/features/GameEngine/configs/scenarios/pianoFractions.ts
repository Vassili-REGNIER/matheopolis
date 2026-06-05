import type { GameStep } from "../../../../models/GameConfig.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";

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

const fractalLuthierQuestions: RiddleQuestion[] = [
  {
    question: "Une melodie lente et grave dessine un arbre simple et tres ouvert.",
    answer: "2:75",
    hint: "Cherchez une complexite basse et un angle tres ouvert.",
    difficulty: 1,
    metadata: { targetDepth: 2, targetAngle: 75 }
  },
  {
    question: "Une pluie de notes rapides et aigues forme une structure fine et tres ramifiee.",
    answer: "6:15",
    hint: "La complexite doit monter, mais l'angle doit rester tres serre.",
    difficulty: 1,
    metadata: { targetDepth: 6, targetAngle: 15 }
  },
  {
    question: "La derniere melodie cherche un equilibre : ni trop large, ni trop serree.",
    answer: "5:45",
    hint: "Visez le milieu : une complexite haute mais stable, avec un angle central.",
    difficulty: 1,
    metadata: { targetDepth: 5, targetAngle: 45 }
  }
];

const fractalLuthierPracticeQuestions: RiddleQuestion[] = [
  {
    question: "Pour vous entrainer, retrouvez un petit arbre musical de 3 branches, stable et bien ouvert.",
    answer: "3:45",
    hint: "Reglez la complexite sur 3, puis gardez un angle au milieu.",
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
        text: "Regarde Laurence ! Pres de l'autel... C'est le grand Pythagore en personne !",
        image: "./public/assets/characters/pape_laurence2.png",
        position: "left"
      },
      {
        speakerId: "Laurence",
        text: "Pythagore ? Peut-etre saura-t-il quelque chose sur mon pere.",
        image: "./public/assets/characters/laurence.png",
        position: "left"
      },
      {
        speakerId: "Pythagore",
        text: "J'ai peut-etre des informations sur ton pere, Laurence. Mais je ne transmets pas mon savoir sans epreuve.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speakerId: "Pythagore",
        text: "Avant de t'enseigner ce que je sais, je dois verifier que tu es au niveau. Resous ma melodie.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speakerId: "Pythagore",
        text: "Reduis chaque fraction, multiplie-la par 3/2, puis divise par 2 si le resultat depasse 2. La suite obtenue correspond aux touches du piano.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      }
    ]
  },
  {
    type: "info",
    title: "Transformer une fraction",
    text: "Pour reduire une fraction, divisez le numerateur et le denominateur par le meme nombre jusqu'a obtenir la forme la plus simple. Pour multiplier par 3/2, multipliez les numerateurs entre eux et les denominateurs entre eux. Si le resultat depasse 2, divisez ensuite la fraction par 2 pour revenir dans l'octave du piano.",
    buttonText: "S'entrainer"
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    mode: "practice",
    title: "Suite d'essai",
    introText: "Transformez les 3 fractions de la suite : reduisez, multipliez par 3/2, puis divisez par 2 si le resultat depasse 2.",
    instruction: "Jouez les 3 notes obtenues dans le bon ordre, puis validez la melodie.",
    completionMessage: "Bravo ! Vous avez assemble la suite d'essai. Passez a l'epreuve pour completer la melodie.",
    questions: practiceMelodyQuestions
  },
  {
    type: "riddle",
    gameId: "PianoFractions",
    title: "Le piano de Pythagore",
    introText: "Cette fois, la suite contient 6 fractions. Chaque calcul donne une touche du piano.",
    instruction: "Resoudre toute la suite, jouer la melodie complete, puis valider.",
    completionMessage: "Melodie terminee ! Laurence a prouve qu'elle pouvait recevoir le savoir de Pythagore.",
    questions: challengeMelodyQuestions
  },
  {
    type: "dialogue",
    lines: [
      {
        speakerId: "Pythagore",
        text: "Je suis impressionne, Laurence. Tu as su entendre les nombres derriere la melodie.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      },
      {
        speakerId: "Laurence",
        text: "Merci, Pythagore. Je n'avais jamais pense que la musique et les maths pouvaient etre liees.",
        image: "./public/assets/characters/laurence.png",
        position: "left"
      },
      {
        speakerId: "Pape",
        text: "Alors, Pythagore ? Laurence a-t-elle le niveau pour apprendre ce que vous savez sur son pere ?",
        image: "./public/assets/characters/pape_laurence2.png",
        position: "left"
      },
      {
        speakerId: "Pythagore",
        text: "Oui. Suivez-moi.",
        image: "./public/assets/characters/pythagore.png",
        position: "right"
      }
    ]
  },
  {
    type: "info",
    title: "Melodie reconstituee",
    text: "Les fractions ont chanté juste. Pythagore accepte de guider Laurence vers les informations sur son pere, son arbre généalogique.",
    buttonText: "S'entrainer"
  },

  {
    type: "riddle",
    gameId: "FractalLuthier",
    mode: "practice",
    title: "Entrainement du luthier",
    introText: "Avant l'epreuve fractale, Laurence observe un arbre simple pour comprendre le lien entre forme et melodie.",
    instruction: "Ecoutez la cible, puis reglez la complexite sur un arbre de 3 branches avant de tester votre creation.",
    completionMessage: "Bien joue ! Laurence comprend comment regler un arbre musical simple.",
    questions: fractalLuthierPracticeQuestions
  },
  {
    type: "riddle",
    gameId: "FractalLuthier",
    title: "Le luthier fractal",
    introText: "Pythagore presente a Laurence un instrument etrange : chaque arbre dessine une melodie.",
    instruction: "Ecoutez la melodie cible, reglez la complexite et l'angle de l'arbre, puis testez votre creation.",
    completionMessage: "Le luthier fractal est accorde ! Laurence a relie la forme, le nombre et le son.",
    questions: fractalLuthierQuestions
  },
  {
    type: "info",
    title: "Arbre reconstituee",
    text: "Les fractions et fractales ont chanté juste.",
    buttonText: "Retour a la carte",
    theme: "endChapter"
  }
];
