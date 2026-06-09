import { BaseComponent } from "../../BaseComponent.js";
import type { AppServices } from "../../../models/services/AppServices.js";
import type { Router } from "../../../router/Router.js";
import { icon } from "../../../utils/icons.js";

export class HomeComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-home");
  }

  public init(): void {
    this.render(`
      <header class="home-header">
        <div class="home-header-inner">
          <div class="brand">${icon("compass")}<span>Math&eacute;opolis</span></div>
          <button class="btn btn-ghost" type="button" data-action="guest">${icon("sparkles")} Mode Invit&eacute;</button>
        </div>
      </header>

      <section class="hero">
        <div class="hero-media"></div>
        <div class="hero-overlay"></div>
        <div class="pattern" aria-hidden="true">${this.geometricPattern()}</div>
        <div class="hero-content">
          <div class="badge">${icon("star")} <span>Une aventure math&eacute;matique in&eacute;dite</span></div>
          <h1>Math&eacute;opolis</h1>
          <p class="hero-subtitle">L'aventure math&eacute;matique commence</p>
          <p class="hero-copy">
            Aidez Laurence Guerney &agrave; retrouver son p&egrave;re en progressant dans des chapitres narratifs,
            des mini-jeux math&eacute;matiques et des quiz inspir&eacute;s de l'univers de Math&eacute;opolis.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button" data-action="register">${icon("compass")} Inscription</button>
            <button class="btn btn-outline" type="button" data-action="login">${icon("graduation")} Connexion</button>
          </div>
        </div>
      </section>

      <section class="pitch">
        <div class="pitch-grid">
          <article class="pitch-card">
            <div class="pitch-icon">${icon("book")}</div>
            <h2>Aidez Laurence</h2>
            <p>Accompagnez Laurence dans son enqu&ecirc;te pour retrouver son p&egrave;re et comprendre les indices laiss&eacute;s dans Math&eacute;opolis.</p>
          </article>
          <article class="pitch-card">
            <div class="pitch-icon">${icon("compass")}</div>
            <h2>Progressez par chapitres</h2>
            <p>Avancez dans des sc&egrave;nes de dialogue, des explications et des &eacute;nigmes interactives reli&eacute;es &agrave; l'histoire de Laurence.</p>
          </article>
          <article class="pitch-card">
            <div class="pitch-icon">${icon("barChart")}</div>
            <h2>Apprenez en jouant</h2>
            <p>R&eacute;solvez des mini-jeux et des quiz pour travailler les notions de maths, suivre votre progression et continuer l'aventure.</p>
          </article>
        </div>
      </section>

      <footer class="home-footer">
        <p>&copy; 2026 Math&eacute;opolis - Une aventure &eacute;ducative bas&eacute;e sur la s&eacute;rie de livres</p>
      </footer>
    `, `
      :host {
        min-height: 100vh;
        display: block;
        background: linear-gradient(135deg, #1e3a8a, #312e81 52%, #5b21b6);
        color: var(--matheo-parchment);
      }

      :host .home-header {
        position: absolute;
        inset: 0 0 auto;
        z-index: 20;
        padding: 24px;
      }

      :host .home-header-inner {
        width: min(1120px, 100%);
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      :host .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-size: 1.55rem;
        font-weight: 900;
        letter-spacing: 0.04em;
      }

      :host .icon {
        width: 1.15em;
        height: 1.15em;
        flex: none;
      }

      :host .brand .icon,
      :host .badge .icon,
      :host .pitch-icon .icon {
        color: var(--matheo-gold);
      }

      :host .hero {
        position: relative;
        min-height: 100vh;
        display: grid;
        place-items: center;
        overflow: hidden;
        padding: 104px 24px 76px;
      }

      :host .hero-media {
        position: absolute;
        inset: 0;
        background-image: url("./public/assets/scenes/scene-1.png");
        background-size: cover;
        background-position: center;
        opacity: 0.34;
        transform: scale(1.02);
      }

      :host .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(30, 58, 138, 0.12), rgba(30, 58, 138, 0.58), #1e3a8a 94%);
      }

      :host .pattern {
        position: absolute;
        inset: 0;
        opacity: 0.42;
      }

      :host .hero-content {
        position: relative;
        z-index: 2;
        width: min(940px, 100%);
        text-align: center;
      }

      :host .badge {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 30px;
        padding: 8px 14px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 999px;
        background: rgba(91, 33, 182, 0.34);
        backdrop-filter: blur(10px);
        color: rgba(250, 249, 246, 0.94);
        font-size: 0.9rem;
      }

      :host h1 {
        margin: 0;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(4rem, 10vw, 7.2rem);
        line-height: 0.92;
        font-weight: 900;
      }

      :host .hero-subtitle {
        margin: 22px 0 0;
        color: var(--matheo-gold);
        font-size: clamp(1.65rem, 4vw, 3rem);
        font-weight: 300;
      }

      :host .hero-copy {
        width: min(760px, 100%);
        margin: 28px auto 44px;
        color: rgba(250, 249, 246, 0.9);
        font-size: 1.16rem;
        line-height: 1.75;
      }

      :host .hero-actions,
      :host .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      :host .hero-actions {
        gap: 16px;
        flex-wrap: wrap;
      }

      :host .btn {
        min-height: 52px;
        gap: 10px;
        padding: 0 24px;
        border-radius: 10px;
        border: 2px solid transparent;
        font-weight: 900;
        line-height: 1;
        transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
      }

      :host .btn:hover {
        transform: translateY(-1px);
      }

      :host .btn-primary {
        background: var(--matheo-gold);
        border-color: var(--matheo-gold);
        color: #1e3a8a;
        box-shadow: 0 18px 45px rgba(212, 175, 55, 0.28);
      }

      :host .btn-primary:hover {
        background: var(--matheo-copper);
      }

      :host .btn-outline {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.26);
        color: #fff;
      }

      :host .btn-outline:hover {
        background: #fff;
        color: #1e3a8a;
      }

      :host .btn-ghost {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(212, 175, 55, 0.4);
        color: #fff;
      }

      :host .btn-ghost:hover {
        background: rgba(212, 175, 55, 0.12);
        border-color: var(--matheo-gold);
      }

      :host .pitch {
        position: relative;
        padding: 80px 24px;
        background: linear-gradient(to bottom, #1e3a8a, #0f172a);
      }

      :host .pitch-grid {
        width: min(1120px, 100%);
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }

      :host .pitch-card {
        position: relative;
        min-height: 278px;
        padding: 30px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.78);
        box-shadow: 0 20px 52px rgba(2, 6, 23, 0.22);
        overflow: hidden;
      }

      :host .pitch-card::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(107, 33, 168, 0.45), rgba(91, 33, 182, 0.3));
        opacity: 0.55;
        transition: opacity 160ms ease;
      }

      :host .pitch-card:hover {
        border-color: rgba(212, 175, 55, 0.55);
      }

      :host .pitch-card:hover::before {
        opacity: 0.72;
      }

      :host .pitch-card > * {
        position: relative;
        z-index: 1;
      }

      :host .pitch-icon {
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        margin-bottom: 24px;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.18);
      }

      :host .pitch-icon .icon {
        width: 30px;
        height: 30px;
      }

      :host .pitch-card h2 {
        margin: 0 0 14px;
        color: #fff;
        font-size: 1.45rem;
      }

      :host .pitch-card p {
        margin: 0;
        color: rgba(250, 249, 246, 0.78);
        line-height: 1.7;
      }

      :host .home-footer {
        padding: 28px 24px;
        border-top: 1px solid rgba(212, 175, 55, 0.2);
        background: #0f172a;
        text-align: center;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .home-footer p {
        margin: 0;
      }

      @media (max-width: 760px) {
        :host .home-header {
          padding: 18px;
        }

        :host .home-header-inner {
          align-items: flex-start;
        }

        :host .brand {
          font-size: 1.25rem;
        }

        :host .btn-ghost {
          min-height: 42px;
          padding: 0 14px;
          font-size: 0.9rem;
        }

        :host .pitch-grid {
          grid-template-columns: 1fr;
        }
      }
    `);
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      this.listen(button, "click", () => {
        const action = button.dataset.action;
        if (action === "register") {
          this.router.navigate("/register");
        } else if (action === "login") {
          this.router.navigate("/login");
        } else if (action === "guest") {
          this.services.auth.startGuestSession();
          this.router.navigate("/game-home");
        }
      });
    });
  }

  private geometricPattern(): string {
    return `
      <svg class="geo-svg" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="matheo-grid-home" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="3" fill="#d4af37" opacity="0.35"/>
            <circle cx="40" cy="40" r="15" fill="none" stroke="#d4af37" stroke-width="0.5"/>
            <circle cx="40" cy="40" r="30" fill="none" stroke="#6b21a8" stroke-width="0.5"/>
            <path d="M40 0v80M0 40h80M0 0l80 80M80 0 0 80" stroke="#d4af37" stroke-width="0.28" opacity="0.45"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#matheo-grid-home)"/>
        <text x="8%" y="18%" fill="#d4af37" opacity="0.18" font-size="42" font-family="serif">&#960;</text>
        <text x="86%" y="28%" fill="#d4af37" opacity="0.16" font-size="40" font-family="serif">&#966;</text>
        <text x="16%" y="78%" fill="#d4af37" opacity="0.16" font-size="38" font-family="serif">&#8730;</text>
      </svg>
    `;
  }
}
