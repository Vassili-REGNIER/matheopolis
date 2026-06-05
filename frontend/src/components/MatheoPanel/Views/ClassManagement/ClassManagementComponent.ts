import { BaseComponent } from "../../../BaseComponent.js";
import type { ClassLevel, Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../services/AppServices.js";
import type { ClassManagementOptions, StudentProgressViewContext } from "../../../../models/ClassManagement.js";
import { ProgressComponent } from "../Progress/ProgressComponent.js";
import { escapeHtml, clampPercent, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

const CLASS_LEVELS: Array<{ value: ClassLevel; label: string }> = [
  { value: "grade_6", label: "6e" },
  { value: "grade_7", label: "5e" },
  { value: "grade_8", label: "4e" },
  { value: "grade_9", label: "3e" },
  { value: "grade_10", label: "Seconde" },
  { value: "grade_11", label: "Premiere" },
  { value: "grade_12", label: "Terminale" }
];

export class ClassManagementComponent extends BaseComponent {
  private classes: Classroom[] = [];
  private selectedClassId: number | null = null;
  private progressRows: StudentChapterProgressSummary[] = [];
  private isCreateModalOpen = false;
  private isCreating = false;
  private editTarget: Classroom | null = null;
  private isUpdating = false;
  private openMenuClassId: number | null = null;
  private deleteTarget: { id: number; name: string } | null = null;
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
    this.render(`<div class="view-loading">Chargement des classes...</div>`, this.style());
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
      this.render(`<div class="student-progress-host" data-student-progress-host></div>`, this.style());
      this.mountStudentProgressView();
      return;
    }

    const selected = this.classes.find((item) => item.id === this.selectedClassId) ?? null;
    this.render(`
      <header class="view-header">
        ${selected !== null ? `<button class="back-classes" type="button">${icon("arrowLeft")}</button>` : ""}
        <div class="view-header-copy">
          <p>Classes</p>
          <h1>${selected === null ? "Mes Classes" : escapeHtml(selected.name)}</h1>
          <span>${selected === null
            ? "Consultez vos groupes et leurs progressions."
            : ``}</span>
        </div>
        ${selected === null ? `
          <button class="open-create-modal" type="button">
            ${icon("plus")}
            Nouvelle classe
          </button>
        ` : `
          <div class="view-header-menu">
            ${this.classMenuTemplate(selected.id)}
          </div>
        `}
      </header>
      ${selected === null ? this.classListTemplate() : this.classDetailTemplate(selected)}
      ${this.isCreateModalOpen ? this.createModalTemplate() : ""}
      ${this.editTarget !== null ? this.editModalTemplate() : ""}
      ${this.deleteTarget !== null ? this.deleteModalTemplate() : ""}
    `, this.style());
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

  private classListTemplate(): string {
    return `
      ${this.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(this.listMessage)}</p>` : ""}
      <div class="class-grid">
        ${this.classes.length === 0 ? `
          <article class="empty-state">
            ${icon("users")}
            <div>
              <h2>Aucune classe pour le moment</h2>
              <p>Creez votre premiere classe pour generer un code d'inscription eleve.</p>
              <button class="open-create-modal" type="button">${icon("plus")} Creer une classe</button>
            </div>
          </article>
        ` : this.classes.map((classroom) => this.classCardTemplate(classroom)).join("")}
      </div>
    `;
  }

  private classCardTemplate(classroom: Classroom): string {
    const isArchived = classroom.archivedAt !== null && classroom.archivedAt !== undefined;
    const description = classroom.description?.trim() ?? "";
    const descriptionPreview = description.length > 90
      ? `${description.slice(0, 90)}...`
      : description;

    return `
      <article class="class-card ${isArchived ? "is-archived" : ""}">
        <div class="class-card-menu-wrap">
          ${this.classMenuTemplate(classroom.id)}
        </div>
        <button class="class-card-open" type="button" data-class-id="${classroom.id}" aria-label="Ouvrir ${escapeHtml(classroom.name)}">
          <div class="class-card-head">
            <span class="class-icon">${icon("users")}</span>
            <div class="class-card-title-row">
              <h2>${escapeHtml(classroom.name)}</h2>
              <div class="class-card-badges">
                <span class="class-level">${escapeHtml(this.formatLevel(classroom.level))}</span>
                ${isArchived ? `<span class="class-badge">Archivee</span>` : ""}
              </div>
            </div>
            <span class="class-card-action">${icon("chevronRight")}</span>
          </div>
          <p class="class-description">${descriptionPreview.length > 0 ? escapeHtml(descriptionPreview) : ""}</p>
          <div class="class-card-meta">
            <div>
              <span>Code</span>
              <strong>${escapeHtml(classroom.code ?? "Non renseigne")}</strong>
            </div>
            <div class="class-card-date">
              <span>Creee le</span>
              <strong>${escapeHtml(this.formatCreatedAt(classroom.createdAt))}</strong>
            </div>
          </div>
        </button>
      </article>
    `;
  }

  private classMenuTemplate(classId: number): string {
    const isOpen = this.openMenuClassId === classId;

    return `
      <button
        class="class-menu-trigger"
        type="button"
        data-menu-class-id="${classId}"
        aria-label="Actions de la classe"
        aria-expanded="${isOpen ? "true" : "false"}"
      >
        ${icon("moreVertical")}
      </button>
      ${isOpen ? `
        <div class="class-menu" role="menu">
          <button
            class="class-menu-item"
            type="button"
            data-edit-class-id="${classId}"
            role="menuitem"
          >
            Modifier
          </button>
          <button
            class="class-menu-item class-menu-item-danger"
            type="button"
            data-delete-class-id="${classId}"
            role="menuitem"
          >
            Supprimer
          </button>
        </div>
      ` : ""}
    `;
  }

  private deleteModalTemplate(): string {
    if (this.deleteTarget === null) {
      return "";
    }

    return `
      <div class="create-modal delete-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-class-title">
          <header class="modal-header">
            <div>
              <p>Suppression</p>
              <h2 id="delete-class-title">Supprimer cette classe ?</h2>
            </div>
            <button class="modal-close" type="button" data-close-delete-modal aria-label="Fermer" ${this.isDeleting ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <p class="delete-modal-copy">
            La classe <strong>${escapeHtml(this.deleteTarget.name)}</strong> sera supprimée.
            Cette action est reversible uniquement par l'administration.
          </p>
          ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-delete-modal ${this.isDeleting ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit modal-submit-danger" type="button" data-confirm-delete ${this.isDeleting ? "disabled" : ""}>
              ${this.isDeleting ? "Suppression..." : `${icon("trash")} Supprimer`}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private levelOptionsTemplate(selectedLevel?: string | null): string {
    return CLASS_LEVELS.map((entry) => `
      <option value="${entry.value}" ${entry.value === selectedLevel ? "selected" : ""}>${entry.label}</option>
    `).join("");
  }

  private classFormFieldsTemplate(
    isDisabled: boolean,
    values?: { name: string; description: string | null; level?: string | null }
  ): string {
    const name = values?.name ?? "";
    const description = values?.description?.trim() ?? "";
    const level = values?.level;

    return `
      <label>
        <span>Nom de la classe</span>
        <input name="name" value="${escapeHtml(name)}" placeholder="Ex : 6eme A" maxlength="120" required ${isDisabled ? "disabled" : ""}>
      </label>
      <label>
        <span>Niveau</span>
        <select name="level" required ${isDisabled ? "disabled" : ""}>
          <option value="">Selectionnez un niveau</option>
          ${this.levelOptionsTemplate(level)}
        </select>
      </label>
      <label>
        <span>Description</span>
        <textarea name="description" rows="4" placeholder="Groupe pilote, objectifs, remarques..." ${isDisabled ? "disabled" : ""}>${escapeHtml(description)}</textarea>
      </label>
    `;
  }

  private createModalTemplate(): string {
    return `
      <div class="create-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="create-class-title">
          <header class="modal-header">
            <div>
              <p>Nouvelle classe</p>
              <h2 id="create-class-title">Creer une classe</h2>
            </div>
            <button class="modal-close" type="button" data-close-modal aria-label="Fermer">${icon("x")}</button>
          </header>
          <form class="class-form" data-form="create">
            ${this.classFormFieldsTemplate(this.isCreating)}
            ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
            <div class="modal-actions">
              <button class="modal-cancel" type="button" data-close-modal ${this.isCreating ? "disabled" : ""}>Annuler</button>
              <button class="modal-submit" type="submit" ${this.isCreating ? "disabled" : ""}>
                ${this.isCreating ? "Creation..." : `${icon("plus")} Creer la classe`}
              </button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  private editModalTemplate(): string {
    if (this.editTarget === null) {
      return "";
    }

    const classroom = this.editTarget;

    return `
      <div class="create-modal edit-modal" role="presentation">
        <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-class-title">
          <header class="modal-header">
            <div>
              <p>Modification</p>
              <h2 id="edit-class-title">Modifier la classe</h2>
            </div>
            <button class="modal-close" type="button" data-close-edit-modal aria-label="Fermer" ${this.isUpdating ? "disabled" : ""}>
              ${icon("x")}
            </button>
          </header>
          <form class="class-form" data-form="edit">
            ${this.classFormFieldsTemplate(this.isUpdating, classroom)}
            ${this.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(this.listMessage)}</p>` : ""}
            <div class="modal-actions">
              <button class="modal-cancel" type="button" data-close-edit-modal ${this.isUpdating ? "disabled" : ""}>
                Annuler
              </button>
              <button class="modal-submit" type="submit" ${this.isUpdating ? "disabled" : ""}>
                ${this.isUpdating ? "Enregistrement..." : `${icon("check")} Enregistrer`}
              </button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  private classDetailTemplate(classroom: Classroom): string {
    const code = classroom.code?.trim() ?? "";

    return `
      <section class="detail-panel">
        <div class="detail-top">
          <article class="detail-stat detail-stat-code">
            <span>Code</span>
            ${code.length > 0 ? `
              <button
                type="button"
                class="detail-code-copy ${this.codeCopied ? "is-copied" : ""}"
                data-copy-class-code="${escapeHtml(code)}"
                title="Copier le code d'inscription"
              >
                <strong>${escapeHtml(code)}</strong>
                <span class="detail-code-copy-action">
                  ${icon(this.codeCopied ? "check" : "copy")}
                  ${this.codeCopied ? "Copie !" : "Copier"}
                </span>
              </button>
            ` : `<strong class="detail-stat-empty">Non renseigne</strong>`}
          </article>
          <article class="detail-stat">
            <span>Niveau</span>
            <strong>${escapeHtml(this.formatLevel(classroom.level))}</strong>
          </article>
          <article class="detail-stat">
            <span>Creation</span>
            <strong>${escapeHtml(this.formatCreatedAt(classroom.createdAt))}</strong>
          </article>
          <article class="detail-stat">
            <span>Eleves suivis</span>
            <strong>${this.progressRows.length}</strong>
          </article>
        </div>
        <div class="table-wrap">
          <table class="students-progress-table">
            <thead>
              <tr>
                <th>Eleve</th>
                <th>Identifiant</th>
                <th>Progression globale</th>
                <th>Derniere activite</th>
              </tr>
            </thead>
            <tbody>
              ${this.progressRows.length === 0 ? `
                <tr><td colspan="4">Aucun eleve inscrit dans cette classe.</td></tr>
              ` : this.progressRows.map((row) => {
                const userId = row.user?.id ?? row.userId;
                const studentName = this.formatStudentName(row);

                return `
                <tr
                  class="student-row"
                  data-student-id="${userId ?? ""}"
                  tabindex="0"
                  role="button"
                  aria-label="Voir la progression de ${escapeHtml(studentName)}"
                >
                  <td class="student-name">${escapeHtml(studentName)}</td>
                  <td class="student-username">${escapeHtml(this.formatStudentUsername(row))}</td>
                  <td>${this.progressCellTemplate(row.completionRate)}</td>
                  <td class="student-last-activity">${escapeHtml(this.formatLastActivity(row.lastActivityAt))}</td>
                </tr>
              `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  private formatStudentName(row: StudentChapterProgressSummary): string {
    if (row.user !== undefined) {
      return `${row.user.firstName} ${row.user.lastName}`.trim();
    }

    return `Eleve #${row.userId ?? "?"}`;
  }

  private formatStudentUsername(row: StudentChapterProgressSummary): string {
    const username = row.user?.username?.trim();
    if (username !== undefined && username.length > 0) {
      return username;
    }

    return "Non renseigne";
  }

  private formatLastActivity(value: string | null): string {
    if (value === null || value.trim() === "") {
      return "Aucune activite";
    }

    return formatDate(value);
  }

  private progressCellTemplate(completionRate: number): string {
    const percent = clampPercent(Math.round(completionRate));

    return `
      <div class="student-progress">
        <div class="student-progress-bar" aria-hidden="true">
          <span style="width: ${percent}%"></span>
        </div>
        <strong>${percent}%</strong>
      </div>
    `;
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

  private formatLevel(level: Classroom["level"]): string {
    if (level === null || level === undefined || level === "") {
      return "Niveau non renseigne";
    }

    const match = CLASS_LEVELS.find((entry) => entry.value === level);
    return match?.label ?? String(level);
  }

  private formatCreatedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return formatDate(value);
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  private style(): string {
    return `
      :host {
        display: block;
        min-width: 0;
        max-width: 100%;
      }

      :host .view-loading,
      :host .list-message,
      :host .modal-message {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .list-message,
      :host .modal-message {
        margin: 0 0 18px;
        color: var(--matheo-danger);
      }

      :host .view-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }

      :host .view-header-copy {
        flex: 1;
        min-width: 0;
      }

      :host .view-header p,
      :host .class-form label span,
      :host .detail-top span,
      :host .modal-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1,
      :host .modal-header h2 {
        margin: 0 0 6px;
        color: #fff;
      }

      :host .view-header h1 {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .open-create-modal,
      :host .modal-submit,
      :host .empty-state button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
        white-space: nowrap;
      }

      :host .back-classes,
      :host .modal-close,
      :host .modal-cancel {
        border: 0;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
      }

      :host .back-classes {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 10px;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .class-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        align-items: stretch;
        gap: 16px;
      }

      :host .class-card,
      :host .empty-state,
      :host .detail-panel,
      :host .create-modal-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .class-card {
        position: relative;
        display: flex;
        min-width: 0;
        height: 100%;
      }

      :host .class-card-menu-wrap,
      :host .view-header-menu {
        position: relative;
        z-index: 3;
      }

      :host .class-card:has(.class-menu-trigger[aria-expanded="true"]) {
        z-index: 4;
      }

      :host .class-card-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
      }

      :host .class-menu-trigger {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.82);
        cursor: pointer;
      }

      :host .class-menu-trigger:hover,
      :host .class-menu-trigger[aria-expanded="true"] {
        background: rgba(212, 175, 55, 0.18);
        color: #fff;
      }

      :host .class-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 10;
        min-width: 168px;
        padding: 8px;
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 12px;
        background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
        box-shadow:
          0 18px 40px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(212, 175, 55, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      :host .class-menu-item {
        width: 100%;
        min-height: 40px;
        display: block;
        padding: 0 12px;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        color: #f8fafc;
        font-size: 0.92rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      :host .class-menu-item + .class-menu-item {
        margin-top: 4px;
      }

      :host .class-menu-item:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      :host .class-menu-item:disabled {
        color: rgba(250, 249, 246, 0.38);
        cursor: not-allowed;
      }

      :host .class-menu-item-danger {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.14);
      }

      :host .class-menu-item-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .class-card-open {
        width: 100%;
        min-width: 0;
        min-height: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1.35em auto;
        gap: 12px;
        padding: 18px 52px 18px 20px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .class-card-open:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-card.is-archived {
        opacity: 0.72;
      }

      :host .class-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }

      :host .class-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        flex: none;
      }

      :host .class-card-title-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      :host .class-card h2 {
        margin: 0;
        width: 100%;
        min-width: 0;
        font-size: 1.3rem;
        font-weight: 900;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .class-card-badges {
        display: inline-flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 6px;
        flex: none;
      }

      :host .class-level {
        display: inline-flex;
        align-items: center;
        flex: none;
        min-height: 28px;
        padding: 0 11px;
        border-radius: 999px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .class-badge {
        display: inline-flex;
        align-items: center;
        flex: none;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.62);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .class-description {
        margin: 0;
        min-width: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .class-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
        min-width: 0;
        padding: 12px 14px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-card-meta > div {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      :host .class-card-date {
        text-align: right;
      }

      :host .class-card-meta span {
        margin: 0;
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .class-card-meta strong {
        color: rgba(250, 249, 246, 0.82);
        font-size: 0.92rem;
      }

      :host .class-card-meta > div:first-child strong {
        display: block;
        font-family: Consolas, monospace;
        overflow-wrap: anywhere;
      }

      :host .class-card-date {
        max-width: 100%;
      }

      :host .class-card-date strong {
        display: block;
        white-space: nowrap;
      }

      :host .class-card-action {
        color: rgba(250, 249, 246, 0.38);
        flex: none;
      }

      :host .empty-state {
        grid-column: 1 / -1;
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 28px;
      }

      :host .empty-state .icon {
        width: 42px;
        height: 42px;
        color: var(--matheo-gold);
      }

      :host .empty-state h2 {
        margin: 0 0 8px;
        color: #fff;
      }

      :host .empty-state p {
        margin: 0 0 16px;
        color: rgba(250, 249, 246, 0.62);
      }

      :host .create-modal {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(4px);
      }

      :host .create-modal-panel {
        width: min(560px, 100%);
        padding: 22px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      :host .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }

      :host .modal-header h2 {
        font-size: 1.6rem;
      }

      :host .modal-close {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 10px;
      }

      :host .class-form {
        display: grid;
        gap: 14px;
      }

      :host .class-form label {
        display: grid;
        gap: 7px;
      }

      :host .class-form input,
      :host .class-form select,
      :host .class-form textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .class-form input,
      :host .class-form select {
        min-height: 44px;
      }

      :host .class-form textarea {
        resize: vertical;
        min-height: 110px;
      }

      :host .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
      }

      :host .modal-cancel,
      :host .modal-submit {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 10px;
        font-weight: 800;
      }

      :host .modal-submit-danger {
        background: #dc2626;
        color: #fff;
      }

      :host .modal-submit-danger:hover:not(:disabled) {
        background: #b91c1c;
      }

      :host .delete-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .delete-modal-copy strong {
        color: #fff;
      }

      :host .detail-panel {
        padding: 22px;
      }

      :host .detail-top {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }

      :host .detail-top article {
        padding: 16px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      :host .detail-stat {
        display: grid;
        gap: 8px;
        align-content: start;
        min-width: 0;
      }

      :host .detail-stat > span {
        margin: 0;
      }

      :host .detail-stat strong,
      :host .detail-code-copy strong {
        color: #fff;
        font-size: 1rem;
        line-height: 1.35;
      }

      :host .detail-stat-empty {
        color: rgba(250, 249, 246, 0.72);
      }

      :host .detail-code-copy {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px 12px;
        padding: 10px 12px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.08);
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .detail-code-copy:hover {
        background: rgba(212, 175, 55, 0.14);
        border-color: rgba(212, 175, 55, 0.45);
      }

      :host .detail-code-copy.is-copied {
        border-color: rgba(34, 197, 94, 0.45);
        background: rgba(34, 197, 94, 0.12);
      }

      :host .detail-code-copy strong {
        font-family: Consolas, monospace;
        overflow-wrap: anywhere;
      }

      :host .detail-code-copy-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .detail-code-copy.is-copied .detail-code-copy-action {
        color: #86efac;
      }

      :host .detail-code-copy .icon {
        width: 16px;
        height: 16px;
      }

      :host .student-name {
        color: #fff;
        font-weight: 700;
      }

      :host .student-username {
        font-family: Consolas, monospace;
        color: rgba(250, 249, 246, 0.82);
        overflow-wrap: anywhere;
      }

      :host .student-row {
        cursor: pointer;
      }

      :host .student-row:hover,
      :host .student-row:focus-visible {
        background: rgba(212, 175, 55, 0.08);
        outline: none;
      }

      :host .student-row:hover .student-name,
      :host .student-row:focus-visible .student-name {
        color: var(--matheo-gold);
      }

      :host .student-last-activity {
        white-space: nowrap;
      }

      :host .student-progress {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-width: 180px;
        max-width: 280px;
      }

      :host .student-progress-bar {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
      }

      :host .student-progress-bar > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(212, 175, 55, 0.85), rgba(212, 175, 55, 1));
      }

      :host .student-progress strong {
        color: #fff;
        font-size: 0.92rem;
        white-space: nowrap;
      }

      :host .students-progress-table td:first-child {
        min-width: 160px;
      }

      :host .table-wrap {
        overflow-x: auto;
      }

      :host table {
        width: 100%;
        border-collapse: collapse;
      }

      :host th,
      :host td {
        padding: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        text-align: left;
      }

      :host th {
        color: var(--matheo-gold);
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host td {
        color: rgba(250, 249, 246, 0.78);
      }

      @media (max-width: 1040px) {
        :host .detail-top {
          grid-template-columns: 1fr;
        }

        :host .view-header {
          flex-direction: column;
        }
      }

      @media (max-width: 680px) {
        :host .class-grid {
          grid-template-columns: 1fr;
        }

        :host .class-card-meta {
          grid-template-columns: 1fr auto;
        }

        :host .class-card-date {
          text-align: right;
        }
      }
    `;
  }
}
