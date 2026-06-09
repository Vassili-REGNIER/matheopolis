import { BaseComponent } from "../../../../components/BaseComponent.js";
import type { DialogueLine, DialogueStep } from "../../../../models/GameConfig.js";
import type { DialogueBlockTemplateModel } from "../../../../models/game-engine/DialogueBlockTemplate.js";
import { asAttribute } from "../../../../utils/dom.js";
import { dialogueBlockStyles } from "./DialogueBlockComponent.styles.js";
import { renderDialogueBlockTemplate } from "./DialogueBlockComponent.template.js";

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
    const isNarrator = current?.speakerId?.toLowerCase() === "narrateur";
    const position = current?.position ? current.position : (this.index % 2 === 0 ? "left" : "right");
    const wrapperClass = isNarrator ? "narrator" : position;
    this.currentText = current !== null ? current.text : "Vous êtes prêt à commencer l'épreuve.";

    const model: DialogueBlockTemplateModel = {
      current,
      currentText: this.currentText,
      finished,
      history: this.history,
      wrapperClass,
      stageStyle: this.renderStageStyle(),
      showPrevious: this.index > 0 && !finished
    };

    this.render(renderDialogueBlockTemplate(model), dialogueBlockStyles);
    
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

  private renderStageStyle(): string {
    if (this.step.backgroundImg === undefined || this.step.backgroundImg.trim() === "") {
      return "";
    }

    return `style="background-image: linear-gradient(rgba(7, 9, 28, 0.22), rgba(7, 9, 28, 0.62)), url('${asAttribute(this.step.backgroundImg)}');"`;
  }
}
