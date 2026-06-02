export type UserRole = "admin" | "teacher" | "student" | "free_user";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string | null;
  role: UserRole;
  classId: number | null;
  createdAt: string;
}

export interface UserEnvelopeData {
  user: User;
  csrfToken?: string;
}

export interface UserListEnvelopeData {
  items: User[];
}

export function displayName(user: User): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName.length > 0 ? fullName : user.username;
}
