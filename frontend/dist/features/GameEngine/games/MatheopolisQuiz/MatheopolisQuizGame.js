import { escapeHtml } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
export class MatheopolisQuizGame extends BaseGame {
    questions = [];
    currentIndex = 0;
    answers = new Map();
    loading = true;
    start() {
        void this.loadQuestions();
    }
    destroy() {
        super.destroy();
    }
    showHint() {
        const message = this.container.querySelector(".quiz-message");
        if (message !== null) {
            message.textContent = "Relisez bien chaque proposition : une seule reponse respecte le texte.";
        }
    }
    async loadQuestions() {
        this.loading = true;
        this.render();
        this.questions = await this.context.content.loadMatheopolisQuiz();
        this.loading = false;
        this.render();
    }
    render() {
        this.clearListeners();
        if (this.loading) {
            this.container.innerHTML = `<div class="quiz-card"><p>Chargement des questions...</p></div>${this.style()}`;
            return;
        }
        if (this.questions.length === 0) {
            this.container.innerHTML = `<div class="quiz-card"><p>Aucune question disponible.</p></div>${this.style()}`;
            return;
        }
        const current = this.questions[this.currentIndex];
        if (current === undefined) {
            this.renderResults();
            return;
        }
        const selected = this.answers.get(current.id);
        const progress = Math.round((this.currentIndex / this.questions.length) * 100);
        this.container.innerHTML = `
      <article class="quiz-card">
        <header>
          <p>QCM Matheopolis</p>
          <h1>Question ${this.currentIndex + 1} sur ${this.questions.length}</h1>
          <div class="bar"><span style="width:${progress}%"></span></div>
        </header>
        <section class="question">
          <h2>${escapeHtml(current.question)}</h2>
          <div class="options">
            ${current.options.map((option) => `
              <button type="button" data-option="${option.id}" data-selected="${selected === option.id ? "true" : "false"}">
                <span>${escapeHtml(option.text)}</span>
                <i></i>
              </button>
            `).join("")}
          </div>
        </section>
        <p class="quiz-message"></p>
        <footer>
          <button type="button" data-action="next" ${selected === undefined ? "disabled" : ""}>${this.currentIndex === this.questions.length - 1 ? "Terminer le test" : "Suivant"}</button>
        </footer>
      </article>
      ${this.style()}
    `;
        this.container.querySelectorAll("[data-option]").forEach((button) => {
            this.listen(button, "click", () => {
                const option = button.dataset.option;
                if (option !== undefined) {
                    this.answers.set(current.id, option);
                    this.render();
                }
            });
        });
        const next = this.container.querySelector('[data-action="next"]');
        if (next !== null) {
            this.listen(next, "click", () => {
                this.currentIndex += 1;
                if (this.currentIndex >= this.questions.length) {
                    this.renderResults();
                }
                else {
                    this.render();
                }
            });
        }
    }
    renderResults() {
        this.clearListeners();
        const score = this.questions.reduce((sum, question) => {
            return sum + (this.answers.get(question.id) === question.correctAnswer ? 1 : 0);
        }, 0);
        const percentage = Math.round((score / this.questions.length) * 100);
        this.container.innerHTML = `
      <article class="quiz-card results">
        <header>
          <p>Bilan de l'epreuve</p>
          <h1>${score} / ${this.questions.length}</h1>
          <span>${percentage >= 80 ? "Excellente memoire !" : percentage >= 50 ? "Bon travail !" : "Replongez dans les carnets."}</span>
        </header>
        <div class="results-scroll">
          ${this.questions.slice(0, 12).map((question, index) => {
            const correct = this.answers.get(question.id) === question.correctAnswer;
            return `<div class="${correct ? "correct" : "wrong"}"><strong>${index + 1}. ${escapeHtml(question.question)}</strong><span>${correct ? "Correct" : "A revoir"}</span></div>`;
        }).join("")}
        </div>
        <footer>
          <button type="button" data-action="complete">Valider le bilan</button>
        </footer>
      </article>
      ${this.style()}
    `;
        const complete = this.container.querySelector('[data-action="complete"]');
        if (complete !== null) {
            this.listen(complete, "click", () => this.complete(percentage, `quiz-score-${score}`));
        }
    }
    style() {
        return `
      <style>
        .quiz-card { width:min(920px,100%); margin:0 auto; padding:30px; border:1px solid rgba(212,175,55,.34); border-radius:22px; background:rgba(15,23,42,.86); color:#fff; box-shadow:var(--matheo-shadow); }
        .quiz-card header { text-align:center; margin-bottom:28px; }
        .quiz-card header p { color:#d4af37; font-size:.78rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .quiz-card h1 { margin:8px 0 16px; font-family:var(--font-title); font-size:clamp(2rem,6vw,4rem); }
        .quiz-card header span { color:rgba(250,249,246,.72); font-size:1.1rem; }
        .bar { height:8px; border-radius:999px; background:rgba(255,255,255,.1); overflow:hidden; }
        .bar span { display:block; height:100%; background:#d4af37; }
        .question h2 { margin:0 0 22px; font-size:clamp(1.35rem,4vw,2rem); line-height:1.3; }
        .options { display:grid; gap:12px; }
        .options button { width:100%; min-height:58px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 16px; border:2px solid rgba(255,255,255,.1); border-radius:12px; background:rgba(255,255,255,.05); color:#d7dce8; text-align:left; }
        .options button:hover,.options button[data-selected="true"] { border-color:#d4af37; background:rgba(212,175,55,.1); color:#d4af37; }
        .options i { width:18px; height:18px; border:2px solid currentColor; border-radius:50%; flex:none; }
        .options button[data-selected="true"] i { box-shadow:inset 0 0 0 4px #0f172a; background:#d4af37; }
        .quiz-message { min-height:24px; color:#d4af37; }
        .quiz-card footer { display:flex; justify-content:flex-end; border-top:1px solid rgba(255,255,255,.1); padding-top:18px; }
        .quiz-card footer button { min-height:46px; border:0; border-radius:10px; padding:0 20px; background:#d4af37; color:#0f172a; font-weight:900; }
        .quiz-card footer button:disabled { opacity:.45; }
        .results-scroll { max-height:46vh; overflow:auto; display:grid; gap:10px; }
        .results-scroll div { padding:14px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.05); display:grid; gap:6px; }
        .results-scroll .correct span { color:#7cf29a; }
        .results-scroll .wrong span { color:#ff6f8f; }
      </style>
    `;
    }
}
