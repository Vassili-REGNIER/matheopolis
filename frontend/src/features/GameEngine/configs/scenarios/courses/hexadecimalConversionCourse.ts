import type { InfoElementContent, InfoStep } from "../../../../../models/GameConfig.js";

function hexadecimalColumn(symbol: string, position: string, multiplier: string, className = "col-hexa"): InfoElementContent {
  return {
    type: "element",
    tag: "div",
    className,
    children: [
      { type: "element", tag: "span", className: "chiffre", text: symbol },
      { type: "element", tag: "span", className: "puissance", children: [position, { type: "element", tag: "small", text: multiplier }] }
    ]
  };
}

function letterColumn(symbol: string, decimalValue: string, position: string, multiplier: string): InfoElementContent {
  return {
    type: "element",
    tag: "div",
    className: "col-hexa-lettre",
    children: [
      {
        type: "element",
        tag: "span",
        className: "chiffre",
        children: [symbol, { type: "element", tag: "small", className: "traduc", text: `(${decimalValue})` }]
      },
      { type: "element", tag: "span", className: "puissance highlight", children: [position, { type: "element", tag: "small", text: multiplier }] }
    ]
  };
}

export const hexadecimalConversionCourseStep: InfoStep = {
  type: "info",
  content: {
    id: 2,
    titre: "Déchiffrer l'Hexadécimal",
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
              { type: "element", tag: "h2", text: "Convertir l'Hexadécimal en Décimal" },
              { type: "element", tag: "p", text: "L'hexadécimal utilise 16 symboles : les chiffres de 0 à 9, puis les lettres A à F pour remplacer les nombres de 10 à 15." },
              {
                type: "element",
                tag: "div",
                className: "table-correspondance",
                children: [
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "A" }, " = 10"] },
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "B" }, " = 11"] },
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "C" }, " = 12"] },
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "D" }, " = 13"] },
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "E" }, " = 14"] },
                  { type: "element", tag: "span", children: [{ type: "element", tag: "strong", text: "F" }, " = 15"] }
                ]
              },
              {
                type: "element",
                tag: "div",
                className: "regle-or",
                children: [
                  { type: "element", tag: "strong", text: "Le secret des positions : " },
                  "de droite à gauche, chaque position vaut 16 fois plus que la précédente. On appelle ça les ",
                  { type: "element", tag: "strong", text: "puissances de 16" },
                  "."
                ]
              },
              { type: "element", tag: "h3", text: "La valeur de chaque colonne :" },
              {
                type: "element",
                tag: "ul",
                children: [
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 0 (à droite) : 16⁰ = ", { type: "element", tag: "strong", text: "valeur 1" }]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 1 (au milieu) : 16¹ = ", { type: "element", tag: "strong", text: "valeur 16" }]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: ["Position 2 (à gauche) : 16² = 16 × 16 = ", { type: "element", tag: "strong", text: "valeur 256" }]
                  }
                ]
              },
              { type: "element", tag: "p", text: "On multiplie le chiffre par la valeur de sa position, puis on fait la somme." }
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
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-hexa-new", id: "h1", checked: true } },
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-hexa-new", id: "h2" } },
                  {
                    type: "element",
                    tag: "div",
                    className: "slides",
                    children: [
                      {
                        type: "element",
                        tag: "div",
                        className: "slide",
                        children: [
                          { type: "element", tag: "div", className: "badge", text: "Exemple 1" },
                          { type: "element", tag: "h4", text: "Le nombre 24" },
                          { type: "element", tag: "p", text: "On applique la valeur de chaque colonne :" },
                          {
                            type: "element",
                            tag: "div",
                            className: "tableau-hexa",
                            children: [
                              hexadecimalColumn("2", "Position 1", "(× 16)"),
                              hexadecimalColumn("4", "Position 0", "(× 1)")
                            ]
                          },
                          {
                            type: "element",
                            tag: "div",
                            className: "calcul-hexa",
                            children: [
                              { type: "element", tag: "div", className: "calcul-detail", text: "(2 × 16) + (4 × 1)" },
                              {
                                type: "element",
                                tag: "div",
                                className: "equation",
                                children: ["32 + 4 = ", { type: "element", tag: "strong", className: "resultat-final", text: "36" }]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        type: "element",
                        tag: "div",
                        className: "slide",
                        children: [
                          { type: "element", tag: "div", className: "badge spec", text: "Exemple 2" },
                          { type: "element", tag: "h4", text: "Le nombre 3B" },
                          { type: "element", tag: "p", text: "Le B est en position 0, il est converti en 11." },
                          {
                            type: "element",
                            tag: "div",
                            className: "tableau-hexa",
                            children: [
                              hexadecimalColumn("3", "Position 1", "(× 16)"),
                              letterColumn("B", "11", "Position 0", "(× 1)")
                            ]
                          },
                          {
                            type: "element",
                            tag: "div",
                            className: "calcul-hexa",
                            children: [
                              { type: "element", tag: "div", className: "calcul-detail", text: "(3 × 16) + (11 × 1)" },
                              {
                                type: "element",
                                tag: "div",
                                className: "equation",
                                children: ["48 + 11 = ", { type: "element", tag: "strong", className: "resultat-final", text: "59" }]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: "element",
                    tag: "div",
                    className: "carrousel-nav",
                    children: [
                      { type: "element", tag: "label", className: "nav-btn b-1", attributes: { for: "h1" }, text: "Exemple 24" },
                      { type: "element", tag: "label", className: "nav-btn b-2", attributes: { for: "h2" }, text: "Exemple 3B" }
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
    targetContentId: "hexadecimal-rules"
  },
  buttonText: "S'entraîner"
};
