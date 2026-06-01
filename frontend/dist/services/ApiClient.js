import { ApiError } from "../models/ApiEnvelopes.js";
import { isRecord, readString } from "../utils/dom.js";
const mockPuzzles = [
    {
        id: 999,
        slug: "matheopolis-quiz",
        title: "L'Histoire de Laurence",
        statement: "Testez vos connaissances sur le livre.",
        position: 0,
        isActive: true
    },
    {
        id: 0,
        slug: "base-conversion",
        title: "Conversion de base",
        statement: "Passez d'une base a l'autre.",
        position: 1,
        isActive: true
    },
    {
        id: 1,
        slug: "thales-ratio",
        title: "Theoreme de Thales",
        statement: "Triangles et proportionnalite.",
        position: 2,
        isActive: true
    },
    {
        id: 2,
        slug: "piano-fractions",
        title: "Fractions musicales",
        statement: "La lecon de piano de Pythagore.",
        position: 3,
        isActive: true
    }
];
export class ApiClient {
    baseUrl;
    mockMode;
    csrfToken;
    constructor() {
        const query = new URLSearchParams(window.location.search);
        this.mockMode = query.get("mock") === "1";
        this.baseUrl = (query.get("api") ?? "").replace(/\/$/, "");
        this.csrfToken = window.sessionStorage.getItem("matheopolis.csrfToken");
    }
    get(endpoint, queryParams) {
        return this.request(endpoint, { method: "GET" }, queryParams);
    }
    post(endpoint, body) {
        return this.request(endpoint, { method: "POST", body });
    }
    patch(endpoint, body) {
        return this.request(endpoint, { method: "PATCH", body });
    }
    delete(endpoint) {
        return this.request(endpoint, { method: "DELETE" });
    }
    async getStaticJson(path) {
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
        return await response.json();
    }
    isMockMode() {
        return this.mockMode;
    }
    async request(endpoint, options, queryParams) {
        if (this.mockMode && endpoint.startsWith("/api/")) {
            return this.mockRequest(endpoint, options);
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
                data: null,
                error: null
            };
        }
        const payload = await this.readJson(response);
        if (!this.isEnvelope(payload)) {
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
    buildUrl(endpoint, queryParams) {
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
    buildHeaders(options) {
        const headers = {
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
    async readJson(response) {
        try {
            return await response.json();
        }
        catch {
            throw new ApiError(response.status, {
                code: "INVALID_JSON",
                message: "The API returned invalid JSON."
            });
        }
    }
    isEnvelope(value) {
        if (!isRecord(value)) {
            return false;
        }
        return typeof value.success === "boolean" && "data" in value && "error" in value;
    }
    captureCsrfToken(data) {
        if (!isRecord(data)) {
            return;
        }
        const csrfToken = data.csrfToken;
        if (typeof csrfToken === "string" && csrfToken.length > 0) {
            this.csrfToken = csrfToken;
            window.sessionStorage.setItem("matheopolis.csrfToken", csrfToken);
        }
    }
    async mockRequest(endpoint, options) {
        const data = this.resolveMockData(endpoint, options);
        this.captureCsrfToken(data);
        return {
            success: true,
            data: data,
            error: null
        };
    }
    resolveMockData(endpoint, options) {
        if (endpoint === "/api/health" && options.method === "GET") {
            return {
                service: "matheopolis-frontend-mock",
                status: "ok",
                time: new Date().toISOString()
            };
        }
        if (endpoint === "/api/puzzles" && options.method === "GET") {
            return { items: mockPuzzles };
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
        if (endpoint === "/api/users/free" && options.method === "POST") {
            const user = this.userFromRegistration(options.body, "free_user");
            this.storeMockUser(user);
            return { user, csrfToken: "mock-csrf-token" };
        }
        const riddleMatch = endpoint.match(/^\/api\/riddles\/(\d+)\/(start|progress|attempt|complete)$/);
        if (riddleMatch !== null) {
            const riddleId = Number.parseInt(riddleMatch[1] ?? "0", 10);
            const action = riddleMatch[2] ?? "";
            return this.resolveMockRiddle(riddleId, action, options);
        }
        if (endpoint === "/api/classes" && options.method === "POST") {
            const classroom = this.createMockClass(options.body);
            return { class: classroom };
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
    toLoginRequest(body) {
        if (!isRecord(body)) {
            return { identifier: "", password: "" };
        }
        return {
            identifier: readString(body.identifier),
            password: readString(body.password)
        };
    }
    makeMockUser(identifier) {
        const lowered = identifier.toLowerCase();
        const role = lowered.includes("admin")
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
            createdAt: new Date().toISOString()
        };
    }
    userFromRegistration(body, role) {
        const source = isRecord(body) ? body : {};
        return {
            id: Math.floor(Date.now() / 1000),
            firstName: readString(source.firstName, role === "teacher" ? "Ada" : "Laurence"),
            lastName: readString(source.lastName, role === "teacher" ? "Noether" : "Guerney"),
            username: readString(source.username, `user-${Date.now()}`),
            email: readString(source.email) || null,
            role,
            classId: role === "student" ? 1 : null,
            createdAt: new Date().toISOString()
        };
    }
    storeMockUser(user) {
        window.sessionStorage.setItem("matheopolis.mockUser", JSON.stringify(user));
    }
    readMockUser() {
        const raw = window.sessionStorage.getItem("matheopolis.mockUser");
        if (raw === null) {
            return null;
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    resolveMockRiddle(riddleId, action, options) {
        const progress = this.readMockProgress(riddleId);
        if (action === "start" && options.method === "POST") {
            const started = {
                ...progress,
                status: "in_progress",
                startedAt: progress.startedAt ?? new Date().toISOString()
            };
            this.writeMockProgress(started);
            return { progress: started, playToken: `mock-token-${riddleId}` };
        }
        if (action === "progress" && options.method === "GET") {
            return { progress };
        }
        if (action === "attempt" && options.method === "POST") {
            const updated = {
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
                    playToken: `mock-token-${riddleId}-${updated.attemptCount}`
                }
            };
        }
        if (action === "complete" && options.method === "POST") {
            const completed = {
                ...progress,
                status: "completed",
                completedAt: new Date().toISOString(),
                lastAttemptAt: new Date().toISOString()
            };
            this.writeMockProgress(completed);
            return { progress: completed };
        }
        throw new ApiError(405, { code: "METHOD_NOT_ALLOWED", message: "Mock method not allowed." });
    }
    readMockProgress(riddleId) {
        const raw = window.localStorage.getItem(`matheopolis.mockProgress.${riddleId}`);
        if (raw !== null) {
            try {
                return JSON.parse(raw);
            }
            catch {
                window.localStorage.removeItem(`matheopolis.mockProgress.${riddleId}`);
            }
        }
        return {
            studentId: 10,
            riddleId,
            status: "not_started",
            attemptCount: 0,
            startedAt: null,
            completedAt: null,
            lastAttemptAt: null
        };
    }
    writeMockProgress(progress) {
        window.localStorage.setItem(`matheopolis.mockProgress.${progress.riddleId}`, JSON.stringify(progress));
    }
    createMockClass(body) {
        const source = isRecord(body) ? body : {};
        const classes = this.readMockClasses();
        const classroom = {
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
    resolveMockClass(endpoint, classId, options) {
        const classes = this.readMockClasses();
        const classroom = classes.find((item) => item.id === classId) ?? classes[0] ?? this.seedMockClasses()[0];
        if (classroom === undefined) {
            throw new ApiError(404, { code: "NOT_FOUND", message: "Class not found." });
        }
        if (endpoint.endsWith("/students/progress") && options.method === "GET") {
            const items = classroom.students.map((student, index) => ({
                user: student,
                startedRiddles: 2 + index,
                completedRiddles: index % 2 === 0 ? 2 : 1,
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
    readMockClasses() {
        const raw = window.localStorage.getItem("matheopolis.mockClasses");
        if (raw !== null) {
            try {
                return JSON.parse(raw);
            }
            catch {
                window.localStorage.removeItem("matheopolis.mockClasses");
            }
        }
        return this.seedMockClasses();
    }
    writeMockClasses(classes) {
        window.localStorage.setItem("matheopolis.mockClasses", JSON.stringify(classes));
    }
    seedMockClasses() {
        const students = [
            {
                id: 10,
                firstName: "Laurence",
                lastName: "Guerney",
                username: "laurence",
                email: null,
                role: "student",
                classId: 1,
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
                createdAt: new Date().toISOString()
            }
        ];
        const classes = [
            {
                id: 1,
                name: "Classe 6eme A",
                description: "Groupe pilote Matheopolis",
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
