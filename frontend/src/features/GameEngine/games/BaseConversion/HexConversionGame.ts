import { escapeHtml } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { QuestionSequence } from "../shared/QuestionSequence.js";
import { chapterGameStyles } from "../shared/chapterGameStyles.js";

export class HexConversionGame extends BaseGame {
  private readonly sequence = new QuestionSequence({
    questions: this.params.questions,
    completionAnswerId: "gateway-code-complete",
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
    const answer = input?.value.trim().toUpperCase() ?? "";
    
    if (await this.validateAnswer(answer, current, this.sequence.currentIndex)) {
      this.solvedAnswers[this.sequence.currentIndex] = answer;
      this.feedbackMessage = "Séquence acceptée.";
      this.feedbackTone = "good";
      const turn = this.sequence.recordCorrect(20);
      if (turn.isComplete) {
        this.markCompleted(this.sequence.currentScore, this.sequence.completionAnswerId);
      }
      this.renderChallenge();
      return;
    }

    this.sequence.recordMistake();
    this.feedbackMessage = "Code erroné. Accès refusé.";
    this.feedbackTone = "bad";
    this.renderChallenge();
  }

  public showHint(): void {
    if (this.completed) {
      return;
    }

    const current = this.sequence.currentQuestion;
    this.feedbackMessage = current?.hint ?? "Convertissez en hexadécimal.";
    this.feedbackTone = "info";
    this.renderChallenge();
  }

  private renderSecretCode(): string {
    const questions = this.params.questions ?? [];
    const solvedCount = this.completed ? questions.length : this.sequence.currentIndex;

    let codeHtml = `<div class="gw-secret-code">`;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question) continue;

      const answerStr = String(this.solvedAnswers[i] ?? question.answer ?? "").toUpperCase();
      const displayStr = i < solvedCount ? answerStr : "?".repeat(Math.max(answerStr.length, 2));
      
      codeHtml += `<span class="code-block ${i < solvedCount ? 'solved' : ''}">${escapeHtml(displayStr)}</span>`;
    }
    
    codeHtml += `</div>`;
    return codeHtml;
  }

  private renderChallenge(): void {
    this.clearListeners();

    if (this.completed) {
      this.container.innerHTML = `
        <article class="chapter-game-card gw-card">
          <div class="chapter-game-heading gw-header">Coordonnées trouvées</div>
          ${this.renderSecretCode()}
          <p class="chapter-game-message gw-message" data-tone="good">${escapeHtml(this.feedbackMessage)}</p>
          ${this.isPracticeMode() ? "" : `<footer class="chapter-game-footer">Score final : ${this.sequence.currentScore}</footer>`}
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

    const rawQuestions = (this.params.questions ?? []) as any[];
    const questionValue = rawQuestions[this.sequence.currentIndex]?.question 
                       ?? (current as any).question 
                       ?? "???";

    this.container.innerHTML = `
      <article class="chapter-game-card gw-card">
        <div class="chapter-game-heading gw-header">Déchiffrement...</div>
        ${this.renderSecretCode()}
        
        <form class="chapter-game-form gw-form">
          <label>
            <span class="gw-instruction">Valeur décimale : <strong>${escapeHtml(String(questionValue))}</strong></span>
            <input class="chapter-game-input gw-input" name="answer" type="text" pattern="[0-9a-fA-F]+" autocomplete="off" required placeholder="Hexadécimal...">
          </label>
          <p class="chapter-game-message gw-message" data-tone="${this.feedbackTone}">${escapeHtml(this.feedbackMessage)}</p>
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
        .gw-header {
          font-size: 1.1rem;
          letter-spacing: 0.15em;
        }
        
        .gw-secret-code {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 15px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          border: 1px inset rgba(255, 255, 255, 0.1);
        }
        .code-block {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.8rem;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 15px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          letter-spacing: 0.1em;
        }
        .code-block.solved {
          color: #7cf29a;
          background: rgba(124, 242, 154, 0.1);
          border-color: rgba(124, 242, 154, 0.5);
        }

        .gw-instruction {
          display: block;
          color: #e2e8f0;
          font-size: 1rem;
          text-align: center;
          margin-bottom: 12px;
        }
        .gw-instruction strong {
          color: #d4af37;
          font-size: 1.2rem;
          padding: 0 6px;
        }

        .gw-input {
          height: 52px;
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: #d4af37;
          font-family: monospace;
          font-size: 1.4rem;
          text-transform: uppercase;
          text-align: center;
          letter-spacing: 0.1em;
        }
      </style>
    `;
  }
}
