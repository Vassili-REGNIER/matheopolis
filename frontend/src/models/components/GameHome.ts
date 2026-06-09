export interface ChapterViewModel {
  id: number;
  title: string;
  subtitle: string;
  era: string;
  progress: number;
  progressLabel: string;
  enabled: boolean;
  status: string;
  route: string;
  kind: "chapter" | "quiz";
  visibility?: "public" | "private";
}

export interface AdminMenuItem {
  action: "edit-quiz" | "publish-quiz" | "unpublish-quiz" | "delete-quiz" | "delete-chapter";
  label: string;
  danger?: boolean;
}

export interface AdminConfirmTarget {
  action: AdminMenuItem["action"];
  id: number;
  title: string;
  kind: ChapterViewModel["kind"];
}

export type GameHomeContentFilter = "chapters" | "private_quizzes" | "public_quizzes";
