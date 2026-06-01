import type { UserRole } from "./User.js";

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  classCode?: string | null;
}

export interface CreateFreeUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email?: string | null;
  password: string;
}

export interface RegisterFormState {
  role: Extract<UserRole, "teacher" | "student" | "free_user">;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  classCode: string;
}
