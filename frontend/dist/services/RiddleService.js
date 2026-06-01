import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
const fallbackPuzzles = [
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
        statement: "Passer d'une base a l'autre.",
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
        statement: "La lecon de piano.",
        position: 3,
        isActive: true
    }
];
export class RiddleService {
    api;
    auth;
    constructor(api, auth) {
        this.api = api;
        this.auth = auth;
    }
    async listPuzzles() {
        try {
            const envelope = await this.api.get("/api/puzzles");
            return unwrapEnvelope(envelope).items.sort((left, right) => left.position - right.position);
        }
        catch {
            return fallbackPuzzles;
        }
    }
    async startRiddle(riddleId) {
        const user = await this.auth.getMe();
        if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
            return this.startLocalRiddle(riddleId);
        }
        try {
            const envelope = await this.api.post(`/api/riddles/${riddleId}/start`);
            return unwrapEnvelope(envelope);
        }
        catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
                return this.startLocalRiddle(riddleId);
            }
            throw error;
        }
    }
    async getProgress(riddleId) {
        const user = await this.auth.getMe();
        if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
            return this.readLocalProgress(riddleId);
        }
        try {
            const envelope = await this.api.get(`/api/riddles/${riddleId}/progress`);
            return unwrapEnvelope(envelope).progress;
        }
        catch {
            return this.readLocalProgress(riddleId);
        }
    }
    async submitAttempt(riddleId, answer, playToken) {
        const user = await this.auth.getMe();
        if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
            const progress = this.readLocalProgress(riddleId);
            const updated = {
                ...progress,
                status: "in_progress",
                attemptCount: progress.attemptCount + 1,
                lastAttemptAt: new Date().toISOString()
            };
            this.writeLocalProgress(updated);
            return updated;
        }
        try {
            const envelope = await this.api.post(`/api/riddles/${riddleId}/attempt`, {
                answer,
                playToken
            });
            return unwrapEnvelope(envelope).attempt.progress;
        }
        catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
                const progress = this.readLocalProgress(riddleId);
                const updated = {
                    ...progress,
                    status: "in_progress",
                    attemptCount: progress.attemptCount + 1,
                    lastAttemptAt: new Date().toISOString()
                };
                this.writeLocalProgress(updated);
                return updated;
            }
            throw error;
        }
    }
    async completeRiddle(riddleId, playToken) {
        const user = await this.auth.getMe();
        if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
            return this.completeLocalRiddle(riddleId);
        }
        try {
            const envelope = await this.api.post(`/api/riddles/${riddleId}/complete`, {
                playToken
            });
            return unwrapEnvelope(envelope).progress;
        }
        catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
                return this.completeLocalRiddle(riddleId);
            }
            throw error;
        }
    }
    async submitScore(riddleId, score, playToken) {
        await this.submitAttempt(riddleId, String(score), playToken);
        return await this.completeRiddle(riddleId, playToken);
    }
    startLocalRiddle(riddleId) {
        const progress = this.readLocalProgress(riddleId);
        const updated = {
            ...progress,
            status: "in_progress",
            startedAt: progress.startedAt ?? new Date().toISOString()
        };
        this.writeLocalProgress(updated);
        return {
            progress: updated,
            playToken: `local-token-${riddleId}-${Date.now()}`
        };
    }
    completeLocalRiddle(riddleId) {
        const progress = this.readLocalProgress(riddleId);
        const completed = {
            ...progress,
            status: "completed",
            completedAt: new Date().toISOString(),
            lastAttemptAt: new Date().toISOString()
        };
        this.writeLocalProgress(completed);
        return completed;
    }
    readLocalProgress(riddleId) {
        const raw = window.localStorage.getItem(`matheopolis.progress.${riddleId}`);
        if (raw !== null) {
            try {
                return JSON.parse(raw);
            }
            catch {
                window.localStorage.removeItem(`matheopolis.progress.${riddleId}`);
            }
        }
        return {
            riddleId,
            studentId: 0,
            status: "not_started",
            attemptCount: 0,
            startedAt: null,
            completedAt: null,
            lastAttemptAt: null
        };
    }
    writeLocalProgress(progress) {
        window.localStorage.setItem(`matheopolis.progress.${progress.riddleId}`, JSON.stringify(progress));
    }
}
