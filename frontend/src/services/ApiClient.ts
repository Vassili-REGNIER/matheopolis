import { ApiError, type ApiEnvelope, type ApiErrorObject } from "../models/ApiEnvelopes.js";
import type { LoginRequest } from "../models/Auth.js";
import type { Classroom } from "../models/Class.js";
import type { Chapter, ChapterDetail } from "../models/Chapter.js";
import type {
  ChapterProgress,
  ChapterProgressEnvelopeData,
  ChapterStartEnvelopeData,
  StudentChapterProgressDetail,
  StudentQuizProgressDetail,
  StudentChapterProgressSummary
} from "../models/ChapterProgress.js";
import { chapterProgressFromApi } from "../models/ChapterProgress.js";
import type { CsvDownload, QueryValue, RequestOptions, StoredClassroom } from "../models/core/ApiClient.js";
import type { GameStep, RiddleQuestion, RiddleStep } from "../models/GameConfig.js";
import type { QuizSummary } from "../models/Quiz.js";
import type { RiddleProgress, RiddleProgressEnvelopeData, RiddleResponseResultEnvelopeData } from "../models/Riddle.js";
import type { User, UserRole } from "../models/User.js";
import { getScenario } from "../features/GameEngine/configs/index.js";
import { isRecord, readString } from "../utils/dom.js";

const mockChapters: Chapter[] = [
  {
    id: 2,
    slug: "base-conversion",
    title: "Conversion de base",
    statement: "Passez d'une base à l'autre.",
    position: 2,
    isActive: true
  },
  {
    id: 1,
    slug: "piano-fractions",
    title: "Fractions musicales",
    statement: "La leçon de la gamme de Pythagore.",
    position: 1,
    isActive: true
  }
];

