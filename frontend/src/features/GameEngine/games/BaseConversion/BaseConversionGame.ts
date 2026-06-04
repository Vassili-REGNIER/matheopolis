import { escapeHtml } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { QuestionSequence } from "../shared/QuestionSequence.js";

export class BaseConversionGame extends BaseGame {
  private readonly sequence = new QuestionSequence({
    questions: this.params.questions,
    completionAnswerId: "base-conversion-complete",
    scoring: !this.isPracticeMode(),
    trackMistakes: !this.isPracticeMode(),
    onProgress: (detail) => {
      this.updateProgress(detail.score, detail.mistakes, detail.currentQuestionIndex);
    }
  });
  private feedbackMessage = "";
  private feedbackTone: "good" | "bad" | "info" = "info";

  public start(): void {
    this.renderChallenge();
  }

  public override submitAnswer(): void {
    if (this.completed) {
      return;
    }

    const current = this.sequence.currentQuestion;
    if (current === undefined) {
      return;
    }

    const input = this.container.querySelector<HTMLInputElement>('input[name="answer"]');
    const answer = input?.value.trim() ?? "";
    if (answer === current.answer) {
      this.feedbackMessage = "Bonne conversion.";
      this.feedbackTone = "good";
      const turn = this.sequence.recordCorrect(20);
      if (turn.isComplete) {
        this.markCompleted(this.sequence.currentScore, this.sequence.completionAnswerId);
      }
      this.renderChallenge();
      return;
    }

    this.sequence.recordMistake();
    this.feedbackMessage = "Ce n'est pas encore la bonne valeur.";
    this.feedbackTone = "bad";
    this.renderChallenge();
  }

  public showHint(): void {
    if (this.completed) {
      return;
    }

    const current = this.sequence.currentQuestion;
    this.feedbackMessage = current?.hint ?? "Regardez les puissances de 2.";
    this.feedbackTone = "info";
    this.renderChallenge();
  }


  private renderSecretDate(): string {
    const questions = this.params.questions as { answer: string }[];
    // Si le jeu est terminé, toutes les questions sont résolues. Sinon, on utilise l'index en cours.
    const solvedCount = this.completed ? questions.length : this.sequence.currentIndex;

    // Fonction pour récupérer la réponse si on a dépassé son index, sinon afficher un espace vide (_)
    const getPart = (index: number, pad: number) => {
      if (index < solvedCount && questions[index]) {
        return String(questions[index].answer).padStart(pad, '0');
      }
      return "_".repeat(pad);
    };

    const d = getPart(0, 2);
    const m = getPart(1, 2);
    const y = getPart(2, 4);
    const h = getPart(3, 2);
    const min = getPart(4, 2);

    return `
      <div class="bc-secret-date">
        <span class="date-part">${d}</span>/<span class="date-part">${m}</span>/<span class="date-part">${y}</span> 
        <span class="time-part">${h}:${min}</span>
      </div>
    `;
  }


  private renderChallenge(): void {
    this.clearListeners();

    if (this.completed) {
      this.container.innerHTML = `
        <article class="bc-card">
          <div class="mission-header">Mission accomplie</div>
          ${this.renderSecretDate()}
          <p class="bc-message" data-tone="good">${escapeHtml(this.feedbackMessage)}</p>
          ${this.isPracticeMode() ? "" : `<footer>Score : ${this.sequence.currentScore}</footer>`}
        </article>
        ${this.style()}
      `;
      return;
    }

    this.sequence.syncProgress();
    this.notifyValidate(true);
    const current = this.sequence.currentQuestion;
    if (current === undefined) {
      return;
    }

    this.container.innerHTML = `
      <article class="bc-card">
        <div class="mission-header">Décodage en cours...</div>
        ${this.renderSecretDate()}
        <form>
          <label>
            <span>Valeur en base 10</span>
            <input name="answer" type="number" autocomplete="off" required>
          </label>
          <p class="bc-message" data-tone="${this.feedbackTone}">${escapeHtml(this.feedbackMessage)}</p>
        </form>
        ${this.renderProgressFooter()}
      </article>
      ${this.style()}
    `;

    const form = this.container.querySelector<HTMLFormElement>("form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        this.submitAnswer();
      });
    }
  }

  private renderProgressFooter(): string {
    if (this.isPracticeMode() && this.sequence.totalCount === 1) {
      return "";
    }

    return `<footer>${this.sequence.currentIndex + 1} / ${this.sequence.totalCount}</footer>`;
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
          display: grid;
          gap: 20px;
        }
        .mission-header {
          text-align: center;
          color: #d4af37;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.8;
        }
        .bc-secret-date {
          text-align: center;
          font-family: monospace;
          font-size: 2rem;
          letter-spacing: 0.1em;
          color: #7cf29a;
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 10px;
          border: 1px dashed rgba(124, 242, 154, 0.4);
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
        .bc-message { min-height: 24px; margin: 0; text-align: center; color: rgba(250, 249, 246, 0.68); }
        .bc-message[data-tone="good"] { color: #7cf29a; }
        .bc-message[data-tone="bad"] { color: #ff6f8f; }
        .bc-card footer { color: rgba(250, 249, 246, 0.55); font-size: 0.9rem; text-align: center; }
      </style>
    `;
  }
}
