import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
import type {
  ChapterTargetClassEnvelopeData,
  ChapterTargetClassListEnvelopeData
} from "../../models/Chapter.js";
import type {
  QuizTargetClassEnvelopeData,
  QuizTargetClassListEnvelopeData
} from "../../models/Quiz.js";
import type { StudentContentVisibility } from "../../models/StudentContentAccess.js";
import type {
  ContentAccessKind,
  TargetClassEntry
} from "../../models/services/TeacherContentClassAccess.js";
import type { ApiClient } from "../ApiClient.js";

export class TeacherContentClassAccessService {
  private readonly cache = new Map<string, TargetClassEntry[]>();

  public constructor(private readonly api: ApiClient) {}

  public async listClassAccess(kind: ContentAccessKind, contentId: number): Promise<TargetClassEntry[]> {
    const key = this.cacheKey(kind, contentId);
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const envelope = await this.api.get<QuizTargetClassListEnvelopeData | ChapterTargetClassListEnvelopeData>(
      this.targetClassesEndpoint(kind, contentId)
    );
    const items = unwrapEnvelope(envelope).items;
    this.cache.set(key, items);

    return items;
  }

  public async setClassAccess(
    kind: ContentAccessKind,
    contentId: number,
    classId: number,
    isActive: boolean
  ): Promise<void> {
    await this.api.put<QuizTargetClassEnvelopeData | ChapterTargetClassEnvelopeData>(
      `${this.targetClassesEndpoint(kind, contentId)}/${classId}`,
      { isActive }
    );
    this.invalidateCache(kind, contentId);
  }

  public async removeClassAccess(kind: ContentAccessKind, contentId: number, classId: number): Promise<void> {
    await this.api.delete<null>(`${this.targetClassesEndpoint(kind, contentId)}/${classId}`);
    this.invalidateCache(kind, contentId);
  }

  public resolveClassAccess(
    kind: ContentAccessKind,
    visibility: StudentContentVisibility,
    classId: number,
    overrides: TargetClassEntry[]
  ): boolean {
    const override = overrides.find((entry) => entry.classId === classId);
    return override?.isActive ?? this.defaultAccess(kind, visibility);
  }

  public invalidateCache(kind: ContentAccessKind, contentId: number): void {
    this.cache.delete(this.cacheKey(kind, contentId));
  }

  private targetClassesEndpoint(kind: ContentAccessKind, contentId: number): string {
    return kind === "quiz"
      ? `/api/quizzes/${contentId}/target-classes`
      : `/api/chapters/${contentId}/target-classes`;
  }

  private defaultAccess(kind: ContentAccessKind, visibility: StudentContentVisibility): boolean {
    return kind === "chapter" || visibility === "public";
  }

  private cacheKey(kind: ContentAccessKind, contentId: number): string {
    return `${kind}:${contentId}`;
  }
}
