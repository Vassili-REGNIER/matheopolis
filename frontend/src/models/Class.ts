import type { User } from "./User.js";

export interface Classroom {
  id: number;
  name: string;
  description: string | null;
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
