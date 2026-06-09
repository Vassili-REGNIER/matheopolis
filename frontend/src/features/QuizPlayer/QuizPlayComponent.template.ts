import type {
  QuizPlayCorrectionTemplateData,
  QuizPlayQuestion,
  QuizPlayQuestionTemplateData
} from "../../models/components/QuizPlay.js";
import type { QuizCorrection, QuizCorrectionQuestion } from "../../models/Quiz.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";

export function quizPlayLoadingTemplate(): string {
  return `
    ${pageHeaderTemplate("Questionnaire", "file")}
    <main id="quiz-top" class="quiz-shell">
      <div class="loading">${icon("file")}<p>Chargement du questionnaire...</p></div>
    </main>
  `;
}

export function quizPlayEmptyTemplate(): string {
  return `
    ${pageHeaderTemplate("Questionnaire", "file")}
    <main id="quiz-top" class="quiz-shell">
      <section class="empty-state">
        ${icon("file")}
        <h1>Questionnaire indisponible</h1>
        <p>Aucune question n'est disponible pour le moment.</p>
      </section>
    </main>
  `;
}

export function quizPlayQuestionTemplate(data: QuizPlayQuestionTemplateData): string {
  const { quiz, question, selectedOptionIds, questionNumber, progress, isLastQuestion } = data;

  return `
    ${pageHeaderTemplate("Questionnaire", "file")}
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
            <span>${questionTypeLabel(question)}</span>
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
                    ${selectedOptionIds.has(option.id) ? "checked" : ""}
                  >
                  <span>${escapeHtml(option.label)}</span>
                </label>
              `;
            }).join("")}
          </fieldset>
          <footer class="question-actions">
            ${isLastQuestion
              ? `<button class="primary" type="button" data-action="finish" ${selectedOptionIds.size === 0 ? "disabled" : ""}>${icon("check")} Terminer</button>`
              : `<button class="primary" type="button" data-action="next" ${selectedOptionIds.size === 0 ? "disabled" : ""}>Suivant ${icon("arrowRight")}</button>`}
          </footer>
        </article>
      </section>
    </main>
  `;
}

export function quizPlayCorrectionTemplate(data: QuizPlayCorrectionTemplateData): string {
  return `
    ${pageHeaderTemplate("Bilan", "award")}
    <main id="quiz-top" class="quiz-shell">
      <div class="results-layout">
        <section class="results">
          <div class="correction">
            ${data.correction.questions.map((question, index) => resultQuestionCardTemplate(question, index)).join("")}
          </div>
        </section>
        ${resultsSummaryTemplate(data.correction)}
      </div>
    </main>
    ${floatingTopButtonTemplate()}
  `;
}

function pageHeaderTemplate(label: string, iconName: "award" | "file"): string {
  return `
    <header class="game-header">
      <button class="back-button" type="button" data-action="back">${icon("arrowLeft")} Retour a la carte</button>
      <div class="quiz-meta">${icon(iconName)}<span>${label}</span></div>
    </header>
  `;
}

function resultsSummaryTemplate(correction: QuizCorrection): string {
  return `
    <aside class="results-summary" aria-label="Recapitulatif des questions">
      <div class="summary-score">
        <span>Score</span>
        <strong>${correction.attempt.score} / ${correction.attempt.total}</strong>
      </div>
      <h2>Recapitulatif</h2>
      <nav>
        ${correction.questions.map((question, index) => `
          <a class="${question.isCorrect ? "correct" : "wrong"}" href="#quiz-result-${question.id}" data-result-target="quiz-result-${question.id}" aria-label="Question ${index + 1}">
            ${index + 1}
          </a>
        `).join("")}
      </nav>
    </aside>
  `;
}

function floatingTopButtonTemplate(): string {
  return `
    <button class="top-button floating-top-button" type="button" data-action="top" aria-label="Haut de page">
      ${icon("arrowUp")} Haut de page
    </button>
  `;
}

function resultQuestionCardTemplate(question: QuizCorrectionQuestion, index: number): string {
  return `
    <article id="quiz-result-${question.id}" class="result-question ${question.isCorrect ? "correct" : "wrong"}">
      <h2>${index + 1}. ${escapeHtml(question.label)}</h2>
      <div class="result-options">
        ${question.options.map((option) => {
          const isSelected = question.selectedOptionIds.includes(option.id);
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
      <section class="answer-status ${question.isCorrect ? "correct" : "wrong"}">
        <p>${question.isCorrect ? "Votre r&eacute;ponse est correcte" : "Votre r&eacute;ponse est incorrecte"}</p>
        <span>R&eacute;ponse attendue : ${escapeHtml(expectedAnswer(question))}</span>
      </section>
    </article>
  `;
}

function expectedAnswer(question: QuizCorrectionQuestion): string {
  return question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.label)
    .join(", ");
}

function questionTypeLabel(question: QuizPlayQuestion): string {
  if (question.type === "checkbox") {
    return "Plusieurs reponses possibles";
  }

  if (question.type === "select") {
    return "Une reponse a choisir";
  }

  return "Une seule reponse";
}
