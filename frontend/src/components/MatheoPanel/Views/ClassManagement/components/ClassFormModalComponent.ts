import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassFormModalData,
  ClassManagementClassFormCancelDetail,
  ClassManagementClassFormSubmitDetail,
  ClassFormValues
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_CLASS_FORM_CANCEL_EVENT,
  CLASS_MANAGEMENT_CLASS_FORM_SUBMIT_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { classFormModalTemplate } from "../ClassManagementComponent.template.js";

export class ClassFormModalComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: ClassFormModalData
  ) {
    super(container, "matheo-class-form-modal");
  }

  public init(): void {
    this.render(classFormModalTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-class-form-cancel]").forEach((button) => {
      this.listen(button, "click", () => {
        this.emitCancel();
      });
    });

    const overlay = this.query<HTMLElement>("[data-class-form-overlay]");
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

    const form = this.query<HTMLFormElement>("[data-class-form]");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        this.emit<ClassManagementClassFormSubmitDetail>(CLASS_MANAGEMENT_CLASS_FORM_SUBMIT_EVENT, {
          mode: this.data.mode,
          values: this.readValues(form)
        });
      });
    }
  }

  private emitCancel(): void {
    if (this.data.isProcessing) {
      return;
    }

    this.emit<ClassManagementClassFormCancelDetail>(CLASS_MANAGEMENT_CLASS_FORM_CANCEL_EVENT, {
      mode: this.data.mode
    });
  }

  private readValues(form: HTMLFormElement): ClassFormValues {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const level = String(data.get("level") ?? "").trim();

    return {
      name,
      description: description || null,
      level: level || null
    };
  }
}
