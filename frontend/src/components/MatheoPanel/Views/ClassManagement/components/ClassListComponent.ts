import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementClassIdDetail,
  ClassManagementListData
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_CLASS_DELETE_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_EDIT_REQUEST_EVENT,
  CLASS_MANAGEMENT_CLASS_MENU_TOGGLE_EVENT,
  CLASS_MANAGEMENT_CLASS_SELECT_EVENT,
  CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { classManagementListTemplate } from "../ClassManagementComponent.template.js";

export class ClassListComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: ClassManagementListData
  ) {
    super(container, "matheo-class-management-list");
  }

  public init(): void {
    this.render(classManagementListTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-create-class-request]").forEach((button) => {
      this.listen(button, "click", () => {
        this.emit(CLASS_MANAGEMENT_CREATE_CLASS_REQUEST_EVENT);
      });
    });

    this.queryAll<HTMLButtonElement>("[data-class-id]").forEach((button) => {
      this.listen(button, "click", () => {
        const classId = Number.parseInt(button.dataset.classId ?? "", 10);
        if (!Number.isNaN(classId)) {
          this.emit<ClassManagementClassIdDetail>(CLASS_MANAGEMENT_CLASS_SELECT_EVENT, { classId });
        }
      });
    });

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
