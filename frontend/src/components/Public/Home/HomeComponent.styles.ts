import { footerStyles } from "../../Layout/Footer/FooterComponent.js";

export function homeStyles(): string {
  return `
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
      background-image: url("./assets/scenes/scene-1.png");
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
      font-size: 7.2rem;
      line-height: 0.92;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    :host .hero-subtitle {
      margin: 22px 0 0;
      color: var(--matheo-gold);
      font-size: 3rem;
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

    @media (max-width: 760px) {
      :host .home-header {
        padding: 18px;
      }

      :host .home-header-inner {
        align-items: flex-start;
        flex-wrap: wrap;
      }

      :host .brand {
        font-size: 1.25rem;
      }

      :host .hero {
        min-height: auto;
        padding: 112px 18px 64px;
      }

      :host h1 {
        font-size: 4.2rem;
      }

      :host .hero-subtitle {
        font-size: 2rem;
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

    @media (max-width: 520px) {
      :host .home-header {
        position: relative;
        background: rgba(15, 23, 42, 0.82);
      }

      :host .home-header-inner,
      :host .hero-actions,
      :host .btn {
        width: 100%;
      }

      :host .home-header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      :host .home-header .btn-ghost {
        width: auto;
        flex: none;
        min-height: 44px;
        padding: 0 12px;
        white-space: nowrap;
      }

      :host .btn {
        min-height: 48px;
      }

      :host .hero {
        padding: 42px 16px 54px;
      }

      :host .badge {
        align-items: flex-start;
        text-align: left;
      }

      :host h1 {
        font-size: 3.2rem;
      }

      :host .hero-subtitle {
        font-size: 1.55rem;
      }

      :host .hero-copy {
        margin: 22px auto 34px;
        font-size: 1rem;
        line-height: 1.62;
      }

      :host .pitch {
        padding: 56px 16px;
      }

      :host .pitch-card {
        min-height: 0;
        padding: 22px;
      }
    }

    @media (max-width: 360px) {
      :host h1 {
        font-size: 2.75rem;
      }

      :host .brand {
        font-size: 1.1rem;
      }

      :host .home-header {
        padding-inline: 12px;
      }

      :host .brand {
        gap: 8px;
      }

      :host .home-header .btn-ghost {
        gap: 6px;
        padding: 0 10px;
        font-size: 0.82rem;
      }
    }
    ${footerStyles()}
  `;
}
