import { floatingTopButtonStyles } from "../../components/Shared/FloatingTopButton/FloatingTopButton.js";

export function quizPlayStyles(): string {
  return `
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

    :host .quiz-shell {
      width: min(1320px, 100%);
      margin: 0 auto;
      padding: 24px;
    }

    :host .game-header,
    :host .quiz-meta,
    :host .back-button,
    :host .question-actions {
      display: flex;
      align-items: center;
    }

    :host .game-header {
      position: sticky;
      top: 0;
      z-index: 20;
      min-height: 72px;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.22);
      background: rgba(15, 23, 42, 0.86);
      backdrop-filter: blur(12px);
    }

    :host .back-button,
    :host .quiz-meta,
    :host .question-actions button {
      gap: 10px;
    }

    :host .back-button,
    :host .question-actions button {
      min-height: 42px;
      border: 1px solid rgba(212, 175, 55, 0.38);
      border-radius: 10px;
      padding: 0 14px;
      background: rgba(15, 23, 42, 0.54);
      color: var(--matheo-gold);
      font-weight: 900;
    }

    :host .question-actions button:disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }

    :host .question-actions .primary {
      border-color: var(--matheo-gold);
      background: var(--matheo-gold);
      color: #0f172a;
    }

    :host .quiz-meta {
      color: rgba(250, 249, 246, 0.72);
      font-size: 0.84rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .quiz-layout {
      display: grid;
      grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }

    :host .quiz-summary {
      padding: 24px 0;
    }

    :host .question-top p,
    :host .question-top span {
      margin: 0;
      color: var(--matheo-gold);
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .quiz-summary h1 {
      margin: 8px 0 12px;
      color: #fff;
      font-family: var(--font-title);
      font-size: 2.4rem;
      line-height: 1;
    }

    :host .quiz-summary p {
      margin: 0;
      color: rgba(250, 249, 246, 0.68);
      line-height: 1.6;
    }

    :host .answer-progress {
      margin-top: 24px;
    }

    :host .answer-progress span {
      display: block;
      margin-bottom: 8px;
      color: #fff;
      font-weight: 900;
    }

    :host .answer-progress div {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(250, 249, 246, 0.12);
    }

    :host .answer-progress i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--matheo-gold);
    }

    :host .question-panel,
    :host .results,
    :host .empty-state,
    :host .loading {
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.62);
      box-shadow: 0 18px 52px rgba(2, 6, 23, 0.18);
    }

    :host .question-panel {
      padding: 26px;
    }

    :host .question-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    :host .question-panel h2 {
      margin: 0 0 24px;
      color: #fff;
      font-size: 1.55rem;
      line-height: 1.35;
    }

    :host .options {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      border: 0;
    }

    :host .options legend {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    :host .options label {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
      padding: 14px;
      border: 1px solid rgba(250, 249, 246, 0.12);
      border-radius: 8px;
      background: rgba(250, 249, 246, 0.04);
      color: rgba(250, 249, 246, 0.82);
    }

    :host .options input {
      margin-top: 3px;
      accent-color: var(--matheo-gold);
    }

    :host .question-actions {
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    :host .results,
    :host .empty-state,
    :host .loading {
      padding: 28px;
    }

    :host .results-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 22px;
      align-items: start;
    }

    :host .correction {
      display: grid;
      gap: 16px;
    }

    :host .result-question {
      scroll-margin-top: 96px;
      padding: 18px;
      border: 2px solid rgba(250, 249, 246, 0.08);
      border-radius: 8px;
      background: rgba(250, 249, 246, 0.05);
    }

    :host .result-question.correct {
      border-color: rgba(124, 242, 154, 0.78);
    }

    :host .result-question.wrong {
      border-color: rgba(255, 111, 143, 0.78);
    }

    :host .result-question h2 {
      margin: 0 0 16px;
      color: #fff;
      font-size: 1.18rem;
      line-height: 1.42;
    }

    :host .result-options {
      display: grid;
      gap: 10px;
    }

    :host .result-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 46px;
      padding: 12px 14px;
      border: 1px solid rgba(250, 249, 246, 0.12);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.42);
      color: rgba(250, 249, 246, 0.78);
    }

    :host .result-option.selected-valid {
      border-color: rgba(124, 242, 154, 0.78);
      color: #7cf29a;
    }

    :host .result-option.selected-invalid {
      border-color: rgba(255, 111, 143, 0.78);
      color: #ff6f8f;
    }

    :host .selection-mark {
      display: grid;
      place-items: center;
      flex: none;
    }

    :host .answer-status {
      margin-top: 14px;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid currentColor;
      background: rgba(15, 23, 42, 0.36);
    }

    :host .answer-status.correct {
      color: #7cf29a;
    }

    :host .answer-status.wrong {
      color: #ff6f8f;
    }

    :host .answer-status p,
    :host .answer-status span {
      display: block;
      margin: 0;
      font-weight: 900;
      line-height: 1.45;
    }

    :host .answer-status span {
      margin-top: 6px;
      color: rgba(250, 249, 246, 0.86);
    }

    :host .results-summary {
      position: sticky;
      top: 96px;
      max-height: calc(100vh - 120px);
      overflow: auto;
      padding: 16px;
      border: 1px solid rgba(212, 175, 55, 0.24);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.78);
    }

    :host .summary-score {
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(250, 249, 246, 0.12);
    }

    :host .summary-score span {
      display: block;
      color: var(--matheo-gold);
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .summary-score strong {
      display: block;
      margin-top: 4px;
      color: #fff;
      font-size: 2rem;
      line-height: 1;
    }

    :host .results-summary h2 {
      margin: 0 0 12px;
      color: #fff;
      font-size: 0.92rem;
    }

    :host .results-summary nav {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 6px;
    }

    :host .results-summary a {
      display: grid;
      place-items: center;
      min-height: 26px;
      border-radius: 6px;
      color: #0f172a;
      font-size: 0.72rem;
      font-weight: 900;
      text-decoration: none;
    }

    :host .results-summary a.correct {
      background: #7cf29a;
    }

    :host .results-summary a.wrong {
      background: #ff6f8f;
    }

    :host .empty-state,
    :host .loading {
      display: grid;
      place-items: center;
      gap: 12px;
      min-height: 320px;
      text-align: center;
    }

    @media (max-width: 780px) {
      :host .game-header,
      :host .quiz-layout,
      :host .results-layout,
      :host .question-top,
      :host .question-actions {
        align-items: stretch;
        grid-template-columns: 1fr;
        flex-direction: column;
      }

      :host .results-summary {
        position: static;
        max-height: none;
      }

      :host .results-summary nav {
        grid-template-columns: repeat(10, minmax(0, 1fr));
      }

    }

    ${floatingTopButtonStyles()}
  `;
}
