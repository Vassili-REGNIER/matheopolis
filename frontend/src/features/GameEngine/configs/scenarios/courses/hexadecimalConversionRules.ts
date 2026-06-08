import type { InfoStep } from "../../../../../models/GameConfig.js";

export const hexadecimalConversionRulesStep: InfoStep = {
  type: "info",
  content: {
    id: "hexadecimal-rules",
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
              { type: "element", tag: "h2", text: "Mission de cartographie hexadécimale" },
              {
                type: "element",
                tag: "p",
                text: "Les coordonnées de la Tour de l'Horloge sont écrites dans la base des cartographes secrets : l'hexadécimal. Pour guider Laurence dans Mathéopolis, tu dois transformer chaque coordonnée en base 10."
              }
            ]
          },
          {
            type: "element",
            tag: "ol",
            className: "rules-sequence",
            children: [
              { type: "element", tag: "li", text: "Remplace les lettres A à F par leurs valeurs de 10 à 15." },
              { type: "element", tag: "li", text: "Multiplie le symbole de gauche par 16, puis ajoute celui de droite." },
              { type: "element", tag: "li", text: "Valide les axes X, Y et Z pour faire apparaître le lieu du rendez-vous." }
            ]
          }
        ]
      }
    ]
  },
  buttonText: "Lire le cours"
};
