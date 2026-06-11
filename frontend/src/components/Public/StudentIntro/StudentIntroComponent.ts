import { BaseComponent } from "../../BaseComponent.js";
import type { IntroStep } from "../../../models/components/StudentIntro.js";
import type { Router } from "../../../router/Router.js";
import { escapeHtml } from "../../../utils/dom.js";
import { icon } from "../../../utils/icons.js";

const introSteps: IntroStep[] = [
  {
    speaker: "Pape",
    text: "Regarde Laurence... Cet homme au loin avec sa grande tunique. C'est lui. Nous l'avons enfin trouvé. Pythagore !",
    image: "./public/assets/characters/Pape-neutral.png"
  },
  {
    speaker: "Pythagore",
    text: "Soyez les bienvenus voyageurs. Un son est un nombre qui chante, et les proportions ouvrent des passages secrets.",
    image: "./public/assets/characters/Pythagore-neutral.png"
  },
  {
    speaker: "Laurence",
    text: "Alors chaque énigme peut devenir une clé. Je suis prête à entrer dans Mathéopolis.",
    image: "./public/assets/characters/Laurence-neutral.png"
  }
];

export class StudentIntroComponent extends BaseComponent {
  private index = 0;

  public constructor(
    container: HTMLElement,
    private readonly router: Router
  ) {
    super(container, "matheo-intro");
  }

  public init(): void {
    this.renderIntro();
  }

  protected bindEvents(): void {
    const next = this.query<HTMLButtonElement>(".next-button");
    if (next !== null) {
      this.listen(next, "click", () => {
        if (this.index < introSteps.length - 1) {
          this.index += 1;
          this.renderIntro();
        } else {
          this.router.navigate("/game-home");
        }
      });
    }

    const skip = this.query<HTMLButtonElement>(".skip-button");
    if (skip !== null) {
      this.listen(skip, "click", () => this.router.navigate("/game-home"));
    }
  }

  private renderIntro(): void {
    const step = introSteps[this.index];
    if (step === undefined) {
      this.router.navigate("/game-home");
      return;
    }

    this.render(`
      <article class="intro-card">
        <div class="image-box">
          <img src="${step.image}" alt="${escapeHtml(step.speaker)}">
        </div>
        <div class="dialogue">
          <p class="speaker">${escapeHtml(step.speaker)}</p>
          <p class="line">${escapeHtml(step.text)}</p>
        </div>
        <div class="intro-actions">
          <span>Étape ${this.index + 1} / ${introSteps.length}</span>
          <div class="button-row">
            <button class="skip-button" type="button">Passer</button>
            <button class="next-button" type="button">${this.index === introSteps.length - 1 ? "Entrer dans Math&eacute;opolis" : `Suivant ${icon("arrowRight")}`}</button>
          </div>
        </div>
      </article>
    `, `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(circle at center, #1a1c3a 0%, #090a14 100%);
        color: #f8f9fa;
      }

      :host .intro-card {
        width: min(820px, 100%);
        max-height: calc(100dvh - 48px);
        overflow-y: auto;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        background: rgba(20, 24, 45, 0.92);
        box-shadow: var(--matheo-shadow);
        backdrop-filter: blur(8px);
      }

      :host .image-box {
        height: min(360px, 48vh);
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: #000;
      }

      :host .image-box img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      :host .dialogue {
        margin-top: 20px;
        padding: 16px;
        border-left: 4px solid #ffd166;
        border-radius: 5px 12px 12px 5px;
        background: rgba(255, 255, 255, 0.055);
      }

      :host .speaker {
        margin: 0 0 6px;
        color: #ffd166;
        font-size: 0.9rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .line {
        margin: 0;
        line-height: 1.55;
      }

      :host .intro-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 18px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 0.88rem;
      }

      :host .button-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      :host button {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-weight: 900;
      }

      :host .next-button {
        background: #ffd166;
        color: #090a14;
        border-color: #ffd166;
      }

      :host .icon {
        width: 18px;
        height: 18px;
      }

      @media (max-width: 620px) {
        :host .intro-actions {
          align-items: stretch;
          flex-direction: column;
        }

        :host .button-row,
        :host button {
          width: 100%;
        }
      }

      @media (max-width: 420px) {
        :host {
          padding: 16px;
        }

        :host .intro-card {
          max-height: calc(100dvh - 32px);
          padding: 18px;
          border-radius: 16px;
        }

        :host .image-box {
          height: min(300px, 38vh);
        }
      }
    `);
    this.bindEvents();
  }
}
