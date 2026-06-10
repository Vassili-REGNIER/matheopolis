import { BaseComponent } from "../../../BaseComponent.js";
import type { Chapter } from "../../../../models/Chapter.js";
import type {
  ChapterProgress,
  StudentChapterProgressDetail,
  StudentChapterProgressSummary,
  StudentQuizProgressDetail
} from "../../../../models/ChapterProgress.js";
import type { QuizProgress, QuizSummary } from "../../../../models/Quiz.js";
import type {
  ProgressComponentOptions,
  ProgressRowViewModel,
  StudentInfoViewModel,
  StudentProgressSummaryViewModel
} from "../../../../models/components/Progress.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import { displayName, type User } from "../../../../models/User.js";
import type { StudentProgressViewContext } from "../../../../models/components/ClassManagement.js";
import { clampPercent, formatDate } from "../../../../utils/dom.js";
import { progressStyles } from "./ProgressComponent.styles.js";
import {
  progressLoadingTemplate,
  progressStudentUnavailableTemplate,
  progressStudentViewTemplate
} from "./ProgressComponent.template.js";

export class ProgressComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices,
    private readonly options?: ProgressComponentOptions
  ) {
    super(container, "matheo-progress-view");
  }

  public init(): void {
    this.render(progressLoadingTemplate(), progressStyles());
    void this.load();
  }

  protected bindEvents(): void {
    const back = this.query<HTMLButtonElement>(".back-button");
    if (back !== null && this.options?.onBack !== undefined) {
      this.listen(back, "click", () => {
        this.options?.onBack?.();
      });
    }
  }

  private async load(): Promise<void> {
    if (this.options?.studentContext !== undefined) {
      await this.loadStudentView(this.options.studentContext);
      return;
    }

    await this.loadPersonalView();
  }

  private async loadPersonalView(): Promise<void> {
    const user = await this.services.auth.getMe();
    if (user === null) {
      this.render(progressStudentUnavailableTemplate(), progressStyles());
      this.bindEvents();
      return;
    }

    const [chapters, quizzes] = await Promise.all([
      this.services.chapters.listChapters(),
      this.services.quizzes.listQuizzes()
    ]);
    const chapterDetails = await Promise.all(chapters.map(async (chapter) => {
      const progress = chapter.progress ?? await this.services.chapters.getProgress(chapter.id);
      return this.toChapterDetail(chapter, progress);
    }));
    const quizDetails = quizzes.map((quiz) => this.toQuizDetail(quiz));
    const summary = this.toPersonalSummary(user, chapterDetails, quizDetails);
    const percent = clampPercent(Math.round(summary.completionRate));

    this.render(
      progressStudentViewTemplate(
        this.toStudentInfo(user, percent, summary),
        this.toStudentSummary(percent, summary),
        chapterDetails.map((item) => this.toStudentChapterRow(item)),
        quizDetails.filter((item) => item.visibility === "private").map((item) => this.toStudentQuizRow(item)),
        quizDetails.filter((item) => item.visibility === "public").map((item) => this.toStudentQuizRow(item)),
        false,
        "Ma progression"
      ),
      progressStyles()
    );
    this.bindEvents();
  }

  private async loadStudentView(context: StudentProgressViewContext): Promise<void> {
    let user: User;
    try {
      user = await this.services.users.getUserProfile(context.userId);
    } catch {
      this.render(progressStudentUnavailableTemplate(), progressStyles());
      this.bindEvents();
      return;
    }

    const summary = context.summary;
    const percent = clampPercent(Math.round(summary.completionRate));

    this.render(
      progressStudentViewTemplate(
        this.toStudentInfo(user, percent, summary),
        this.toStudentSummary(percent, summary),
        summary.chapterProgress.map((item) => this.toStudentChapterRow(item)),
        summary.quizProgress.filter((item) => item.visibility === "private").map((item) => this.toStudentQuizRow(item)),
        summary.quizProgress.filter((item) => item.visibility === "public").map((item) => this.toStudentQuizRow(item)),
        this.options?.onBack !== undefined
      ),
      progressStyles()
    );
    this.bindEvents();
  }

  private toStudentSummary(
    percent: number,
    summary: StudentChapterProgressSummary
  ): StudentProgressSummaryViewModel {
    const statusLabel = percent >= 100 ? "Complété" : percent > 0 ? "En cours" : "Non commencé";
    const dateLabel = this.formatLastActivity(summary.lastActivityAt);
    const summaryDateLabel = dateLabel === "Aucune activité" ? "" : formatDate(summary.lastActivityAt);

    return {
      percent,
      statusLabel,
      startedChapters: summary.startedChapters,
      completedChapters: summary.completedChapters,
      totalChapters: summary.totalChapters,
      startedQuizzes: summary.startedQuizzes,
      completedQuizzes: summary.completedQuizzes,
      totalQuizzes: summary.totalQuizzes,
      startedItems: summary.startedItems,
      completedItems: summary.completedItems,
      totalItems: summary.totalItems,
      dateLabel: summaryDateLabel
    };
  }

  private toStudentInfo(
    user: User,
    percent: number,
    summary: StudentChapterProgressSummary
  ): StudentInfoViewModel {
    return {
      displayName: displayName(user),
      username: user.username,
      percent,
      lastActivityLabel: this.formatLastActivity(summary.lastActivityAt),
      registrationDateLabel: formatDate(user.createdAt)
    };
  }

  private toChapterDetail(chapter: Chapter, progress: ChapterProgress): StudentChapterProgressDetail {
    const stepCount = chapter.stepCount ?? 0;

    return {
      chapterId: chapter.id,
      title: chapter.title,
      status: progress.status,
      percent: this.services.progressMetrics.progressPercent(progress, stepCount),
      currentStepIndex: progress.currentStepIndex,
      stepCount,
      score: progress.score,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt
    };
  }

  private toQuizDetail(quiz: QuizSummary): StudentQuizProgressDetail {
    const progress = quiz.progress;
    const status = progress?.status ?? "not_started";

    return {
      quizId: quiz.id,
      title: quiz.title,
      visibility: quiz.status,
      status,
      percent: this.quizProgressPercent(progress, quiz.questionCount),
      currentQuestionIndex: progress?.currentQuestionIndex ?? 0,
      questionCount: quiz.questionCount,
      score: this.quizScore(progress),
      attemptCount: progress?.attemptCount ?? 0,
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null
    };
  }

  private toPersonalSummary(
    user: User,
    chapterProgress: StudentChapterProgressDetail[],
    quizProgress: StudentQuizProgressDetail[]
  ): StudentChapterProgressSummary {
    const percentages = [
      ...chapterProgress.map((item) => item.percent),
      ...quizProgress.map((item) => item.percent)
    ];
    const totalChapters = chapterProgress.length;
    const totalQuizzes = quizProgress.length;
    const startedChapters = chapterProgress.filter((item) => item.status !== "not_started").length;
    const completedChapters = chapterProgress.filter((item) => item.status === "completed").length;
    const startedQuizzes = quizProgress.filter((item) => item.status !== "not_started").length;
    const completedQuizzes = quizProgress.filter((item) => item.status === "completed").length;

    return {
      user,
      userId: user.id,
      startedChapters,
      completedChapters,
      totalChapters,
      startedQuizzes,
      completedQuizzes,
      totalQuizzes,
      startedItems: startedChapters + startedQuizzes,
      completedItems: completedChapters + completedQuizzes,
      totalItems: totalChapters + totalQuizzes,
      completionRate: percentages.length === 0
        ? 0
        : Math.round(percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length),
      lastActivityAt: this.latestActivity([...chapterProgress, ...quizProgress]),
      chapterProgress,
      quizProgress
    };
  }

  private toStudentChapterRow(item: StudentChapterProgressDetail): ProgressRowViewModel {
    const stepCount = item.stepCount;
    const completedSteps = item.status === "completed"
      ? stepCount
      : Math.min(item.currentStepIndex, stepCount);

    return {
      title: item.title,
      iconName: "book",
      percent: clampPercent(Math.round(item.percent)),
      statusLabel: this.statusLabel(item.status),
      dateLabel: this.progressDateLabel(item),
      detailLabel: stepCount > 0 ? `${completedSteps} / ${stepCount} étapes` : ""
    };
  }

  private toStudentQuizRow(item: StudentQuizProgressDetail): ProgressRowViewModel {
    const questionCount = item.questionCount;
    const answeredQuestions = item.status === "completed"
      ? questionCount
      : Math.min(item.currentQuestionIndex, questionCount);

    return {
      title: item.title,
      iconName: item.visibility === "private" ? "lock" : "file",
      percent: clampPercent(Math.round(item.percent)),
      statusLabel: this.statusLabel(item.status),
      dateLabel: this.progressDateLabel(item),
      detailLabel: `${answeredQuestions} / ${questionCount} questions`
    };
  }

  private formatLastActivity(value: string | null): string {
    if (value === null || value.trim() === "") {
      return "Aucune activité";
    }

    return formatDate(value);
  }

  private statusLabel(status: string): string {
    if (status === "completed") {
      return "Complété";
    }
    if (status === "in_progress") {
      return "En cours";
    }
    return "Non commencé";
  }

  private progressDateLabel(progress: {
    lastAttemptAt?: string | null;
    completedAt: string | null;
    startedAt: string | null;
  }): string {
    const raw = progress.lastAttemptAt ?? progress.completedAt ?? progress.startedAt;
    if (raw === null || raw.trim() === "") {
      return "";
    }
    return formatDate(raw);
  }

  private quizProgressPercent(progress: QuizProgress | null, questionCount: number): number {
    if (progress === null || progress.status === "not_started") {
      return 0;
    }
    if (progress.status === "completed") {
      return 100;
    }
    if (questionCount <= 0) {
      return 0;
    }

    return clampPercent(Math.min(99, Math.round((progress.currentQuestionIndex / questionCount) * 100)));
  }

  private quizScore(progress: (QuizProgress & { score?: number | null }) | null): number | null {
    if (progress === null) {
      return null;
    }

    return progress.bestScore ?? progress.lastScore ?? progress.score ?? null;
  }

  private latestActivity(items: Array<{ completedAt: string | null; startedAt: string | null }>): string | null {
    return items.reduce<string | null>((latest, item) => {
      const candidate = item.completedAt ?? item.startedAt;
      if (candidate === null) {
        return latest;
      }

      return latest === null || candidate > latest ? candidate : latest;
    }, null);
  }
}
