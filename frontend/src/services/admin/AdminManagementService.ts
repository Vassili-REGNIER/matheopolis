import type { User } from "../../models/User.js";

export class AdminManagementService {
  public getTeachers(): Promise<User[]> {
    return Promise.resolve([]);
  }
}
