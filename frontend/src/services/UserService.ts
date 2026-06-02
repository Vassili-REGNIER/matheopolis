import { unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type { User, UserEnvelopeData } from "../models/User.js";
import type { ApiClient } from "./ApiClient.js";
import type { AuthService } from "./AuthService.js";

export class UserService {
  public constructor(
    private readonly api: ApiClient,
    private readonly auth: AuthService
  ) {}

  public async getCurrentProfile(): Promise<User | null> {
    return await this.auth.getMe();
  }

  public async getUserProfile(userId: number): Promise<User> {
    const current = await this.auth.getMe();
    if (current !== null && (current.id === userId || this.auth.isLocalOnlyUser(current))) {
      return current;
    }

    const envelope = await this.api.get<UserEnvelopeData>(`/api/users/${userId}`);
    return unwrapEnvelope(envelope).user;
  }
}
