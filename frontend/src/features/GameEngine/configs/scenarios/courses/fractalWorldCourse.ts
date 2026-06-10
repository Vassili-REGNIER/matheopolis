import type { InfoElementContent, InfoStep } from "../../../../../models/GameConfig.js";

function bar(className: string): InfoElementContent {
  return { type: "element", tag: "div", className };
}

export const fractalWorldCourseStep: InfoStep = {
  type: "info",
  content: {
    id: "fractal-world-course",
    titre: "Monde des Fractales",
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
              { type: "element", tag: "h2", text: "Qu'est-ce qu'une fractale ?" },
              {
                type: "element",
                tag: "p",
                children: [
                  "Une ",
                  { type: "element", tag: "strong", text: "fractale" },
                  " est une forme géométrique où une petite partie ressemble au tout. C'est le principe d'",
                  { type: "element", tag: "strong", text: "auto-similitude" },
                  " : quand on zoome, on retrouve le même motif."
                ]
              },
              {
                type: "element",
                tag: "div",
                className: "regle-or",
                children: [
                  { type: "element", tag: "strong", text: "La règle d'or : " },
                  "plus on répète le motif, plus la forme devient détaillée. Dans le jeu, cette répétition est la ",
                  { type: "element", tag: "strong", text: "complexité" },
                  "."
                ]
              },
              { type: "element", tag: "h3", text: "Les idées à retenir :" },
              {
                type: "element",
                tag: "ul",
                children: [
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Complexité basse : " }, "le motif reste simple, comme un tronc avec quelques branches."]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Complexité haute : " }, "les répétitions se multiplient et créent beaucoup de petits détails."]
                  },
                  {
                    type: "element",
                    tag: "li",
                    children: [{ type: "element", tag: "strong", text: "Musique fractale : " }, "une grande mélodie peut être répétée en petites notes rapides, comme un zoom sonore."]
                  }
                ]
              },
              { type: "element", tag: "p", className: "consigne-carrousel", text: "Utilise le carrousel à droite pour visualiser le zoom fractal et l'effet de la complexité." }
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
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-fractale-layout", id: "tab-auto-ly", checked: true } },
                  { type: "element", tag: "input", attributes: { type: "radio", name: "slide-fractale-layout", id: "tab-comp-ly" } },
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
                          { type: "element", tag: "div", className: "badge", text: "Formes et zoom" },
                          { type: "element", tag: "h4", text: "L'effet poupée russe" },
                          { type: "element", tag: "p", text: "Le motif se répète en petit à l'intérieur de lui-même." },
                          {
                            type: "element",
                            tag: "div",
                            className: "visualisation-fractale",
                            children: [
                              {
                                type: "element",
                                tag: "div",
                                className: "motif-fractal-visuel",
                                children: [
                                  {
                                    type: "element",
                                    tag: "div",
                                    className: "boite-ext",
                                    children: [
                                      {
                                        type: "element",
                                        tag: "div",
                                        className: "boite-med",
                                        children: [{ type: "element", tag: "div", className: "boite-int" }]
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
                            className: "autres-exemples",
                            children: [
                              { type: "element", tag: "strong", text: "Dans la nature : " },
                              {
                                type: "element",
                                tag: "ul",
                                children: [
                                  { type: "element", tag: "li", text: "Le chou romanesco répète des petites pyramides dans des pyramides plus grandes." },
                                  { type: "element", tag: "li", text: "Les poumons se divisent en branches de plus en plus fines." }
                                ]
                              }
                            ]
                          },
                          { type: "element", tag: "p", className: "statut-fractale", text: "Du grand angle jusqu'au micro-détail." }
                        ]
                      },
                      {
                        type: "element",
                        tag: "div",
                        className: "slide",
                        children: [
                          { type: "element", tag: "div", className: "badge spec", text: "Complexité et son" },
                          { type: "element", tag: "h4", text: "Complexité et rythme" },
                          { type: "element", tag: "p", text: "Plus la complexité augmente, plus le rythme s'enrichit." },
                          {
                            type: "element",
                            tag: "div",
                            className: "visualisation-fractale grid-comp",
                            children: [
                              {
                                type: "element",
                                tag: "div",
                                className: "comp-box",
                                children: [
                                  { type: "element", tag: "span", className: "label-comp", text: "Complexité 1" },
                                  { type: "element", tag: "div", className: "onde-simple", children: [bar("b-simple"), bar("b-simple sub"), bar("b-simple")] },
                                  { type: "element", tag: "small", text: "Notes longues et lentes" }
                                ]
                              },
                              {
                                type: "element",
                                tag: "div",
                                className: "comp-box",
                                children: [
                                  { type: "element", tag: "span", className: "label-comp spec-txt", text: "Complexité 12" },
                                  { type: "element", tag: "div", className: "onde-complexe", children: [bar("b-comp"), bar("b-comp h1"), bar("b-comp h2"), bar("b-comp h1"), bar("b-comp"), bar("b-comp h2"), bar("b-comp h3")] },
                                  { type: "element", tag: "small", text: "Nuage de notes imbriquées" }
                                ]
                              }
                            ]
                          },
                          {
                            type: "element",
                            tag: "div",
                            className: "autres-exemples",
                            children: [
                              { type: "element", tag: "strong", text: "Dans les sons : " },
                              {
                                type: "element",
                                tag: "ul",
                                children: [
                                  { type: "element", tag: "li", text: "La pluie et les vagues gardent des rythmes similaires à plusieurs échelles." },
                                  { type: "element", tag: "li", text: "Certaines musiques répètent une même idée en notes longues puis en notes très rapides." }
                                ]
                              }
                            ]
                          },
                          { type: "element", tag: "p", className: "statut-fractale", text: "La complexité crée la richesse du morceau." }
                        ]
                      }
                    ]
                  },
                  {
                    type: "element",
                    tag: "div",
                    className: "carrousel-nav",
                    children: [
                      { type: "element", tag: "label", className: "nav-btn b-1", attributes: { for: "tab-auto-ly" }, text: "Exemple de forme" },
                      { type: "element", tag: "label", className: "nav-btn b-2", attributes: { for: "tab-comp-ly" }, text: "Exemple musical" }
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
    targetContentId: "fractal-luthier-rules"
  },
  buttonText: "S'entraîner"
};
