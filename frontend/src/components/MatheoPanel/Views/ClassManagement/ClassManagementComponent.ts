import { BaseComponent } from "../../../BaseComponent.js";
import type { Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type {
  ClassDeleteTarget,
  ClassFormModalMode,
  ClassFormValues,
  ClassManagementClassCodeDetail,
  ClassManagementClassFormCancelDetail,
  ClassManagementClassFormSubmitDetail,
  ClassManagementClassIdDetail,
  ClassManagementExportSubmitDetail,
  ClassManagementImportSubmitDetail,
  ClassManagementOptions,
  ClassManagementStudentIdDetail,
  StudentActionTarget,
  StudentProgressViewContext
} from "../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_BACK_TO_CLASSES_EVENT,
  CLASS_MANAGEMENT_CLASS_CODE_COPY_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_FORM_CANCEL_EVENT,
  CLASS_MANAGEMENT_CLASS_FORM_SUBMIT_EVENT,
  CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT,
  CLASS_MANAGEMENT_CLASS_SELECT_EVENT,
  CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT,
  CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT,
  CLASS_MANAGEMENT_EXPORT_MODAL_OPEN_EVENT,
  CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT,
  CLASS_MANAGEMENT_IMPORT_MODAL_CANCEL_EVENT,
  CLASS_MANAGEMENT_IMPORT_MODAL_OPEN_EVENT,
  CLASS_MANAGEMENT_IMPORT_SUBMIT_EVENT,
  CLASS_MANAGEMENT_STUDENT_MENU_TOGGLE_EVENT,
  CLASS_MANAGEMENT_STUDENT_PASSWORD_RESET_REQUEST_EVENT,
  CLASS_MANAGEMENT_STUDENT_REMOVE_REQUEST_EVENT,
  CLASS_MANAGEMENT_STUDENT_SELECT_EVENT
} from "../../../../models/components/ClassManagement.js";
import {
  CONFIRMATION_MODAL_ACTION_EVENT,
  type ConfirmationModalActionDetail,
  type ConfirmationModalConfig
} from "../../../../models/components/ConfirmationModal.js";
import { ConfirmationModalComponent } from "../../../Shared/ConfirmationModal/ConfirmationModalComponent.js";
import { ProgressComponent } from "../Progress/ProgressComponent.js";
import { classManagementStyles } from "./ClassManagementComponent.styles.js";
import {
  classManagementLoadingTemplate,
  classManagementShellTemplate,
  classManagementStudentProgressHostTemplate
} from "./ClassManagementComponent.template.js";
import { ClassDetailComponent } from "./components/ClassDetailComponent.js";
import { ClassFormModalComponent } from "./components/ClassFormModalComponent.js";
import { ClassListComponent } from "./components/ClassListComponent.js";
import { ClassManagementHeaderComponent } from "./components/ClassManagementHeaderComponent.js";
import { ProgressExportModalComponent } from "./components/ProgressExportModalComponent.js";
import { StudentsImportModalComponent } from "./components/StudentsImportModalComponent.js";
import {
  buildClassDeleteConfirmationConfig,
  buildStudentPasswordResetConfirmationConfig,
  buildStudentRemovalConfirmationConfig
} from "./utils/classManagementConfirmationConfigs.js";
import { validateStudentsImportCsv } from "./utils/classManagementCsv.js";
import { downloadCsvFile } from "./utils/classManagementDownload.js";
import { formatStudentName } from "./utils/classManagementFormatters.js";

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
  private isExportModalOpen = false;
  private isExporting = false;
  private exportChapters: Array<{ id: number; title: string }> = [];
  private isLoadingExportChapters = false;
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
  private readonly childComponents: BaseComponent[] = [];
  private readonly confirmationModals: ConfirmationModalComponent[] = [];

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
    this.resetCodeCopyFeedback();
    this.clearChildComponents();
    this.clearConfirmationModals();
    this.clearStudentProgressView();
    super.destroy();
  }

  protected bindEvents(): void {
    // Child components own DOM events and bubble typed intentions to this orchestrator.
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

  private renderView(): void {
    this.clearChildComponents();
    this.clearConfirmationModals();
    this.clearStudentProgressView();

    if (this.studentViewContext !== null) {
      this.render(classManagementStudentProgressHostTemplate(), classManagementStyles());
      this.mountStudentProgressView();
      return;
    }

    const selected = this.getSelectedClass();
    this.render(classManagementShellTemplate(), classManagementStyles());
    this.bindChildComponentEvents();
    this.mountHeader(selected);
    this.mountBody(selected);
    this.mountActiveModals();
    this.bindOpenMenuDismiss();
    this.mountConfirmationModals();
  }

  private mountHeader(selected: Classroom | null): void {
    const host = this.query<HTMLElement>("[data-class-management-header]");
    if (host === null) {
      return;
    }

    this.mountChild(new ClassManagementHeaderComponent(host, {
      selected,
      isExporting: this.isExporting,
      openMenuClassId: this.openMenuClassId
    }));
  }

  private mountBody(selected: Classroom | null): void {
    const host = this.query<HTMLElement>("[data-class-management-body]");
    if (host === null) {
      return;
    }

    if (selected === null) {
      this.mountChild(new ClassListComponent(host, {
        classes: this.classes,
        listMessage: this.listMessage,
        openMenuClassId: this.openMenuClassId
      }));
      return;
    }

    this.mountChild(new ClassDetailComponent(host, {
      selected,
      progressRows: this.progressRows,
      listMessage: this.listMessage,
      openMenuStudentId: this.openMenuStudentId,
      codeCopied: this.codeCopied
    }));
  }

  private mountActiveModals(): void {
    const host = this.query<HTMLElement>("[data-class-management-modals]");
    if (host === null) {
      return;
    }

    if (this.isCreateModalOpen) {
      this.mountChild(new ClassFormModalComponent(this.createChildContainer(host), {
        mode: "create",
        isProcessing: this.isCreating,
        message: this.listMessage
      }));
    }

    if (this.editTarget !== null) {
      this.mountChild(new ClassFormModalComponent(this.createChildContainer(host), {
        mode: "edit",
        values: this.classroomToFormValues(this.editTarget),
        isProcessing: this.isUpdating,
        message: this.listMessage
      }));
    }

    if (this.isImportModalOpen) {
      this.mountChild(new StudentsImportModalComponent(this.createChildContainer(host), {
        isImporting: this.isImporting,
        message: this.listMessage
      }));
    }

    if (this.isExportModalOpen) {
      this.mountChild(new ProgressExportModalComponent(this.createChildContainer(host), {
        isExporting: this.isExporting,
        message: this.listMessage,
        chapters: this.exportChapters,
        isLoadingChapters: this.isLoadingExportChapters
      }));
    }
  }

  private mountChild(component: BaseComponent): void {
    this.childComponents.push(component);
    component.init();
  }

  private createChildContainer(host: HTMLElement): HTMLElement {
    const container = document.createElement("div");
    host.append(container);
    return container;
  }

  private clearChildComponents(): void {
    while (this.childComponents.length > 0) {
      this.childComponents.pop()?.destroy();
    }
  }

  private bindChildComponentEvents(): void {
    this.listenTo(this.container, CLASS_MANAGEMENT_BACK_TO_CLASSES_EVENT, () => {
      this.showClassList();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT, () => {
      this.openCreateModal();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_IMPORT_MODAL_OPEN_EVENT, () => {
      this.openImportModal();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_EXPORT_MODAL_OPEN_EVENT, () => {
      void this.openExportModal();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT, () => {
      this.closeExportModal();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT, (event) => {
      const detail = this.readDetail<ClassManagementExportSubmitDetail>(event);
      void this.exportClassProgress(detail.mode, detail.chapterId ?? undefined);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_SELECT_EVENT, (event) => {
      const { classId } = this.readDetail<ClassManagementClassIdDetail>(event);
      this.openMenuClassId = null;
      this.openMenuStudentId = null;
      void this.selectClass(classId);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT, (event) => {
      const { classId } = this.readDetail<ClassManagementClassIdDetail>(event);
      this.openMenuClassId = this.openMenuClassId === classId ? null : classId;
      this.openMenuStudentId = null;
      this.renderView();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT, (event) => {
      const { classId } = this.readDetail<ClassManagementClassIdDetail>(event);
      this.openEditModal(classId);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT, (event) => {
      const { classId } = this.readDetail<ClassManagementClassIdDetail>(event);
      this.openDeleteModal(classId);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_FORM_CANCEL_EVENT, (event) => {
      const { mode } = this.readDetail<ClassManagementClassFormCancelDetail>(event);
      this.closeClassFormModal(mode);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_FORM_SUBMIT_EVENT, (event) => {
      const detail = this.readDetail<ClassManagementClassFormSubmitDetail>(event);
      if (detail.mode === "create") {
        void this.createClass(detail.values);
        return;
      }

      void this.submitClassUpdate(detail.values);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_IMPORT_MODAL_CANCEL_EVENT, () => {
      this.closeImportModal();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_IMPORT_SUBMIT_EVENT, (event) => {
      const { file } = this.readDetail<ClassManagementImportSubmitDetail>(event);
      void this.submitStudentsImport(file);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_CLASS_CODE_COPY_REQUEST_EVENT, (event) => {
      const { code } = this.readDetail<ClassManagementClassCodeDetail>(event);
      void this.copyClassCode(code);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_STUDENT_MENU_TOGGLE_EVENT, (event) => {
      const { studentId } = this.readDetail<ClassManagementStudentIdDetail>(event);
      this.openMenuStudentId = this.openMenuStudentId === studentId ? null : studentId;
      this.openMenuClassId = null;
      this.renderView();
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_STUDENT_REMOVE_REQUEST_EVENT, (event) => {
      const { studentId } = this.readDetail<ClassManagementStudentIdDetail>(event);
      this.openRemoveStudentModal(studentId);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_STUDENT_PASSWORD_RESET_REQUEST_EVENT, (event) => {
      const { studentId } = this.readDetail<ClassManagementStudentIdDetail>(event);
      this.openResetPasswordModal(studentId);
    });

    this.listenTo(this.container, CLASS_MANAGEMENT_STUDENT_SELECT_EVENT, (event) => {
      const { studentId } = this.readDetail<ClassManagementStudentIdDetail>(event);
      this.openStudentProgress(studentId);
    });
  }

  private bindOpenMenuDismiss(): void {
    if (this.openMenuClassId === null && this.openMenuStudentId === null) {
      return;
    }

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

  private readDetail<TDetail>(event: Event): TDetail {
    return (event as CustomEvent<TDetail>).detail;
  }

  private showClassList(): void {
    this.openMenuClassId = null;
    this.openMenuStudentId = null;
    this.selectedClassId = null;
    this.progressRows = [];
    this.isImportModalOpen = false;
    this.resetCodeCopyFeedback();
    this.renderView();
  }

  private openCreateModal(): void {
    this.isCreateModalOpen = true;
    this.editTarget = null;
    this.isImportModalOpen = false;
    this.clearActionTargets();
    this.closeMenus();
    this.listMessage = "";
    this.renderView();
  }

  private openImportModal(): void {
    this.isImportModalOpen = true;
    this.isCreateModalOpen = false;
    this.editTarget = null;
    this.deleteTarget = null;
    this.clearActionTargets();
    this.closeMenus();
    this.listMessage = "";
    this.renderView();
  }

  private openEditModal(classId: number): void {
    const classroom = this.classes.find((item) => item.id === classId);
    if (classroom === undefined) {
      return;
    }

    this.isCreateModalOpen = false;
    this.isImportModalOpen = false;
    this.editTarget = classroom;
    this.deleteTarget = null;
    this.clearActionTargets();
    this.closeMenus();
    this.listMessage = "";
    this.renderView();
  }

  private openDeleteModal(classId: number): void {
    const classroom = this.classes.find((item) => item.id === classId);
    if (classroom === undefined) {
      return;
    }

    this.isCreateModalOpen = false;
    this.isImportModalOpen = false;
    this.editTarget = null;
    this.clearActionTargets();
    this.closeMenus();
    this.deleteTarget = { id: classroom.id, name: classroom.name };
    this.renderView();
  }

  private openRemoveStudentModal(studentId: number): void {
    const target = this.findStudentActionTarget(studentId);
    if (target === null) {
      return;
    }

    this.openMenuStudentId = null;
    this.resetPasswordTarget = null;
    this.generatedStudentPassword = null;
    this.removeStudentTarget = target;
    this.listMessage = "";
    this.renderView();
  }

  private openResetPasswordModal(studentId: number): void {
    const target = this.findStudentActionTarget(studentId);
    if (target === null) {
      return;
    }

    this.openMenuStudentId = null;
    this.removeStudentTarget = null;
    this.resetPasswordTarget = target;
    this.generatedStudentPassword = null;
    this.listMessage = "";
    this.renderView();
  }

  private openStudentProgress(studentId: number): void {
    if (this.selectedClassId === null) {
      return;
    }

    const summary = this.progressRows.find((item) => (item.user?.id ?? item.userId) === studentId);
    if (summary === undefined) {
      return;
    }

    this.studentViewContext = {
      userId: studentId,
      classId: this.selectedClassId,
      summary
    };
    this.closeMenus();
    this.renderView();
  }

  private closeClassFormModal(mode: ClassFormModalMode): void {
    if (mode === "create") {
      this.closeCreateModal();
      return;
    }

    this.closeEditModal();
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

  private async createClass(values: ClassFormValues): Promise<void> {
    const name = values.name.trim();
    const description = values.description?.trim() ?? "";
    const level = values.level?.trim() ?? "";

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
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Création impossible.";
    } finally {
      this.isCreating = false;
      this.renderView();
    }
  }

  private async submitClassUpdate(values: ClassFormValues): Promise<void> {
    if (this.editTarget === null) {
      return;
    }

    const name = values.name.trim();
    const description = values.description?.trim() ?? "";
    const level = values.level?.trim() ?? "";

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

  private async submitStudentsImport(file: File | null): Promise<void> {
    if (this.selectedClassId === null || this.isImporting) {
      return;
    }

    if (file === null || file.size === 0) {
      this.listMessage = "Sélectionnez un fichier CSV avant de lancer l'import.";
      this.renderView();
      return;
    }

    if (!file.name.toLocaleLowerCase("fr-FR").endsWith(".csv")) {
      this.listMessage = "Le fichier sélectionné doit être au format .csv.";
      this.renderView();
      return;
    }

    let csvContent = "";
    try {
      csvContent = await file.text();
    } catch {
      this.listMessage = "Impossible de lire le fichier CSV sélectionné.";
      this.renderView();
      return;
    }

    const validation = validateStudentsImportCsv(csvContent);
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
      downloadCsvFile(download.content, download.filename);
      this.progressRows = await this.services.teacherClasses.listStudentsProgress(this.selectedClassId);
      this.isImportModalOpen = false;
      this.listMessage = "Import terminé. Le fichier des comptes créés a été téléchargé.";
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Import impossible.";
    } finally {
      this.isImporting = false;
      this.renderView();
    }
  }

  private async openExportModal(): Promise<void> {
    if (this.selectedClassId === null || this.isExporting) {
      return;
    }

    this.isExportModalOpen = true;
    this.isLoadingExportChapters = true;
    this.exportChapters = [];
    this.listMessage = "";
    this.renderView();

    try {
      const chapters = await this.services.teacherClasses.listChaptersForExport();
      this.exportChapters = chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title
      }));
    } catch {
      this.exportChapters = [];
      this.listMessage = "Impossible de charger la liste des chapitres.";
    } finally {
      this.isLoadingExportChapters = false;
      this.renderView();
    }
  }

  private closeExportModal(): void {
    if (this.isExporting) {
      return;
    }

    this.isExportModalOpen = false;
    this.exportChapters = [];
    this.isLoadingExportChapters = false;
    this.listMessage = "";
    this.renderView();
  }

  private async exportClassProgress(
    mode: ClassManagementExportSubmitDetail["mode"] = "overview",
    chapterId?: number
  ): Promise<void> {
    if (this.selectedClassId === null || this.isExporting) {
      return;
    }

    if (mode === "chapter" && chapterId === undefined) {
      this.listMessage = "Sélectionnez un chapitre.";
      this.renderView();
      return;
    }

    this.isExporting = true;
    this.listMessage = "";
    this.renderView();

    try {
      const download = await this.services.teacherClasses.exportStudentsProgressCsv(
        this.selectedClassId,
        mode,
        chapterId
      );
      downloadCsvFile(download.content, download.filename);
      this.isExportModalOpen = false;
      this.exportChapters = [];
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Export impossible.";
    } finally {
      this.isExporting = false;
      this.isLoadingExportChapters = false;
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

  private mountConfirmationModals(): void {
    const host = this.query<HTMLElement>("[data-confirmation-modals]");
    if (host === null) {
      return;
    }

    this.buildConfirmationModalConfigs().forEach((config) => {
      this.mountConfirmationModal(host, config);
    });
  }

  private buildConfirmationModalConfigs(): ConfirmationModalConfig[] {
    const configs: ConfirmationModalConfig[] = [];

    if (this.deleteTarget !== null) {
      configs.push(buildClassDeleteConfirmationConfig(this.deleteTarget, this.listMessage, this.isDeleting));
    }

    if (this.resetPasswordTarget !== null) {
      configs.push(buildStudentPasswordResetConfirmationConfig(
        this.resetPasswordTarget,
        this.generatedStudentPassword,
        this.listMessage,
        this.isResettingPassword
      ));
    }

    if (this.removeStudentTarget !== null) {
      configs.push(buildStudentRemovalConfirmationConfig(
        this.removeStudentTarget,
        this.listMessage,
        this.isRemovingStudent
      ));
    }

    return configs;
  }

  private mountConfirmationModal(host: HTMLElement, config: ConfirmationModalConfig): void {
    const container = document.createElement("div");
    host.append(container);

    const modal = new ConfirmationModalComponent(container, config);
    this.confirmationModals.push(modal);
    this.listenTo(container, CONFIRMATION_MODAL_ACTION_EVENT, (event) => {
      const detail = (event as CustomEvent<ConfirmationModalActionDetail>).detail;
      this.handleConfirmationModalAction(detail);
    });
    modal.init();
  }

  private handleConfirmationModalAction(detail: ConfirmationModalActionDetail): void {
    if (detail.modalId === "delete-class") {
      if (detail.action === "confirm") {
        void this.confirmDeleteClass();
      } else if (!this.isDeleting) {
        this.closeDeleteModal();
      }
      return;
    }

    if (detail.modalId === "remove-student") {
      if (detail.action === "confirm") {
        void this.confirmRemoveStudent();
      } else if (!this.isRemovingStudent) {
        this.closeRemoveStudentModal();
      }
      return;
    }

    if (detail.modalId === "reset-student-password") {
      if (detail.action === "confirm") {
        void this.confirmResetStudentPassword();
      } else if (!this.isResettingPassword) {
        this.closeResetPasswordModal();
      }
    }
  }

  private clearConfirmationModals(): void {
    while (this.confirmationModals.length > 0) {
      this.confirmationModals.pop()?.destroy();
    }
  }

  private clearStudentProgressView(): void {
    this.studentProgressView?.destroy();
    this.studentProgressView = null;
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
      name: formatStudentName(row),
      username: row.user?.username?.trim() || "Non renseigné"
    };
  }

  private getSelectedClass(): Classroom | null {
    return this.classes.find((item) => item.id === this.selectedClassId) ?? null;
  }

  private classroomToFormValues(classroom: Classroom): ClassFormValues {
    return {
      name: classroom.name,
      description: classroom.description ?? null,
      level: classroom.level ?? null
    };
  }

  private clearActionTargets(): void {
    this.removeStudentTarget = null;
    this.resetPasswordTarget = null;
    this.generatedStudentPassword = null;
  }

  private closeMenus(): void {
    this.openMenuClassId = null;
    this.openMenuStudentId = null;
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
}
