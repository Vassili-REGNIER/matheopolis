import { BaseComponent } from "../../../BaseComponent.js";
import type { ClassLevel, Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type { ClassManagementOptions, StudentProgressViewContext } from "../../../../models/ClassManagement.js";
import type { ClassDeleteTarget, StudentActionTarget } from "../../../../models/components/ClassManagement.js";
import { ProgressComponent } from "../Progress/ProgressComponent.js";
import { classManagementStyles } from "./ClassManagementComponent.styles.js";
import {
  classManagementLoadingTemplate,
  classManagementStudentProgressHostTemplate,
  classManagementViewTemplate
} from "./ClassManagementComponent.template.js";

export class ClassManagementComponent extends BaseComponent {
  private classes: Classroom[] = [];
  private selectedClassId: number | null = null;
  private progressRows: StudentChapterProgressSummary[] = [];
  private isCreateModalOpen = false;
  private isCreating = false;
  private editTarget: Classroom | null = null;
  private isUpdating = false;
  private isImportModalOpen = false;
  private isImporting = false;
  private openMenuClassId: number | null = null;
  private openMenuStudentId: number | null = null;
  private removeStudentTarget: StudentActionTarget | null = null;
  private isRemovingStudent = false;
  private resetPasswordTarget: StudentActionTarget | null = null;
  private isResettingPassword = false;
  private generatedStudentPassword: string | null = null;
  private deleteTarget: ClassDeleteTarget | null = null;
  private isDeleting = false;
  private listMessage = "";
  private codeCopied = false;
  private codeCopyTimer: number | null = null;
  private studentViewContext: StudentProgressViewContext | null = null;
  private studentProgressView: ProgressComponent | null = null;

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices,
    private readonly options?: ClassManagementOptions
  ) {
    super(container, "matheo-class-management-view");
  }

  public init(): void {
    this.render(classManagementLoadingTemplate(), classManagementStyles());
    void this.load();
  }

  public override destroy(): void {
    this.clearStudentProgressView();
    super.destroy();
  }

  private async load(): Promise<void> {
    try {
      this.classes = await this.services.teacherClasses.listMyClasses();
    } catch {
      this.classes = this.services.teacherClasses.listCachedClasses();
    }

    const restoreId = this.options?.selectedClassId;
    if (restoreId !== null && restoreId !== undefined) {
      await this.selectClass(restoreId);
      return;
    }

    this.renderView();
  }

  protected bindEvents(): void {
    const openModal = this.query<HTMLButtonElement>(".open-create-modal");
    if (openModal !== null) {
      this.listen(openModal, "click", () => {
        this.isCreateModalOpen = true;
        this.editTarget = null;
        this.isImportModalOpen = false;
        this.removeStudentTarget = null;
        this.resetPasswordTarget = null;
        this.generatedStudentPassword = null;
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.listMessage = "";
        this.renderView();
      });
    }

    const openImportModal = this.query<HTMLButtonElement>("[data-open-import-modal]");
    if (openImportModal !== null) {
      this.listen(openImportModal, "click", () => {
        this.isImportModalOpen = true;
        this.isCreateModalOpen = false;
        this.editTarget = null;
        this.deleteTarget = null;
        this.removeStudentTarget = null;
        this.resetPasswordTarget = null;
        this.generatedStudentPassword = null;
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.listMessage = "";
        this.renderView();
      });
    }

    this.bindModalBackdropClose();

    const closeButtons = this.queryAll<HTMLButtonElement>("[data-close-modal]");
    closeButtons.forEach((button) => {
      this.listen(button, "click", () => {
        this.closeCreateModal();
      });
    });

    const form = this.query<HTMLFormElement>('[data-form="create"]');
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        void this.createClass(form);
      });
    }

    this.queryAll<HTMLButtonElement>("[data-class-id]").forEach((button) => {
      this.listen(button, "click", () => {
        const id = Number.parseInt(button.dataset.classId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuClassId = null;
          this.openMenuStudentId = null;
          void this.selectClass(id);
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-menu-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuClassId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuClassId = this.openMenuClassId === id ? null : id;
          this.openMenuStudentId = null;
          this.renderView();
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-edit-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.editClassId ?? "", 10);
        const classroom = this.classes.find((item) => item.id === id);
        if (classroom === undefined) {
          return;
        }
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.isCreateModalOpen = false;
        this.deleteTarget = null;
        this.removeStudentTarget = null;
        this.resetPasswordTarget = null;
        this.generatedStudentPassword = null;
        this.editTarget = classroom;
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-delete-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.deleteClassId ?? "", 10);
        const classroom = this.classes.find((item) => item.id === id);
        if (classroom === undefined) {
          return;
        }
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.editTarget = null;
        this.removeStudentTarget = null;
        this.resetPasswordTarget = null;
        this.generatedStudentPassword = null;
        this.deleteTarget = { id: classroom.id, name: classroom.name };
        this.renderView();
      });
    });

    const closeDeleteButtons = this.queryAll<HTMLButtonElement>("[data-close-delete-modal]");
    closeDeleteButtons.forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isDeleting) {
          this.closeDeleteModal();
        }
      });
    });

    const confirmDelete = this.query<HTMLButtonElement>("[data-confirm-delete]");
    if (confirmDelete !== null) {
      this.listen(confirmDelete, "click", () => {
        void this.confirmDeleteClass();
      });
    }

    const closeRemoveStudentButtons = this.queryAll<HTMLButtonElement>("[data-close-remove-student-modal]");
    closeRemoveStudentButtons.forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isRemovingStudent) {
          this.closeRemoveStudentModal();
        }
      });
    });

    const confirmRemoveStudent = this.query<HTMLButtonElement>("[data-confirm-remove-student]");
    if (confirmRemoveStudent !== null) {
      this.listen(confirmRemoveStudent, "click", () => {
        void this.confirmRemoveStudent();
      });
    }

    const closeResetPasswordButtons = this.queryAll<HTMLButtonElement>("[data-close-reset-student-password-modal]");
    closeResetPasswordButtons.forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isResettingPassword) {
          this.closeResetPasswordModal();
        }
      });
    });

    const confirmResetPassword = this.query<HTMLButtonElement>("[data-confirm-reset-student-password]");
    if (confirmResetPassword !== null) {
      this.listen(confirmResetPassword, "click", () => {
        void this.confirmResetStudentPassword();
      });
    }

    const closeEditButtons = this.queryAll<HTMLButtonElement>("[data-close-edit-modal]");
    closeEditButtons.forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isUpdating) {
          this.closeEditModal();
        }
      });
    });

    const editForm = this.query<HTMLFormElement>('[data-form="edit"]');
    if (editForm !== null) {
      this.listen(editForm, "submit", (event) => {
        event.preventDefault();
        void this.submitClassUpdate(editForm);
      });
    }

    const closeImportButtons = this.queryAll<HTMLButtonElement>("[data-close-import-modal]");
    closeImportButtons.forEach((button) => {
      this.listen(button, "click", () => {
        if (!this.isImporting) {
          this.closeImportModal();
        }
      });
    });

    const importForm = this.query<HTMLFormElement>('[data-form="import"]');
    if (importForm !== null) {
      this.listen(importForm, "submit", (event) => {
        event.preventDefault();
        void this.submitStudentsImport(importForm);
      });
    }

    const back = this.query<HTMLButtonElement>(".back-classes");
    if (back !== null) {
      this.listen(back, "click", () => {
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.selectedClassId = null;
        this.progressRows = [];
        this.isImportModalOpen = false;
        this.resetCodeCopyFeedback();
        this.renderView();
      });
    }

    const copyCodeButton = this.query<HTMLButtonElement>("[data-copy-class-code]");
    if (copyCodeButton !== null) {
      this.listen(copyCodeButton, "click", () => {
        void this.copyClassCode(copyCodeButton.dataset.copyClassCode ?? "");
      });
    }

    this.queryAll<HTMLButtonElement>("[data-menu-student-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.menuStudentId ?? "", 10);
        if (!Number.isNaN(id)) {
          this.openMenuStudentId = this.openMenuStudentId === id ? null : id;
          this.openMenuClassId = null;
          this.renderView();
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-remove-student-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.removeStudentId ?? "", 10);
        const target = this.findStudentActionTarget(id);
        if (target === null) {
          return;
        }
        this.openMenuStudentId = null;
        this.resetPasswordTarget = null;
        this.generatedStudentPassword = null;
        this.removeStudentTarget = target;
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-reset-student-password-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const id = Number.parseInt(button.dataset.resetStudentPasswordId ?? "", 10);
        const target = this.findStudentActionTarget(id);
        if (target === null) {
          return;
        }
        this.openMenuStudentId = null;
        this.removeStudentTarget = null;
        this.resetPasswordTarget = target;
        this.generatedStudentPassword = null;
        this.listMessage = "";
        this.renderView();
      });
    });

    this.queryAll<HTMLTableRowElement>("[data-student-id]").forEach((row) => {
      const openStudentProgress = (): void => {
        if (this.selectedClassId === null) {
          return;
        }

        const userId = Number.parseInt(row.dataset.studentId ?? "", 10);
        if (Number.isNaN(userId)) {
          return;
        }

        const summary = this.progressRows.find((item) => (item.user?.id ?? item.userId) === userId);
        if (summary === undefined) {
          return;
        }

        this.studentViewContext = {
          userId,
          classId: this.selectedClassId,
          summary
        };
        this.openMenuClassId = null;
        this.openMenuStudentId = null;
        this.renderView();
      };

      this.listen(row, "click", (event) => {
        if (this.isStudentActionEvent(event)) {
          return;
        }

        openStudentProgress();
      });
      this.listen(row, "keydown", (event) => {
        if (this.isStudentActionEvent(event)) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openStudentProgress();
        }
      });
    });

    if (this.openMenuClassId !== null || this.openMenuStudentId !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(".class-card-menu-wrap, .view-header-menu, .student-menu-wrap");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuClassId = null;
          this.openMenuStudentId = null;
          this.renderView();
        }
      });
    }
  }

  private isStudentActionEvent(event: Event): boolean {
    const target = event.target;
    return target instanceof Element && target.closest(".student-actions-cell") !== null;
  }

  private bindModalBackdropClose(): void {
    this.queryAll<HTMLElement>(".create-modal").forEach((overlay) => {
      this.listen(overlay, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const panel = overlay.querySelector(".create-modal-panel");
        if (panel !== null && panel.contains(target)) {
          return;
        }

        if (overlay.classList.contains("delete-modal")) {
          if (!this.isDeleting) {
            this.closeDeleteModal();
          }
          return;
        }

        if (overlay.classList.contains("edit-modal")) {
          if (!this.isUpdating) {
            this.closeEditModal();
          }
          return;
        }

        if (overlay.classList.contains("import-modal")) {
          if (!this.isImporting) {
            this.closeImportModal();
          }
          return;
        }

        if (overlay.classList.contains("remove-student-modal")) {
          if (!this.isRemovingStudent) {
            this.closeRemoveStudentModal();
          }
          return;
        }

        if (overlay.classList.contains("reset-student-password-modal")) {
          if (!this.isResettingPassword) {
            this.closeResetPasswordModal();
          }
          return;
        }

        this.closeCreateModal();
      });
    });
  }

  private closeCreateModal(): void {
    if (this.isCreating) {
      return;
    }
    this.isCreateModalOpen = false;
    this.listMessage = "";
    this.renderView();
  }

  private closeEditModal(): void {
    if (this.isUpdating) {
      return;
    }
    this.editTarget = null;
    this.listMessage = "";
    this.renderView();
  }

  private closeImportModal(): void {
    if (this.isImporting) {
      return;
    }
    this.isImportModalOpen = false;
    this.listMessage = "";
    this.renderView();
  }

  private closeDeleteModal(): void {
    this.deleteTarget = null;
    this.renderView();
  }

  private closeRemoveStudentModal(): void {
    if (this.isRemovingStudent) {
      return;
    }
    this.removeStudentTarget = null;
    this.listMessage = "";
    this.renderView();
  }

  private closeResetPasswordModal(): void {
    if (this.isResettingPassword) {
      return;
    }
    this.resetPasswordTarget = null;
    this.generatedStudentPassword = null;
    this.listMessage = "";
    this.renderView();
  }

  private async confirmDeleteClass(): Promise<void> {
    if (this.deleteTarget === null || this.isDeleting) {
      return;
    }

    const targetId = this.deleteTarget.id;
    this.isDeleting = true;
    this.listMessage = "";
    this.renderView();

    try {
      await this.services.teacherClasses.deleteClass(targetId);
      this.classes = this.classes.filter((item) => item.id !== targetId);
      if (this.selectedClassId === targetId) {
        this.selectedClassId = null;
        this.progressRows = [];
      }
      this.deleteTarget = null;
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Suppression impossible.";
      this.deleteTarget = null;
    } finally {
      this.isDeleting = false;
      this.renderView();
    }
  }

  private async confirmRemoveStudent(): Promise<void> {
    if (this.selectedClassId === null || this.removeStudentTarget === null || this.isRemovingStudent) {
      return;
    }

    const classId = this.selectedClassId;
    const studentId = this.removeStudentTarget.id;
    this.isRemovingStudent = true;
    this.listMessage = "";
    this.renderView();

    try {
      await this.services.teacherClasses.deleteStudentAccount(classId, studentId);
      this.progressRows = this.progressRows.filter((item) => (item.user?.id ?? item.userId) !== studentId);
      this.removeStudentTarget = null;
      this.listMessage = "Le compte élève a été supprimé.";
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Suppression de l'élève impossible.";
    } finally {
      this.isRemovingStudent = false;
      this.renderView();
    }
  }

  private async confirmResetStudentPassword(): Promise<void> {
    if (this.selectedClassId === null || this.resetPasswordTarget === null || this.isResettingPassword) {
      return;
    }

    const classId = this.selectedClassId;
    const studentId = this.resetPasswordTarget.id;
    this.isResettingPassword = true;
    this.generatedStudentPassword = null;
    this.listMessage = "";
    this.renderView();

    try {
      this.generatedStudentPassword = await this.services.teacherClasses.resetStudentPassword(
        classId,
        studentId
      );
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Régénération du mot de passe impossible.";
    } finally {
      this.isResettingPassword = false;
      this.renderView();
    }
  }

  private async createClass(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const level = String(data.get("level") ?? "").trim() as ClassLevel;

    if (name.length === 0 || level.length === 0) {
      this.listMessage = "Le nom et le niveau sont obligatoires.";
      this.renderView();
      return;
    }

    this.isCreating = true;
    this.renderView();

    try {
      const classroom = await this.services.teacherClasses.createClass({
        name,
        description: description || null,
        level
      });
      this.classes = [classroom, ...this.classes.filter((item) => item.id !== classroom.id)];
      this.isCreateModalOpen = false;
      this.listMessage = "";
      form.reset();
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Creation impossible.";
    } finally {
      this.isCreating = false;
      this.renderView();
    }
  }

  private async submitClassUpdate(form: HTMLFormElement): Promise<void> {
    if (this.editTarget === null) {
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const level = String(data.get("level") ?? "").trim() as ClassLevel;

    if (name.length === 0 || level.length === 0) {
      this.listMessage = "Le nom et le niveau sont obligatoires.";
      this.renderView();
      return;
    }

    this.isUpdating = true;
    this.renderView();

    try {
      const classroom = await this.services.teacherClasses.updateClass(this.editTarget.id, {
        name,
        description: description || null,
        level
      });
      this.classes = this.classes.map((item) => (item.id === classroom.id ? classroom : item));
      this.editTarget = null;
      this.listMessage = "";
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Modification impossible.";
    } finally {
      this.isUpdating = false;
      this.renderView();
    }
  }

  private async submitStudentsImport(form: HTMLFormElement): Promise<void> {
    if (this.selectedClassId === null || this.isImporting) {
      return;
    }

    const data = new FormData(form);
    const file = data.get("csvFile");
    if (!(file instanceof File) || file.size === 0) {
      this.listMessage = "Selectionnez un fichier CSV avant de lancer l'import.";
      this.renderView();
      return;
    }

    if (!file.name.toLocaleLowerCase("fr-FR").endsWith(".csv")) {
      this.listMessage = "Le fichier selectionne doit etre au format .csv.";
      this.renderView();
      return;
    }

    let csvContent = "";
    try {
      csvContent = await file.text();
    } catch {
      this.listMessage = "Impossible de lire le fichier CSV selectionne.";
      this.renderView();
      return;
    }

    const validation = this.validateStudentsImportCsv(csvContent);
    if (!validation.valid) {
      this.listMessage = validation.message;
      this.renderView();
      return;
    }

    this.isImporting = true;
    this.listMessage = "";
    this.renderView();

    try {
      const download = await this.services.teacherClasses.importStudentsCsv(
        this.selectedClassId,
        validation.normalizedCsv
      );
      this.downloadCsv(download.content, download.filename);
      this.progressRows = await this.services.teacherClasses.listStudentsProgress(this.selectedClassId);
      this.isImportModalOpen = false;
      this.listMessage = "Import termine. Le fichier des comptes crees a ete telecharge.";
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Import impossible.";
    } finally {
      this.isImporting = false;
      this.renderView();
    }
  }

  private async selectClass(classId: number): Promise<void> {
    this.resetCodeCopyFeedback();
    this.isImportModalOpen = false;
    this.selectedClassId = classId;
    try {
      this.progressRows = await this.services.teacherClasses.listStudentsProgress(classId);
    } catch {
      this.progressRows = [];
    }
    this.renderView();
  }

  private renderView(): void {
    this.clearStudentProgressView();

    if (this.studentViewContext !== null) {
      this.render(classManagementStudentProgressHostTemplate(), classManagementStyles());
      this.mountStudentProgressView();
      return;
    }

    const selected = this.classes.find((item) => item.id === this.selectedClassId) ?? null;
    this.render(classManagementViewTemplate({
      selected,
      classes: this.classes,
      progressRows: this.progressRows,
      isCreateModalOpen: this.isCreateModalOpen,
      isCreating: this.isCreating,
      editTarget: this.editTarget,
      isUpdating: this.isUpdating,
      isImportModalOpen: this.isImportModalOpen,
      isImporting: this.isImporting,
      openMenuClassId: this.openMenuClassId,
      openMenuStudentId: this.openMenuStudentId,
      removeStudentTarget: this.removeStudentTarget,
      isRemovingStudent: this.isRemovingStudent,
      resetPasswordTarget: this.resetPasswordTarget,
      isResettingPassword: this.isResettingPassword,
      generatedStudentPassword: this.generatedStudentPassword,
      deleteTarget: this.deleteTarget,
      isDeleting: this.isDeleting,
      listMessage: this.listMessage,
      codeCopied: this.codeCopied
    }), classManagementStyles());
    this.bindEvents();
  }

  private clearStudentProgressView(): void {
    this.studentProgressView?.destroy();
    this.studentProgressView = null;
  }

  private findStudentActionTarget(studentId: number): StudentActionTarget | null {
    if (Number.isNaN(studentId)) {
      return null;
    }

    const row = this.progressRows.find((item) => (item.user?.id ?? item.userId) === studentId);
    if (row === undefined) {
      return null;
    }

    return {
      id: studentId,
      name: this.formatStudentName(row),
      username: row.user?.username?.trim() || "Non renseigne"
    };
  }

  private formatStudentName(row: StudentChapterProgressSummary): string {
    if (row.user !== undefined) {
      return `${row.user.firstName} ${row.user.lastName}`.trim();
    }

    return `Eleve #${row.userId ?? "?"}`;
  }

  private mountStudentProgressView(): void {
    if (this.studentViewContext === null) {
      return;
    }

    const host = this.query<HTMLElement>("[data-student-progress-host]");
    if (host === null) {
      return;
    }

    this.studentProgressView = new ProgressComponent(host, this.services, {
      studentContext: this.studentViewContext,
      onBack: () => {
        this.studentViewContext = null;
        this.renderView();
      }
    });
    this.studentProgressView.init();
  }

  private resetCodeCopyFeedback(): void {
    if (this.codeCopyTimer !== null) {
      window.clearTimeout(this.codeCopyTimer);
      this.codeCopyTimer = null;
    }
    this.codeCopied = false;
  }

  private async copyClassCode(code: string): Promise<void> {
    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmedCode);
      this.resetCodeCopyFeedback();
      this.codeCopied = true;
      this.renderView();
      this.codeCopyTimer = window.setTimeout(() => {
        this.codeCopied = false;
        this.codeCopyTimer = null;
        this.renderView();
      }, 2000);
    } catch {
      this.listMessage = "Impossible de copier le code.";
      this.renderView();
    }
  }

  private validateStudentsImportCsv(csvContent: string): { valid: true; normalizedCsv: string } | { valid: false; message: string } {
    const trimmed = csvContent.trim();
    if (trimmed.length === 0) {
      return { valid: false, message: "Collez le contenu CSV avant de lancer l'import." };
    }

    const rows = this.parseCsvRows(trimmed);
    if (rows.length < 2) {
      return { valid: false, message: "Le CSV doit contenir une ligne d'en-tete et au moins un eleve." };
    }

    const header = rows[0];
    if (header === undefined) {
      return { valid: false, message: "Le CSV doit commencer par l'en-tete nom,prenom." };
    }

    const normalizedHeader = header.map((cell) => this.normalizeCsvHeader(cell));
    const nameIndex = normalizedHeader.indexOf("nom");
    const firstNameIndex = normalizedHeader.indexOf("prenom");
    if (nameIndex === -1 || firstNameIndex === -1) {
      return { valid: false, message: "L'en-tete attendu est nom,prenom." };
    }

    const normalizedRows: string[][] = [["nom", "prenom"]];
    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index] ?? [];
      const name = (row[nameIndex] ?? "").trim();
      const firstName = (row[firstNameIndex] ?? "").trim();

      if (name.length === 0 || firstName.length === 0) {
        return {
          valid: false,
          message: `La ligne ${index + 1} doit contenir un nom et un prenom.`
        };
      }

      normalizedRows.push([name, firstName]);
    }

    return {
      valid: true,
      normalizedCsv: normalizedRows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(",")).join("\n")
    };
  }

  private parseCsvRows(csvContent: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < csvContent.length; index += 1) {
      const char = csvContent[index];
      const next = csvContent[index + 1];

      if (char === "\"") {
        if (inQuotes && next === "\"") {
          cell += "\"";
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          index += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (char !== undefined) {
        cell += char;
      }
    }

    row.push(cell);
    rows.push(row);

    return rows.filter((cells) => cells.some((value) => value.trim().length > 0));
  }

  private normalizeCsvHeader(value: string): string {
    return value
      .replace(/^\uFEFF/, "")
      .trim()
      .toLocaleLowerCase("fr-FR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  private escapeCsvCell(value: string): string {
    if (!/[",\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
