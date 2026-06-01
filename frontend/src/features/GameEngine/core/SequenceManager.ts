import type { GameStep } from "../../../models/GameConfig.js";

export class SequenceManager {
  private currentIndex = 0;

  public constructor(private readonly steps: GameStep[]) {}

  public getCurrentStep(): GameStep | null {
    return this.steps[this.currentIndex] ?? null;
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
}
