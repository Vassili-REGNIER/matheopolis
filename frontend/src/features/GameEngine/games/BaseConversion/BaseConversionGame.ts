import { icon } from "../../../../utils/icons.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { QuestionSequence } from "../shared/QuestionSequence.js";

export class BaseConversionGame extends BaseGame {
  private readonly sequence = new QuestionSequence({
    questions: this.params.questions,
    completionAnswerId: "base-conversion-complete",
    onProgress: (detail) => {
      this.updateProgress(detail.score, detail.mistakes, detail.currentQuestionIndex);
    },
    onComplete: (detail) => {
      this.complete(detail.score, detail.answer);
    }
  });

  public start(): void {
    this.renderChallenge("");
  }

  public showHint(): void {
    const current = this.sequence.currentQuestion;
    this.renderChallenge(current?.hint ?? "Regardez les puissances de 2.");
  }

  private renderChallenge(message: string, tone: "good" | "bad" | "info" = "info"): void {
    this.clearListeners();

    if (this.sequence.isComplete) {
      this.sequence.finalize();
      return;
    }

    this.sequence.syncProgress();
    const current = this.sequence.currentQuestion;
    if (current === undefined) {
      this.sequence.finalize();
      return;
    }

    this.container.innerHTML = `
      <article class="bc-card">
        <form>
          <label>
            <span>Valeur en base 10</span>
            <input name="answer" type="number" autocomplete="off" required>
          </label>
          <p class="bc-message" data-tone="${tone}">${escapeHtml(message)}</p>
          <div class="bc-actions">
            <button type="submit" class="submit-button">${icon("check")} Valider</button>
          </div>
        </form>
        <footer>${this.sequence.currentIndex + 1} / ${this.sequence.totalCount}</footer>
      </article>
      ${this.style()}
    `;

    const form = this.container.querySelector<HTMLFormElement>("form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        const answer = String(new FormData(form).get("answer") ?? "").trim();
        if (answer === current.answer) {
          this.sequence.recordCorrect(20);
          this.renderChallenge("Bonne conversion.", "good");
        } else {
          this.sequence.recordMistake();
          this.renderChallenge("Ce n'est pas encore la bonne valeur.", "bad");
        }
      });
    }
  }

  private style(): string {
    return `
      <style>
        .bc-card {
          width: 100%;
          margin: 0;
          padding: 30px;
          color: #fff;
          border: 1px solid rgba(212, 175, 55, 0.34);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.84);
          box-shadow: var(--matheo-shadow);
        }
        .bc-card label span {
          color: #d4af37;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .bc-card form { display: grid; gap: 12px; }
        .bc-card label { display: grid; gap: 8px; }
        .bc-card input {
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }
        .bc-message { min-height: 24px; margin: 0; color: rgba(250, 249, 246, 0.68); }
        .bc-message[data-tone="good"] { color: #7cf29a; }
        .bc-message[data-tone="bad"] { color: #ff6f8f; }
        .bc-card footer { color: rgba(250, 249, 246, 0.55); font-size: 0.9rem; }
        .bc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }
        .bc-actions .submit-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
          border: 0;
          background: var(--matheo-gold);
          color: #0f172a;
        }
        .bc-actions button .icon {
          width: 18px;
          height: 18px;
        }
      </style>
    `;
  }
}
