import { BaseComponent } from "../../../../components/BaseComponent.js";
import type { InfoStep } from "../../../../models/GameConfig.js";
import { infoBlockStyles } from "./InfoBlockComponent.styles.js";
import { renderInfoBlockTemplate } from "./InfoBlockComponent.template.js";

export class InfoBlockComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly step: InfoStep
  ) {
    super(container, "matheo-info-block");
  }

  public init(): void {
    this.render(renderInfoBlockTemplate(this.step), this.renderScopedStyles());
    this.bindEvents();
  }

  private renderScopedStyles(): string {
    return `${infoBlockStyles}\n${this.renderContentStyle()}`;
  }

  private renderContentStyle(): string {
    const embeddedStyle = this.step.content !== undefined && !Array.isArray(this.step.content)
      ? this.step.content.styles ?? ""
      : "";

    return `${embeddedStyle}\n${this.step.contentCss ?? ""}`;
  }

  protected bindEvents(): void {
    const button = this.query<HTMLButtonElement>(".info-primary-action");
    if (button !== null) {
      this.listen(button, "click", () => this.emit("stepComplete"));
    }

    const secondaryAction = this.query<HTMLButtonElement>(".info-secondary-action");
    if (secondaryAction !== null && this.step.secondaryAction !== undefined) {
      const targetContentId = this.step.secondaryAction.targetContentId;
      this.listen(secondaryAction, "click", () => this.emit("infoNavigate", {
        targetContentId
      }));
    }
  }
}
