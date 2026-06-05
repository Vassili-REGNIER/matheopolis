import type { User } from "./User.js";

export type ClassLevel =
  | "grade_6"
  | "grade_7"
  | "grade_8"
  | "grade_9"
  | "grade_10"
  | "grade_11"
  | "grade_12";

export interface Classroom {
  id: number;
  name: string;
  description: string | null;
  level?: ClassLevel | string | null;
  code: string | null;
  teacherId: number;
  createdAt: string;
  archivedAt?: string | null;
}

export interface ClassroomDetail {
  class: Classroom;
  teacher: User | null;
  students: User[];
}

export interface CreateClassRequest {
  name: string;
  description?: string | null;
  level?: string | null;
}

export interface UpdateClassRequest {
  name?: string;
  description?: string | null;
  level?: string | null;
}

export interface ClassEnvelopeData {
  class: Classroom;
}

export interface ClassListEnvelopeData {
  items: Classroom[];
}

export interface ClassDetailEnvelopeData {
  class: Classroom;
  teacher?: User | null;
  students?: User[];
}