const mockQuizzes: QuizSummary[] = [
  {
    id: 1,
    type: "quiz",
    title: "Mission privée",
    description: "Questionnaire réservé à la classe.",
    status: "private",
    creatorId: 20,
    askAdmin: false,
    questionCount: 6,
    position: 1,
    createdAt: "2026-01-01T00:00:00Z",
    progress: {
      quizId: 1,
      status: "in_progress",
      attemptCount: 1,
      currentQuestionIndex: 3,
      startedAt: "2026-01-04T10:00:00Z",
      completedAt: null,
      lastScore: null,
      bestScore: null
    }
  },
  {
    id: 2,
    type: "quiz",
    title: "Quiz de démonstration",
    description: "Questionnaire public de démonstration.",
    status: "public",
    creatorId: 20,
    askAdmin: false,
    questionCount: 10,
    position: 2,
    createdAt: "2026-01-01T00:00:00Z",
    progress: {
      quizId: 2,
      status: "completed",
      attemptCount: 2,
      currentQuestionIndex: 10,
      startedAt: "2026-01-03T10:00:00Z",
      completedAt: "2026-01-03T10:20:00Z",
      lastScore: 8,
      bestScore: 8
    }
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
      return this.resolveMockCsvDownload(endpoint, queryParams);
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

    if (endpoint === "/api/chapters" && options.method === "GET") {
      return {
        items: mockChapters.map((chapter) => ({
          ...chapter,
          stepCount: getScenario(chapter.id)?.length ?? 0
        }))
      };
    }

    if (endpoint === "/api/quizzes" && options.method === "GET") {
      return { items: mockQuizzes };
    }

    const chapterMatch = endpoint.match(/^\/api\/chapters\/(\d+)(?:\/(start|progress|steps|complete))?$/);
    if (chapterMatch !== null) {
      const chapterId = Number.parseInt(chapterMatch[1] ?? "0", 10);
      const action = chapterMatch[2] ?? "detail";
      return this.resolveMockChapter(chapterId, action, options);
    }

    const riddleMatch = endpoint.match(/^\/api\/riddles\/(\d+)\/(start|progress|responses)$/);
    if (riddleMatch !== null) {
      const riddleId = Number.parseInt(riddleMatch[1] ?? "0", 10);
      const action = riddleMatch[2] ?? "";
      return this.resolveMockRiddle(riddleId, action, options);
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

  private resolveMockCsvDownload(endpoint: string, queryParams?: Record<string, QueryValue>): CsvDownload {
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

    const modeRaw = queryParams?.mode;
    const mode = (
      modeRaw === "chapter"
      || modeRaw === "quiz"
      || modeRaw === "quiz_public_detail"
      || modeRaw === "quiz_private_detail"
    ) ? modeRaw : "overview";
    const className = this.filenamePart(classroom.name);

    if (mode === "chapter") {
      return {
        content: this.buildMockCsv([
          ["Nom", "Prénom", "Pseudo", "Nom de l'énigme", "Progression", "Meilleur score", "Score maximal faisable", "Nombre de tentatives"],
          ...classroom.students.map((student, index) => [
            student.lastName,
            student.firstName,
            student.username,
            "Énigme challenge",
            index % 2 === 0 ? "Terminé" : "Non commencé",
            index % 2 === 0 ? "100" : "0",
            "100",
            index % 2 === 0 ? "1" : "0"
          ])
        ]),
        filename: `Detail-Chapitre-${className}-Chapitre.csv`
      };
    }

    if (mode === "quiz") {
      return {
        content: this.buildMockCsv([
          ["Nom", "Prénom", "Pseudo", "Nom du quiz", "Visibilité", "Progression", "Meilleure tentative", "Nombre de questions", "Nombre de tentatives"],
          ...classroom.students.map((student, index) => [
            student.lastName,
            student.firstName,
            student.username,
            "Quiz de démonstration",
            "Public",
            index % 2 === 0 ? "Terminé" : "Non commencé",
            index % 2 === 0 ? "8" : "0",
            "10",
            index % 2 === 0 ? "2" : "0"
          ])
        ]),
        filename: `Quiz-${className}.csv`
      };
    }

    if (mode === "quiz_public_detail" || mode === "quiz_private_detail") {
      const filenameVisibility = mode === "quiz_public_detail" ? "Public" : "Prive";

      return {
        content: this.buildMockCsv([
          [
            "Nom",
            "Prénom",
            "Pseudo",
            "Progression",
            "Meilleure tentative",
            "Nombre de questions",
            "Nombre de tentatives"
          ],
          ...classroom.students.map((student, index) => [
            student.lastName,
            student.firstName,
            student.username,
            index % 2 === 0 ? "Terminé" : "Non commencé",
            index % 2 === 0 ? "8" : "0",
            "10",
            index % 2 === 0 ? "2" : "0"
          ])
        ]),
        filename: `Detail-Quiz-${filenameVisibility}-${className}-Quiz.csv`
      };
    }

    const rows = [
      ["Nom", "Prénom", "Pseudo", "Nom du chapitre", "Progression", "Meilleur score", "Score maximal faisable", "Progression totale"],
      ...classroom.students.map((student, index) => [
        student.lastName,
        student.firstName,
        student.username,
        "Fractions musicales",
        index % 2 === 0 ? "Terminé" : "En cours",
        index % 2 === 0 ? "100" : "0",
        "100",
        index % 2 === 0 ? "100%" : "50%"
      ])
    ];

    return {
      content: this.buildMockCsv(rows),
      filename: `Chapitres-${className}.csv`
    };
  }

  private buildMockCsv(rows: string[][]): string {
    return `\uFEFF${rows.map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(";")).join("\n")}`;
  }

  private escapeCsvValue(value: string): string {
    if (!/[",;\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  private filenamePart(value: string): string {
    const normalized = value.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return normalized.length > 0 ? normalized : "export";
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
      lastName: role === "teacher" ? "Noether" : role === "admin" ? "Mathéopolis" : "Guerney",
      username: identifier.includes("@") ? identifier.split("@")[0] ?? identifier : identifier,
      email: identifier.includes("@") ? identifier : null,
      role,
      classId: role === "student" ? 1 : null,
      className: role === "student" ? "Classe 6e A" : null,
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
      className: role === "student" ? "Classe 6e A" : null,
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
    const chapter = mockChapters.find((item) => item.id === chapterId);
    if (chapter === undefined) {
      throw new ApiError(404, { code: "NOT_FOUND", message: "Chapter not found." });
    }

    if (action === "detail" && options.method === "GET") {
      const scenario = getScenario(chapterId);
      if (scenario === null) {
        throw new ApiError(404, { code: "NOT_FOUND", message: "Chapter scenario not found." });
      }

      return {
        ...chapter,
        type: "narrative",
        stepCount: scenario.length,
        scenario: {
          steps: this.toMockApiScenario(chapterId, scenario)
        },
        progress: this.readMockProgress(chapterId)
      } satisfies ChapterDetail;
    }

    const progress = this.readMockProgress(chapterId);

    if (action === "start" && options.method === "POST") {
      const started: ChapterProgress = {
        ...progress,
        status: "in_progress",
        currentStepIndex: progress.status === "completed" ? 0 : progress.currentStepIndex,
        score: progress.status === "completed" ? null : progress.score,
        startedAt: progress.status === "completed" ? new Date().toISOString() : (progress.startedAt ?? new Date().toISOString()),
        completedAt: progress.status === "completed" ? null : progress.completedAt
      };
      this.writeMockProgress(started);
      return { progress: started, playToken: `mock-token-${chapterId}` } satisfies ChapterStartEnvelopeData;
    }

    if (action === "progress" && options.method === "GET") {
      return { progress } satisfies ChapterProgressEnvelopeData;
    }

    if (action === "steps" && options.method === "POST") {
      const source = isRecord(options.body) ? options.body : {};
      const currentStepIndex = typeof source.currentStepIndex === "number" ? source.currentStepIndex : -1;
      const scenario = getScenario(chapterId);
      if (scenario === null || currentStepIndex < 0 || currentStepIndex >= scenario.length) {
        throw new ApiError(422, { code: "VALIDATION_ERROR", message: "currentStepIndex is invalid." });
      }

      const updated: ChapterProgress = {
        ...progress,
        currentStepIndex
      };
      this.writeMockProgress(updated);
      return { progress: updated } satisfies ChapterProgressEnvelopeData;
    }

    if (action === "complete" && options.method === "POST") {
      const source = isRecord(options.body) ? options.body : {};
      if (source.score !== undefined && typeof source.score !== "number") {
        throw new ApiError(422, { code: "VALIDATION_ERROR", message: "score must be numeric." });
      }
      if (typeof source.score === "number" && (source.score < 0 || source.score > 100)) {
        throw new ApiError(422, { code: "VALIDATION_ERROR", message: "score must be between 0 and 100." });
      }
      const score = typeof source.score === "number" ? source.score : progress.score;
      const completed: ChapterProgress = {
        ...progress,
        status: "completed",
        score,
        completedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString()
      };
      this.writeMockProgress(completed);
      return { progress: completed } satisfies ChapterProgressEnvelopeData;
    }

    throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
  }

  private resolveMockRiddle(riddleId: number, action: string, options: RequestOptions): unknown {
    const riddle = this.findMockRiddle(riddleId);
    if (riddle === null) {
      throw new ApiError(404, { code: "NOT_FOUND", message: "Riddle not found." });
    }

    if (action === "start" && options.method === "POST") {
      const progress = this.readMockRiddleProgress(riddleId);
      if (progress.status !== "in_progress") {
        this.writeMockRiddleMistakes(riddleId, 0);
      }
      const started: RiddleProgress = {
        ...progress,
        status: "in_progress",
        currentQuestionIndex: progress.status === "completed" ? 0 : progress.currentQuestionIndex,
        attemptCount: progress.status === "completed" ? progress.attemptCount + 1 : progress.attemptCount,
        score: progress.status === "completed" ? null : progress.score,
        completedAt: progress.status === "completed" ? null : progress.completedAt,
        startedAt: progress.status === "completed" ? new Date().toISOString() : (progress.startedAt ?? new Date().toISOString())
      };
      this.writeMockRiddleProgress(started);
      return { progress: started } satisfies RiddleProgressEnvelopeData;
    }

    if (action === "progress" && options.method === "GET") {
      return { progress: this.readMockRiddleProgress(riddleId) } satisfies RiddleProgressEnvelopeData;
    }

    if (action === "responses" && options.method === "POST") {
      const source = isRecord(options.body) ? options.body : {};
      const answer = readString(source.answer);
      const questionIndex = typeof source.questionIndex === "number"
        ? source.questionIndex
        : this.readMockRiddleProgress(riddleId).currentQuestionIndex;
      const question = riddle.questions[questionIndex];
      const isCorrect = question?.answer !== undefined
        && this.normalizeMockAnswer(question.answer) === this.normalizeMockAnswer(answer);
      const currentProgress = this.readMockRiddleProgress(riddleId);
      const nextIndex = isCorrect
        ? Math.min(questionIndex + 1, riddle.questions.length)
        : currentProgress.currentQuestionIndex;
      const previousMistakes = questionIndex < currentProgress.currentQuestionIndex
        ? 0
        : this.readMockRiddleMistakes(riddleId);
      const mistakes = previousMistakes + (isCorrect ? 0 : 1);
      const progress: RiddleProgress = {
        ...currentProgress,
        status: nextIndex >= riddle.questions.length ? "completed" : "in_progress",
        currentQuestionIndex: nextIndex,
        attemptCount: currentProgress.attemptCount + 1,
        score: this.computeMockMistakeScore(nextIndex, mistakes),
        completedAt: nextIndex >= riddle.questions.length ? new Date().toISOString() : currentProgress.completedAt,
        startedAt: currentProgress.startedAt ?? new Date().toISOString()
      };
      this.writeMockRiddleMistakes(riddleId, mistakes);
      this.writeMockRiddleProgress(progress);
      return { isCorrect, progress } satisfies RiddleResponseResultEnvelopeData;
    }

    throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
  }

  private toMockApiScenario(chapterId: number, scenario: GameStep[]): GameStep[] {
    let riddleIndex = 0;
    return scenario.map((step) => {
      if (step.type !== "riddle") {
        return step;
      }

      riddleIndex += 1;
      const riddleId = this.toMockRiddleId(chapterId, riddleIndex);
      const questions = step.questions.map((question, index) => ({
        id: riddleId * 100 + index,
        question: question.question,
        difficulty: question.difficulty,
        metadata: question.metadata
      }));

      return {
        ...step,
        riddleId,
        questions,
        gameParams: {
          ...(step.gameParams ?? {}),
          questions
        }
      };
    });
  }

  private findMockRiddle(riddleId: number): RiddleStep | null {
    const chapterId = Math.floor(riddleId / 100);
    const riddlePosition = riddleId % 100;
    const scenario = getScenario(chapterId);
    if (scenario === null) {
      return null;
    }

    const riddles = scenario.filter((step): step is RiddleStep => step.type === "riddle");
    return riddles[riddlePosition - 1] ?? null;
  }

  private toMockRiddleId(chapterId: number, riddleIndex: number): number {
    return chapterId * 100 + riddleIndex;
  }

  private normalizeMockAnswer(answer: string): string {
    return answer.trim().toUpperCase();
  }

  private computeMockMistakeScore(completedUnits: number, mistakes: number): number {
    if (mistakes === 0) {
      return 100;
    }
    if (completedUnits === 0) {
      return 0;
    }

    return Math.round((completedUnits / (completedUnits + mistakes)) * 100);
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
      userId: 10,
      chapterId,
      status: "not_started",
      currentStepIndex: 0,
      score: null,
      startedAt: null,
      completedAt: null
    };
  }

  private writeMockProgress(progress: ChapterProgress): void {
    window.localStorage.setItem(
      `matheopolis.mockChapterProgress.${progress.chapterId}`,
      JSON.stringify(progress)
    );
  }

  private readMockRiddleProgress(riddleId: number): RiddleProgress {
    const raw = window.localStorage.getItem(`matheopolis.mockRiddleProgress.${riddleId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw) as RiddleProgress;
      } catch {
        window.localStorage.removeItem(`matheopolis.mockRiddleProgress.${riddleId}`);
      }
    }

    return {
      riddleId,
      userId: 10,
      status: "not_started",
      currentQuestionIndex: 0,
      attemptCount: 0,
      score: null,
      startedAt: null,
      completedAt: null
    };
  }

  private writeMockRiddleProgress(progress: RiddleProgress): void {
    window.localStorage.setItem(
      `matheopolis.mockRiddleProgress.${progress.riddleId}`,
      JSON.stringify(progress)
    );
  }

  private readMockRiddleMistakes(riddleId: number): number {
    const raw = window.localStorage.getItem(`matheopolis.mockRiddleMistakes.${riddleId}`);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private writeMockRiddleMistakes(riddleId: number, mistakes: number): void {
    window.localStorage.setItem(
      `matheopolis.mockRiddleMistakes.${riddleId}`,
      String(Math.max(0, mistakes))
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
      const items: StudentChapterProgressSummary[] = classroom.students.map((student, index) => {
        const chapterProgress: StudentChapterProgressDetail[] = mockChapters.map((chapter, chapterIndex) => {
          const stepCount = getScenario(chapter.id)?.length ?? 0;
          const isCompleted = index % 2 === 0 || chapterIndex === 0;
          const currentStepIndex = isCompleted ? stepCount : Math.min(2, stepCount);

          return {
            chapterId: chapter.id,
            title: chapter.title,
            status: isCompleted ? "completed" : "in_progress",
            percent: isCompleted ? 100 : stepCount === 0 ? 0 : Math.round((currentStepIndex / stepCount) * 100),
            currentStepIndex,
            stepCount,
            score: isCompleted ? 100 : null,
            startedAt: new Date().toISOString(),
            completedAt: isCompleted ? new Date().toISOString() : null
          };
        });
        const quizProgress: StudentQuizProgressDetail[] = mockQuizzes.map((quiz, quizIndex) => {
          const isCompleted = index % 2 === 0 && quizIndex === 1;
          const isInProgress = quiz.status === "private";
          const status = isCompleted ? "completed" : isInProgress ? "in_progress" : "not_started";
          const currentQuestionIndex = isCompleted
            ? quiz.questionCount
            : isInProgress
              ? Math.min(3, quiz.questionCount)
              : 0;

          return {
            quizId: quiz.id,
            title: quiz.title,
            visibility: quiz.status,
            status,
            percent: isCompleted
              ? 100
              : quiz.questionCount === 0
                ? 0
                : Math.round((currentQuestionIndex / quiz.questionCount) * 100),
            currentQuestionIndex,
            questionCount: quiz.questionCount,
            score: isCompleted ? 8 : null,
            attemptCount: isCompleted ? 2 : isInProgress ? 1 : 0,
            startedAt: isCompleted || isInProgress ? new Date().toISOString() : null,
            completedAt: isCompleted ? new Date().toISOString() : null
          };
        });
        const percentages = [...chapterProgress, ...quizProgress].map((item) => item.percent);
        const startedChapters = chapterProgress.filter((item) => item.status !== "not_started").length;
        const completedChapters = chapterProgress.filter((item) => item.status === "completed").length;
        const startedQuizzes = quizProgress.filter((item) => item.status !== "not_started").length;
        const completedQuizzes = quizProgress.filter((item) => item.status === "completed").length;

        return {
          user: student,
          startedChapters,
          completedChapters,
          totalChapters: mockChapters.length,
          startedQuizzes,
          completedQuizzes,
          totalQuizzes: mockQuizzes.length,
          startedItems: startedChapters + startedQuizzes,
          completedItems: completedChapters + completedQuizzes,
          totalItems: mockChapters.length + mockQuizzes.length,
          completionRate: percentages.length === 0
            ? 0
            : Math.round(percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length),
          lastActivityAt: new Date().toISOString(),
          chapterProgress,
          quizProgress
        };
      });
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
        className: "Classe 6e A",
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
        className: "Classe 6e A",
        createdAt: new Date().toISOString()
      }
    ];

    const classes: StoredClassroom[] = [
      {
        id: 1,
        name: "Classe 6e A",
        description: "Groupe pilote Mathéopolis",
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
