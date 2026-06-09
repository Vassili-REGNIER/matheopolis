import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type {
  CreateAccountRequest,
  CreateStudentRequest,
  CreateTeacherRequest,
  LoginRequest
} from "../models/Auth.js";
import type { User, UserEnvelopeData } from "../models/User.js";
import type { ApiClient } from "./ApiClient.js";

export interface RegisterAccountResult {
  user: User;
  emailVerificationRequired: boolean;
}

export interface MessageEnvelopeData {
  message: string;
}

export class AuthService {
  private currentUser: User | null = null;

  public constructor(private readonly api: ApiClient) {}

  public async login(request: LoginRequest): Promise<User> {
    const envelope = await this.api.post<UserEnvelopeData>("/api/auth/login", request);
    const data = unwrapEnvelope(envelope);
    this.setCurrentUser(data.user);
    return data.user;
  }

  public async logout(): Promise<void> {
    try {
      await this.api.post<null>("/api/auth/logout");
    } finally {
      this.setCurrentUser(null);
      window.sessionStorage.removeItem("matheopolis.csrfToken");
    }
  }

  public async getMe(): Promise<User | null> {
    if (this.currentUser !== null) {
      return this.currentUser;
    }

    const localUser = this.readLocalUser();
    if (localUser !== null) {
      this.currentUser = localUser;
      return localUser;
    }

    try {
      const envelope = await this.api.get<UserEnvelopeData>("/api/auth/me");
      const data = unwrapEnvelope(envelope);
      this.setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  }

  public async registerTeacher(request: CreateTeacherRequest): Promise<RegisterAccountResult> {
    const envelope = await this.api.post<UserEnvelopeData>("/api/users/teachers", request);
    const data = unwrapEnvelope(envelope);

    return await this.completeRegistration(data.user, request.email, request.password);
  }

  public async registerStudent(request: CreateStudentRequest): Promise<User> {
    const envelope = await this.api.post<UserEnvelopeData>("/api/users/students", request);
    const data = unwrapEnvelope(envelope);
    return await this.login({ identifier: data.user.username, password: request.password });
  }

  public async registerAccount(request: CreateAccountRequest): Promise<RegisterAccountResult> {
    const envelope = await this.api.post<UserEnvelopeData>("/api/users", request);
    const data = unwrapEnvelope(envelope);

    return await this.completeRegistration(data.user, request.email, request.password);
  }

  public async requestPasswordReset(email: string): Promise<string> {
    const envelope = await this.api.post<MessageEnvelopeData>("/api/auth/forgot-password", { email });
    return unwrapEnvelope(envelope).message;
  }

  public async resetPassword(token: string, password: string): Promise<string> {
    const envelope = await this.api.post<MessageEnvelopeData>("/api/auth/reset-password", { token, password });
    return unwrapEnvelope(envelope).message;
  }

  public async verifyEmail(token: string): Promise<string> {
    const envelope = await this.api.post<MessageEnvelopeData>("/api/auth/verify-email", { token });
    return unwrapEnvelope(envelope).message;
  }

  public startGuestSession(): User {
    const user: User = {
      id: 0,
      firstName: "Mode",
      lastName: "Invite",
      username: "invite",
      email: null,
      role: "free_user",
      classId: null,
      className: null,
      createdAt: new Date().toISOString()
    };
    this.setCurrentUser(user);
    return user;
  }

  public endGuestSession(): void {
    const user = this.currentUser ?? this.readLocalUser();
    if (user !== null && this.isGuestUser(user)) {
      this.setCurrentUser(null);
    }
  }

  public isGuestUser(user: User): boolean {
    return user.id === 0
      && user.role === "free_user"
      && user.firstName === "Mode"
      && user.lastName === "Invite"
      && user.username === "invite"
      && user.email === null;
  }

  public isLocalOnlyUser(user: User): boolean {
    return user.id === 0;
  }

  private async completeRegistration(user: User, email: string, password: string): Promise<RegisterAccountResult> {
    try {
      const loggedInUser = await this.login({ identifier: email, password: password });
      return { user: loggedInUser, emailVerificationRequired: false };
    } catch (error) {
      if (error instanceof ApiError && error.codeName === "EMAIL_NOT_VERIFIED") {
        return { user, emailVerificationRequired: true };
      }

      throw error;
    }
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user === null) {
      window.sessionStorage.removeItem("matheopolis.localUser");
    } else if (user.id === 0) {
      window.sessionStorage.setItem("matheopolis.localUser", JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem("matheopolis.localUser");
    }
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user } }));
  }

  private readLocalUser(): User | null {
    const raw = window.sessionStorage.getItem("matheopolis.localUser");
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      window.sessionStorage.removeItem("matheopolis.localUser");
      return null;
    }
  }
}
