import type { GameStep } from "../../../../models/GameConfig.js";

export const baseConversionScenario: GameStep[] = [
  // ==========================================
  // CHAPITRE 1 : LA DATE DU RENDEZ-VOUS (BINAIRE -> BASE 10)
  // ==========================================
  {
    type: "dialogue",
    lines: [
      {
        speaker: "Pythagore",
        text: "Pst... Laurence, par ici. Ton père m'avait prévenu que tu finirais par arriver.",
        image: "./public/assets/characters/pythagore.png",
      },
      {
        speaker: "Laurence",
        text: "Pythagore ? Où est mon père ? Dites-moi ce que vous savez !",
        image: "./public/assets/characters/laurence.png",

      },
      {
        speaker: "Pythagore",
        text: "Il a dû fuir pour échapper au Haut-Conseil. Il veut te voir en secret. Cependant, pour que personne d'autre ne puisse lire son message, il a chiffré la date du rendez-vous en binaire.",
        image: "./public/assets/characters/pythagore.png",
      }
    ]
  },
  {
    type: "info",
    title: "Déchiffrer le Binaire",
    text: "En base 2 (binaire), chaque colonne vaut le double de la précédente en partant de la droite : 1, 2, 4, 8, 16, 32... Additionnez les valeurs des colonnes contenant un '1' pour obtenir le nombre en Base 10.",
    buttonText: "S'entraîner"
  },
  {
    type: "riddle",
    gameId: "BaseConversion",
    mode: "practice",
<<<<<<< HEAD
    title: "Conversion de base",
    introText: "En base 2, chaque position vaut une puissance de 2.",
    instruction: "Combien vaut 101010 en base 10 ?",
    completionMessage: "Exact : 32 + 8 + 2 = 42. Vous pouvez passer a l'epreuve.",
    questions: [
      {
        question: "101010",
        answer: "42",
        hint: "101010 = 1x32 + 0x16 + 1x8 + 0x4 + 1x2 + 0x1.",
        difficulty: 1
      }
    ]
=======
    title: "Entraînement : Binaire vers Décimal",
    introText: "Rappel : En base 2, chaque position en partant de la droite vaut une puissance de 2.",
    instruction: "Déchiffrez ce fragment de test : combien vaut 00101 en base 10 ?",
    completionMessage: "Excellent : 4 + 1 = 5. Passez aux véritables données temporelles.",
    gameParams: {
      questions: [
        { question: "00101", answer: "5", hint: "0x16 + 0x8 + 1x4 + 0x2 + 1x1", difficulty: 1 }
      ]
    }
>>>>>>> 7060851 (feat: enhance dialogue and base conversion features)
  },
  {
    type: "riddle",
    gameId: "BaseConversion",
<<<<<<< HEAD
    title: "Conversion de base",
    instruction: "Transformez les nombres binaires en base 10.",
    completionMessage: "Epreuve terminee ! Toutes les conversions sont reussies.",
    questions: [
      { question: "101010", answer: "42", hint: "32 + 8 + 2", difficulty: 1 },
      { question: "1111", answer: "15", hint: "8 + 4 + 2 + 1", difficulty: 1 },
      { question: "100000", answer: "32", hint: "Une seule puissance de deux est active.", difficulty: 1 }
    ]
=======
    title: "La date du rendez-vous",
    instruction: "Convertissez chaque fragment binaire laissé par votre père en base 10 pour trouver la date exacte.",
    completionMessage: "Parfait ! La date est décodée : 13/09/1956 à 11h30.",
    gameParams: {
      questions: [
        { question: "1101", answer: "13", hint: "Jour (8 + 4 + 1)", difficulty: 1 },
        { question: "1001", answer: "9", hint: "Mois (8 + 1)", difficulty: 1 },
        { question: "11110100100", answer: "1956", hint: "Année (1024 + 512 + 256 + 128 + 32 + 4)", difficulty: 1 },
        { question: "1011", answer: "11", hint: "Heure (8 + 2 + 1)", difficulty: 1 },
        { question: "11110", answer: "30", hint: "Minutes (16 + 8 + 4 + 2)", difficulty: 1 }
      ]
    }
  },

  // ==========================================
  // CHAPITRE 2 : LE LIEU DU RENDEZ-VOUS (HEXA -> BASE 10)
  // ==========================================
  {
    type: "dialogue",
    lines: [
      {
        speaker: "Laurence",
        text: "J'ai la date ! Mais où est-ce que je suis censée le retrouver ?",
        image: "./public/assets/characters/laurence.png",
      },
      {
        speaker: "Pythagore",
        text: "C'est là que ça se corse. Il m'a transmis ce bout de parchemin. Ce sont des coordonnées cartésiennes pour te repérer dans la ville, mais elles sont notées en Hexadécimal.",
        image: "./public/assets/characters/pythagore.png",
      },
      {
        speaker: "Laurence",
        text: "De l'Hexadécimal ? La base 16, celle qui utilise les lettres de A à F en plus des chiffres ?",
        image: "./public/assets/characters/laurence.png",
      },
      {
        speaker: "Pythagore",
        text: "Exactement. Pour pouvoir lire ces coordonnées sur une carte standard, tu vas devoir faire la conversion inverse et les ramener dans notre système classique, la Base 10.",
        image: "./public/assets/characters/pythagore.png",
      }
    ]
  },
  {
    type: "info",
    title: "Déchiffrer l'Hexadécimal",
    text: "Pour repasser de la base 16 à la base 10 (pour un bloc de 2 caractères) : Prenez le caractère de gauche, multipliez sa valeur par 16, et ajoutez la valeur du caractère de droite. Ex: 'A4' = (10 x 16) + 4 = 164.",
    buttonText: "S'entraîner"
  },
  {
    type: "riddle",
    gameId: "HexConversion", // Utilise le jeu que nous avons conçu pour l'Hexa -> Base 10
    mode: "practice",
    title: "Entraînement : Hexadécimal vers Décimal",
    introText: "Rappel : A=10, B=11, C=12, D=13, E=14, F=15.",
    instruction: "Convertissez la coordonnée test '1A' en Base 10.",
    completionMessage: "Parfait ! 1 x 16 + 10 = 26. Vous êtes prête à lire la carte.",
    gameParams: {
      questions: [
        { question: "1A", answer: "26", hint: "(1 x 16) + 10", difficulty: 1 },
      ]
    }
  },
  {
    type: "riddle",
    gameId: "HexConversion",
    title: "Les Coordonnées Géographiques",
    instruction: "Traduisez les coordonnées X, Y et Z hexadécimales en Base 10 pour trouver le lieu exact.",
    completionMessage: "Coordonnées trouvées ! Le lieu du rendez-vous est la Tour de l'Horloge.",
    gameParams: {
      questions: [
        { question: "Axe X : 2B", answer: "43", hint: "(2 x 16) + 11", difficulty: 1 },
        { question: "Axe Y : 64", answer: "100", hint: "(6 x 16) + 4", difficulty: 1 },
        { question: "Axe Z : A5", answer: "165", hint: "(10 x 16) + 5", difficulty: 1 }
      ]
    }
>>>>>>> 7060851 (feat: enhance dialogue and base conversion features)
  },
  {
    type: "info",
    title: "En route !",
    text: "Munie de la date et des coordonnées exactes du lieu, Laurence se met en route vers la Tour de l'Horloge. Les réponses ne sont plus très loin.",
    buttonText: "Terminer le chapitre",
    theme: "endChapter"
  }
];