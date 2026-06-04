import { BaseComponent } from "../../../components/BaseComponent.js";
import type { DialogueLine, DialogueStep } from "../../../models/GameConfig.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";

export class DialogueBlockComponent extends BaseComponent {
  private index = 0;
  private history: DialogueLine[] = [];
  private isTyping = false;
  private typingTimeout?: number;
  private currentText = "";

  public constructor(
    container: HTMLElement,
    private readonly step: DialogueStep
  ) {
    super(container, "matheo-dialogue-block");
  }

  public init(): void {
    this.renderDialogue();
  }

  protected bindEvents(): void {
    const next = this.query<HTMLButtonElement>(".next-button");
    if (next !== null) {
      this.listen(next, "click", () => this.next());
    }

    const prev = this.query<HTMLButtonElement>(".prev-button");
    if (prev !== null) {
      this.listen(prev, "click", () => this.previous());
    }
  }

  private next(): void {
    if (this.isTyping) {
      this.completeTyping();
      return;
    }

    const current = this.step.lines[this.index];
    if (current !== undefined) {
      this.history.push(current);
    }
    this.index += 1;
    if (this.index > this.step.lines.length) {
      this.emit("stepComplete");
      return;
    }
    this.renderDialogue();
  }

  private previous(): void {
    if (this.typingTimeout) {
      window.clearTimeout(this.typingTimeout);
    }
    this.isTyping = false;

    if (this.index === 0) {
      return;
    }
    this.index -= 1;
    this.history = this.history.slice(0, -1);
    this.renderDialogue();
  }

