import type {
  GameCompletedDetail,
  GameProgressDetail,
  GameValidateDetail,
  GameWonDetail
} from "../../../models/GameConfig.js";
import type { BaseGameContext, BaseGameParams } from "../../../models/game-engine/BaseGame.js";
import { computeMistakeScore } from "./shared/mistakeScore.js";

export abstract class BaseGame {
  private readonly disposers: Array<() => void> = [];
  private pendingWin: GameWonDetail | null = null;

  protected completed = false;

  protected isPracticeMode(): boolean {
    return this.params.mode === "practice";
  }

  public constructor(
    protected readonly container: HTMLElement,
    protected readonly params: BaseGameParams,
    protected readonly context: BaseGameContext
  ) {}

  public abstract start(): void;

  public destroy(): void {
    this.clearListeners();
    this.container.innerHTML = "";
  }

  public abstract showHint(): void;

  public submitAnswer(): void | Promise<void> {
    // Override in games that expose a validate action in the shell.
  }

  public proceedToNextStep(): void {
    if (this.pendingWin === null) {
      return;
    }

    const win = this.pendingWin;
    this.pendingWin = null;
    this.complete(win.score, win.answer);
  }

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

  protected markCompleted(score: number, answer: string): void {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.pendingWin = { score, answer };
    this.notifyValidate(false);
    this.container.dispatchEvent(new CustomEvent<GameCompletedDetail>("gameCompleted", {
      bubbles: true,
      detail: {
        message: this.params.completionMessage ?? "Épreuve terminée !",
        score,
        answer
      }
    }));
  }

  protected markCompletedWithMistakes(completedUnits: number, mistakes: number, answer: string): void {
    const score = this.isPracticeMode() ? 0 : computeMistakeScore(completedUnits, mistakes);
    this.markCompleted(score, answer);
  }

  protected notifyValidate(visible: boolean, enabled = true): void {
    this.container.dispatchEvent(new CustomEvent<GameValidateDetail>("gameValidate", {
      bubbles: true,
      detail: { visible, enabled }
    }));
  }
}
