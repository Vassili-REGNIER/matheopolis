import { BaseComponent } from "../../../components/BaseComponent.js";
import type { InfoStep } from "../../../models/GameConfig.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";
import { renderInfoContent } from "./infoContentRenderer.js";

export class InfoBlockComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly step: InfoStep
  ) {
    super(container, "matheo-info-block");
  }

  public init(): void {
    this.render(`
      <article class="info-card" data-theme="${this.step.theme ?? "default"}">
        <div class="info-icon">${icon(this.step.theme === "endChapter" ? "award" : "compass")}</div>
        <div class="info-content">
          ${this.renderBody()}
        </div>
        <div class="info-actions">
          ${this.renderSecondaryAction()}
          <button class="info-primary-action" type="button">${this.step.buttonText ?? "Continuer"} ${icon("arrowRight")}</button>
        </div>
      </article>
    `, `
      :host {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      :host .info-card {
        width: min(1080px, 100%);
        padding: 34px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.84);
        box-shadow: var(--matheo-shadow);
        text-align: center;
      }

      :host .info-icon {
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 100%;
        height: 100%;
      }

      :host .info-content {
        margin-bottom: 26px;
      }

      :host .info-content:empty {
        display: none;
      }

      :host h1 {
        margin: 0 0 14px;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(1.9rem, 4vw, 3rem);
        line-height: 1.08;
      }

      :host p {
        margin: 0 auto 26px;
        color: rgba(250, 249, 246, 0.78);
        line-height: 1.65;
        max-width: 620px;
      }

      :host .info-content > p:last-child,
      :host .info-content > div:last-child p:last-child {
        margin-bottom: 0;
      }

      :host .info-content > div:first-of-type {
        margin-bottom: 20px;
      }

      :host .info-content h2 {
        margin: 0 0 10px;
        color: var(--matheo-gold);
        font-family: var(--font-title);
        font-size: clamp(1.25rem, 2.4vw, 1.85rem);
        line-height: 1.15;
      }

      :host .cours-container {
        display: flex;
        gap: 30px;
        border-radius: 8px;
        color: var(--matheo-parchment);
        text-align: left;
      }

      :host .cours-texte,
      :host .cours-visuel {
        flex: 1;
        min-width: 0;
      }

      :host .cours-texte {
        padding: 18px 0;
      }

      :host .cours-texte h3 {
        margin: 22px 0 10px;
        color: #99f6e4;
        font-size: 1rem;
        font-weight: 900;
      }

      :host .cours-texte p,
      :host .slide p {
        color: rgba(250, 249, 246, 0.78);
        max-width: none;
      }

      :host .regle-or {
        margin: 16px 0;
        padding: 14px;
        border: 1px solid rgba(212, 175, 55, 0.26);
        border-left: 4px solid var(--matheo-gold);
        border-radius: 8px;
        background: rgba(212, 175, 55, 0.1);
        color: rgba(250, 249, 246, 0.88);
      }

      :host .cours-texte ul {
        padding-left: 20px;
        color: rgba(250, 249, 246, 0.8);
        line-height: 1.6;
      }

      :host .cours-texte li::marker {
        color: var(--matheo-gold);
      }

      :host .cours-texte strong,
      :host .slide strong {
        color: #fff;
      }

      :host .cours-texte em {
        color: #99f6e4;
        font-style: normal;
        font-weight: 800;
      }

      :host .precision-cours,
      :host .consigne-carrousel,
      :host .introduction {
        color: rgba(250, 249, 246, 0.64);
        font-size: 0.9rem;
        font-style: italic;
      }

      :host .grille-contenu {
        display: flex;
        gap: 20px;
      }

      :host .bloc-colonne {
        flex: 1;
        min-width: 0;
      }

      :host .concept-item,
      :host .exemple-musique-box,
      :host .autres-exemples {
        margin-bottom: 12px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(250, 249, 246, 0.78);
        font-size: 0.88rem;
        line-height: 1.45;
      }

      :host .exemple-musique-box {
        border-left: 4px solid #c084fc;
        background: rgba(192, 132, 252, 0.09);
      }

      :host .exemple-musique-box strong {
        color: #e9d5ff;
      }

      :host .table-correspondance {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 15px 0;
        padding: 10px;
        border: 1px dashed rgba(94, 234, 212, 0.28);
        border-radius: 8px;
        background: rgba(94, 234, 212, 0.08);
        text-align: center;
        font-size: 0.9rem;
      }

      :host .table-correspondance span {
        color: rgba(250, 249, 246, 0.82);
      }

      :host .rules-container {
        display: grid;
        gap: 22px;
        color: var(--matheo-parchment);
        text-align: left;
      }

      :host .rules-intro {
        max-width: 760px;
        margin: 0 auto;
        text-align: center;
      }

      :host .rules-intro h2 {
        margin-bottom: 12px;
      }

      :host .rules-intro p {
        margin-bottom: 0;
        max-width: none;
      }

      :host .rules-sequence {
        margin: 0;
        padding: 16px 18px;
        border: 1px solid rgba(94, 234, 212, 0.22);
        border-radius: 8px;
        background: rgba(94, 234, 212, 0.08);
        color: rgba(250, 249, 246, 0.82);
        line-height: 1.65;
      }

      :host .rules-sequence li {
        margin-left: 18px;
        padding-left: 4px;
      }

      :host .rules-sequence li::marker {
        color: #99f6e4;
        font-weight: 900;
      }

      :host .rules-note {
        margin: 0 auto;
        padding: 12px 14px;
        border-left: 4px solid var(--matheo-gold);
        border-radius: 8px;
        background: rgba(212, 175, 55, 0.1);
        color: rgba(250, 249, 246, 0.82);
        max-width: 760px;
      }

      :host .rules-note strong {
        color: #fff;
      }

      :host .cours-visuel {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      :host .carrousel-wrapper {
        width: 100%;
        max-width: 430px;
        overflow: hidden;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.62);
        box-shadow: 0 18px 42px rgba(4, 8, 24, 0.28);
      }

      :host input[type="radio"] {
        display: none;
      }

      :host .slides {
        display: flex;
        width: 200%;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host .slide {
        width: 50%;
        padding: 24px;
        box-sizing: border-box;
        background: rgba(15, 23, 42, 0.74);
        text-align: center;
      }

      :host .badge {
        display: inline-block;
        padding: 4px 10px;
        border: 1px solid rgba(94, 234, 212, 0.24);
        border-radius: 20px;
        background: rgba(94, 234, 212, 0.14);
        color: #99f6e4;
        font-size: 0.8rem;
        font-weight: 800;
      }

      :host .badge.spec {
        border-color: rgba(212, 175, 55, 0.28);
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .slide h4 {
        margin: 10px 0 5px;
        color: #fff;
        font-size: 1.2rem;
      }

      :host .slide p {
        font-size: 0.9rem;
      }

      :host .tableau-binaire,
      :host .tableau-hexa,
      :host .fraction-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 20px 0;
      }

      :host .tableau-hexa {
        gap: 15px;
      }

      :host .col-bin,
      :host .col-hexa,
      :host .col-hexa-lettre {
        display: flex;
        flex-direction: column;
        width: 75px;
        overflow: hidden;
        border: 1px solid rgba(212, 175, 55, 0.26);
        border-radius: 8px;
      }

      :host .col-hexa,
      :host .col-hexa-lettre {
        width: 90px;
      }

      :host .tableau-binaire.mini .col-bin {
        width: 42px;
      }

      :host .bit,
      :host .chiffre {
        padding: 6px 0;
        background: rgba(250, 249, 246, 0.08);
        color: #fff;
        font-size: 1.5rem;
        font-weight: 800;
      }

      :host .chiffre {
        padding: 8px 0;
        font-size: 1.6rem;
      }

      :host .traduc {
        display: block;
        color: var(--matheo-gold);
        font-size: 0.9rem;
        font-weight: 600;
      }

      :host .poids-binaire,
      :host .puissance {
        padding: 6px 0;
        background: rgba(94, 234, 212, 0.22);
        color: #ccfbf1;
        font-size: 0.75rem;
        font-weight: 800;
        line-height: 1.3;
      }

      :host .puissance.highlight {
        background: rgba(212, 175, 55, 0.22);
        color: #fde68a;
      }

      :host .poids-binaire small,
      :host .puissance small {
        display: block;
        font-size: 0.65rem;
        font-weight: 400;
      }

      :host .poids-binaire.inactive {
        background: rgba(148, 163, 184, 0.18);
        color: rgba(250, 249, 246, 0.56);
      }

      :host .calcul-binaire,
      :host .calcul-hexa {
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      :host .calcul-detail {
        margin-bottom: 5px;
        color: rgba(250, 249, 246, 0.68);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 1rem;
      }

      :host .equation {
        color: #fff;
        font-size: 1.2rem;
        font-weight: 500;
      }

      :host .resultat-final,
      :host .frac-concept {
        color: var(--matheo-green);
      }

      :host .resultat-final {
        border-bottom: 3px solid var(--matheo-green);
        font-size: 1.5rem;
      }

      :host .fraction-display {
        flex-wrap: wrap;
        gap: 10px;
        margin: 25px 0;
        font-size: 1.1rem;
      }

      :host .visualisation-fractale {
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px 0;
      }

      :host .grid-comp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-items: stretch;
      }

      :host .comp-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 112px;
        padding: 8px;
        border: 1px dashed rgba(212, 175, 55, 0.22);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host .label-comp {
        color: rgba(250, 249, 246, 0.74);
        font-size: 0.7rem;
        font-weight: 900;
      }

      :host .label-comp.spec-txt {
        color: #e9d5ff;
      }

      :host .comp-box small {
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.65rem;
        line-height: 1.15;
      }

      :host .onde-simple,
      :host .onde-complexe {
        height: 42px;
        display: flex;
        align-items: center;
        gap: 3px;
      }

      :host .b-simple,
      :host .b-comp {
        border-radius: 2px;
      }

      :host .b-simple {
        width: 10px;
        height: 28px;
        background: rgba(148, 163, 184, 0.86);
      }

      :host .b-simple.sub {
        height: 12px;
      }

      :host .b-comp {
        width: 4px;
        height: 15px;
        background: #d946ef;
      }

      :host .b-comp.h1 {
        height: 35px;
        background: #c084fc;
      }

      :host .b-comp.h2 {
        height: 22px;
        background: #a21caf;
      }

      :host .b-comp.h3 {
        height: 38px;
        background: #6b21a8;
      }

      :host .boite-ext,
      :host .boite-med,
      :host .boite-int {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      :host .boite-ext {
        width: 75px;
        height: 75px;
        border: 2px solid #99f6e4;
        transform: rotate(45deg);
      }

      :host .boite-med {
        width: 48px;
        height: 48px;
        border: 2px solid rgba(153, 246, 228, 0.78);
        transform: rotate(15deg);
      }

      :host .boite-int {
        width: 28px;
        height: 28px;
        border: 2px solid var(--matheo-gold);
        background: rgba(212, 175, 55, 0.1);
        transform: rotate(15deg);
      }

      :host .statut-fractale {
        margin-top: 8px;
        color: #99f6e4 !important;
        font-size: 0.85rem;
        font-weight: 900;
      }

      :host .frac,
      :host .frac-concept {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 0 5px;
      }

      :host .frac-concept {
        font-size: 1.3rem;
      }

      :host .bar {
        width: 100%;
        height: 0;
        margin: 3px 0;
        overflow: hidden;
        border-bottom: 2px solid rgba(250, 249, 246, 0.84);
      }

      :host .frac-concept .bar {
        border-bottom-color: var(--matheo-green);
        border-bottom-width: 3px;
      }

      :host .fleche {
        color: rgba(250, 249, 246, 0.5);
        font-size: 0.9rem;
        font-weight: 900;
      }

      :host .statut {
        margin-top: 10px;
        color: #99f6e4 !important;
        font-weight: 800;
      }

      :host .carrousel-nav {
        display: flex;
        border-top: 1px solid rgba(212, 175, 55, 0.18);
        background: rgba(15, 23, 42, 0.88);
      }

      :host .nav-btn {
        flex: 1;
        padding: 12px;
        color: rgba(250, 249, 246, 0.68);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
      }

      :host .nav-btn:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      :host #exemple1:checked ~ .slides,
      :host #h1:checked ~ .slides,
      :host #methode1:checked ~ .slides,
      :host #tab-auto-ly:checked ~ .slides {
        transform: translateX(0%);
      }

      :host #exemple2:checked ~ .slides,
      :host #h2:checked ~ .slides,
      :host #methode2:checked ~ .slides,
      :host #tab-comp-ly:checked ~ .slides {
        transform: translateX(-50%);
      }

      :host #exemple1:checked ~ .carrousel-nav .btn-1,
      :host #exemple2:checked ~ .carrousel-nav .btn-2,
      :host #h1:checked ~ .carrousel-nav .b-1,
      :host #h2:checked ~ .carrousel-nav .b-2,
      :host #methode1:checked ~ .carrousel-nav .btn-1,
      :host #methode2:checked ~ .carrousel-nav .btn-2,
      :host #tab-auto-ly:checked ~ .carrousel-nav .b-1,
      :host #tab-comp-ly:checked ~ .carrousel-nav .b-2 {
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        font-weight: 800;
      }

      @media (max-width: 860px) {
        :host .cours-container {
          flex-direction: column;
        }

        :host .tableau-binaire {
          gap: 6px;
        }

        :host .cours-visuel {
          width: 100%;
        }

        :host .grille-contenu {
          flex-direction: column;
        }
      }

      :host .info-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      :host button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 20px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
      }

      :host .info-secondary-action {
        border: 1px solid rgba(212, 175, 55, 0.38);
        background: rgba(212, 175, 55, 0.1);
        color: var(--matheo-gold);
      }

      :host button .icon {
        width: 18px;
        height: 18px;
      }

      ${this.renderContentStyle()}
    `);
    this.bindEvents();
  }

  private renderBody(): string {
    const content = renderInfoContent(this.step.content);
    if (content.trim().length > 0) {
      return content;
    }

    return `${this.step.title !== undefined ? `<h1>${escapeHtml(this.step.title)}</h1>` : ""}${this.step.text !== undefined ? `<p>${escapeHtml(this.step.text)}</p>` : ""}`;
  }

  private renderSecondaryAction(): string {
    if (this.step.secondaryAction === undefined) {
      return "";
    }

    return `<button class="info-secondary-action" type="button">${escapeHtml(this.step.secondaryAction.text)}</button>`;
  }

  private renderContentStyle(): string {
    const embeddedStyle = this.step.content !== undefined && !Array.isArray(this.step.content)
      ? this.step.content.styles ?? ""
      : "";

    return `${embeddedStyle}\n${this.step.contentCss ?? ""}`;
  }

  protected bindEvents(): void {
    const button = this.query<HTMLButtonElement>(".info-primary-action");
    if (button !== null) {
      this.listen(button, "click", () => this.emit("stepComplete"));
    }

    const secondaryAction = this.query<HTMLButtonElement>(".info-secondary-action");
    if (secondaryAction !== null && this.step.secondaryAction !== undefined) {
      const targetContentId = this.step.secondaryAction.targetContentId;
      this.listen(secondaryAction, "click", () => this.emit("infoNavigate", {
        targetContentId
      }));
    }
  }
}
