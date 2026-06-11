export function chapterGameStyles(): string {
  return `
    .chapter-game-card {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      min-width: 0;
      margin: 0;
      padding: clamp(12px, 1.7vw, 22px);
      color: #f8f7ff;
      display: grid;
      gap: clamp(12px, 1.6vw, 16px);
      overflow-wrap: anywhere;
    }

    .chapter-game-heading {
      text-align: center;
      color: var(--matheo-gold);
      font-size: 0.85rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .chapter-game-form {
      display: grid;
      gap: 12px;
    }

    .chapter-game-form label {
      display: grid;
      gap: 8px;
    }

    .chapter-game-label {
      color: var(--matheo-gold);
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .chapter-game-input {
      width: 100%;
      min-width: 0;
      height: 48px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 0 14px;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      font-size: 1rem;
    }

    .chapter-game-input:focus {
      outline: none;
      border-color: var(--matheo-gold);
    }

    .chapter-game-message {
      min-height: 28px;
      margin: 0;
      text-align: center;
      color: rgba(250, 249, 246, 0.72);
      font-weight: 900;
      line-height: 1.4;
    }

    .chapter-game-message[data-tone="good"],
    .chapter-game-message.good {
      color: #7cf29a;
    }

    .chapter-game-message[data-tone="bad"],
    .chapter-game-message.bad {
      color: #ff8fa3;
    }

    .chapter-game-message[data-tone="info"],
    .chapter-game-message.neutral {
      color: rgba(250, 249, 246, 0.72);
    }

    .chapter-game-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .chapter-game-actions button {
      min-height: 42px;
      flex: 0 1 auto;
      border: 1px solid rgba(212, 175, 55, 0.26);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      color: #f8f7ff;
      padding: 0 16px;
      font-weight: 900;
      cursor: pointer;
    }

    .chapter-game-actions button:hover {
      background: var(--matheo-gold);
      color: #11162c;
    }

    .chapter-game-actions button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .chapter-game-footer {
      color: rgba(250, 249, 246, 0.55);
      font-size: 0.9rem;
      text-align: center;
    }

    @media (max-width: 520px) {
      .chapter-game-card {
        padding: 12px;
      }

      .chapter-game-actions,
      .chapter-game-actions button {
        width: 100%;
      }

      .chapter-game-actions button {
        min-height: 44px;
      }
    }
  `;
}
