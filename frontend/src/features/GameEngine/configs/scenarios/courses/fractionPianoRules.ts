import type { InfoStep } from "../../../../../models/GameConfig.js";

export const fractionPianoRulesStep: InfoStep = {
  type: "info",
  content: {
    id: "fraction-piano-rules",
    titre: "Règles du jeu",
    nodes: [
      {
        type: "element",
        tag: "div",
        className: "rules-container",
        children: [
          {
            type: "element",
            tag: "div",
            className: "rules-intro",
            children: [
              { type: "element", tag: "h2", text: "Mission du piano de Pythagore" },
              {
                type: "element",
                tag: "p",
                text: "Dans le temple de Mathéopolis, chaque fraction cache une note. Pour prouver que Laurence peut entendre les nombres derrière la musique, transforme les fractions puis joue la mélodie dans le bon ordre."
              }
            ]
          },
          {
            type: "element",
            tag: "ol",
            className: "rules-sequence",
            children: [
              { type: "element", tag: "li", text: "Réduis chaque fraction pour révéler sa forme la plus simple." },
              { type: "element", tag: "li", text: "Multiplie-la par 3/2, puis divise par 2 si elle dépasse l'octave." },
              { type: "element", tag: "li", text: "Joue les notes obtenues dans l'ordre et valide la mélodie." }
            ]
          }
        ]
      }
    ]
  },
  buttonText: "Lire le cours"
};
