import { riddleInstructionPanelStyles } from "../shared/riddleInstructionPanelStyles.js";
import { stepInteractionChromeStyles } from "../shared/stepInteractionChrome.js";

export function riddleBlockStyles(): string {
  return `
      :host {
        min-height: 100%;
        display: grid;
        align-items: start;
        padding: 24px;
      }

      :host .game-shell {
        width: min(1180px, 100%);
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto;
        gap: 16px;
        border-radius: 12px;
        overflow: hidden;
      }

      :host .game-shell--practice {
        border: 1px solid rgba(94, 234, 212, 0.42);
        box-shadow:
          0 0 0 1px rgba(94, 234, 212, 0.12),
          0 18px 40px rgba(8, 47, 73, 0.28);
      }

      :host .game-shell--challenge {
        border: 1px solid rgba(212, 175, 55, 0.38);
        box-shadow:
          0 0 0 1px rgba(212, 175, 55, 0.1),
          0 18px 40px rgba(0, 0, 0, 0.22);
      }

      :host .riddle-header {
        min-height: 58px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 10px 16px;
        background: rgba(15, 23, 42, 0.9);
      }

      :host .game-shell--practice .riddle-header {
        border-bottom: 1px solid rgba(94, 234, 212, 0.14);
      }

      :host .game-shell--challenge .riddle-header {
        border-bottom: 1px solid rgba(212, 175, 55, 0.18);
      }

      :host .riddle-header h1 {
        margin: 0;
        color: #fff;
        font-family: var(--font-title);
        font-size: clamp(1.55rem, 3vw, 2.35rem);
        line-height: 1.05;
      }

      :host .riddle-heading {
        display: grid;
        gap: 6px;
      }

      :host .mode-indicator {
        min-width: 168px;
        padding: 10px 12px;
        border-radius: 10px;
      }

      :host .mode-indicator--practice {
        border: 1px solid rgba(94, 234, 212, 0.34);
        background: rgba(13, 148, 136, 0.16);
      }

      :host .mode-indicator-label {
        display: block;
        margin-bottom: 8px;
        color: #99f6e4;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host .mode-indicator-list {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
        color: rgba(250, 249, 246, 0.86);
        font-size: 0.88rem;
        font-weight: 700;
      }

      :host .mode-indicator-list li {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      :host .mode-indicator-list li::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #5eead4;
        box-shadow: 0 0 8px rgba(94, 234, 212, 0.55);
      }

      :host .riddle-stats {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }

      :host .riddle-stats div {
        min-width: 92px;
        padding: 7px 10px;
        border: 1px solid rgba(212, 175, 55, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      :host .riddle-stats dt {
        color: rgba(250, 249, 246, 0.68);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      :host .riddle-stats dd {
        margin: 0;
        color: var(--matheo-gold);
        font-size: 1.25rem;
        font-weight: 900;
      }

      :host .riddle-layout {
        display: grid;
        grid-template-columns: minmax(220px, 0.8fr) minmax(0, 2fr);
        align-items: stretch;
        gap: 16px;
        min-height: 0;
        padding: 0 16px 16px;
      }

      :host .instructions-panel,
      :host .interaction-panel {
        min-width: 0;
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.78);
      }

      :host .instructions-panel--practice,
      :host .interaction-panel--practice {
        border: 1px solid rgba(94, 234, 212, 0.22);
      }

      :host .instructions-panel--challenge,
      :host .interaction-panel--challenge {
        border: 1px solid rgba(212, 175, 55, 0.24);
      }

      ${riddleInstructionPanelStyles()}

      :host .interaction-panel {
        display: grid;
        grid-template-rows: auto auto auto;
        align-content: start;
        gap: 12px;
        padding: 18px;
        overflow: visible;
      }

      :host .game-host {
        width: 100%;
        min-height: 0;
        min-width: 0;
      }

      ${stepInteractionChromeStyles()}

      :host .missing-game {
        width: min(560px, 100%);
        margin: auto;
        padding: 28px;
        text-align: center;
      }

      @media (max-width: 900px) {
        :host {
          padding: 16px;
        }

        :host .riddle-header,
        :host .riddle-stats,
        :host .mode-indicator {
          align-items: stretch;
          flex-direction: column;
        }

        :host .mode-indicator,
        :host .riddle-stats {
          width: 100%;
        }

        :host .riddle-layout {
          grid-template-columns: 1fr;
        }

        :host .riddle-stats {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
}
