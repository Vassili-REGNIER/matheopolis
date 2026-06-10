import { BaseComponent } from "../../../../BaseComponent.js";
import type {
  ClassManagementExportSubmitDetail,
  ProgressExportModalData
} from "../../../../../models/components/ClassManagement.js";
import {
  CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT,
  CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT
} from "../../../../../models/components/ClassManagement.js";
import { progressExportModalTemplate } from "../ClassManagementComponent.template.js";

type ExportFormMode = "overview" | "chapter" | "quiz" | "quiz_detail";
type QuizDetailVisibility = "public" | "private";

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
        if (!this.isExportFormMode(modeRaw)) {
          return;
        }

        const mode = modeRaw;
        const chapterRaw = formData.get("chapterId");
        const chapterId = typeof chapterRaw === "string" && chapterRaw.length > 0
          ? Number.parseInt(chapterRaw, 10)
          : null;
        const visibilityRaw = formData.get("quizVisibility");
        const visibility = this.isQuizDetailVisibility(visibilityRaw) ? visibilityRaw : null;
        const quizRaw = formData.get("quizId");
        const quizId = typeof quizRaw === "string" && quizRaw.length > 0
          ? Number.parseInt(quizRaw, 10)
          : null;

        if (mode === "chapter" && (chapterId === null || Number.isNaN(chapterId))) {
          return;
        }
        if (mode === "quiz_detail" && (visibility === null || quizId === null || Number.isNaN(quizId))) {
          return;
        }

        this.emit<ClassManagementExportSubmitDetail>(CLASS_MANAGEMENT_EXPORT_SUBMIT_EVENT, {
          mode: mode === "quiz_detail"
            ? visibility === "public" ? "quiz_public_detail" : "quiz_private_detail"
            : mode,
          chapterId: mode === "chapter" ? chapterId : null,
          quizId: mode === "quiz_detail" ? quizId : null
        });
      });
    }

    const modeInputs = this.queryAll<HTMLInputElement>('input[name="exportMode"]');
    modeInputs.forEach((input) => {
      this.listen(input, "change", () => {
        this.updateFormState();
      });
    });

    const chapterSelect = this.query<HTMLSelectElement>('select[name="chapterId"]');
    if (chapterSelect !== null) {
      this.listen(chapterSelect, "change", () => {
        this.updateFormState();
      });
    }

    const visibilityInputs = this.queryAll<HTMLInputElement>('input[name="quizVisibility"]');
    visibilityInputs.forEach((input) => {
      this.listen(input, "change", () => {
        this.updateFormState();
      });
    });

    const quizSelect = this.query<HTMLSelectElement>('select[name="quizId"]');
    if (quizSelect !== null) {
      this.listen(quizSelect, "change", () => {
        this.updateFormState();
      });
    }

    this.updateFormState();
  }

  private updateFormState(): void {
    const selected = this.query<HTMLInputElement>('input[name="exportMode"]:checked');
    const chapterField = this.query<HTMLElement>("[data-export-chapter-field]");
    const quizVisibilityField = this.query<HTMLElement>("[data-export-quiz-visibility-field]");
    const quizField = this.query<HTMLElement>("[data-export-quiz-field]");
    const chapterSelect = this.query<HTMLSelectElement>('select[name="chapterId"]');
    const quizSelect = this.query<HTMLSelectElement>('select[name="quizId"]');
    const submitButton = this.query<HTMLButtonElement>("[data-export-submit]");
    if (chapterField === null || quizVisibilityField === null || quizField === null || submitButton === null) {
      return;
    }

    const selectedMode = selected?.value ?? null;
    const isChapterMode = selectedMode === "chapter";
    const isQuizDetailMode = selectedMode === "quiz_detail";
    const visibility = isQuizDetailMode ? this.readSelectedQuizVisibility() : null;
    chapterField.hidden = !isChapterMode;
    quizVisibilityField.hidden = !isQuizDetailMode;
    quizField.hidden = !isQuizDetailMode || visibility === null;

    if (!isChapterMode && chapterSelect !== null) {
      chapterSelect.value = "";
    }
    if (!isQuizDetailMode) {
      this.queryAll<HTMLInputElement>('input[name="quizVisibility"]').forEach((input) => {
        input.checked = false;
      });
    }
    this.updateQuizSelect(visibility);

    const hasSelectedMode = this.isExportFormMode(selectedMode);
    const hasChapter = !isChapterMode || (
      chapterSelect !== null
      && chapterSelect.value.length > 0
      && !Number.isNaN(Number.parseInt(chapterSelect.value, 10))
    );
    const hasQuiz = !isQuizDetailMode || (
      visibility !== null
      && quizSelect !== null
      && quizSelect.value.length > 0
      && !Number.isNaN(Number.parseInt(quizSelect.value, 10))
    );

    submitButton.disabled = (
      this.data.isExporting
      || !hasSelectedMode
      || !hasChapter
      || !hasQuiz
      || ((isChapterMode || isQuizDetailMode) && this.data.isLoadingOptions)
    );
  }

  private updateQuizSelect(visibility: QuizDetailVisibility | null): void {
    const quizSelect = this.query<HTMLSelectElement>('select[name="quizId"]');
    if (quizSelect === null) {
      return;
    }

    const currentValue = quizSelect.value;
    const quizzes = visibility === "public"
      ? this.data.publicQuizzes
      : visibility === "private"
        ? this.data.privateQuizzes
        : [];
    const placeholder = this.quizSelectPlaceholder(visibility, quizzes.length);
    quizSelect.replaceChildren(new Option(placeholder, ""));
    quizzes.forEach((quiz) => {
      quizSelect.add(new Option(quiz.title, String(quiz.id)));
    });

    if (quizzes.some((quiz) => String(quiz.id) === currentValue)) {
      quizSelect.value = currentValue;
    }

    quizSelect.disabled = this.data.isExporting || this.data.isLoadingOptions || visibility === null || quizzes.length === 0;
  }

  private quizSelectPlaceholder(visibility: QuizDetailVisibility | null, quizCount: number): string {
    if (this.data.isLoadingOptions) {
      return "Chargement des quiz...";
    }
    if (visibility === null) {
      return "Choisir d'abord Publique ou Privé";
    }
    if (quizCount === 0) {
      return visibility === "public" ? "Aucun quiz public disponible" : "Aucun quiz privé disponible";
    }

    return visibility === "public" ? "Choisir un quiz public" : "Choisir un quiz privé";
  }

  private readSelectedQuizVisibility(): QuizDetailVisibility | null {
    const selected = this.query<HTMLInputElement>('input[name="quizVisibility"]:checked');
    const value = selected?.value ?? null;

    return this.isQuizDetailVisibility(value) ? value : null;
  }

  private isExportFormMode(value: FormDataEntryValue | string | null): value is ExportFormMode {
    return value === "overview" || value === "chapter" || value === "quiz" || value === "quiz_detail";
  }

  private isQuizDetailVisibility(value: FormDataEntryValue | string | null): value is QuizDetailVisibility {
    return value === "public" || value === "private";
  }

  private emitCancel(): void {
    this.emit(CLASS_MANAGEMENT_EXPORT_MODAL_CANCEL_EVENT);
  }
}
