import type { ContentService } from "../../../services/ContentService.js";
import type { GameParams, GameProgressDetail, GameWonDetail } from "../../../models/GameConfig.js";

export interface BaseGameContext {
  content: ContentService;
}

export abstract class BaseGame {
  private readonly disposers: Array<() => void> = [];

  public constructor(
    protected readonly container: HTMLElement,
    protected readonly params: GameParams,
    protected readonly context: BaseGameContext
  ) {}

  public abstract start(): void;

  public destroy(): void {
    this.clearListeners();
    this.container.innerHTML = "";
  }

  public abstract showHint(): void;

  protected clearListeners(): void {
    while (this.disposers.length > 0) {
      const dispose = this.disposers.pop();
      if (dispose !== undefined) {
        dispose();
      }
    }
  }

  protected listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ): void {
    target.addEventListener(type, listener as EventListener);
    this.disposers.push(() => target.removeEventListener(type, listener as EventListener));
  }

  protected complete(score: number, answer: string): void {
    this.container.dispatchEvent(new CustomEvent<GameWonDetail>("gameWon", {
      bubbles: true,
      detail: { score, answer }
    }));
  }

  protected updateProgress(score: number, mistakes: number, currentQuestionIndex?: number): void {
    this.container.dispatchEvent(new CustomEvent<GameProgressDetail>("gameProgress", {
      bubbles: true,
      detail: { score, mistakes, currentQuestionIndex }
    }));
  }
}
