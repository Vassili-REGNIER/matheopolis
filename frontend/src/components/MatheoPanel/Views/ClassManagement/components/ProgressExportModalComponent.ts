import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementExportSubmitDetail,
  ProgressExportModalData,
  ProgressExportMode
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT,
  CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { progressExportModalTemplate } from "../ClassManagementComponent.template.js";

export class ProgressExportModalComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly data: ProgressExportModalData
  ) {
    super(container, "matheo-progress-export-modal");
  }

  public init(): void {
    this.render(progressExportModalTemplate(this.data));
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-export-modal-cancel]").forEach((button) => {
      this.listen(button, "click", () => {
        this.emitCancel();
      });
    });

    const overlay = this.query<HTMLElement>("[data-export-modal-overlay]");
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

    const form = this.query<HTMLFormElement>("[data-export-form]");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const modeRaw = formData.get("exportMode");
        const mode = typeof modeRaw === "string" ? modeRaw as ProgressExportMode : "overview";
        const chapterRaw = formData.get("chapterId");
        const chapterId = typeof chapterRaw === "string" && chapterRaw.length > 0
          ? Number.parseInt(chapterRaw, 10)
          : null;

        if (mode === "chapter" && (chapterId === null || Number.isNaN(chapterId))) {
          return;
        }

        this.emit<ClassManagementExportSubmitDetail>(CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT, {
          mode,
          chapterId: mode === "chapter" ? chapterId : null
        });
      });
    }

    const modeInputs = this.queryAll<HTMLInputElement>('input[name="exportMode"]');
    modeInputs.forEach((input) => {
      this.listen(input, "change", () => {
        this.toggleChapterField();
      });
    });
  }

  private toggleChapterField(): void {
    const selected = this.query<HTMLInputElement>('input[name="exportMode"]:checked');
    const chapterField = this.query<HTMLElement>("[data-export-chapter-field]");
    if (chapterField === null || selected === null) {
      return;
    }

    chapterField.hidden = selected.value !== "chapter";
  }

  private emitCancel(): void {
    this.emit(CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT);
  }
}
