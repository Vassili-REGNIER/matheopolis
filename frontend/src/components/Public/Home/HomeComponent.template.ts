import { icon } from "../../../utils/icons.js";
import { footerTemplate } from "../../Layout/Footer/FooterComponent.js";

export function homeTemplate(): string {
  return `
    <header class="home-header">
      <div class="home-header-inner">
        <div class="brand">${icon("compass")}<span>Math&eacute;opolis</span></div>
        <button class="btn btn-ghost" type="button" data-action="guest">${icon("sparkles")} Mode Invit&eacute;</button>
      </div>
    </header>

    <section class="hero">
      <div class="hero-media"></div>
      <div class="hero-overlay"></div>
      <div class="pattern" aria-hidden="true">${geometricPatternTemplate()}</div>
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

    ${footerTemplate()}
  `;
}

function geometricPatternTemplate(): string {
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
