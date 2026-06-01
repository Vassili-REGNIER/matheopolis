import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
export class AuthService {
    api;
    currentUser = null;
    constructor(api) {
        this.api = api;
    }
    async login(request) {
        const envelope = await this.api.post("/api/auth/login", request);
        const data = unwrapEnvelope(envelope);
        this.setCurrentUser(data.user);
        return data.user;
    }
    async logout() {
        try {
            await this.api.post("/api/auth/logout");
        }
        finally {
            this.setCurrentUser(null);
            window.sessionStorage.removeItem("matheopolis.csrfToken");
        }
    }
    async getMe() {
        if (this.currentUser !== null) {
            return this.currentUser;
        }
        const localUser = this.readLocalUser();
        if (localUser !== null) {
            this.currentUser = localUser;
            return localUser;
        }
        try {
            const envelope = await this.api.get("/api/auth/me");
            const data = unwrapEnvelope(envelope);
            this.setCurrentUser(data.user);
            return data.user;
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return null;
            }
            throw error;
        }
    }
    async registerTeacher(request) {
        const envelope = await this.api.post("/api/users/teachers", request);
        const data = unwrapEnvelope(envelope);
        try {
            return await this.login({ identifier: request.email, password: request.password });
        }
        catch {
            this.setCurrentUser(data.user);
            return data.user;
        }
    }
    async registerStudent(request) {
        const envelope = await this.api.post("/api/users/students", request);
        const data = unwrapEnvelope(envelope);
        try {
            return await this.login({ identifier: request.username, password: request.password });
        }
        catch {
            this.setCurrentUser(data.user);
            return data.user;
        }
    }
    async registerFreeUser(request) {
        try {
            const envelope = await this.api.post("/api/users/free", request);
            const data = unwrapEnvelope(envelope);
            this.setCurrentUser(data.user);
            return data.user;
        }
        catch (error) {
            if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
                const user = this.makeLocalFreeUser(request);
                this.setCurrentUser(user);
                return user;
            }
            throw error;
        }
    }
    startGuestSession() {
        const user = {
            id: 0,
            firstName: "Mode",
            lastName: "Invite",
            username: "invite",
            email: null,
            role: "free_user",
            classId: null,
            createdAt: new Date().toISOString()
        };
        this.setCurrentUser(user);
        return user;
    }
    isLocalOnlyUser(user) {
        return user.role === "free_user" || user.id === 0;
    }
    setCurrentUser(user) {
        this.currentUser = user;
        if (user === null) {
            window.sessionStorage.removeItem("matheopolis.localUser");
        }
        else if (user.role === "free_user" || user.id === 0) {
            window.sessionStorage.setItem("matheopolis.localUser", JSON.stringify(user));
        }
        window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user } }));
    }
    readLocalUser() {
        const raw = window.sessionStorage.getItem("matheopolis.localUser");
        if (raw === null) {
            return null;
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            window.sessionStorage.removeItem("matheopolis.localUser");
            return null;
        }
    }
    makeLocalFreeUser(request) {
        return {
            id: 0,
            firstName: request.firstName,
            lastName: request.lastName,
            username: request.username,
            email: request.email ?? null,
            role: "free_user",
            classId: null,
            createdAt: new Date().toISOString()
        };
    }
}
