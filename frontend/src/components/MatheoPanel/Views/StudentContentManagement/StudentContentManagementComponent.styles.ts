export function studentContentManagementStyles(): string {
  return `
    :host {
      display: block;
      min-width: 0;
    }

    :host .view-loading,
    :host .empty-copy {
      color: rgba(250, 249, 246, 0.66);
    }

    :host .list-message {
      margin: 0 0 18px;
      color: var(--matheo-danger);
    }

    :host .view-header {
      margin-bottom: 26px;
    }

    :host .view-header p,
    :host .content-card-copy p,
    :host .content-section h2 {
      margin: 0 0 6px;
      color: var(--matheo-gold);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .view-header h1 {
      margin: 0 0 6px;
      color: #fff;
      font-size: clamp(2rem, 4vw, 3rem);
    }

    :host .view-header span {
      color: rgba(250, 249, 246, 0.58);
    }

    :host .content-section {
      margin-bottom: 28px;
    }

    :host .content-section-header {
      margin-bottom: 14px;
    }

    :host .content-section h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      font-size: 0.82rem;
    }

    :host .content-section-header p {
      margin: 0;
      color: rgba(250, 249, 246, 0.52);
      font-size: 0.88rem;
      letter-spacing: normal;
      text-transform: none;
      font-weight: 500;
    }

    :host .content-list {
      display: grid;
      gap: 12px;
    }

    :host .content-card {
      position: relative;
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.62);
    }

    :host .content-card.is-menu-open {
      z-index: 2;
    }

    :host .content-card-menu-wrap {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 3;
    }

    :host .content-menu-trigger {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(250, 249, 246, 0.82);
      cursor: pointer;
    }

    :host .content-menu-trigger:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    :host .content-menu-trigger:hover:not(:disabled),
    :host .content-menu-trigger[aria-expanded="true"] {
      background: rgba(212, 175, 55, 0.18);
      color: #fff;
    }

    :host .content-class-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 10;
      width: min(360px, calc(100vw - 120px));
      max-height: 320px;
      overflow: auto;
      padding: 8px;
      border: 1px solid rgba(212, 175, 55, 0.55);
      border-radius: 12px;
      background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
    }

    :host .menu-empty {
      margin: 0;
      padding: 10px 12px;
      color: rgba(250, 249, 246, 0.62);
      font-size: 0.9rem;
    }

    :host .content-class-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
    }

    :host .content-class-row + .content-class-row {
      margin-top: 4px;
    }

    :host .content-class-row:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    :host .content-class-copy {
      min-width: 0;
      display: grid;
      gap: 4px;
    }

    :host .content-class-copy strong {
      color: #fff;
      font-size: 0.95rem;
      overflow-wrap: anywhere;
    }

    :host .class-level {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(250, 249, 246, 0.72);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    :host .access-toggle {
      width: 54px;
      height: 28px;
      position: relative;
      flex: none;
      border: 0;
      border-radius: 999px;
      background: #4b5563;
      cursor: pointer;
    }

    :host .access-toggle:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    :host .access-toggle[data-enabled="true"] {
      background: var(--matheo-gold);
    }

    :host .access-toggle span {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      transition: transform 160ms ease;
    }

    :host .access-toggle[data-enabled="true"] span {
      transform: translateX(26px);
    }

    :host .content-card-trigger {
      width: 100%;
      min-width: 0;
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      align-items: center;
      gap: 14px;
      padding: 18px 52px 18px 18px;
      border: 0;
      background: transparent;
      color: #fff;
      text-align: left;
      cursor: pointer;
    }

    :host .content-card-trigger:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    :host .content-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      background: rgba(212, 175, 55, 0.12);
      color: var(--matheo-gold);
    }

    :host .content-card-copy h3 {
      margin: 0 0 4px;
      color: #fff;
      line-height: 1.3;
    }

    :host .content-card-copy span {
      display: block;
      color: rgba(250, 249, 246, 0.55);
      font-size: 0.9rem;
      letter-spacing: normal;
      text-transform: none;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host .content-card-chevron {
      color: rgba(250, 249, 246, 0.38);
    }

    :host .icon {
      width: 20px;
      height: 20px;
    }
  `;
}
