import { BaseComponent } from "../BaseComponent.js";
import type { QuizQuestionFull, StaticQuiz } from "../../models/Quiz.js";
import type { Router } from "../../router/Router.js";
import type { AppServices } from "../../services/AppServices.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";

export class StaticQuizComponent extends BaseComponent {
  private quiz: StaticQuiz | null = null;
  private currentIndex = 0;
  private readonly selectedOptionIds = new Map<number, Set<number>>();

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices
  ) {
    super(container, "matheo-static-quiz");
  }

  public init(): void {
    this.renderLoading();
    void this.load();
  }

  protected bindEvents(): void {
    const backButton = this.query<HTMLButtonElement>('[data-action="back"]');
    if (backButton !== null) {
      this.listen(backButton, "click", () => this.router.navigate("/game-home"));
    }

    this.queryAll<HTMLInputElement>("[data-option-id]").forEach((input) => {
      this.listen(input, "change", () => this.updateAnswer(input));
    });

    const nextButton = this.query<HTMLButtonElement>('[data-action="next"]');
    if (nextButton !== null) {
      this.listen(nextButton, "click", () => {
        if (this.quiz !== null) {
          this.currentIndex = Math.min(this.quiz.questions.length - 1, this.currentIndex + 1);
          this.renderQuiz();
        }
      });
    }

    const finishButton = this.query<HTMLButtonElement>('[data-action="finish"]');
    if (finishButton !== null) {
      this.listen(finishButton, "click", () => this.renderResults());
    }

    const topButton = this.query<HTMLButtonElement>('[data-action="top"]');
    if (topButton !== null) {
      this.listen(topButton, "click", () => {
        this.query<HTMLElement>("#quiz-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    this.queryAll<HTMLAnchorElement>("[data-result-target]").forEach((link) => {
      this.listen(link, "click", (event) => {
        event.preventDefault();
        const target = link.dataset.resultTarget;
        if (target !== undefined) {
          this.query<HTMLElement>(`#${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  private async load(): Promise<void> {
    this.quiz = await this.services.content.loadMatheopolisQuiz();
    if (this.quiz === null || this.quiz.questions.length === 0) {
      this.renderEmpty();
      return;
    }

    this.restoreStoredAnswers(this.quiz);
    this.renderQuiz();
  }

  private updateAnswer(input: HTMLInputElement): void {
    const quiz = this.quiz;
    const question = quiz?.questions[this.currentIndex];
    if (question === undefined) {
      return;
    }

    const optionId = Number.parseInt(input.dataset.optionId ?? "", 10);
    if (Number.isNaN(optionId)) {
      return;
    }

    if (question.type === "checkbox") {
      const existing = this.selectedOptionIds.get(question.id) ?? new Set<number>();
      if (input.checked) {
        existing.add(optionId);
      } else {
        existing.delete(optionId);
      }
      this.selectedOptionIds.set(question.id, existing);
    } else {
      this.selectedOptionIds.set(question.id, new Set([optionId]));
    }

    this.services.content.saveMatheopolisQuizAnswer(
      question.id,
      this.selectedOptionIds.get(question.id) ?? new Set<number>()
    );
    this.renderQuiz();
  }

  private restoreStoredAnswers(quiz: StaticQuiz): void {
    const questionIds = new Set(quiz.questions.map((question) => question.id));
    this.services.content.loadMatheopolisQuizAnswers().forEach((optionIds, questionId) => {
      if (questionIds.has(questionId)) {
        this.selectedOptionIds.set(questionId, optionIds);
      }
    });
  }

  private renderLoading(): void {
    this.render(`
      ${this.pageHeader("Questionnaire", "file")}
      <main id="quiz-top" class="quiz-shell">
        <div class="loading">${icon("file")}<p>Chargement du questionnaire...</p></div>
      </main>
    `, this.style());
  }

  private renderEmpty(): void {
    this.render(`
      ${this.pageHeader("Questionnaire", "file")}
      <main id="quiz-top" class="quiz-shell">
        <section class="empty-state">
          ${icon("file")}
          <h1>Questionnaire indisponible</h1>
          <p>Aucune question n'est disponible pour le moment.</p>
        </section>
      </main>
    `, this.style());
    this.bindEvents();
  }

  private renderQuiz(): void {
    const quiz = this.quiz;
    const question = quiz?.questions[this.currentIndex];
    if (quiz === null || question === undefined) {
      this.renderEmpty();
      return;
    }

    const selected = this.selectedOptionIds.get(question.id) ?? new Set<number>();
    const answeredCount = quiz.questions.filter((item) => (this.selectedOptionIds.get(item.id)?.size ?? 0) > 0).length;
    const questionNumber = this.currentIndex + 1;
    const progress = Math.round((questionNumber / quiz.questions.length) * 100);
    const isLastQuestion = this.currentIndex === quiz.questions.length - 1;

    this.render(`
      ${this.pageHeader("Questionnaire", "file")}
      <main id="quiz-top" class="quiz-shell">
        <section class="quiz-layout">
          <aside class="quiz-summary">
            <h1>${escapeHtml(quiz.title)}</h1>
            <p>${escapeHtml(quiz.description ?? "")}</p>
            <div class="answer-progress">
              <span>Question ${questionNumber} / ${quiz.questions.length}</span>
              <div><i style="width:${progress}%"></i></div>
            </div>
          </aside>

          <article class="question-panel">
            <div class="question-top">
              <p>Question ${questionNumber} sur ${quiz.questions.length}</p>
              <span>${this.questionTypeLabel(question)}</span>
            </div>
            <h2>${escapeHtml(question.label)}</h2>
            <fieldset class="options">
              <legend>Options</legend>
              ${question.options.map((option) => {
                const inputType = question.type === "checkbox" ? "checkbox" : "radio";
                return `
                  <label>
                    <input
                      type="${inputType}"
                      name="question-${question.id}"
                      value="${option.id}"
                      data-option-id="${option.id}"
                      ${selected.has(option.id) ? "checked" : ""}
                    >
                    <span>${escapeHtml(option.label)}</span>
                  </label>
                `;
              }).join("")}
            </fieldset>
            <footer class="question-actions">
              ${isLastQuestion
                ? `<button class="primary" type="button" data-action="finish" ${answeredCount < quiz.questions.length ? "disabled" : ""}>${icon("check")} Terminer</button>`
                : `<button class="primary" type="button" data-action="next" ${selected.size === 0 ? "disabled" : ""}>Suivant ${icon("arrowRight")}</button>`}
            </footer>
          </article>
        </section>
      </main>
    `, this.style());
    this.bindEvents();
  }

  private renderResults(): void {
    const quiz = this.quiz;
    if (quiz === null) {
      this.renderEmpty();
      return;
    }

    const score = quiz.questions.reduce((total, question) => total + (this.isCorrect(question) ? 1 : 0), 0);

    this.render(`
      ${this.pageHeader("Bilan", "award")}
      <main id="quiz-top" class="quiz-shell">
        <div class="results-layout">
          <section class="results">
            <div class="correction">
              ${quiz.questions.map((question, index) => this.resultQuestionCard(question, index)).join("")}
            </div>
          </section>
          ${this.resultsSummary(quiz, score)}
        </div>
      </main>
      ${this.floatingTopButton()}
    `, this.style());
    this.bindEvents();
  }

  private pageHeader(label: string, iconName: "award" | "file"): string {
    return `
      <header class="game-header">
        <button class="back-button" type="button" data-action="back">${icon("arrowLeft")} Retour a la carte</button>
        <div class="quiz-meta">${icon(iconName)}<span>${label}</span></div>
      </header>
    `;
  }

  private resultsSummary(quiz: StaticQuiz, score: number): string {
    return `
      <aside class="results-summary" aria-label="Recapitulatif des questions">
        <div class="summary-score">
          <span>Score</span>
          <strong>${score} / ${quiz.questions.length}</strong>
        </div>
        <h2>Recapitulatif</h2>
        <nav>
          ${quiz.questions.map((question, index) => `
            <a class="${this.isCorrect(question) ? "correct" : "wrong"}" href="#quiz-result-${question.id}" data-result-target="quiz-result-${question.id}" aria-label="Question ${index + 1}">
              ${index + 1}
            </a>
          `).join("")}
        </nav>
      </aside>
    `;
  }

  private floatingTopButton(): string {
    return `
      <button class="top-button floating-top-button" type="button" data-action="top" aria-label="Haut de page">
        ${icon("arrowUp")} Haut de page
      </button>
    `;
  }

  private resultQuestionCard(question: QuizQuestionFull, index: number): string {
    const correct = this.isCorrect(question);
    const selected = this.selectedOptionIds.get(question.id) ?? new Set<number>();

    return `
      <article id="quiz-result-${question.id}" class="result-question ${correct ? "correct" : "wrong"}">
        <h2>${index + 1}. ${escapeHtml(question.label)}</h2>
        <div class="result-options">
          ${question.options.map((option) => {
            const isSelected = selected.has(option.id);
            const selectedClass = isSelected ? (option.isCorrect ? "selected-valid" : "selected-invalid") : "";
            const selectedMark = isSelected ? `<span class="selection-mark">${option.isCorrect ? icon("check") : icon("x")}</span>` : "";

            return `
              <div class="result-option ${selectedClass}">
                <span>${escapeHtml(option.label)}</span>
                ${selectedMark}
              </div>
            `;
          }).join("")}
        </div>
        <section class="answer-status ${correct ? "correct" : "wrong"}">
          <p>${correct ? "Votre r&eacute;ponse est correcte" : "Votre r&eacute;ponse est incorrecte"}</p>
          <span>R&eacute;ponse attendue : ${escapeHtml(this.expectedAnswer(question))}</span>
        </section>
      </article>
    `;
  }

  private isCorrect(question: QuizQuestionFull): boolean {
    const selected = Array.from(this.selectedOptionIds.get(question.id) ?? []).sort((left, right) => left - right);
    const correct = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort((left, right) => left - right);

    return selected.length === correct.length && selected.every((optionId, index) => optionId === correct[index]);
  }

  private expectedAnswer(question: QuizQuestionFull): string {
    return question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.label)
      .join(", ");
  }

  private questionTypeLabel(question: QuizQuestionFull): string {
    if (question.type === "checkbox") {
      return "Plusieurs reponses possibles";
    }

    if (question.type === "select") {
      return "Une reponse a choisir";
    }

    return "Une seule reponse";
  }

  private style(): string {
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
      :host .question-actions,
      :host .top-button {
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
      :host .question-actions button,
      :host .top-button {
        gap: 10px;
      }

      :host .back-button,
      :host .question-actions button,
      :host .top-button {
        min-height: 42px;
        border: 1px solid rgba(212, 175, 55, 0.38);
        border-radius: 10px;
        padding: 0 14px;
        background: rgba(15, 23, 42, 0.54);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .question-actions button:disabled,
      :host .top-button:disabled {
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

      :host .top-button {
        justify-content: center;
      }

      :host .floating-top-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 40;
        box-shadow: 0 16px 38px rgba(2, 6, 23, 0.28);
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

        :host .floating-top-button {
          right: 14px;
          bottom: 14px;
        }
      }
    `;
  }
}
