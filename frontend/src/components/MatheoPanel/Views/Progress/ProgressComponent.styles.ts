export function progressStyles(): string {
  return `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header-with-back {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      :host .view-header-copy {
        min-width: 0;
      }

      :host .back-button {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        flex: none;
        margin-top: 4px;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
        cursor: pointer;
      }

      :host .back-button:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }

      :host .view-loading,
      :host .view-header p,
      :host .view-header span {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .view-header p,
      :host .student-info-grid span {
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
        display: block;
        font-size: 0.92rem;
        letter-spacing: normal;
        text-transform: none;
        font-weight: 600;
      }

      :host .student-info-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }

      :host .student-info-grid article {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 92px;
        padding: 18px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .student-info-grid strong {
        display: block;
        color: #fff;
        overflow-wrap: anywhere;
      }

      :host .progress-list {
        display: grid;
        gap: 14px;
      }

      :host article {
        padding: 20px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .row-main {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      :host .row-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 22px;
        height: 22px;
      }

      :host .row-main h2 {
        margin: 0;
        color: #fff;
        line-height: 1.25;
      }

      :host .row-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin: 16px 0 10px;
        font-size: 0.82rem;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .row-percent {
        color: var(--matheo-gold);
        font-weight: 900;
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
        background: var(--matheo-gold);
      }

      @media (max-width: 860px) {
        :host .student-info-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
}
