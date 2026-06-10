import type { Classroom } from "../../models/Class.js";
import type { ChapterService } from "../ChapterService.js";
import type {
  StudentContentCatalog,
  StudentContentClassAccessRow,
  StudentContentItem,
  StudentContentSectionId
} from "../../models/StudentContentAccess.js";
import { STUDENT_CONTENT_SECTIONS } from "../../models/StudentContentAccess.js";
import type { TeacherClassService } from "./TeacherClassService.js";
import type { TeacherContentClassAccessService } from "./TeacherContentClassAccessService.js";
import type { TeacherQuizService } from "./TeacherQuizService.js";

/**
 * Teacher-facing access management for student-visible content.
 */
export class StudentContentAccessService {
  public constructor(
    private readonly teacherClasses: TeacherClassService,
    private readonly teacherQuizzes: TeacherQuizService,
    private readonly chapters: ChapterService,
    private readonly contentClassAccess: TeacherContentClassAccessService
  ) {}

  public async listContentCatalog(): Promise<StudentContentCatalog> {
    const [chapters, quizzes] = await Promise.all([
      this.loadChaptersFromApi(),
      this.teacherQuizzes.listAccessibleQuizzes()
    ]);
    const publicQuizzes = this.mapQuizItems(quizzes, "public");
    const privateQuizzes = this.mapQuizItems(quizzes, "private");

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
    const overrides = await this.contentClassAccess.listClassAccess(item.kind, item.id);

    return classes.map((classroom) => ({
      classId: classroom.id,
      hasAccess: this.contentClassAccess.resolveClassAccess(
        item.kind,
        item.visibility,
        classroom.id,
        overrides
      )
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

    return this.contentClassAccess.resolveClassAccess(item.kind, item.visibility, classId, []);
  }

  public async setClassAccess(
    item: StudentContentItem,
    classId: number,
    hasAccess: boolean
  ): Promise<void> {
    const defaultAccess = this.contentClassAccess.resolveClassAccess(item.kind, item.visibility, classId, []);
    if (hasAccess === defaultAccess) {
      await this.contentClassAccess.removeClassAccess(item.kind, item.id, classId);
      return;
    }

    await this.contentClassAccess.setClassAccess(item.kind, item.id, classId, hasAccess);
  }

  private mapQuizItems(
    quizzes: Awaited<ReturnType<TeacherQuizService["listAccessibleQuizzes"]>>,
    visibility: "public" | "private"
  ): StudentContentItem[] {
    const sectionId = visibility === "public" ? "public_quizzes" : "private_quizzes";

    return quizzes
      .filter((quiz) => quiz.status === visibility)
      .map((quiz) => ({
        kind: "quiz" as const,
        sectionId,
        id: quiz.id,
        title: quiz.title,
        description: quiz.description ?? "",
        position: quiz.position ?? quiz.id,
        visibility,
        canManageAccess: true
      }));
  }

  private async loadChaptersFromApi(): Promise<StudentContentItem[]> {
    const chapters = await this.chapters.listChapters();

    return chapters.map((chapter) => ({
      kind: "chapter" as const,
      sectionId: "chapters" as const,
      id: chapter.id,
      title: chapter.title,
      description: chapter.statement ?? "",
      position: chapter.position,
      visibility: "public" as const,
      canManageAccess: true
    }));
  }
}
