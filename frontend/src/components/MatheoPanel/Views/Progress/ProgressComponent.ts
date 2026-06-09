import { BaseComponent } from "../../../BaseComponent.js";
import type { Chapter } from "../../../../models/Chapter.js";
import type { ChapterProgress, StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type {
  ProgressComponentOptions,
  ProgressRowViewModel,
  StudentInfoViewModel,
  StudentProgressSummaryViewModel
} from "../../../../models/components/Progress.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import { displayName, type User } from "../../../../models/User.js";
import type { StudentProgressViewContext } from "../../../../models/ClassManagement.js";
import { clampPercent, formatDate } from "../../../../utils/dom.js";
import { progressStyles } from "./ProgressComponent.styles.js";
import {
  progressLoadingTemplate,
  progressPersonalViewTemplate,
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

    const chapters = await this.services.chapters.listChapters();
    const rows = await Promise.all(chapters.map(async (chapter) => ({
      chapter,
      progress: await this.services.chapters.getProgress(chapter.id)
    })));

    this.render(
      progressPersonalViewTemplate(rows.map((row) => this.toProgressRow(row.chapter, row.progress))),
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
    const summaryDateLabel = dateLabel === "Aucune activite" ? "" : formatDate(summary.lastActivityAt);

    return {
      percent,
      statusLabel,
      startedChapters: summary.startedChapters,
      completedChapters: summary.completedChapters,
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

  private toProgressRow(chapter: Chapter, progress: ChapterProgress): ProgressRowViewModel {
    return {
      title: chapter.title,
      chapterId: chapter.id,
      percent: this.services.progressMetrics.progressPercent(progress),
      statusLabel: this.statusLabel(progress.status),
      attemptCount: progress.attemptCount,
      dateLabel: this.progressDateLabel(progress)
    };
  }

  private formatLastActivity(value: string | null): string {
    if (value === null || value.trim() === "") {
      return "Aucune activite";
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
    lastAttemptAt: string | null;
    completedAt: string | null;
    startedAt: string | null;
  }): string {
    const raw = progress.lastAttemptAt ?? progress.completedAt ?? progress.startedAt;
    if (raw === null || raw.trim() === "") {
      return "";
    }
    return formatDate(raw);
  }
}
