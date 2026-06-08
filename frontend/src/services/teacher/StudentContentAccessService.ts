import { unwrapEnvelope, type ApiEnvelope } from "../../models/ApiEnvelopes.js";
import type { ChapterListEnvelopeData } from "../../models/Chapter.js";
import type { Classroom } from "../../models/Class.js";
import type {
  StudentContentCatalog,
  StudentContentClassAccessRow,
  StudentContentItem,
  StudentContentSectionId
} from "../../models/StudentContentAccess.js";
import { STUDENT_CONTENT_SECTIONS } from "../../models/StudentContentAccess.js";
import type { ApiClient } from "../ApiClient.js";
import type { TeacherClassService } from "./TeacherClassService.js";
import type { TeacherQuizService } from "./TeacherQuizService.js";

type AccessOverrideMap = Record<string, boolean>;
type QuizOverrideEntry = { classId: number; isActive: boolean };

/**
 * Teacher-facing access management for student-visible content.
 * Quizzes use the target-classes API; chapter access will use chapter target-class API routes when available.
 */
export class StudentContentAccessService {
  private static readonly chapterListMockPath = "./public/mocks/api/puzzles.json";
  private readonly chapterStorageKey = "matheopolis.studentContentClassAccess.chapters";
  private readonly quizOverrideCache = new Map<number, QuizOverrideEntry[]>();

  public constructor(
    private readonly api: ApiClient,
    private readonly teacherClasses: TeacherClassService,
    private readonly teacherQuizzes: TeacherQuizService
  ) {}

  public async listContentCatalog(): Promise<StudentContentCatalog> {
    const [chapters, publicQuizzes, privateQuizzes] = await Promise.all([
      this.loadChaptersFromMock(),
      this.loadPublicQuizzesFromApi(),
      this.loadPrivateQuizzesFromApi()
    ]);

    const itemsBySection = new Map<StudentContentSectionId, StudentContentItem[]>([
      ["public_quizzes", publicQuizzes],
      ["private_quizzes", privateQuizzes],
      ["chapters", chapters]
    ]);

    return {
      sections: STUDENT_CONTENT_SECTIONS.map((section) => ({
        id: section.id,
        items: [...(itemsBySection.get(section.id) ?? [])].sort((left, right) => left.position - right.position)
      }))
    };
  }

  /** @deprecated Use listContentCatalog() for section-aware views. */
  public async listContentItems(): Promise<StudentContentItem[]> {
    const catalog = await this.listContentCatalog();
    return catalog.sections.flatMap((section) => section.items);
  }

  public async listTeacherClasses(): Promise<Classroom[]> {
    try {
      return await this.teacherClasses.listMyClasses();
    } catch {
      return this.teacherClasses.listCachedClasses();
    }
  }

  public async listClassAccessRows(
    item: StudentContentItem,
    classes: Classroom[]
  ): Promise<StudentContentClassAccessRow[]> {
    if (item.kind === "quiz") {
      const overrides = await this.loadQuizOverrides(item.id);
      return classes.map((classroom) => ({
        classId: classroom.id,
        hasAccess: this.resolveQuizClassAccess(item.visibility, classroom.id, overrides)
      }));
    }

    const overrides = this.readChapterOverrides();
    return classes.map((classroom) => ({
      classId: classroom.id,
      hasAccess: this.resolveChapterClassAccess(classroom.id, overrides)
    }));
  }

  public isClassAccessEnabled(
    item: StudentContentItem,
    classId: number,
    cachedRows?: StudentContentClassAccessRow[]
  ): boolean {
    if (cachedRows !== undefined) {
      const row = cachedRows.find((entry) => entry.classId === classId);
      if (row !== undefined) {
        return row.hasAccess;
      }
    }

    if (item.kind === "quiz") {
      const overrides = this.quizOverrideCache.get(item.id) ?? [];
      return this.resolveQuizClassAccess(item.visibility, classId, overrides);
    }

    return this.resolveChapterClassAccess(classId, this.readChapterOverrides());
  }

  public async setClassAccess(
    item: StudentContentItem,
    classId: number,
    hasAccess: boolean
  ): Promise<void> {
    if (item.kind === "quiz") {
      await this.setQuizClassAccess(item, classId, hasAccess);
      return;
    }

    await this.setChapterClassAccess(classId, hasAccess);
  }

