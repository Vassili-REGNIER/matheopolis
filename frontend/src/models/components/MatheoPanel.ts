import type { IconName } from "./Icons.js";
import type { UserRole } from "../User.js";

export type PanelViewId =
  | "profile"
  | "progress"
  | "student-class"
  | "classes"
  | "quiz-management"
  | "student-content-management"
  | "admin";

export interface PanelNavItem {
  id: PanelViewId;
  label: string;
  icon: IconName;
  roles: UserRole[];
}

export interface PanelNavigateDetail {
  view: PanelViewId;
}
