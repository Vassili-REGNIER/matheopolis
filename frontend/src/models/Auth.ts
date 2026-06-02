export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  password: string;
  classCode: string;
}

export interface CreateAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type RegisterMode = "join_class" | "signup";

export interface RegisterFormState {
  mode: RegisterMode;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  classCode: string;
}
