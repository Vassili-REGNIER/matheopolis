import { BaseComponent } from "../../components/BaseComponent.js";
import type { QuizPlayView } from "../../models/Quiz.js";
import type { AppServices } from "../../models/services/AppServices.js";
import type { Router } from "../../router/Router.js";
import { quizPlayStyles } from "./QuizPlayComponent.styles.js";
import {
  quizPlayCorrectionTemplate,
  quizPlayEmptyTemplate,
  quizPlayLoadingTemplate,
  quizPlayQuestionTemplate
} from "./QuizPlayComponent.template.js";

export class QuizPlayComponent extends BaseComponent {
  private quiz: QuizPlayView | null = null;
  private currentIndex = 0;
  private readonly selectedOptionIds = new Map<number, Set<number>>();

  public constructor(
    container: HTMLElement,
    private readonly router: Router,
    private readonly services: AppServices,
    private readonly quizId: number,
    private readonly showResults = false
  ) {
    super(container, "matheo-quiz-play");
  }

  public init(): void {
    this.renderLoading();
    void this.load();
  }

  protected bindEvents(): void {
    const backButton = this.query<HTMLButtonElement>('[data-action="back"]');
    if (backButton !== null) {
      this.listen(backButton, "click", () => this.router.navigate("/game-home"));
    }

    this.queryAll<HTMLInputElement>("[data-option-id]").forEach((input) => {
      this.listen(input, "change", () => this.updateAnswer(input));
    });

    const nextButton = this.query<HTMLButtonElement>('[data-action="next"]');
    if (nextButton !== null) {
      this.listen(nextButton, "click", () => {
        void this.submitCurrentQuestion();
      });
    }

    const finishButton = this.query<HTMLButtonElement>('[data-action="finish"]');
    if (finishButton !== null) {
      this.listen(finishButton, "click", () => {
        void this.submitCurrentQuestion();
      });
    }

    const topButton = this.query<HTMLButtonElement>('[data-action="top"]');
    if (topButton !== null) {
      this.listen(topButton, "click", () => {
        this.query<HTMLElement>("#quiz-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    this.queryAll<HTMLAnchorElement>("[data-result-target]").forEach((link) => {
      this.listen(link, "click", (event) => {
        event.preventDefault();
        const target = link.dataset.resultTarget;
        if (target !== undefined) {
          this.query<HTMLElement>(`#${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  private async load(): Promise<void> {
    this.quiz = await this.services.quizzes.getQuiz(this.quizId);
    if (this.quiz === null || this.quiz.questions.length === 0) {
      this.renderEmpty();
      return;
    }

    if (this.showResults) {
      await this.renderCorrection();
      return;
    }

    const progress = await this.services.quizzes.getProgress(this.quizId);
    if (progress.status === "completed") {
      await this.renderCorrection();
      return;
    }

    this.currentIndex = progress.status === "in_progress"
      ? Math.min(progress.currentQuestionIndex, this.quiz.questions.length - 1)
      : 0;
    this.renderQuiz();
  }

  private updateAnswer(input: HTMLInputElement): void {
    const quiz = this.quiz;
    const question = quiz?.questions[this.currentIndex];
    if (question === undefined) {
      return;
    }

    const optionId = Number.parseInt(input.dataset.optionId ?? "", 10);
    if (Number.isNaN(optionId)) {
      return;
    }

    if (question.type === "checkbox") {
      const existing = this.selectedOptionIds.get(question.id) ?? new Set<number>();
      if (input.checked) {
        existing.add(optionId);
      } else {
        existing.delete(optionId);
      }
      this.selectedOptionIds.set(question.id, existing);
    } else {
      this.selectedOptionIds.set(question.id, new Set([optionId]));
    }

    this.renderQuiz();
  }

  private async submitCurrentQuestion(): Promise<void> {
    const quiz = this.quiz;
    const question = quiz?.questions[this.currentIndex];
    if (quiz === null || question === undefined) {
      return;
    }

    const selected = this.selectedOptionIds.get(question.id) ?? new Set<number>();
    if (selected.size === 0) {
      return;
    }

    const progress = await this.services.quizzes.submitResponse(this.quizId, {
      questionId: question.id,
      optionIds: Array.from(selected)
    });
    this.selectedOptionIds.delete(question.id);

    if (progress.status === "completed") {
      await this.renderCorrection();
      return;
    }

    this.currentIndex = Math.min(progress.currentQuestionIndex, quiz.questions.length - 1);
    this.renderQuiz();
  }

  private renderLoading(): void {
    this.render(quizPlayLoadingTemplate(), quizPlayStyles());
  }

  private renderEmpty(): void {
    this.render(quizPlayEmptyTemplate(), quizPlayStyles());
    this.bindEvents();
  }

  private renderQuiz(): void {
    const quiz = this.quiz;
    const question = quiz?.questions[this.currentIndex];
    if (quiz === null || question === undefined) {
      this.renderEmpty();
      return;
    }

    const selected = this.selectedOptionIds.get(question.id) ?? new Set<number>();
    const questionNumber = this.currentIndex + 1;
    const progress = Math.round((questionNumber / quiz.questions.length) * 100);
    const isLastQuestion = this.currentIndex === quiz.questions.length - 1;

    this.render(quizPlayQuestionTemplate({
      quiz,
      question,
      selectedOptionIds: selected,
      questionNumber,
      progress,
      isLastQuestion
    }), quizPlayStyles());
    this.bindEvents();
  }

  private async renderCorrection(): Promise<void> {
    const correction = await this.services.quizzes.getCorrection(this.quizId);

    this.render(quizPlayCorrectionTemplate({ correction }), quizPlayStyles());
    this.bindEvents();
  }
}
