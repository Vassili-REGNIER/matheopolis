import { footerStyles } from "../Layout/Footer/FooterComponent.js";
import { floatingTopButtonStyles } from "../Shared/FloatingTopButton/FloatingTopButton.js";

export function gameHomeStyles(): string {
  return `
    :host {
      min-height: 100vh;
      display: block;
      background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #312e81);
      color: var(--matheo-parchment);
    }

    :host .icon {
      width: 1.2em;
      height: 1.2em;
      flex: none;
    }

    :host .loading-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      gap: 12px;
      color: rgba(250, 249, 246, 0.72);
      text-align: center;
    }

    :host .loading-icon {
      width: 64px;
      height: 64px;
      color: var(--matheo-gold);
    }

    :host .loading-icon .icon {
      width: 100%;
      height: 100%;
    }

    :host .map-top-anchor {
      scroll-margin-top: 0;
    }

    :host .map-header {
      position: sticky;
      top: 0;
      z-index: 30;
      border-bottom: 1px solid rgba(212, 175, 55, 0.22);
      background: rgba(15, 23, 42, 0.86);
      backdrop-filter: blur(12px);
    }

    :host .header-inner {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    :host .map-title {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 900;
    }

    :host .map-title .icon,
    :host .panel-button .icon,
    :host .home-button .icon,
    :host .stats-grid .icon,
    :host .timeline h1 .icon,
    :host .chapter-icon .icon,
    :host .guest-banner .icon {
      color: var(--matheo-gold);
    }

    :host .header-actions,
    :host .player-box,
    :host .panel-button,
    :host .home-button {
      display: flex;
      align-items: center;
    }

    :host .header-actions {
      gap: 18px;
    }

    :host .player-box {
      gap: 12px;
      padding-right: 18px;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      justify-content: center;
      text-align: center;
    }

    :host .player-box strong {
      display: block;
      color: #fff;
    }

    :host .player-box .player-mode {
      color: var(--matheo-gold);
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .avatar {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 2px solid var(--matheo-gold);
      border-radius: 50%;
      background: linear-gradient(135deg, #6b21a8, #5b21b6);
    }

    :host .panel-button,
    :host .home-button {
      min-height: 42px;
      gap: 10px;
      padding: 0 16px;
      border: 1px solid rgba(212, 175, 55, 0.42);
      border-radius: 10px;
      background: rgba(212, 175, 55, 0.1);
      color: var(--matheo-gold);
      font-weight: 900;
    }

    :host .panel-button:hover,
    :host .home-button:hover {
      background: var(--matheo-gold);
      color: #0f172a;
    }

    :host .panel-button:hover .icon,
    :host .home-button:hover .icon {
      color: #0f172a;
    }

    :host .progress-row > div:first-child {
      display: flex;
      justify-content: space-between;
      margin-bottom: 7px;
      color: var(--matheo-gold);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .bar {
      height: 6px;
      overflow: hidden;
      border-radius: 999px;
      background: #312e81;
    }

    :host .bar span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #d4af37, #ffd166);
    }

    :host .map-main {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 42px 24px 64px;
    }

    :host .guest-banner {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 34px;
      padding: 20px;
      border-left: 4px solid var(--matheo-gold);
      border-radius: 0 14px 14px 0;
      background: linear-gradient(90deg, rgba(212, 175, 55, 0.18), transparent);
    }

    :host .guest-banner .icon {
      width: 38px;
      height: 38px;
    }

    :host .guest-banner h2,
    :host .guest-banner p {
      margin: 0;
    }

    :host .guest-banner p {
      margin-top: 4px;
      color: rgba(250, 249, 246, 0.76);
    }

    :host .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }

    :host .content-toolbar {
      display: grid;
      gap: 14px;
      margin-bottom: 34px;
      padding: 18px;
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.58);
    }

    :host .search-field {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      padding: 0 16px;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.72);
    }

    :host .search-icon {
      display: grid;
      place-items: center;
      color: var(--matheo-gold);
    }

    :host .search-icon .icon {
      width: 18px;
      height: 18px;
    }

    :host .search-field input {
      width: 100%;
      min-width: 0;
      border: 0;
      background: transparent;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
    }

    :host .search-field input::placeholder {
      color: rgba(250, 249, 246, 0.42);
    }

    :host .content-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    :host .filter-chip {
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 14px;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      color: rgba(250, 249, 246, 0.72);
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
    }

    :host .filter-chip .icon {
      width: 16px;
      height: 16px;
    }

    :host .filter-chip.is-active {
      border-color: var(--matheo-gold);
      background: rgba(212, 175, 55, 0.16);
      color: #fff;
    }

    :host .filter-chip.is-active .icon {
      color: var(--matheo-gold);
    }

    :host .empty-filter-copy {
      margin: 0 0 24px;
      padding: 18px 20px;
      border: 1px dashed rgba(212, 175, 55, 0.28);
      border-radius: 12px;
      color: rgba(250, 249, 246, 0.66);
      text-align: center;
    }

    :host .stats-grid article {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 22px;
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.58);
      box-shadow: 0 16px 40px rgba(2, 6, 23, 0.16);
    }

    :host .stats-grid article > .icon {
      width: 42px;
      height: 42px;
      padding: 8px;
      border-radius: 10px;
      background: rgba(107, 33, 168, 0.28);
    }

    :host .stats-grid strong {
      display: block;
      color: #fff;
      font-size: 1.55rem;
    }

    :host .stats-grid span {
      color: rgba(250, 249, 246, 0.48);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .timeline h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 26px;
      color: #fff;
      font-size: 1.65rem;
    }

    :host .timeline,
    :host .quiz-section {
      margin-bottom: 42px;
    }

    :host .era-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 5px;
    }

    :host .era-row .era {
      margin: 0;
    }

    :host .visibility-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.62rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .visibility-badge.public {
      border: 1px solid rgba(212, 175, 55, 0.45);
      background: rgba(212, 175, 55, 0.14);
      color: var(--matheo-gold);
    }

    :host .visibility-badge.private {
      border: 1px solid rgba(167, 139, 250, 0.45);
      background: rgba(107, 33, 168, 0.24);
      color: #ddd6fe;
    }

    :host .chapter-list {
      display: grid;
      gap: 16px;
    }

    :host .chapter-wrap {
      position: relative;
    }

    :host .connector {
      position: absolute;
      left: 39px;
      top: 88px;
      width: 4px;
      height: 28px;
      border-radius: 999px;
      background: rgba(212, 175, 55, 0.12);
    }

    :host .chapter-card {
      position: relative;
      display: flex;
      gap: 22px;
      padding: 22px;
      border: 2px solid rgba(212, 175, 55, 0.3);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.58);
      transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
    }

    :host .chapter-card[data-enabled="true"] {
      cursor: pointer;
    }

    :host .chapter-card[data-enabled="true"]:hover {
      border-color: var(--matheo-gold);
      transform: translateY(-1px);
      background: rgba(15, 23, 42, 0.74);
    }

    :host .chapter-card.disabled {
      opacity: 0.52;
      filter: grayscale(0.75);
    }

    :host .chapter-card.guest-card[data-enabled="true"] .chapter-top {
      margin-bottom: 0;
    }

    :host .chapter-icon {
      width: 80px;
      height: 80px;
      display: grid;
      place-items: center;
      flex: none;
      border: 2px solid var(--matheo-gold);
      border-radius: 50%;
      background: linear-gradient(135deg, #6b21a8, #5b21b6);
    }

    :host .chapter-icon .icon {
      width: 34px;
      height: 34px;
    }

    :host .chapter-content {
      min-width: 0;
      flex: 1;
    }

    :host .chapter-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    :host .era {
      margin: 0 0 5px;
      color: var(--matheo-gold);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .chapter-top h2 {
      margin: 0 0 5px;
      color: #fff;
      font-size: 1.35rem;
    }

    :host .subtitle,
    :host .locked-copy {
      margin: 0;
      color: rgba(250, 249, 246, 0.6);
    }

    @media (max-width: 780px) {
      :host .header-inner,
      :host .header-actions,
      :host .chapter-top {
        align-items: stretch;
        flex-direction: column;
      }

      :host .player-box {
        justify-content: space-between;
        padding-right: 0;
        border-right: 0;
        text-align: center;
      }

      :host .stats-grid {
        grid-template-columns: 1fr;
      }

      :host .chapter-card {
        flex-direction: column;
      }

      :host .connector {
        display: none;
      }
    }

    ${floatingTopButtonStyles()}

    ${footerStyles()}
  `;
}