  private renderDialogue(): void {
    const current = this.step.lines[this.index] ?? null;
    const finished = current === null;
    
    // Détection du narrateur
    const isNarrator = current?.speakerId?.toLowerCase() === "narrateur";
    
    // Si la position n'est pas définie dans le GameConfig, on alterne automatiquement (gauche/droite)
    const position = current?.position ? current.position : (this.index % 2 === 0 ? "left" : "right");
    const wrapperClass = isNarrator ? "narrator" : position;
    
    // Mise à jour du texte courant pour l'animation
    this.currentText = current !== null ? current.text : "Vous êtes prêt à commencer l'épreuve.";

    this.render(`
      <div class="stars" aria-hidden="true"></div>
      <section class="dialogue-stage">
        <div class="history">
          ${this.history.map((line, i) => this.historyLine(line, i)).join("")}
        </div>
        
        <div class="dialogue-container">
          <article class="dialogue-wrapper ${wrapperClass}">
            ${!isNarrator && current !== null ? `<img class="avatar" src="${current.image ?? "./public/assets/characters/laurence.png"}" alt="${escapeHtml(current.speakerId)}">` : ""}
            <div class="dialogue-bubble">
              ${!isNarrator && current !== null ? `<h1>${escapeHtml(current.speakerId)}</h1>` : ""}
              <p class="typewriter-text">${escapeHtml(this.currentText)}</p>
            </div>
          </article>
          
          <div class="button-group">
            ${this.index > 0 && !finished ? `<button class="prev-button" type="button">${icon("arrowLeft")} Precedent</button>` : ""}
            <button class="next-button" type="button">${finished ? `Lancer le jeu ${icon("gamepad")}` : `Suivant ${icon("arrowRight")}`}</button>
          </div>
        </div>
      </section>
    `, `
      :host {
        min-height: 100%;
        display: block;
      }

      :host .dialogue-stage {
        min-height: calc(100vh - 72px);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        position: relative;
        overflow: hidden;
        padding: 36px 24px;
        background:
          radial-gradient(circle at 15% 10%, rgba(145, 215, 255, .25), transparent 28%),
          radial-gradient(circle at 80% 15%, rgba(255, 209, 102, .18), transparent 26%),
          linear-gradient(135deg, #07091c, #21134a);
      }

      :host .stars {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: radial-gradient(circle, rgba(255, 255, 255, .8) 1px, transparent 1px), radial-gradient(circle, rgba(255, 255, 255, .3) 1px, transparent 1px);
        background-size: 80px 80px, 150px 150px;
        opacity: .22;
      }

      :host .history {
        width: min(860px, 100%);
        max-height: 35vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
        position: relative;
        z-index: 1;
      }

      :host .history-item {
        width: fit-content;
        max-width: 85%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        background: rgba(20, 20, 20, 0.58);
        color: #bdc3c7;
      }

      :host .history-item.right {
        flex-direction: row-reverse;
        align-self: flex-end;
        text-align: right;
      }

      /* Style spécifique pour le narrateur dans l'historique */
      :host .history-item.narrator {
        width: 100%;
        max-width: 100%;
        justify-content: center;
        text-align: center;
        background: transparent;
        border: none;
        padding: 8px;
        font-style: italic;
        color: rgba(255, 255, 255, 0.6);
      }

      :host .history-item img {
        width: 64px; 
        height: 64px;
        border-radius: 50%;
        object-fit: contain;
      }

      :host .history-item strong {
        display: block;
        color: #91d7ff;
        margin-bottom: 4px;
      }

      :host .history-item p {
        margin: 0;
        line-height: 1.4;
      }

      :host .dialogue-container {
        width: 100%;
        max-width: 860px;
        display: flex;
        flex-direction: column;
        align-items: flex-end; 
        gap: 16px;
        position: relative;
        z-index: 1;
      }

      @keyframes slideFadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host .dialogue-wrapper {
        width: 100%;
        display: flex;
        align-items: flex-end;
        gap: 20px;
        animation: slideFadeIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
      }

      :host .dialogue-wrapper.right {
        flex-direction: row-reverse;
      }

      /* Style spécifique pour le narrateur (bulle centrale) */
      :host .dialogue-wrapper.narrator {
        justify-content: center;
        align-items: center;
      }

      :host .avatar {
        width: 200px; 
        height: 200px;
        flex: none;
        object-fit: contain;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
      }

      :host .dialogue-bubble {
        flex: 1;
        padding: 24px;
        min-height: 120px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(20, 20, 20, 0.5);
        backdrop-filter: blur(8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);
        border-radius: 24px 24px 24px 4px; 
        display: flex;
        flex-direction: column;
      }

      :host .dialogue-wrapper.right .dialogue-bubble {
        border-radius: 24px 24px 4px 24px;
      }

      /* Style spécifique pour la bulle du narrateur */
      :host .dialogue-wrapper.narrator .dialogue-bubble {
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        max-width: 80%;
        flex: none; /* Empêche la bulle de prendre toute la largeur disponible inutilement */
        margin: 0 auto;
      }

      :host .dialogue-wrapper.narrator .typewriter-text {
        font-style: italic;
        color: rgba(255, 255, 255, 0.85);
      }

      :host .dialogue-wrapper.right h1 {
        text-align: right;
      }

      :host h1 {
        margin: 0 0 12px;
        color: #91d7ff;
        font-size: 1.35rem;
      }

      :host .typewriter-text {
        margin: 0;
        color: #fff;
        line-height: 1.6;
        font-size: 1.1rem;
        flex-grow: 1;
      }

      :host .typewriter-text.typing::after {
        content: '|';
        animation: blink 1s step-start infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }

      :host .button-group {
        display: flex;
        gap: 12px;
      }

      :host button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 18px;
        border-radius: 8px;
        color: #fff;
        font-weight: 900;
        cursor: pointer;
        font-size: 1rem;
        transition: transform 0.15s ease, background 0.15s ease;
      }

      :host button:hover {
        transform: translateY(-2px);
      }

      :host .next-button {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.15);
      }

      :host .next-button:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      :host .prev-button {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.4); 
      }

      :host .icon {
        width: 17px;
        height: 17px;
      }

      @media (max-width: 720px) {
        :host .dialogue-stage {
          padding: 24px; 
        }

        :host .dialogue-wrapper,
        :host .dialogue-wrapper.right {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        :host .dialogue-wrapper.narrator .dialogue-bubble {
          max-width: 100%;
        }

        :host .dialogue-wrapper.right h1 {
          text-align: center;
        }

        :host .avatar {
          width: 160px;
          height: 160px;
        }

        :host .dialogue-bubble,
        :host .dialogue-wrapper.right .dialogue-bubble {
          border-radius: 20px;
          width: 100%;
        }

        :host .button-group {
          align-self: flex-end;
        }
      }
    `);
    
    this.bindEvents();
    
    const textElement = this.query<HTMLParagraphElement>(".typewriter-text");
    if (textElement) {
      this.startTypewriter(textElement);
    }
  }

  private startTypewriter(element: HTMLParagraphElement): void {
    this.isTyping = true;
    element.textContent = "";
    element.classList.add("typing"); 
    let charIndex = 0;

    if (this.typingTimeout) {
      window.clearTimeout(this.typingTimeout);
    }

    const typeNextChar = () => {
      if (charIndex < this.currentText.length) {
        element.textContent += this.currentText.charAt(charIndex);
        charIndex++;
        this.typingTimeout = window.setTimeout(typeNextChar, 30); 
      } else {
        this.isTyping = false;
        element.classList.remove("typing"); 
      }
    };

    typeNextChar();
  }

  private completeTyping(): void {
    if (this.typingTimeout) {
      window.clearTimeout(this.typingTimeout);
    }
    this.isTyping = false;
    
    const textElement = this.query<HTMLParagraphElement>(".typewriter-text");
    if (textElement) {
      textElement.textContent = this.currentText;
      textElement.classList.remove("typing");
    }
  }

  private historyLine(line: DialogueLine, i: number): string {
    const isNarrator = line.speakerId?.toLowerCase() === "narrateur";
    const pos = line.position ? line.position : (i % 2 === 0 ? "right" : "left");
    const itemClass = isNarrator ? "narrator" : pos;
    
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
}