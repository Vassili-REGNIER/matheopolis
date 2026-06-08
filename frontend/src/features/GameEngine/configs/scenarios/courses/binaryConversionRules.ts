import type { InfoStep } from "../../../../../models/GameConfig.js";

export const binaryConversionRulesStep: InfoStep = {
  type: "info",
  content: {
    id: "binary-rules",
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
              { type: "element", tag: "h2", text: "Mission de chiffrement binaire" },
              {
                type: "element",
                tag: "p",
                text: "Dans les archives de Mathéopolis, le message du père de Laurence est verrouillé par des suites de 0 et de 1. Ton rôle est de convertir chaque fragment en nombre décimal pour révéler la date du rendez-vous."
              }
            ]
          },
          {
            type: "element",
            tag: "ol",
            className: "rules-sequence",
            children: [
              { type: "element", tag: "li", text: "Repère les colonnes qui contiennent un 1 dans la suite binaire." },
              { type: "element", tag: "li", text: "Additionne uniquement leurs valeurs pour obtenir le nombre en base 10." },
              { type: "element", tag: "li", text: "Valide chaque conversion pour révéler peu à peu la date secrète." }
            ]
          }
        ]
      }
    ]
  },
  buttonText: "Lire le cours"
};
