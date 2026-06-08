import type { InfoElementContent, InfoStep } from "../../../../../models/GameConfig.js";

function fraction(numerator: string, denominator: string, className = "frac"): InfoElementContent {
  return {
    type: "element",
    tag: "span",
    className,
    children: [
      { type: "element", tag: "span", text: numerator },
      { type: "element", tag: "span", className: "bar", text: "/" },
      { type: "element", tag: "span", text: denominator }
    ]
  };
}

function arrow(text: string): InfoElementContent {
  return { type: "element", tag: "span", className: "fleche", text };
}

export const fractionReductionCourseStep: InfoStep = {
  type: "info",
  content: {
    id: 3,
    titre: "Transformer une fraction",
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
              { type: "element", tag: "h2", text: "Comment réduire une fraction ?" },
              {
                type: "element",
                tag: "p",
                children: [
                  "Simplifier une fraction, ou la ",
                  { type: "element", tag: "strong", text: "réduire" },
                  ", c'est écrire la même fraction mais avec des ",
                  { type: "element", tag: "strong", text: "nombres plus petits" },
                  " pour la rendre plus facile à lire."
                ]
              },
              {
                type: "element",
                tag: "div",
                className: "regle-or",
                children: [
                  { type: "element", tag: "strong", text: "La règle d'or : " },
                  "on ne change pas la valeur d'une fraction si on ",
                  { type: "element", tag: "strong", text: "divise" },
                  " le haut et le bas par un ",
                  { type: "element", tag: "strong", text: "même nombre" },
                  "."
                ]
              },
              { type: "element", tag: "h3", text: "Les étapes clés :" },
              {
                type: "element",
                tag: "ul",
                children: [
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Étape 1 : " }, "repérer un diviseur commun avec les nombres pairs ou les tables de multiplication."]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Étape 2 : " }, "diviser le numérateur et le dénominateur, ou décomposer les nombres pour barrer les facteurs identiques."]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Étape 3 : " }, "s'arrêter quand la fraction devient ", { type: "element", tag: "strong", text: "irréductible" }, "."]
                  }
                ]
              },
              { type: "element", tag: "p", className: "consigne-carrousel", text: "Utilise le carrousel à droite pour visualiser les deux méthodes." }
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
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide", id: "methode1", checked: true } },
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide", id: "methode2" } },
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
                          { type: "element", tag: "div", className: "badge", text: "Méthode 1" },
                          { type: "element", tag: "h4", text: "Le pas à pas" },
                          { type: "element", tag: "p", text: "On divise petit à petit en cherchant les nombres pairs ou les tables." },
                          {
                            type: "element",
                            tag: "div",
                            className: "fraction-display",
                            children: [
                              fraction("42", "60"),
                              arrow("÷2 →"),
                              fraction("21", "30"),
                              arrow("÷3 →"),
                              fraction("7", "10", "frac-concept")
                            ]
                          },
                          { type: "element", tag: "p", className: "statut", text: "Fraction irréductible !" }
                        ]
                      },
                      {
                        type: "element",
                        tag: "div",
                        className: "slide slide-2",
                        children: [
                          { type: "element", tag: "div", className: "badge spec", text: "Méthode 2" },
                          { type: "element", tag: "h4", text: "La décomposition" },
                          { type: "element", tag: "p", text: "On casse les nombres pour barrer les facteurs identiques." },
                          {
                            type: "element",
                            tag: "div",
                            className: "fraction-display",
                            children: [
                              fraction("12", "18"),
                              arrow("→"),
                              fraction("6 × 2", "6 × 3"),
                              arrow("→"),
                              fraction("2", "3", "frac-concept")
                            ]
                          },
                          { type: "element", tag: "p", className: "statut", text: "Le 6 s'en va en haut et en bas." }
                        ]
                      }
                    ]
                  },
                  {
                    type: "element",
                    tag: "div",
                    className: "carrousel-nav",
                    children: [
                      { type: "element", tag: "label", className: "nav-btn btn-1", attributes: { for: "methode1" }, text: "Étape par étape" },
                      { type: "element", tag: "label", className: "nav-btn btn-2", attributes: { for: "methode2" }, text: "Décomposition" }
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
    targetContentId: "fraction-piano-rules"
  },
  buttonText: "S'entrainer"
};
