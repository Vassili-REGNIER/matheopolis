import { unwrapEnvelope } from "../models/ApiEnvelopes.js";
export class UserService {
    api;
    auth;
    constructor(api, auth) {
        this.api = api;
        this.auth = auth;
    }
    async getCurrentProfile() {
        return await this.auth.getMe();
    }
    async getUserProfile(userId) {
        const current = await this.auth.getMe();
        if (current !== null && (current.id === userId || this.auth.isLocalOnlyUser(current))) {
            return current;
        }
        const envelope = await this.api.get(`/api/users/${userId}`);
        return unwrapEnvelope(envelope).user;
    }
}
