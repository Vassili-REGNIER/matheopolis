import type { StudentChapterProgressSummary } from "../ChapterProgress.js";
import type { Classroom } from "../Class.js";

export const CLASS_MANAGEMENT_BACK_TO_CLASSES_EVENT = "classManagementBackToClasses";
export const CLASS_MANAGEMENT_CLASS_CODE_COPY_REQUEST_EVENT = "classManagementClassCodeCopyRequest";
export const CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT = "classManagementClassDeleteRequest";
export const CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT = "classManagementClassEditRequest";
export const CLASS_MANAGEMENT_CLASS_FORM_CANCEL_EVENT = "classManagementClassFormCancel";
export const CLASS_MANAGEMENT_CLASS_FORM_SUBMIT_EVENT = "classManagementClassFormSubmit";
export const CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT = "classManagementClassMenuToggle";
export const CLASS_MANAGEMENT_CLASS_SELECT_EVENT = "classManagementClassSelect";
export const CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT = "classManagementCreateClassRequest";
export const CLASS_MANAGEMENT_EXPORT_PROGRESS_REQUEST_EVENT = "classManagementExportProgressRequest";
export const CLASS_MANAGEMENT_IMPORT_MODAL_CANCEL_EVENT = "classManagementImportModalCancel";
export const CLASS_MANAGEMENT_IMPORT_MODAL_OPEN_EVENT = "classManagementImportModalOpen";
export const CLASS_MANAGEMENT_IMPORT_SUBMIT_EVENT = "classManagementImportSubmit";
export const CLASS_MANAGEMENT_STUDENT_MENU_TOGGLE_EVENT = "classManagementStudentMenuToggle";
export const CLASS_MANAGEMENT_STUDENT_PASSWORD_RESET_REQUEST_EVENT = "classManagementStudentPasswordResetRequest";
export const CLASS_MANAGEMENT_STUDENT_REMOVE_REQUEST_EVENT = "classManagementStudentRemoveRequest";
export const CLASS_MANAGEMENT_STUDENT_SELECT_EVENT = "classManagementStudentSelect";

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

export interface ClassManagementClassIdDetail {
  classId: number;
}

export interface ClassManagementStudentIdDetail {
  studentId: number;
}

export interface ClassManagementClassCodeDetail {
  code: string;
}

export type ClassFormModalMode = "create" | "edit";

export interface ClassManagementClassFormSubmitDetail {
  mode: ClassFormModalMode;
  values: ClassFormValues;
}

export interface ClassManagementClassFormCancelDetail {
  mode: ClassFormModalMode;
}

export interface ClassManagementImportSubmitDetail {
  file: File | null;
}

export interface ClassManagementHeaderData {
  selected: Classroom | null;
  isExporting: boolean;
  openMenuClassId: number | null;
}

export interface ClassManagementListData {
  classes: Classroom[];
  listMessage: string;
  openMenuClassId: number | null;
}

export interface ClassManagementDetailData {
  selected: Classroom;
  progressRows: StudentChapterProgressSummary[];
  listMessage: string;
  openMenuStudentId: number | null;
  codeCopied: boolean;
}

export interface ClassFormModalData {
  mode: ClassFormModalMode;
  values?: ClassFormValues;
  isProcessing: boolean;
  message: string;
}

export interface StudentsImportModalData {
  isImporting: boolean;
  message: string;
}
