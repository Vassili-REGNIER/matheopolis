import { BaseComponent } from "../../../BaseComponent.js";
import type { ClassLevel, Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type { ClassManagementOptions, StudentProgressViewContext } from "../../../../models/ClassManagement.js";
import type { ClassDeleteTarget } from "../../../../models/components/ClassManagement.js";
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
  private openMenuClassId: number | null = null;
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
        this.openMenuClassId = null;
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
        this.isCreateModalOpen = false;
        this.deleteTarget = null;
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
        this.editTarget = null;
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

    const back = this.query<HTMLButtonElement>(".back-classes");
    if (back !== null) {
      this.listen(back, "click", () => {
        this.openMenuClassId = null;
        this.selectedClassId = null;
        this.progressRows = [];
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
        this.renderView();
      };

      this.listen(row, "click", openStudentProgress);
      this.listen(row, "keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openStudentProgress();
        }
      });
    });

    if (this.openMenuClassId !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (target instanceof Element && target.closest(".create-modal") !== null) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(".class-card-menu-wrap, .view-header-menu");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuClassId = null;
          this.renderView();
        }
      });
    }
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

  private closeDeleteModal(): void {
    this.deleteTarget = null;
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

  private async selectClass(classId: number): Promise<void> {
    this.resetCodeCopyFeedback();
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
      openMenuClassId: this.openMenuClassId,
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
}
