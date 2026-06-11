import { BaseComponent } from "../../BaseComponent.js";
import { backToMapButtonStyles, backToMapButtonTemplate, BACK_TO_MAP_SELECTOR } from "../../Shared/BackToMapButton/BackToMapButton.js";
import { footerStyles } from "../../Layout/Footer/FooterComponent.js";
import { footerTemplate } from "../../Layout/Footer/FooterComponent.js";
import type { Router } from "../../../router/Router.js";
import { icon } from "../../../utils/icons.js";

export class AboutComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router
  ) {
    super(container, "matheo-about");
  }

  public init(): void {
    this.render(`
      <header class="about-header">
        <div class="about-header-inner">
          <div class="about-title">${icon("compass")}<span>Math&eacute;opolis</span></div>
          ${backToMapButtonTemplate()}
        </div>
      </header>

      <main class="about-main">
        <section class="about-hero">
          <p class="about-kicker">Projet ludo-p&eacute;dagogique</p>
          <h1>Qui sommes-nous ?</h1>
          <p>
            Math&eacute;opolis est une plateforme web interactive inspir&eacute;e des ouvrages
            <a href="https://www.matheopolis.org/" target="_blank" rel="noopener noreferrer">Math&eacute;opolis</a>,
            r&eacute;alis&eacute;s par l'association Maths Pour Tous.
          </p>
        </section>

        <section class="team-section" aria-label="Membres du projet">
          <h2>${icon("users")} Membres</h2>
          <ul class="team-list">
            <li>Sofia Ach</li>
            <li>Maxime Arfi</li>
            <li>Heather Burbeck</li>
            <li>Ilian Marchitto</li>
            <li>Vassili R&eacute;gnier</li>
          </ul>
        </section>

        <section class="about-grid" aria-label="Pr&eacute;sentation du projet">
          <article class="about-panel about-panel--wide">
            <h2>${icon("book")} Le projet</h2>
            <p>
              Notre objectif est de proposer une exp&eacute;rience immersive pour aider les &eacute;l&egrave;ves
              de coll&egrave;ge et de lyc&eacute;e &agrave; d&eacute;couvrir des notions math&eacute;matiques &agrave; travers
              un univers narratif, interactif et progressif.
            </p>
          </article>

          <article class="about-panel">
            <h2>${icon("graduation")} Cadre</h2>
            <p>
              Le projet est r&eacute;alis&eacute; dans le cadre d'une SAE par un groupe de deuxi&egrave;me ann&eacute;e
              du BUT Informatique d'Aix-Marseille Universit&eacute;.
            </p>
          </article>

          <article class="about-panel">
            <h2>${icon("sparkles")} L'exp&eacute;rience</h2>
            <ul>
              <li>Des sc&eacute;narios narratifs</li>
              <li>Des mini-jeux</li>
              <li>Des quiz interactifs</li>
            </ul>
          </article>
        </section>
      </main>

      ${footerTemplate()}
    `, `
      :host {
        min-height: 100vh;
        display: block;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
        color: var(--matheo-parchment);
      }

      :host .icon {
        width: 1.15em;
        height: 1.15em;
        flex: none;
      }

      :host .about-header {
        position: sticky;
        top: 0;
        z-index: 30;
        border-bottom: 1px solid rgba(212, 175, 55, 0.22);
        background: rgba(15, 23, 42, 0.86);
        backdrop-filter: blur(12px);
      }

      :host .about-header-inner {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      :host .about-title {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-size: 1.25rem;
        font-weight: 900;
      }

      :host .about-title .icon,
      :host .about-kicker,
      :host .about-panel h2 .icon,
      :host .team-section h2 .icon {
        color: var(--matheo-gold);
      }

      :host .about-main {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 62px 24px 72px;
      }

      :host .about-hero {
        width: min(860px, 100%);
        margin-bottom: 34px;
      }

      :host .about-kicker {
        margin: 0 0 12px;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      :host h1 {
        margin: 0;
        color: #fff;
        font-family: var(--font-title);
        font-size: 4.8rem;
        line-height: 0.95;
        font-weight: 900;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      :host .about-hero p {
        width: min(760px, 100%);
        margin: 22px 0 0;
        color: rgba(250, 249, 246, 0.78);
        font-size: 1.08rem;
        line-height: 1.75;
      }

      :host a {
        color: var(--matheo-gold);
        font-weight: 800;
        text-decoration: none;
        border-bottom: 1px solid rgba(212, 175, 55, 0.42);
      }

      :host a:hover {
        border-bottom-color: currentColor;
      }

      :host .about-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      :host .about-panel,
      :host .team-section {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.58);
        box-shadow: 0 18px 50px rgba(2, 6, 23, 0.24);
      }

      :host .about-panel {
        padding: 24px;
      }

      :host .about-panel--wide {
        grid-column: 1 / -1;
      }

      :host h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 14px;
        color: #fff;
        font-size: 1.15rem;
        font-weight: 900;
      }

      :host .about-panel p,
      :host .about-panel li {
        color: rgba(250, 249, 246, 0.74);
        line-height: 1.7;
      }

      :host .about-panel p {
        margin: 0;
      }

      :host .about-panel ul,
      :host .team-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      :host .about-panel li {
        position: relative;
        padding-left: 18px;
      }

      :host .about-panel li + li {
        margin-top: 8px;
      }

      :host .about-panel li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.75em;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--matheo-gold);
      }

      :host .team-section {
        margin-bottom: 18px;
        padding: 24px;
      }

      :host .team-list {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
      }

      :host .team-list li {
        min-height: 48px;
        display: grid;
        place-items: center;
        padding: 10px;
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 10px;
        background: rgba(250, 249, 246, 0.055);
        color: rgba(250, 249, 246, 0.86);
        font-weight: 800;
        text-align: center;
      }

      ${backToMapButtonStyles()}
      ${footerStyles()}

      @media (max-width: 980px) {
        :host .team-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        :host h1 {
          font-size: 3.6rem;
        }
      }

      @media (max-width: 820px) {
        :host .about-header-inner {
          align-items: flex-start;
          flex-direction: column;
        }

        :host .about-main {
          padding: 42px 18px 56px;
        }

        :host .about-grid,
        :host .team-list {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 520px) {
        :host .about-header-inner,
        :host .back-button {
          width: 100%;
        }

        :host .about-main {
          padding: 34px 16px 50px;
        }

        :host h1 {
          font-size: 2.7rem;
        }

        :host .about-panel,
        :host .team-section {
          padding: 20px;
        }
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {
    const backButton = this.query<HTMLButtonElement>(BACK_TO_MAP_SELECTOR);
    if (backButton !== null) {
      this.listen(backButton, "click", () => this.router.navigate("/game-home"));
    }
  }
}
