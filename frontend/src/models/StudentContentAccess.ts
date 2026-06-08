export type StudentContentKind = "chapter" | "quiz";

export type StudentContentVisibility = "public" | "private";

export type StudentContentSectionId = "public_quizzes" | "private_quizzes" | "chapters";

export interface StudentContentSectionMeta {
  id: StudentContentSectionId;
  label: string;
  icon: "file" | "lock" | "book";
  description: string;
}

export const STUDENT_CONTENT_SECTIONS: readonly StudentContentSectionMeta[] = [
  {
    id: "chapters",
    label: "Chapitres",
    icon: "book",
    description: "Gestion locale en attente de l'API chapitres."
  },
  {
    id: "private_quizzes",
    label: "Questionnaires prives",
    icon: "lock",
    description: "Autorisez l'acces par classe pour vos QCM prives."
  },
  {
    id: "public_quizzes",
    label: "Questionnaires officiels",
    icon: "file",
    description: "Retirez l'acces par classe si necessaire."
  }
] as const;

export interface StudentContentItem {
  kind: StudentContentKind;
  sectionId: StudentContentSectionId;
  id: number;
  title: string;
  description: string;
  position: number;
  visibility: StudentContentVisibility;
  /** Whether the teacher can change class access for this item. */
  canManageAccess: boolean;
}

export interface StudentContentSection {
  id: StudentContentSectionId;
  items: StudentContentItem[];
}

export interface StudentContentCatalog {
  sections: StudentContentSection[];
}

export interface StudentContentClassAccessRow {
  classId: number;
  hasAccess: boolean;
}

export function resolveStudentContentSectionId(
  kind: StudentContentKind,
  visibility: StudentContentVisibility
): StudentContentSectionId {
  if (kind === "chapter") {
    return "chapters";
  }

  return visibility === "public" ? "public_quizzes" : "private_quizzes";
}

export function emptyStudentContentCatalog(): StudentContentCatalog {
  return {
    sections: STUDENT_CONTENT_SECTIONS.map((section) => ({
      id: section.id,
      items: []
    }))
  };
}
