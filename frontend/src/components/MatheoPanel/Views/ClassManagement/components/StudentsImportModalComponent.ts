import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementImportSubmitDetail,
  StudentsImportModalData
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_IMPORT_MODAL_CANCEL_EVENT,
  CLASS_MANAGEMENT_IMPORT_SUBMIT_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { studentsImportModalTemplate } from "../ClassManagementComponent.template.js";

export class StudentsImportModalComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: StudentsImportModalData
  ) {
    super(container, "matheo-students-import-modal");
  }

  public init(): void {
    this.render(studentsImportModalTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-import-modal-cancel]").forEach((button) => {
      this.listen(button, "click", () => {
        this.emitCancel();
      });
    });

    const overlay = this.query<HTMLElement>("[data-import-modal-overlay]");
    if (overlay !== null) {
      this.listen(overlay, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const panel = overlay.querySelector(".create-modal-panel");
        if (panel !== null && panel.contains(target)) {
          return;
        }

        this.emitCancel();
      });
    }

    const form = this.query<HTMLFormElement>("[data-import-form]");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const file = data.get("csvFile");
        this.emit<ClassManagementImportSubmitDetail>(CLASS_MANAGEMENT_IMPORT_SUBMIT_EVENT, {
          file: file instanceof File ? file : null
        });
      });
    }
  }

  private emitCancel(): void {
    if (this.data.isImporting) {
      return;
    }

    this.emit(CLASS_MANAGEMENT_IMPORT_MODAL_CANCEL_EVENT);
  }
}
