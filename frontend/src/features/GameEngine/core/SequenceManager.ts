import type { GameStep } from "../../../models/GameConfig.js";

export class SequenceManager {
  private currentIndex: number;

  public constructor(private readonly steps: GameStep[], initialIndex = 0) {
    this.currentIndex = this.clampIndex(initialIndex);
  }

  public getCurrentStep(): GameStep | null {
    return this.steps[this.currentIndex] ?? null;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public advanceToNextStep(): boolean {
    if (!this.hasNextStep()) {
      return false;
    }

    this.currentIndex += 1;
    return this.getCurrentStep() !== null;
  }

  private hasNextStep(): boolean {
    return this.currentIndex < this.steps.length - 1;
  }

  private clampIndex(index: number): number {
    if (this.steps.length === 0) {
      return 0;
    }

    return Math.min(Math.max(0, index), this.steps.length - 1);
  }
}
