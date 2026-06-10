import type { DialogueLine } from "../../../../models/GameConfig.js";
import type { DialogueBlockTemplateModel } from "../../../../models/game-engine/DialogueBlockTemplate.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

const defaultAvatar = "./public/assets/characters/laurence.png";

export function renderDialogueBlockTemplate(model: DialogueBlockTemplateModel): string {
  const isNarrator = model.current?.speakerId?.toLowerCase() === "narrateur";

  return `
    <div class="stars" aria-hidden="true"></div>
    <section class="dialogue-stage" ${model.stageStyle}>
      <div class="history">
        ${model.history.map((line, index) => renderHistoryLine(line, index)).join("")}
      </div>
      
      <div class="dialogue-container">
        <article class="dialogue-wrapper ${model.wrapperClass}">
          ${renderAvatar(model.current, isNarrator)}
          <div class="dialogue-bubble">
            ${renderSpeakerName(model.current, isNarrator)}
            <p class="typewriter-text">${escapeHtml(model.currentText)}</p>
          </div>
        </article>
        
        <div class="button-group">
          ${model.showPrevious ? `<button class="prev-button" type="button">${icon("arrowLeft")} Précédent</button>` : ""}
          <button class="next-button" type="button">${model.finished ? `Lancer le jeu ${icon("gamepad")}` : `Suivant ${icon("arrowRight")}`}</button>
        </div>
      </div>
    </section>
  `;
}

function renderAvatar(line: DialogueLine | null, isNarrator: boolean): string {
  if (isNarrator || line === null) {
    return "";
  }

  return `<img class="avatar" src="${line.image ?? defaultAvatar}" alt="${escapeHtml(line.speakerId)}">`;
}

function renderSpeakerName(line: DialogueLine | null, isNarrator: boolean): string {
  if (isNarrator || line === null) {
    return "";
  }

  return `<h1>${escapeHtml(line.speakerId)}</h1>`;
}

function renderHistoryLine(line: DialogueLine, index: number): string {
  const isNarrator = line.speakerId?.toLowerCase() === "narrateur";
  const position = line.position ? line.position : (index % 2 === 0 ? "right" : "left");
  const itemClass = isNarrator ? "narrator" : position;
  
  return `
    <div class="history-item ${itemClass}">
      ${!isNarrator && line.image ? `<img src="${line.image}" alt="${escapeHtml(line.speakerId)}">` : ""}
      <div>
        ${!isNarrator ? `<strong>${escapeHtml(line.speakerId)}</strong>` : ""}
        <p>${escapeHtml(line.text)}</p>
      </div>
    </div>
  `;
}
