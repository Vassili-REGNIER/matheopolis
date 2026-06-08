import type { InfoElementContent, InfoStep } from "../../../../../models/GameConfig.js";

function binaryColumn(bit: string, value: string, detail: string, active: boolean): InfoElementContent {
  return {
    type: "element",
    tag: "div",
    className: "col-bin",
    children: [
      { type: "element", tag: "span", className: "bit", text: bit },
      {
        type: "element",
        tag: "span",
        className: `poids-binaire${active ? "" : " inactive"}`,
        children: detail === "" ? [value] : [value, { type: "element", tag: "small", text: detail }]
      }
    ]
  };
}

export const binaryConversionCourseStep: InfoStep = {
  type: "info",
  content: {
    id: 1,
    titre: "Déchiffrer le Binaire",
    paragraph: {
      type: "paragraph",
      "sous-titre": "Convertir du Binaire (Base 2) en Décimal (Base 10)",
      text: "Le binaire ne contient que des 0 et des 1. Chaque position de droite à gauche représente une puissance de 2."
    },
    nodes: [
      {
        type: "element",
        tag: "div",
        className: "cours-container",
        children: [
          {
            type: "element",
            tag: "div",
            className: "cours-texte",
            children: [
              {
                type: "element",
                tag: "p",
                children: [
                  "C'est exactement comme notre système décimal, sauf qu'au lieu de compter en dizaines, centaines et milliers, on compte en doubles."
                ]
              },
              {
                type: "element",
                tag: "div",
                className: "regle-or",
                children: [
                  { type: "element", tag: "strong", text: "La règle d'or : " },
                  "pour convertir un nombre binaire, on prend chaque bit égal à ",
                  { type: "element", tag: "strong", text: "1" },
                  " et on fait la ",
                  { type: "element", tag: "strong", text: "somme de sa valeur" },
                  " selon sa position."
                ]
              },
              { type: "element", tag: "h3", text: "Les valeurs des positions (de droite à gauche) :" },
              {
                type: "element",
                tag: "ul",
                children: [
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 0 (tout à droite) : 2⁰ = ", { type: "element", tag: "strong", text: "valeur 1" }]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 1 : 2¹ = ", { type: "element", tag: "strong", text: "valeur 2" }]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 2 : 2² = ", { type: "element", tag: "strong", text: "valeur 4" }]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 3 : 2³ = ", { type: "element", tag: "strong", text: "valeur 8" }]
                  }
                ]
              },
              { type: "element", tag: "p", className: "precision-cours", text: "(Et ainsi de suite en doublant à chaque fois : 16, 32, 64, 128...)" },
              { type: "element", tag: "p", className: "consigne-carrousel", text: "Regarde le carrousel à droite pour voir les exemples appliqués !" }
            ]
          },
          {
            type: "element",
            tag: "div",
            className: "cours-visuel",
            children: [
              {
                type: "element",
                tag: "div",
                className: "carrousel-wrapper",
                children: [
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-binaire", id: "exemple1", checked: true } },
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-binaire", id: "exemple2" } },
                  {
                    type: "element",
                    tag: "div",
                    className: "slides",
                    children: [
                      {
                        type: "element",
                        tag: "div",
                        className: "slide slide-1",
                        children: [
                          { type: "element", tag: "div", className: "badge", text: "Exemple 1" },
                          { type: "element", tag: "h4", text: "Le nombre binaire 1011" },
                          { type: "element", tag: "p", text: "On associe chaque bit à la valeur de sa position :" },
                          {
                            type: "element",
                            tag: "div",
                            className: "tableau-binaire",
                            children: [
                              binaryColumn("1", "Valeur 8", "(2³)", true),
                              binaryColumn("0", "Valeur 4", "(2²)", false),
                              binaryColumn("1", "Valeur 2", "(2¹)", true),
                              binaryColumn("1", "Valeur 1", "(2⁰)", true)
                            ]
                          },
                          {
                            type: "element",
                            tag: "div",
                            className: "calcul-binaire",
                            children: [
                              { type: "element", tag: "p", text: "On additionne uniquement là où il y a un 1 :" },
                              {
                                type: "element",
                                tag: "div",
                                className: "equation",
                                children: ["8 + 2 + 1 = ", { type: "element", tag: "strong", className: "resultat-final", text: "11" }]
                              }
                            ]
                          },
                          { type: "element", tag: "p", className: "statut", text: "En base 10, le nombre vaut 11." }
                        ]
                      },
                      {
                        type: "element",
                        tag: "div",
                        className: "slide slide-2",
                        children: [
                          { type: "element", tag: "div", className: "badge spec", text: "Exemple 2" },
                          { type: "element", tag: "h4", text: "Un octet : 10010100" },
                          { type: "element", tag: "p", text: "On applique la même méthode de droite à gauche :" },
                          {
                            type: "element",
                            tag: "div",
                            className: "tableau-binaire mini",
                            children: [
                              binaryColumn("1", "128", "", true),
                              binaryColumn("0", "64", "", false),
                              binaryColumn("0", "32", "", false),
                              binaryColumn("1", "16", "", true),
                              binaryColumn("0", "8", "", false),
                              binaryColumn("1", "4", "", true),
                              binaryColumn("0", "2", "", false),
                              binaryColumn("0", "1", "", false)
                            ]
                          },
                          {
                            type: "element",
                            tag: "div",
                            className: "calcul-binaire",
                            children: [
                              { type: "element", tag: "p", text: "On fait la somme des cases actives :" },
                              {
                                type: "element",
                                tag: "div",
                                className: "equation",
                                children: ["128 + 16 + 4 = ", { type: "element", tag: "strong", className: "resultat-final", text: "148" }]
                              }
                            ]
                          },
                          { type: "element", tag: "p", className: "statut", text: "En base 10, le nombre vaut 148." }
                        ]
                      }
                    ]
                  },
                  {
                    type: "element",
                    tag: "div",
                    className: "carrousel-nav",
                    children: [
                      { type: "element", tag: "label", className: "nav-btn btn-1", attributes: { for: "exemple1" }, text: "Sur 4 bits" },
                      { type: "element", tag: "label", className: "nav-btn btn-2", attributes: { for: "exemple2" }, text: "Sur 8 bits" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  secondaryAction: {
    text: "Retour aux règles",
    targetContentId: "binary-rules"
  },
  buttonText: "S'entraîner"
};
