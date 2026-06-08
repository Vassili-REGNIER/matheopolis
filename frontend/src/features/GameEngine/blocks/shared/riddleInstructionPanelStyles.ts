export function riddleInstructionPanelStyles(): string {
  return `
    :host .instructions-panel {
      display: grid;
      align-content: start;
      gap: 18px;
      padding: 22px;
      color: rgba(250, 249, 246, 0.78);
    }

    :host .intro-text {
      margin: 0;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.18);
      line-height: 1.65;
    }

    :host .panel-mode-tag {
      margin: 0;
      padding: 6px 10px;
      border: 1px solid rgba(94, 234, 212, 0.28);
      border-radius: 999px;
      background: rgba(13, 148, 136, 0.14);
      color: #99f6e4;
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-align: center;
    }

    :host .score-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 0;
      padding: 10px 12px;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 8px;
      background: rgba(212, 175, 55, 0.1);
      color: rgba(250, 249, 246, 0.84);
      font-size: 0.86rem;
      font-weight: 800;
      line-height: 1.45;
    }

    :host .score-notice .icon {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      color: var(--matheo-gold);
    }

    :host .current-task {
      display: grid;
      gap: 14px;
    }

    :host .instructions-panel h2 {
      margin: 0;
      color: var(--matheo-gold);
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .instructions-panel p {
      margin: 0;
      line-height: 1.65;
    }

    :host .instructions-panel--practice h2 {
      color: #99f6e4;
    }

    :host .current-question {
      display: grid;
      gap: 14px;
      padding: 16px;
      border: 1px solid rgba(212, 175, 55, 0.32);
      border-radius: 8px;
      background: rgba(212, 175, 55, 0.12);
      color: #fff;
    }

    :host .instructions-panel--practice .current-question {
      border-color: rgba(94, 234, 212, 0.28);
      background: rgba(13, 148, 136, 0.12);
    }

    :host .current-question p {
      margin: 0;
      color: rgba(250, 249, 246, 0.82);
      line-height: 1.55;
    }

    :host .current-question span {
      color: var(--matheo-gold);
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .instructions-panel--practice .current-question span {
      color: #99f6e4;
    }

    :host .current-question strong {
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 1.25rem;
      line-height: 1.35;
    }

    :host .instruction-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin: 0;
    }

    :host .instruction-actions--dual {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :host .riddle-course-button,
    :host .hint-button {
      width: 100%;
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 14px;
      border: 1px solid rgba(212, 175, 55, 0.36);
      border-radius: 8px;
      background: rgba(212, 175, 55, 0.1);
      color: var(--matheo-gold);
      font-weight: 900;
    }

    :host .hint-button {
      border-color: rgba(212, 175, 55, 0.42);
      background: rgba(212, 175, 55, 0.14);
      color: #fde68a;
    }

    :host .riddle-course-button .icon,
    :host .hint-button .icon {
      width: 18px;
      height: 18px;
    }

    :host .instruction-hint {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 12px 14px;
      border: 1px solid rgba(212, 175, 55, 0.42);
      border-left: 4px solid var(--matheo-gold);
      border-radius: 8px;
      background: rgba(212, 175, 55, 0.14);
      color: #fde68a;
    }

    :host .instruction-hint[hidden] {
      display: none;
    }

    :host .instruction-hint strong {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #fde68a;
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .instruction-hint strong .icon {
      width: 18px;
      height: 18px;
    }

    :host .instruction-hint p {
      margin: 0;
      color: rgba(254, 243, 199, 0.92);
      line-height: 1.55;
    }

    @media (max-width: 520px) {
      :host .instruction-actions--dual {
        grid-template-columns: 1fr;
      }
    }
  `;
}
