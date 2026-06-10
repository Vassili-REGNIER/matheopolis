import type {
  QuestionSequenceOptions,
  SequenceTurnResult
} from "../../../../models/game-engine/QuestionSequence.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";
import { computeMistakeScore } from "./mistakeScore.js";

export class QuestionSequence {
  private index = 0;
  private mistakes = 0;

  public constructor(private readonly options: QuestionSequenceOptions) {}

  public get currentIndex(): number {
    return this.index;
  }

  public get currentMistakes(): number {
    return this.mistakes;
  }

  public get totalCount(): number {
    return this.options.questions.length;
  }

  public get completionAnswerId(): string {
    return this.options.completionAnswerId;
  }

  public get currentQuestion(): RiddleQuestion | undefined {
    return this.options.questions[this.index];
  }

  public get isComplete(): boolean {
    return this.index >= this.options.questions.length;
  }

  public get isEmpty(): boolean {
    return this.options.questions.length === 0;
  }

  public reset(): void {
    this.index = 0;
    this.mistakes = 0;
    this.syncProgress();
  }

  public syncProgress(): void {
    this.options.onProgress({
      score: this.options.scoring === false ? 0 : computeMistakeScore(this.index, this.mistakes),
      mistakes: this.mistakes,
      currentQuestionIndex: this.index
    });
  }

  public recordCorrect(): SequenceTurnResult {
    this.index += 1;
    this.syncProgress();
    return { isComplete: this.isComplete };
  }

  public recordMistake(): void {
    if (this.options.trackMistakes === false) {
      return;
    }
    this.mistakes += 1;
    this.syncProgress();
  }
}
