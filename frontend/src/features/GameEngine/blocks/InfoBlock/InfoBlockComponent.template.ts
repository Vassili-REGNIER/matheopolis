import type { InfoStep } from "../../../../models/GameConfig.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";
import { renderInfoContent } from "../infoContentRenderer.js";

export function renderInfoBlockTemplate(step: InfoStep): string {
  return `
    <article class="info-card" data-theme="${step.theme ?? "default"}">
      <div class="info-icon">${icon(step.theme === "endChapter" ? "award" : "compass")}</div>
      <div class="info-content">
        ${renderInfoBodyTemplate(step)}
      </div>
      <div class="info-actions">
        ${renderInfoSecondaryActionTemplate(step)}
        <button class="info-primary-action" type="button">${step.buttonText ?? "Continuer"} ${icon("arrowRight")}</button>
      </div>
    </article>
  `;
}

function renderInfoBodyTemplate(step: InfoStep): string {
  const content = renderInfoContent(step.content);
  if (content.trim().length > 0) {
    return content;
  }

  return `${step.title !== undefined ? `<h1>${escapeHtml(step.title)}</h1>` : ""}${step.text !== undefined ? `<p>${escapeHtml(step.text)}</p>` : ""}`;
}

function renderInfoSecondaryActionTemplate(step: InfoStep): string {
  if (step.secondaryAction === undefined) {
    return "";
  }

  return `<button class="info-secondary-action" type="button">${escapeHtml(step.secondaryAction.text)}</button>`;
}
