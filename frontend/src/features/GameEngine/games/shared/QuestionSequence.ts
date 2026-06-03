import type { GameProgressDetail, GameWonDetail, RiddleQuestion } from "../../../../models/GameConfig.js";

export interface QuestionSequenceOptions {
  questions: RiddleQuestion[];
  completionAnswerId: string;
  onProgress: (detail: GameProgressDetail) => void;
  onComplete: (detail: GameWonDetail) => void;
}

export interface SequenceTurnResult {
  isComplete: boolean;
}

export class QuestionSequence {
  private index = 0;
  private score = 0;
  private mistakes = 0;
  private finalized = false;

  public constructor(private readonly options: QuestionSequenceOptions) {}

  public get currentIndex(): number {
    return this.index;
  }

  public get currentScore(): number {
    return this.score;
  }

  public get currentMistakes(): number {
    return this.mistakes;
  }

  public get totalCount(): number {
    return this.options.questions.length;
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
    this.score = 0;
    this.mistakes = 0;
    this.finalized = false;
    this.syncProgress();
  }

  public syncProgress(): void {
    this.options.onProgress({
      score: this.score,
      mistakes: this.mistakes,
      currentQuestionIndex: this.index
    });
  }

  public recordCorrect(points: number): SequenceTurnResult {
    this.score += points;
    this.index += 1;
    this.syncProgress();
    return { isComplete: this.isComplete };
  }

  public recordMistake(): void {
    this.mistakes += 1;
    this.syncProgress();
  }

  public finalize(): void {
    if (!this.isComplete || this.finalized) {
      return;
    }

    this.finalized = true;
    this.options.onComplete({
      score: this.score,
      answer: this.options.completionAnswerId
    });
  }
}
