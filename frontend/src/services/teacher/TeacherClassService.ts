import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
import type {
  ClassDetailEnvelopeData,
  ClassEnvelopeData,
  ClassListEnvelopeData,
  Classroom,
  ClassroomDetail,
  CreateClassRequest,
  UpdateClassRequest
} from "../../models/Class.js";
import type {
  StudentChapterProgressListEnvelopeData,
  StudentChapterProgressSummary
} from "../../models/ChapterProgress.js";
import { studentChapterProgressFromApi } from "../../models/ChapterProgress.js";
import type { User, UserListEnvelopeData } from "../../models/User.js";
import type { ApiClient } from "../ApiClient.js";

export class TeacherClassService {
  private readonly cacheKey = "matheopolis.teacher.classes";

  public constructor(private readonly api: ApiClient) {}

  public listCachedClasses(): Classroom[] {
    const raw = window.localStorage.getItem(this.cacheKey);
    if (raw === null) {
      return [];
    }

    try {
      return JSON.parse(raw) as Classroom[];
    } catch {
      window.localStorage.removeItem(this.cacheKey);
      return [];
    }
  }

  public async listMyClasses(): Promise<Classroom[]> {
    const envelope = await this.api.get<ClassListEnvelopeData>("/api/classes");
    const items = unwrapEnvelope(envelope).items;
    this.writeCache(items);
    return items;
  }

  public async createClass(request: CreateClassRequest): Promise<Classroom> {
    const envelope = await this.api.post<ClassEnvelopeData>("/api/classes", request);
    const classroom = unwrapEnvelope(envelope).class;
    this.rememberClass(classroom);
    return classroom;
  }

  public async getClassDetails(classId: number): Promise<ClassroomDetail> {
    const envelope = await this.api.get<ClassDetailEnvelopeData>(`/api/classes/${classId}`);
    const data = unwrapEnvelope(envelope);
    return {
      class: data.class,
      teacher: data.teacher ?? null,
      students: data.students ?? []
    };
  }

  public async updateClass(classId: number, request: UpdateClassRequest): Promise<Classroom> {
    const envelope = await this.api.patch<ClassEnvelopeData>(`/api/classes/${classId}`, request);
    const classroom = unwrapEnvelope(envelope).class;
    this.rememberClass(classroom);
    return classroom;
  }

  public async deleteClass(classId: number): Promise<void> {
    await this.api.delete<null>(`/api/classes/${classId}`);
    this.writeCache(this.listCachedClasses().filter((item) => item.id !== classId));
  }

  public async listStudents(classId: number): Promise<User[]> {
    const envelope = await this.api.get<UserListEnvelopeData>(`/api/classes/${classId}/students`);
    return unwrapEnvelope(envelope).items;
  }

  public async listStudentsProgress(classId: number): Promise<StudentChapterProgressSummary[]> {
    const envelope = await this.api.get<StudentChapterProgressListEnvelopeData>(
      `/api/classes/${classId}/students/progress`
    );
    return unwrapEnvelope(envelope).items.map((item) => studentChapterProgressFromApi(item));
  }

  private rememberClass(classroom: Classroom): void {
    const current = this.listCachedClasses();
    const next = [
      classroom,
      ...current.filter((item) => item.id !== classroom.id)
    ];
    this.writeCache(next);
  }

  private writeCache(classes: Classroom[]): void {
    window.localStorage.setItem(this.cacheKey, JSON.stringify(classes));
  }
}
