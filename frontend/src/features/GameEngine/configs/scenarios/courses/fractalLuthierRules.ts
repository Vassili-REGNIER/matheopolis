import type { InfoStep } from "../../../../../models/GameConfig.js";

export const fractalLuthierRulesStep: InfoStep = {
  type: "info",
  content: {
    id: "fractal-luthier-rules",
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
              { type: "element", tag: "h2", text: "Mission du luthier fractal" },
              {
                type: "element",
                tag: "p",
                text: "Dans l'atelier secret de Mathéopolis, chaque arbre dessiné fait naître une mélodie. Pour aider Laurence, règle la forme de l'arbre jusqu'à retrouver le son demandé par Pythagore."
              }
            ]
          },
          {
            type: "element",
            tag: "ol",
            className: "rules-sequence",
            children: [
              { type: "element", tag: "li", text: "Écoute la mélodie cible et observe son rythme." },
              { type: "element", tag: "li", text: "Règle la complexité et l'angle pour façonner l'arbre correspondant." },
              { type: "element", tag: "li", text: "Teste, ajuste, puis valide quand la forme et le son s'accordent." }
            ]
          }
        ]
      }
    ]
  },
  buttonText: "Lire le cours"
};