  public invalidateQuizAccessCache(quizId: number): void {
    this.quizOverrideCache.delete(quizId);
  }

  private async loadPublicQuizzesFromApi(): Promise<StudentContentItem[]> {
    const quizzes = await this.teacherQuizzes.listAccessibleQuizzes();

    return quizzes
      .filter((quiz) => quiz.status === "public")
      .map((quiz) => ({
        kind: "quiz" as const,
        sectionId: "public_quizzes" as const,
        id: quiz.id,
        title: quiz.title,
        description: quiz.description ?? "",
        position: quiz.position ?? quiz.id,
        visibility: "public" as const,
        canManageAccess: true
      }));
  }

  private async loadPrivateQuizzesFromApi(): Promise<StudentContentItem[]> {
    const quizzes = await this.teacherQuizzes.listAccessibleQuizzes();

    return quizzes
      .filter((quiz) => quiz.status === "private")
      .map((quiz) => ({
        kind: "quiz" as const,
        sectionId: "private_quizzes" as const,
        id: quiz.id,
        title: quiz.title,
        description: quiz.description ?? "",
        position: quiz.position ?? quiz.id,
        visibility: "private" as const,
        canManageAccess: true
      }));
  }

  private async loadChaptersFromMock(): Promise<StudentContentItem[]> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<ChapterListEnvelopeData>>(
      StudentContentAccessService.chapterListMockPath
    );
    const items = unwrapEnvelope(envelope).items;

    return items.map((chapter) => ({
      kind: "chapter" as const,
      sectionId: "chapters" as const,
      id: chapter.id,
      title: chapter.title,
      description: chapter.statement,
      position: chapter.position,
      visibility: "public" as const,
      canManageAccess: true
    }));
  }

  private async loadQuizOverrides(quizId: number): Promise<QuizOverrideEntry[]> {
    const cached = this.quizOverrideCache.get(quizId);
    if (cached !== undefined) {
      return cached;
    }

    const items = await this.teacherQuizzes.listClassAccess(quizId);
    this.quizOverrideCache.set(quizId, items);
    return items;
  }

  private async setQuizClassAccess(
    item: StudentContentItem,
    classId: number,
    hasAccess: boolean
  ): Promise<void> {
    const defaultAccess = item.visibility === "public";
    if (hasAccess === defaultAccess) {
      await this.teacherQuizzes.removeClassAccess(item.id, classId);
    } else {
      await this.teacherQuizzes.setClassAccess(item.id, classId, hasAccess);
    }

    this.invalidateQuizAccessCache(item.id);
  }

  private resolveQuizClassAccess(
    visibility: StudentContentItem["visibility"],
    classId: number,
    overrides: QuizOverrideEntry[]
  ): boolean {
    const override = overrides.find((entry) => entry.classId === classId);
    if (override !== undefined) {
      return override.isActive;
    }

    return visibility === "public";
  }

  private async setChapterClassAccess(classId: number, hasAccess: boolean): Promise<void> {
    const overrides = this.readChapterOverrides();
    const key = this.chapterOverrideKey(classId);
    const defaultAccess = true;

    if (hasAccess === defaultAccess) {
      delete overrides[key];
    } else {
      overrides[key] = hasAccess;
    }

    this.writeChapterOverrides(overrides);
  }

  private resolveChapterClassAccess(classId: number, overrides: AccessOverrideMap): boolean {
    const override = overrides[this.chapterOverrideKey(classId)];
    if (override !== undefined) {
      return override;
    }

    return true;
  }

  private chapterOverrideKey(classId: number): string {
    return `chapter:${classId}`;
  }

  private readChapterOverrides(): AccessOverrideMap {
    const raw = window.localStorage.getItem(this.chapterStorageKey);
    if (raw === null) {
      return {};
    }

    try {
      return JSON.parse(raw) as AccessOverrideMap;
    } catch {
      window.localStorage.removeItem(this.chapterStorageKey);
      return {};
    }
  }

  private writeChapterOverrides(overrides: AccessOverrideMap): void {
    window.localStorage.setItem(this.chapterStorageKey, JSON.stringify(overrides));
  }
}
