import type { StudentChapterProgressSummary } from "../ChapterProgress.js";
import type { Classroom } from "../Class.js";

export interface ClassDeleteTarget {
  id: number;
  name: string;
}

export interface ClassFormValues {
  name: string;
  description: string | null;
  level?: string | null;
}

export interface ClassManagementTemplateData {
  selected: Classroom | null;
  classes: Classroom[];
  progressRows: StudentChapterProgressSummary[];
  isCreateModalOpen: boolean;
  isCreating: boolean;
  editTarget: Classroom | null;
  isUpdating: boolean;
  openMenuClassId: number | null;
  deleteTarget: ClassDeleteTarget | null;
  isDeleting: boolean;
  listMessage: string;
  codeCopied: boolean;
}
