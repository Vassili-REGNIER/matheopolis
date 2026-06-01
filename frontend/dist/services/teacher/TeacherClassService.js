import { unwrapEnvelope } from "../../models/ApiEnvelopes.js";
export class TeacherClassService {
    api;
    cacheKey = "matheopolis.teacher.classes";
    constructor(api) {
        this.api = api;
    }
    listCachedClasses() {
        const raw = window.localStorage.getItem(this.cacheKey);
        if (raw === null) {
            return [];
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            window.localStorage.removeItem(this.cacheKey);
            return [];
        }
    }
    async createClass(request) {
        const envelope = await this.api.post("/api/classes", request);
        const classroom = unwrapEnvelope(envelope).class;
        this.rememberClass(classroom);
        return classroom;
    }
    async getClassDetails(classId) {
        const envelope = await this.api.get(`/api/classes/${classId}`);
        const data = unwrapEnvelope(envelope);
        return {
            class: data.class,
            teacher: data.teacher ?? null,
            students: data.students ?? []
        };
    }
    async updateClass(classId, request) {
        const envelope = await this.api.patch(`/api/classes/${classId}`, request);
        const classroom = unwrapEnvelope(envelope).class;
        this.rememberClass(classroom);
        return classroom;
    }
    async deleteClass(classId) {
        await this.api.delete(`/api/classes/${classId}`);
        this.writeCache(this.listCachedClasses().filter((item) => item.id !== classId));
    }
    async listStudents(classId) {
        const envelope = await this.api.get(`/api/classes/${classId}/students`);
        return unwrapEnvelope(envelope).items;
    }
    async listStudentsProgress(classId) {
        const envelope = await this.api.get(`/api/classes/${classId}/students/progress`);
        return unwrapEnvelope(envelope).items;
    }
    rememberClass(classroom) {
        const current = this.listCachedClasses();
        const next = [
            classroom,
            ...current.filter((item) => item.id !== classroom.id)
        ];
        this.writeCache(next);
    }
    writeCache(classes) {
        window.localStorage.setItem(this.cacheKey, JSON.stringify(classes));
    }
}
