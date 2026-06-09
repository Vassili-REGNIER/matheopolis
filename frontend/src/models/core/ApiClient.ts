import type { Classroom } from "../Class.js";
import type { User } from "../User.js";

export type QueryValue = string | number | boolean | null | undefined;
export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  method: HttpMethod;
  body?: object;
}

export interface CsvDownload {
  content: string;
  filename: string;
}

export interface StoredClassroom extends Classroom {
  students: User[];
}
