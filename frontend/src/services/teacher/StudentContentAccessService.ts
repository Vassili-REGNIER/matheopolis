import { unwrapEnvelope, type ApiEnvelope } from "../../models/ApiEnvelopes.js";
import type { ChapterListEnvelopeData } from "../../models/Chapter.js";
import type { Classroom } from "../../models/Class.js";
import type { QuizListEnvelopeData } from "../../models/Quiz.js";
import type {
  StudentContentClassAccessRow,
  StudentContentItem,
  StudentContentKind
} from "../../models/StudentContentAccess.js";
import type { ApiClient } from "../ApiClient.js";
import type { TeacherClassService } from "./TeacherClassService.js";
import type { TeacherQuizService } from "./TeacherQuizService.js";

type AccessOverrideMap = Record<string, boolean>;

/**
 * Central access-management facade for teacher content visibility per class.
 * Mock-backed today; swap the private *FromMock methods for API calls when endpoints are wired.
 */
export class StudentContentAccessService {
  private static readonly chapterListMockPath = "./public/mocks/api/puzzles.json";
  private static readonly quizListMockPath = "./public/mocks/api/quizzes/list.json";
  private readonly storageKey = "matheopolis.studentContentClassAccess";

  public constructor(
    private readonly api: ApiClient,
    private readonly teacherClasses: TeacherClassService,
    private readonly teacherQuizzes: TeacherQuizService
  ) {}

  public async listContentItems(): Promise<StudentContentItem[]> {
    const [chapters, quizzes] = await Promise.all([
      this.loadChaptersFromMock(),
      this.loadQuizzesFromMock()
    ]);

    return [...chapters, ...quizzes].sort((left, right) => left.position - right.position);
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
    const overrides = this.readOverrides();

    return classes.map((classroom) => ({
      classId: classroom.id,
      hasAccess: this.resolveClassAccess(item, classroom.id, overrides)
    }));
  }

  public isClassAccessEnabled(
    item: StudentContentItem,
    classId: number,
    overrides: AccessOverrideMap = this.readOverrides()
  ): boolean {
    return this.resolveClassAccess(item, classId, overrides);
  }

  public async setClassAccess(
    item: StudentContentItem,
    classId: number,
    hasAccess: boolean
  ): Promise<void> {
    await this.setClassAccessFromMock(item, classId, hasAccess);
    // TODO(api): chapters -> PUT /api/chapters/{id}/target-classes/{classId}
    // TODO(api): quizzes -> this.teacherQuizzes.setClassAccess(item.id, classId, hasAccess)
  }

  private async loadChaptersFromMock(): Promise<StudentContentItem[]> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<ChapterListEnvelopeData>>(
      StudentContentAccessService.chapterListMockPath
    );
    const items = unwrapEnvelope(envelope).items;

    return items.map((chapter) => ({
      kind: "chapter" as const,
      id: chapter.id,
      title: chapter.title,
      description: chapter.statement,
      position: chapter.position,
      visibility: "public" as const
    }));
  }

  private async loadQuizzesFromMock(): Promise<StudentContentItem[]> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<QuizListEnvelopeData>>(
      StudentContentAccessService.quizListMockPath
    );
    const items = unwrapEnvelope(envelope).items;

    return items.map((quiz) => ({
      kind: "quiz" as const,
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? "",
      position: quiz.position ?? quiz.id,
      visibility: quiz.status
    }));
  }

  private async setClassAccessFromMock(
    item: StudentContentItem,
    classId: number,
    hasAccess: boolean
  ): Promise<void> {
    const overrides = this.readOverrides();
    const key = this.overrideKey(item.kind, item.id, classId);
    const defaultAccess = this.defaultAccessFor(item);

    if (hasAccess === defaultAccess) {
      delete overrides[key];
    } else {
      overrides[key] = hasAccess;
    }

    this.writeOverrides(overrides);
  }

  private resolveClassAccess(
    item: StudentContentItem,
    classId: number,
    overrides: AccessOverrideMap
  ): boolean {
    const key = this.overrideKey(item.kind, item.id, classId);
    const override = overrides[key];
    if (override !== undefined) {
      return override;
    }

    return this.defaultAccessFor(item);
  }

  private defaultAccessFor(item: StudentContentItem): boolean {
    return item.visibility === "public";
  }

  private overrideKey(kind: StudentContentKind, contentId: number, classId: number): string {
    return `${kind}:${contentId}:${classId}`;
  }

  private readOverrides(): AccessOverrideMap {
    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === null) {
      return {};
    }

    try {
      return JSON.parse(raw) as AccessOverrideMap;
    } catch {
      window.localStorage.removeItem(this.storageKey);
      return {};
    }
  }

  private writeOverrides(overrides: AccessOverrideMap): void {
    window.localStorage.setItem(this.storageKey, JSON.stringify(overrides));
  }
}
