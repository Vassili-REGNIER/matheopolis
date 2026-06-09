import { ApiError, type ApiEnvelope, type ApiErrorObject } from "../models/ApiEnvelopes.js";
import type { LoginRequest } from "../models/Auth.js";
import type { Classroom } from "../models/Class.js";
import type { Chapter } from "../models/Chapter.js";
import type {
  ChapterAttemptEnvelopeData,
  ChapterProgress,
  ChapterProgressEnvelopeData,
  ChapterStartEnvelopeData,
  StudentChapterProgressSummary
} from "../models/ChapterProgress.js";
import { chapterProgressFromApi } from "../models/ChapterProgress.js";
import type { CsvDownload, QueryValue, RequestOptions, StoredClassroom } from "../models/core/ApiClient.js";
import type { User, UserRole } from "../models/User.js";
import { isRecord, readString } from "../utils/dom.js";

const mockChapters: Chapter[] = [
  {
    id: 2,
    slug: "base-conversion",
    title: "Conversion de base",
    statement: "Passez d'une base a l'autre.",
    position: 2,
    isActive: true
  },
  {
    id: 1,
    slug: "piano-fractions",
    title: "Fractions musicales",
    statement: "La lecon de piano de Pythagore.",
    position: 1,
    isActive: true
  }
];

