import type { StudentChapterProgressSummary } from "../ChapterProgress.js";
import type { Classroom } from "../Class.js";

export interface StudentProgressViewContext {
  userId: number;
  classId: number;
  summary: StudentChapterProgressSummary;
}

export interface ClassManagementOptions {
  selectedClassId?: number | null;
}

export interface ClassDeleteTarget {
  id: number;
  name: string;
}

export interface StudentActionTarget {
  id: number;
  name: string;
  username: string;
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
  isImportModalOpen: boolean;
  isImporting: boolean;
  isExporting: boolean;
  openMenuClassId: number | null;
  openMenuStudentId: number | null;
  removeStudentTarget: StudentActionTarget | null;
  isRemovingStudent: boolean;
  resetPasswordTarget: StudentActionTarget | null;
  isResettingPassword: boolean;
  generatedStudentPassword: string | null;
  deleteTarget: ClassDeleteTarget | null;
  isDeleting: boolean;
  listMessage: string;
  codeCopied: boolean;
}
