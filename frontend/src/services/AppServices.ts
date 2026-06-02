import { AdminManagementService } from "./admin/AdminManagementService.js";
import { AdminQuizValidationService } from "./admin/AdminQuizValidationService.js";
import { ApiClient } from "./ApiClient.js";
import { AuthService } from "./AuthService.js";
import { ChapterService } from "./ChapterService.js";
import { ContentService } from "./ContentService.js";
import { GameAccessService } from "./GameAccessService.js";
import { ProgressMetricsService } from "./ProgressMetricsService.js";
import { TeacherClassService } from "./teacher/TeacherClassService.js";
import { TeacherQuizService } from "./teacher/TeacherQuizService.js";
import { UserService } from "./UserService.js";

export interface AppServices {
  api: ApiClient;
  auth: AuthService;
  users: UserService;
  chapters: ChapterService;
  content: ContentService;
  gameAccess: GameAccessService;
  progressMetrics: ProgressMetricsService;
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
    chapters: new ChapterService(api, auth),
    content: new ContentService(api),
    gameAccess,
    progressMetrics: new ProgressMetricsService(),
    teacherClasses: new TeacherClassService(api),
    teacherQuizzes: new TeacherQuizService(gameAccess),
    adminManagement: new AdminManagementService(),
    adminQuizValidation: new AdminQuizValidationService()
  };
}
