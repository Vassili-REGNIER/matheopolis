export type StudentContentKind = "chapter" | "quiz";

export type StudentContentVisibility = "public" | "private";

export interface StudentContentItem {
  kind: StudentContentKind;
  id: number;
  title: string;
  description: string;
  position: number;
  visibility: StudentContentVisibility;
}

export interface StudentContentClassAccessRow {
  classId: number;
  hasAccess: boolean;
}
