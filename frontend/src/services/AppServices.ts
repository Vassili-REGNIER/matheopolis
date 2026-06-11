import { AdminManagementService } from "./admin/AdminManagementService.js";
import { AdminQuizService } from "./admin/AdminQuizService.js";
import { ApiClient } from "./ApiClient.js";
import { AuthService } from "./AuthService.js";
import { ChapterService } from "./ChapterService.js";
import { ContentService } from "./ContentService.js";
import { ProgressMetricsService } from "./ProgressMetricsService.js";
import { QuizService } from "./QuizService.js";
import { TeacherClassService } from "./teacher/TeacherClassService.js";
import { TeacherContentClassAccessService } from "./teacher/TeacherContentClassAccessService.js";
import { StudentContentAccessService } from "./teacher/StudentContentAccessService.js";
import { TeacherQuizService } from "./teacher/TeacherQuizService.js";
import { UserService } from "./UserService.js";
import type { AppServices } from "../models/services/AppServices.js";

export function createAppServices(): AppServices {
  const api = new ApiClient();
  const auth = new AuthService(api);
  const teacherClasses = new TeacherClassService(api);
  const teacherQuizzes = new TeacherQuizService(api);
  const chapters = new ChapterService(api, auth);
  const contentClassAccess = new TeacherContentClassAccessService(api);
  const studentContentAccess = new StudentContentAccessService(
    teacherClasses,
    teacherQuizzes,
    chapters,
    contentClassAccess
  );

  return {
    api,
    auth,
    users: new UserService(api, auth),
    chapters,
    content: new ContentService(api),
    progressMetrics: new ProgressMetricsService(),
    quizzes: new QuizService(api),
    teacherClasses,
    contentClassAccess,
    teacherQuizzes,
    studentContentAccess,
    adminManagement: new AdminManagementService(),
    adminQuizzes: new AdminQuizService(api)
  };
}
