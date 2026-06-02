import { AdminManagementService } from "./admin/AdminManagementService.js";
import { AdminQuizValidationService } from "./admin/AdminQuizValidationService.js";
import { ApiClient } from "./ApiClient.js";
import { AuthService } from "./AuthService.js";
import { ContentService } from "./ContentService.js";
import { GameAccessService } from "./GameAccessService.js";
import { RiddleService } from "./RiddleService.js";
import { TeacherClassService } from "./teacher/TeacherClassService.js";
import { TeacherQuizService } from "./teacher/TeacherQuizService.js";
import { UserService } from "./UserService.js";

export interface AppServices {
  api: ApiClient;
  auth: AuthService;
  users: UserService;
  riddles: RiddleService;
  content: ContentService;
  gameAccess: GameAccessService;
  teacherClasses: TeacherClassService;
  teacherQuizzes: TeacherQuizService;
  adminManagement: AdminManagementService;
  adminQuizValidation: AdminQuizValidationService;
}

export function createAppServices(): AppServices {
  const api = new ApiClient();
  const auth = new AuthService(api);
  const gameAccess = new GameAccessService();

  return {
    api,
    auth,
    users: new UserService(api, auth),
    riddles: new RiddleService(api, auth),
    content: new ContentService(api),
    gameAccess,
    teacherClasses: new TeacherClassService(api),
    teacherQuizzes: new TeacherQuizService(gameAccess),
    adminManagement: new AdminManagementService(),
    adminQuizValidation: new AdminQuizValidationService()
  };
}
