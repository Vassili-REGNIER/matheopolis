import { escapeHtml } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { QuestionSequence } from "../shared/QuestionSequence.js";
import { chapterGameStyles } from "../shared/chapterGameStyles.js";

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
  private readonly solvedAnswers: string[] = [];

  public start(): void {
    this.renderChallenge();
  }

  public override submitAnswer(): void {
    void this.handleSubmitAnswer();
  }

  private async handleSubmitAnswer(): Promise<void> {
    if (this.completed) {
      return;
    }

    const current = this.sequence.currentQuestion;
    if (current === undefined) {
      return;
    }

    const input = this.container.querySelector<HTMLInputElement>('input[name="answer"]');
    const answer = input?.value.trim() ?? "";
    if (await this.validateAnswer(answer, current, this.sequence.currentIndex)) {
      this.solvedAnswers[this.sequence.currentIndex] = answer;
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
    const questions = this.params.questions;
    // Si le jeu est terminé, toutes les questions sont résolues. Sinon, on utilise l'index en cours.
    const solvedCount = this.completed ? questions.length : this.sequence.currentIndex;

    // Fonction pour récupérer la réponse si on a dépassé son index, sinon afficher un espace vide (_)
    const getPart = (index: number, pad: number) => {
      if (index < solvedCount && questions[index]) {
        const answer = this.solvedAnswers[index] ?? questions[index]?.answer ?? "";
        return String(answer).padStart(pad, "0");
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
        <article class="chapter-game-card bc-card">
          <div class="chapter-game-heading mission-header">Mission accomplie</div>
          ${this.renderSecretDate()}
          <p class="chapter-game-message bc-message" data-tone="good">${escapeHtml(this.feedbackMessage)}</p>
          ${this.isPracticeMode() ? "" : `<footer class="chapter-game-footer">Score : ${this.sequence.currentScore}</footer>`}
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
      <article class="chapter-game-card bc-card">
        <div class="chapter-game-heading mission-header">Décodage en cours...</div>
        ${this.renderSecretDate()}
        <form class="chapter-game-form">
          <label>
            <span class="chapter-game-label">Valeur en base 10</span>
            <input class="chapter-game-input" name="answer" type="number" autocomplete="off" required>
          </label>
          <p class="chapter-game-message bc-message" data-tone="${this.feedbackTone}">${escapeHtml(this.feedbackMessage)}</p>
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

    return `<footer class="chapter-game-footer">${this.sequence.currentIndex + 1} / ${this.sequence.totalCount}</footer>`;
  }

  private style(): string {
    return `
      <style>
        ${chapterGameStyles()}
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
      </style>
    `;
  }
}