const academicDomains = [
  "ac-aix-marseille.fr",
  "ac-amiens.fr",
  "ac-besancon.fr",
  "ac-bordeaux.fr",
  "ac-caen.fr",
  "ac-clermont.fr",
  "ac-corse.fr",
  "ac-creteil.fr",
  "ac-dijon.fr",
  "ac-grenoble.fr",
  "ac-guadeloupe.fr",
  "ac-guyane.fr",
  "ac-reunion.fr",
  "ac-lille.fr",
  "ac-limoges.fr",
  "ac-lyon.fr",
  "ac-martinique.fr",
  "ac-mayotte.fr",
  "ac-montpellier.fr",
  "ac-nancy-metz.fr",
  "ac-nantes.fr",
  "ac-nice.fr",
  "ac-noumea.nc",
  "ac-orleans-tours.fr",
  "ac-paris.fr",
  "ac-poitiers.fr",
  "ac-polynesie.pf",
  "ac-reims.fr",
  "ac-rennes.fr",
  "ac-rouen.fr",
  "ac-spm.fr",
  "ac-strasbourg.fr",
  "ac-toulouse.fr",
  "ac-versailles.fr",
  "ac-wf.wf"
] as const;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly mockMode: boolean;
  private csrfToken: string | null;

  public constructor() {
    const query = new URLSearchParams(window.location.search);
    this.mockMode = query.get("mock") === "1";
    this.baseUrl = (query.get("api") ?? "").replace(/\/$/, "");
    this.csrfToken = window.sessionStorage.getItem("matheopolis.csrfToken");
  }

  public get<TData>(endpoint: string, queryParams?: Record<string, QueryValue>): Promise<ApiEnvelope<TData>> {
    return this.request<TData>(endpoint, { method: "GET" }, queryParams);
  }

  public post<TData>(endpoint: string, body?: object): Promise<ApiEnvelope<TData>> {
    return this.request<TData>(endpoint, { method: "POST", body });
  }

  public patch<TData>(endpoint: string, body: object): Promise<ApiEnvelope<TData>> {
    return this.request<TData>(endpoint, { method: "PATCH", body });
  }

  public put<TData>(endpoint: string, body: object): Promise<ApiEnvelope<TData>> {
    return this.request<TData>(endpoint, { method: "PUT", body });
  }

  public delete<TData>(endpoint: string): Promise<ApiEnvelope<TData>> {
    return this.request<TData>(endpoint, { method: "DELETE" });
  }

  public async getStaticJson<TData>(path: string): Promise<TData> {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new ApiError(response.status, {
        code: "STATIC_CONTENT_ERROR",
        message: `Unable to load static content at ${path}.`
      });
    }

    return await response.json() as TData;
  }

  public async postCsvDownload(endpoint: string, csvContent: string): Promise<CsvDownload> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      credentials: "include",
      headers: this.buildCsvHeaders(),
      body: csvContent
    });

    if (!response.ok) {
      const payload = await this.readJson(response);
      if (this.isEnvelope<unknown>(payload)) {
        throw new ApiError(response.status, payload.error ?? {
          code: "REQUEST_FAILED",
          message: "The request failed."
        });
      }

      throw new ApiError(response.status, {
        code: "REQUEST_FAILED",
        message: "The request failed."
      });
    }

    return {
      content: await response.text(),
      filename: this.readContentDispositionFilename(response) ?? "download.csv"
    };
  }

  public async getCsvDownload(endpoint: string, queryParams?: Record<string, QueryValue>): Promise<CsvDownload> {
    if (this.mockMode && endpoint.startsWith("/api/")) {
      return this.resolveMockCsvDownload(endpoint);
    }

    const response = await fetch(this.buildUrl(endpoint, queryParams), {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "text/csv"
      }
    });

    if (!response.ok) {
      const payload = await this.readJson(response);
      if (this.isEnvelope<unknown>(payload)) {
        throw new ApiError(response.status, payload.error ?? {
          code: "REQUEST_FAILED",
          message: "The request failed."
        });
      }

      throw new ApiError(response.status, {
        code: "REQUEST_FAILED",
        message: "The request failed."
      });
    }

    return {
      content: await response.text(),
      filename: this.readContentDispositionFilename(response) ?? "class-progress.csv"
    };
  }

  public isMockMode(): boolean {
    return this.mockMode;
  }

  private async request<TData>(
    endpoint: string,
    options: RequestOptions,
    queryParams?: Record<string, QueryValue>
  ): Promise<ApiEnvelope<TData>> {
    if (this.mockMode && endpoint.startsWith("/api/")) {
      return this.mockRequest<TData>(endpoint, options);
    }

    const response = await fetch(this.buildUrl(endpoint, queryParams), {
      method: options.method,
      credentials: "include",
      headers: this.buildHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    if (response.status === 204) {
      return {
        success: true,
        data: null as TData,
        error: null
      };
    }

    const payload = await this.readJson(response);
    if (!this.isEnvelope<TData>(payload)) {
      throw new ApiError(response.status, {
        code: "INVALID_RESPONSE",
        message: "The API returned an unexpected response shape."
      });
    }

    this.captureCsrfToken(payload.data);

    if (!response.ok || !payload.success) {
      throw new ApiError(response.status, payload.error ?? {
        code: "REQUEST_FAILED",
        message: "The request failed."
      });
    }

    return payload;
  }

  private buildUrl(endpoint: string, queryParams?: Record<string, QueryValue>): string {
    const url = `${this.baseUrl}${endpoint}`;
    if (queryParams === undefined) {
      return url;
    }

    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return query.length > 0 ? `${url}?${query}` : url;
  }

  private buildHeaders(options: RequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.method !== "GET" && this.csrfToken !== null) {
      headers["X-CSRF-Token"] = this.csrfToken;
    }

    return headers;
  }

  private buildCsvHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "text/csv",
      "Content-Type": "text/csv; charset=utf-8"
    };

    if (this.csrfToken !== null) {
      headers["X-CSRF-Token"] = this.csrfToken;
    }

    return headers;
  }

  private readContentDispositionFilename(response: Response): string | null {
    const header = response.headers.get("Content-Disposition");
    if (header === null) {
      return null;
    }

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8Match?.[1] !== undefined) {
      return decodeURIComponent(utf8Match[1].replaceAll("\"", ""));
    }

    const regularMatch = /filename="?([^";]+)"?/i.exec(header);
    return regularMatch?.[1] ?? null;
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json() as unknown;
    } catch {
      throw new ApiError(response.status, {
        code: "INVALID_JSON",
        message: "The API returned invalid JSON."
      });
    }
  }

  private isEnvelope<TData>(value: unknown): value is ApiEnvelope<TData> {
    if (!isRecord(value)) {
      return false;
    }

    return typeof value.success === "boolean" && "data" in value && "error" in value;
  }

  private captureCsrfToken(data: unknown): void {
    if (!isRecord(data)) {
      return;
    }

    const csrfToken = data.csrfToken;
    if (typeof csrfToken === "string" && csrfToken.length > 0) {
      this.csrfToken = csrfToken;
      window.sessionStorage.setItem("matheopolis.csrfToken", csrfToken);
    }
  }

  private async mockRequest<TData>(endpoint: string, options: RequestOptions): Promise<ApiEnvelope<TData>> {
    const data = this.resolveMockData(endpoint, options);
    this.captureCsrfToken(data);

    return {
      success: true,
      data: data as TData,
      error: null
    };
  }

  private resolveMockData(endpoint: string, options: RequestOptions): unknown {
    if (endpoint === "/api/health" && options.method === "GET") {
      return {
        service: "matheopolis-frontend-mock",
        status: "ok",
        time: new Date().toISOString()
      };
    }

    if (endpoint === "/api/puzzles" && options.method === "GET") {
      return { items: mockChapters };
    }

    if (endpoint === "/api/auth/login" && options.method === "POST") {
      const request = this.toLoginRequest(options.body);
      const user = this.makeMockUser(request.identifier);
      this.storeMockUser(user);
      return { user, csrfToken: "mock-csrf-token" };
    }

    if (endpoint === "/api/auth/me" && options.method === "GET") {
      const user = this.readMockUser();
      if (user === null) {
        throw new ApiError(401, { code: "AUTH_REQUIRED", message: "Authentication required." });
      }
      return { user, csrfToken: "mock-csrf-token" };
    }

    if (endpoint === "/api/auth/logout" && options.method === "POST") {
      window.sessionStorage.removeItem("matheopolis.mockUser");
      return null;
    }

    if (endpoint === "/api/users/teachers" && options.method === "POST") {
      const user = this.userFromRegistration(options.body, "teacher");
      this.storeMockUser(user);
      return { user, csrfToken: "mock-csrf-token" };
    }

    if (endpoint === "/api/users/students" && options.method === "POST") {
      const user = this.userFromRegistration(options.body, "student");
      this.storeMockUser(user);
      return { user, csrfToken: "mock-csrf-token" };
    }

    if (endpoint === "/api/users" && options.method === "POST") {
      const source = isRecord(options.body) ? options.body : {};
      const role: UserRole = this.isAcademicEmail(readString(source.email)) ? "teacher" : "free_user";
      const user = this.userFromRegistration(options.body, role);
      this.storeMockUser(user);
      return { user, csrfToken: "mock-csrf-token" };
    }

    const chapterMatch = endpoint.match(/^\/api\/riddles\/(\d+)\/(start|progress|attempt|complete)$/);
    if (chapterMatch !== null) {
      const chapterId = Number.parseInt(chapterMatch[1] ?? "0", 10);
      const action = chapterMatch[2] ?? "";
      return this.resolveMockChapter(chapterId, action, options);
    }

    if (endpoint === "/api/classes" && options.method === "GET") {
      const classes = this.readMockClasses().map((classroom) => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        code: classroom.code,
        teacherId: classroom.teacherId,
        createdAt: classroom.createdAt,
        archivedAt: classroom.archivedAt ?? null
      }));
      return { items: classes };
    }

    if (endpoint === "/api/classes" && options.method === "POST") {
      const classroom = this.createMockClass(options.body);
      return { class: classroom };
    }

    const studentActionMatch = endpoint.match(/^\/api\/classes\/(\d+)\/students\/(\d+)(?:\/reset-password)?$/);
    if (studentActionMatch !== null) {
      return this.resolveMockStudentAction(
        endpoint,
        Number.parseInt(studentActionMatch[1] ?? "0", 10),
        Number.parseInt(studentActionMatch[2] ?? "0", 10),
        options
      );
    }

    const classMatch = endpoint.match(/^\/api\/classes\/(\d+)(?:\/students(?:\/progress)?)?$/);
    if (classMatch !== null) {
      return this.resolveMockClass(endpoint, Number.parseInt(classMatch[1] ?? "0", 10), options);
    }

    throw new ApiError(404, {
      code: "NOT_FOUND",
      message: `Mock route not found: ${endpoint}.`
    });
  }

  private resolveMockCsvDownload(endpoint: string): CsvDownload {
    const match = endpoint.match(/^\/api\/classes\/(\d+)\/students\/progress\/export$/);
    if (match === null) {
      throw new ApiError(404, {
        code: "NOT_FOUND",
        message: `Mock route not found: ${endpoint}.`
      });
    }

    const classId = Number.parseInt(match[1] ?? "0", 10);
    const classroom = this.readMockClasses().find((item) => item.id === classId);
    if (classroom === undefined) {
      throw new ApiError(404, { code: "NOT_FOUND", message: "Class not found." });
    }

    const rows = [
      ["nom", "prenom", "identifiant", "progression_totale"],
      ...classroom.students.map((student, index) => [
        student.lastName,
        student.firstName,
        student.username,
        index % 2 === 0 ? "100%" : "50%"
      ])
    ];

    return {
      content: rows.map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(",")).join("\n"),
      filename: `class-${classId}-progress-overview.csv`
    };
  }

  private escapeCsvValue(value: string): string {
    if (!/[",\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  private toLoginRequest(body: object | undefined): LoginRequest {
    if (!isRecord(body)) {
      return { identifier: "", password: "" };
    }

    return {
      identifier: readString(body.identifier),
      password: readString(body.password)
    };
  }

  private makeMockUser(identifier: string): User {
    const lowered = identifier.toLowerCase();
    const role: UserRole = lowered.includes("admin")
      ? "admin"
      : lowered.includes("@ac-") || lowered.includes("prof") || lowered.includes("teacher")
        ? "teacher"
        : "student";

    return {
      id: role === "teacher" ? 20 : role === "admin" ? 1 : 10,
      firstName: role === "teacher" ? "Ada" : role === "admin" ? "Admin" : "Laurence",
      lastName: role === "teacher" ? "Noether" : role === "admin" ? "Matheopolis" : "Guerney",
      username: identifier.includes("@") ? identifier.split("@")[0] ?? identifier : identifier,
      email: identifier.includes("@") ? identifier : null,
      role,
      classId: role === "student" ? 1 : null,
      className: role === "student" ? "Classe 6eme A" : null,
      createdAt: new Date().toISOString()
    };
  }

  private userFromRegistration(body: object | undefined, role: UserRole): User {
    const source = isRecord(body) ? body : {};
    const firstName = readString(source.firstName, role === "teacher" ? "Ada" : "Laurence");
    const lastName = readString(source.lastName, role === "teacher" ? "Noether" : "Guerney");

    return {
      id: Math.floor(Date.now() / 1000),
      firstName,
      lastName,
      username: this.generateMockUsername(firstName, lastName),
      email: readString(source.email) || null,
      role,
      classId: role === "student" ? 1 : null,
      className: role === "student" ? "Classe 6eme A" : null,
      createdAt: new Date().toISOString()
    };
  }

  private generateMockUsername(firstName: string, lastName: string): string {
    const firstPart = this.normalizeUsernamePart(firstName);
    const lastPart = this.normalizeUsernamePart(lastName);
    const base = firstPart !== "" && lastPart !== ""
      ? `${firstPart}.${lastPart}`
      : firstPart !== ""
        ? firstPart
        : lastPart;

    return `${base.length >= 2 ? base : "user"}1`;
  }

  private normalizeUsernamePart(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  private isAcademicEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split("@")[1] ?? "";
    if (domain === "") {
      return false;
    }

    const normalizedDomain = domain.startsWith("www.") ? domain.slice(4) : domain;

    return academicDomains.includes(normalizedDomain as typeof academicDomains[number]);
  }

  private storeMockUser(user: User): void {
    window.sessionStorage.setItem("matheopolis.mockUser", JSON.stringify(user));
  }

  private readMockUser(): User | null {
    const raw = window.sessionStorage.getItem("matheopolis.mockUser");
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private resolveMockChapter(chapterId: number, action: string, options: RequestOptions): unknown {
    const progress = this.readMockProgress(chapterId);

    if (action === "start" && options.method === "POST") {
      const started: ChapterProgress = {
        ...progress,
        status: "in_progress",
        startedAt: progress.startedAt ?? new Date().toISOString()
      };
      this.writeMockProgress(started);
      return { progress: started, playToken: `mock-token-${chapterId}` } satisfies ChapterStartEnvelopeData;
    }

    if (action === "progress" && options.method === "GET") {
      return { progress } satisfies ChapterProgressEnvelopeData;
    }

    if (action === "attempt" && options.method === "POST") {
      const updated: ChapterProgress = {
        ...progress,
        status: "in_progress",
        attemptCount: progress.attemptCount + 1,
        lastAttemptAt: new Date().toISOString()
      };
      this.writeMockProgress(updated);
      return {
        attempt: {
          isCorrect: true,
          progress: updated,
          playToken: `mock-token-${chapterId}-${updated.attemptCount}`
        }
      } satisfies ChapterAttemptEnvelopeData;
    }

    if (action === "complete" && options.method === "POST") {
      const completed: ChapterProgress = {
        ...progress,
        status: "completed",
        completedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString()
      };
      this.writeMockProgress(completed);
      return { progress: completed } satisfies ChapterProgressEnvelopeData;
    }

    throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
  }

  private readMockProgress(chapterId: number): ChapterProgress {
    const keys = [
      `matheopolis.mockChapterProgress.${chapterId}`,
      `matheopolis.mockProgress.${chapterId}`
    ];

    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        continue;
      }

      try {
        return chapterProgressFromApi(JSON.parse(raw) as ChapterProgress & { riddleId?: number });
      } catch {
        window.localStorage.removeItem(key);
      }
    }

    return {
      studentId: 10,
      chapterId,
      status: "not_started",
      attemptCount: 0,
      startedAt: null,
      completedAt: null,
      lastAttemptAt: null
    };
  }

  private writeMockProgress(progress: ChapterProgress): void {
    window.localStorage.setItem(
      `matheopolis.mockChapterProgress.${progress.chapterId}`,
      JSON.stringify(progress)
    );
  }

  private createMockClass(body: object | undefined): Classroom {
    const source = isRecord(body) ? body : {};
    const classes = this.readMockClasses();
    const classroom: StoredClassroom = {
      id: Date.now(),
      name: readString(source.name, "Classe sans nom"),
      description: readString(source.description) || null,
      code: `CLS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      teacherId: 20,
      createdAt: new Date().toISOString(),
      archivedAt: null,
      students: []
    };
    classes.push(classroom);
    this.writeMockClasses(classes);
    return classroom;
  }

  private resolveMockClass(endpoint: string, classId: number, options: RequestOptions): unknown {
    const classes = this.readMockClasses();
    const classroom = classes.find((item) => item.id === classId) ?? classes[0] ?? this.seedMockClasses()[0];
    if (classroom === undefined) {
      throw new ApiError(404, { code: "NOT_FOUND", message: "Class not found." });
    }

    if (endpoint.endsWith("/students/progress") && options.method === "GET") {
      const items: StudentChapterProgressSummary[] = classroom.students.map((student, index) => ({
        user: student,
        startedChapters: 2 + index,
        completedChapters: index % 2 === 0 ? 2 : 1,
        completionRate: index % 2 === 0 ? 100 : 50,
        lastActivityAt: new Date().toISOString()
      }));
      return { items };
    }

    if (endpoint.endsWith("/students") && options.method === "GET") {
      return { items: classroom.students };
    }

    if (options.method === "GET") {
      return {
        class: classroom,
        teacher: this.makeMockUser("prof@ac-paris.fr"),
        students: classroom.students
      };
    }

    if (options.method === "PATCH") {
      const source = isRecord(options.body) ? options.body : {};
      const updated = classes.map((item) => item.id === classroom.id ? {
        ...item,
        name: readString(source.name, item.name),
        description: "description" in source ? readString(source.description) : item.description
      } : item);
      this.writeMockClasses(updated);
      const updatedClass = updated.find((item) => item.id === classroom.id) ?? classroom;
      return { class: updatedClass };
    }

    if (options.method === "DELETE") {
      this.writeMockClasses(classes.filter((item) => item.id !== classroom.id));
      return null;
    }

    throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
  }

  private resolveMockStudentAction(endpoint: string, classId: number, studentId: number, options: RequestOptions): unknown {
    const classes = this.readMockClasses();
    const classroom = classes.find((item) => item.id === classId);
    if (classroom === undefined || classroom.students.every((student) => student.id !== studentId)) {
      throw new ApiError(404, { code: "NOT_FOUND", message: "Student not found in this class." });
    }

    if (endpoint.endsWith("/reset-password") && options.method === "POST") {
      return { password: Math.random().toString(36).slice(2, 14).padEnd(12, "x") };
    }

    if (options.method === "DELETE") {
      this.writeMockClasses(classes.map((item) => item.id === classId
        ? { ...item, students: item.students.filter((student) => student.id !== studentId) }
        : item
      ));
      return null;
    }

    throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
  }

  private readMockClasses(): StoredClassroom[] {
    const raw = window.localStorage.getItem("matheopolis.mockClasses");
    if (raw !== null) {
      try {
        return JSON.parse(raw) as StoredClassroom[];
      } catch {
        window.localStorage.removeItem("matheopolis.mockClasses");
      }
    }

    return this.seedMockClasses();
  }

  private writeMockClasses(classes: StoredClassroom[]): void {
    window.localStorage.setItem("matheopolis.mockClasses", JSON.stringify(classes));
  }

  private seedMockClasses(): StoredClassroom[] {
    const students: User[] = [
      {
        id: 10,
        firstName: "Laurence",
        lastName: "Guerney",
        username: "laurence",
        email: null,
        role: "student",
        classId: 1,
        className: "Classe 6eme A",
        createdAt: new Date().toISOString()
      },
      {
        id: 11,
        firstName: "Marc",
        lastName: "Dupont",
        username: "mdupont",
        email: null,
        role: "student",
        classId: 1,
        className: "Classe 6eme A",
        createdAt: new Date().toISOString()
      }
    ];

    const classes: StoredClassroom[] = [
      {
        id: 1,
        name: "Classe 6eme A",
        description: "Groupe pilote Matheopolis",
        level: "grade_6",
        code: "CLS-DEMO6A",
        teacherId: 20,
        createdAt: new Date().toISOString(),
        archivedAt: null,
        students
      }
    ];

    this.writeMockClasses(classes);
    return classes;
  }
}
