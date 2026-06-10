import type { RiddleBlockTemplateData } from "../../../../models/game-engine/RiddleBlockTemplate.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";
import { renderStepInteractionChrome } from "../shared/stepInteractionChrome.js";

export function missingGameTemplate(gameId: string): string {
  return `
        <article class="missing-game">
          <h1>Mini-jeu introuvable</h1>
          <p>${escapeHtml(gameId)}</p>
          <button type="button">Continuer</button>
        </article>
      `;
}

export function riddleBlockTemplate(data: RiddleBlockTemplateData): string {
  return `
      <div class="game-shell ${data.isPractice ? "game-shell--practice" : "game-shell--challenge"}">
        <header class="riddle-header">
          <div class="riddle-heading">
            <h1>${escapeHtml(data.step.title)}</h1>
          </div>
          ${riddleHeaderAsideTemplate(data)}
        </header>
        <div class="riddle-layout">
          <aside class="instructions-panel ${data.isPractice ? "instructions-panel--practice" : "instructions-panel--challenge"}">
            ${data.isPractice ? '<p class="panel-mode-tag">Étape d\'apprentissage</p>' : ""}
            ${riddleIntroTextTemplate(data)}
            ${riddleScoringNoticeTemplate(data)}
            ${riddleCurrentTaskTemplate(data)}
            ${riddleInstructionActionsTemplate(data)}
            <aside class="instruction-hint" data-hint-panel hidden>
              <strong>${icon("help")} Indice</strong>
              <p data-hint-message></p>
            </aside>
          </aside>
          <section class="interaction-panel ${data.isPractice ? "interaction-panel--practice" : "interaction-panel--challenge"}" aria-label="Zone de jeu">
            <div class="game-host"></div>
            ${renderStepInteractionChrome()}
          </section>
        </div>
      </div>
    `;
}

function riddleHeaderAsideTemplate(data: RiddleBlockTemplateData): string {
  if (data.isPractice) {
    return `
        <aside class="mode-indicator mode-indicator--practice" aria-label="Indicateurs du tutoriel">
          <span class="mode-indicator-label">Mode tutoriel</span>
          <ul class="mode-indicator-list">
            <li>Sans score</li>
            <li>Essais illimités</li>
          </ul>
        </aside>
      `;
  }

  return `
      <dl class="riddle-stats mode-indicator--challenge" aria-label="Progression de l'épreuve">
        <div>
          <dt>Score</dt>
          <dd data-score>0</dd>
        </div>
        <div>
          <dt>Erreurs</dt>
          <dd data-mistakes>0</dd>
        </div>
      </dl>
    `;
}

function riddleIntroTextTemplate(data: RiddleBlockTemplateData): string {
  if (data.step.introText === undefined || data.step.introText === "") {
    return "";
  }

  return `<p class="intro-text">${escapeHtml(data.step.introText)}</p>`;
}

function riddleScoringNoticeTemplate(data: RiddleBlockTemplateData): string {
  if (data.isPractice) {
    return "";
  }

  return `
      <p class="score-notice">
        ${icon("award")}
        <span>Épreuve scorée : le score et les erreurs sont pris en compte.</span>
      </p>
    `;
}

function riddleCurrentTaskTemplate(data: RiddleBlockTemplateData): string {
  if (data.step.questions.length === 0) {
    return `
        <section class="current-task" aria-label="Consigne">
          <h2>Consigne</h2>
          <p>${escapeHtml(data.step.instruction)}</p>
        </section>
      `;
  }

  const currentQuestion = data.step.questions[data.activeQuestionIndex] ?? data.step.questions[0];
  if (currentQuestion === undefined) {
    return "";
  }

  const showQuestionCount = !(data.isPractice && data.step.questions.length === 1);

  return `
      <section class="current-task" aria-label="Consigne">
        <h2>Consigne</h2>
        <article class="current-question">
          ${showQuestionCount ? `<span data-question-count>${data.activeQuestionIndex + 1} / ${data.step.questions.length}</span>` : ""}
          <p data-current-prompt>${escapeHtml(data.taskPrompt)}</p>
          <strong data-current-question>${escapeHtml(currentQuestion.question)}</strong>
        </article>
      </section>
    `;
}

function riddleInstructionActionsTemplate(data: RiddleBlockTemplateData): string {
  const layoutClass = data.canReturnToCourse ? "instruction-actions--dual" : "";

  return `
      <div class="instruction-actions ${layoutClass}">
        ${data.canReturnToCourse ? `<button class="riddle-course-button" type="button">${icon("book")} Leçon</button>` : ""}
        <button type="button" class="hint-button" data-hint>${icon("help")} Indice</button>
      </div>
    `;
}
