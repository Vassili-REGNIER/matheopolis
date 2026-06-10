import type { AdminManagementService } from "../../services/admin/AdminManagementService.js";
import type { AdminQuizService } from "../../services/admin/AdminQuizService.js";
import type { ApiClient } from "../../services/ApiClient.js";
import type { AuthService } from "../../services/AuthService.js";
import type { ChapterService } from "../../services/ChapterService.js";
import type { ContentService } from "../../services/ContentService.js";
import type { GameAccessService } from "../../services/GameAccessService.js";
import type { ProgressMetricsService } from "../../services/ProgressMetricsService.js";
import type { QuizService } from "../../services/QuizService.js";
import type { StudentContentAccessService } from "../../services/teacher/StudentContentAccessService.js";
import type { TeacherClassService } from "../../services/teacher/TeacherClassService.js";
import type { TeacherContentClassAccessService } from "../../services/teacher/TeacherContentClassAccessService.js";
import type { TeacherQuizService } from "../../services/teacher/TeacherQuizService.js";
import type { UserService } from "../../services/UserService.js";

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
  contentClassAccess: TeacherContentClassAccessService;
  teacherQuizzes: TeacherQuizService;
  studentContentAccess: StudentContentAccessService;
  adminManagement: AdminManagementService;
  adminQuizzes: AdminQuizService;
}
