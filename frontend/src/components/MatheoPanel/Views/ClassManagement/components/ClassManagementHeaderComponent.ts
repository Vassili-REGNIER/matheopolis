import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementClassIdDetail,
  ClassManagementHeaderData
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_BACK_TO_CLASSES_EVENT,
  CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT,
  CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT,
  CLASS_MANAGEMENT_EXPORT_MODAL_OPEN_EVENT,
  CLASS_MANAGEMENT_IMPORT_MODAL_OPEN_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { classManagementHeaderTemplate } from "../ClassManagementComponent.template.js";

export class ClassManagementHeaderComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: ClassManagementHeaderData
  ) {
    super(container, "matheo-class-management-header");
  }

  public init(): void {
    this.render(classManagementHeaderTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    const backButton = this.query<HTMLButtonElement>("[data-back-classes]");
    if (backButton !== null) {
      this.listen(backButton, "click", () => {
        this.emit(CLASS_MANAGEMENT_BACK_TO_CLASSES_EVENT);
      });
    }

    const createButton = this.query<HTMLButtonElement>("[data-create-class-request]");
    if (createButton !== null) {
      this.listen(createButton, "click", () => {
        this.emit(CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT);
      });
    }

    const importButton = this.query<HTMLButtonElement>("[data-open-import-modal]");
    if (importButton !== null) {
      this.listen(importButton, "click", () => {
        this.emit(CLASS_MANAGEMENT_IMPORT_MODAL_OPEN_EVENT);
      });
    }

    const exportButton = this.query<HTMLButtonElement>("[data-export-progress]");
    if (exportButton !== null) {
      this.listen(exportButton, "click", () => {
        this.emit(CLASS_MANAGEMENT_EXPORT_MODAL_OPEN_EVENT);
      });
    }

    this.bindClassMenuEvents();
  }

  private bindClassMenuEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-menu-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const classId = Number.parseInt(button.dataset.menuClassId ?? "", 10);
        if (!Number.isNaN(classId)) {
          this.emit<ClassManagementClassIdDetail>(CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT, { classId });
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-edit-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const classId = Number.parseInt(button.dataset.editClassId ?? "", 10);
        if (!Number.isNaN(classId)) {
          this.emit<ClassManagementClassIdDetail>(CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT, { classId });
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-delete-class-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const classId = Number.parseInt(button.dataset.deleteClassId ?? "", 10);
        if (!Number.isNaN(classId)) {
          this.emit<ClassManagementClassIdDetail>(CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT, { classId });
        }
      });
    });
  }
}
