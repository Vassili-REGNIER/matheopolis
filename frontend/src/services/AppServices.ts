import { AdminManagementService } from "./admin/AdminManagementService.js";
import { AdminQuizService } from "./admin/AdminQuizService.js";
import { ApiClient } from "./ApiClient.js";
import { AuthService } from "./AuthService.js";
import { ChapterService } from "./ChapterService.js";
import { ContentService } from "./ContentService.js";
import { GameAccessService } from "./GameAccessService.js";
import { ProgressMetricsService } from "./ProgressMetricsService.js";
import { QuizService } from "./QuizService.js";
import { TeacherClassService } from "./teacher/TeacherClassService.js";
import { StudentContentAccessService } from "./teacher/StudentContentAccessService.js";
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
  quizzes: QuizService;
  teacherClasses: TeacherClassService;
  teacherQuizzes: TeacherQuizService;
  studentContentAccess: StudentContentAccessService;
  adminManagement: AdminManagementService;
  adminQuizzes: AdminQuizService;
}

export function createAppServices(): AppServices {
  const api = new ApiClient();
  const auth = new AuthService(api);
  const gameAccess = new GameAccessService();
  const teacherClasses = new TeacherClassService(api);
  const teacherQuizzes = new TeacherQuizService(api, gameAccess);

  return {
    api,
    auth,
    users: new UserService(api, auth),
    chapters: new ChapterService(api, auth),
    content: new ContentService(api),
    gameAccess,
    progressMetrics: new ProgressMetricsService(),
    quizzes: new QuizService(api),
    teacherClasses,
    teacherQuizzes,
    studentContentAccess: new StudentContentAccessService(api, teacherClasses, teacherQuizzes),
    adminManagement: new AdminManagementService(),
    adminQuizzes: new AdminQuizService(api)
  };
}
