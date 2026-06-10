import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementClassCodeDetail,
  ClassManagementDetailData,
  ClassManagementStudentIdDetail
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_CLASS_CODE_COPY_REQUEST_EVENT,
  CLASS_MANAGEMENT_STUDENT_MENU_TOGGLE_EVENT,
  CLASS_MANAGEMENT_STUDENT_PASSWORD_RESET_REQUEST_EVENT,
  CLASS_MANAGEMENT_STUDENT_REMOVE_REQUEST_EVENT,
  CLASS_MANAGEMENT_STUDENT_SELECT_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { classManagementDetailTemplate } from "../ClassManagementComponent.template.js";

export class ClassDetailComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: ClassManagementDetailData
  ) {
    super(container, "matheo-class-management-detail");
  }

  public init(): void {
    this.render(classManagementDetailTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    const copyCodeButton = this.query<HTMLButtonElement>("[data-copy-class-code]");
    if (copyCodeButton !== null) {
      this.listen(copyCodeButton, "click", () => {
        this.emit<ClassManagementClassCodeDetail>(CLASS_MANAGEMENT_CLASS_CODE_COPY_REQUEST_EVENT, {
          code: copyCodeButton.dataset.copyClassCode ?? ""
        });
      });
    }

    this.bindStudentMenuEvents();
    this.bindStudentRows();
  }

  private bindStudentMenuEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-menu-student-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const studentId = Number.parseInt(button.dataset.menuStudentId ?? "", 10);
        if (!Number.isNaN(studentId)) {
          this.emit<ClassManagementStudentIdDetail>(CLASS_MANAGEMENT_STUDENT_MENU_TOGGLE_EVENT, { studentId });
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-remove-student-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const studentId = Number.parseInt(button.dataset.removeStudentId ?? "", 10);
        if (!Number.isNaN(studentId)) {
          this.emit<ClassManagementStudentIdDetail>(CLASS_MANAGEMENT_STUDENT_REMOVE_REQUEST_EVENT, { studentId });
        }
      });
    });

    this.queryAll<HTMLButtonElement>("[data-reset-student-password-id]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const studentId = Number.parseInt(button.dataset.resetStudentPasswordId ?? "", 10);
        if (!Number.isNaN(studentId)) {
          this.emit<ClassManagementStudentIdDetail>(CLASS_MANAGEMENT_STUDENT_PASSWORD_RESET_REQUEST_EVENT, {
            studentId
          });
        }
      });
    });
  }

  private bindStudentRows(): void {
    this.queryAll<HTMLTableRowElement>("[data-student-id]").forEach((row) => {
      const openStudentProgress = (): void => {
        const studentId = Number.parseInt(row.dataset.studentId ?? "", 10);
        if (!Number.isNaN(studentId)) {
          this.emit<ClassManagementStudentIdDetail>(CLASS_MANAGEMENT_STUDENT_SELECT_EVENT, { studentId });
        }
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
  }

  private isStudentActionEvent(event: Event): boolean {
    const target = event.target;
    return target instanceof Element && target.closest(".student-actions-cell") !== null;
  }
}
