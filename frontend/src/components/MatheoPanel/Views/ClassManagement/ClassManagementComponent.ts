import { BaseComponent } from "../../../BaseComponent.js";
import type { ClassLevel, Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
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
  private listMessage = "";

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-class-management-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement des classes...</div>`, this.style());
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.classes = await this.services.teacherClasses.listMyClasses();
    } catch {
      this.classes = this.services.teacherClasses.listCachedClasses();
    }
    this.renderView();
  }

  protected bindEvents(): void {
    const openModal = this.query<HTMLButtonElement>(".open-create-modal");
    if (openModal !== null) {
      this.listen(openModal, "click", () => {
        this.isCreateModalOpen = true;
        this.listMessage = "";
        this.renderView();
      });
    }

    const modal = this.query<HTMLElement>(".create-modal");
    if (modal !== null) {
      this.listen(modal, "click", (event) => {
        if (event.target === modal) {
          this.closeCreateModal();
        }
      });
    }

    const closeButtons = this.queryAll<HTMLButtonElement>("[data-close-modal]");
    closeButtons.forEach((button) => {
      this.listen(button, "click", () => {
        this.closeCreateModal();
      });
    });

    const form = this.query<HTMLFormElement>(".create-class-form");
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
          void this.selectClass(id);
        }
      });
    });

    const back = this.query<HTMLButtonElement>(".back-classes");
    if (back !== null) {
      this.listen(back, "click", () => {
        this.selectedClassId = null;
        this.progressRows = [];
        this.renderView();
      });
    }
  }

  private closeCreateModal(): void {
    if (this.isCreating) {
      return;
    }
    this.isCreateModalOpen = false;
    this.listMessage = "";
    this.renderView();
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

  private async selectClass(classId: number): Promise<void> {
    this.selectedClassId = classId;
    try {
      this.progressRows = await this.services.teacherClasses.listStudentsProgress(classId);
    } catch {
      this.progressRows = [];
    }
    this.renderView();
  }

  private renderView(): void {
    const selected = this.classes.find((item) => item.id === this.selectedClassId) ?? null;
    this.render(`
      <header class="view-header">
        ${selected !== null ? `<button class="back-classes" type="button">${icon("arrowLeft")}</button>` : ""}
        <div class="view-header-copy">
          <p>Classes</p>
          <h1>${selected === null ? "Mes Classes" : escapeHtml(selected.name)}</h1>
          <span>${selected === null
            ? "Consultez vos groupes et leurs progressions."
            : `Code : ${escapeHtml(selected.code ?? "Non renseigne")}`}</span>
        </div>
        ${selected === null ? `
          <button class="open-create-modal" type="button">
            ${icon("plus")}
            Nouvelle classe
          </button>
        ` : ""}
      </header>
      ${selected === null ? this.classListTemplate() : this.classDetailTemplate(selected)}
      ${this.isCreateModalOpen ? this.createModalTemplate() : ""}
    `, this.style());
    this.bindEvents();
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
        <button type="button" data-class-id="${classroom.id}" aria-label="Ouvrir ${escapeHtml(classroom.name)}">
          <div class="class-card-head">
            <span class="class-icon">${icon("users")}</span>
            <div class="class-card-title-row">
              <h2>${escapeHtml(classroom.name)}</h2>
              <span class="class-level">${escapeHtml(this.formatLevel(classroom.level))}</span>
              ${isArchived ? `<span class="class-badge">Archivee</span>` : ""}
            </div>
            <span class="class-card-action">${icon("chevronRight")}</span>
          </div>
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
          ${descriptionPreview.length > 0 ? `<p class="class-description">${escapeHtml(descriptionPreview)}</p>` : ""}
        </button>
      </article>
    `;
  }

  private createModalTemplate(): string {
    const levelOptions = CLASS_LEVELS.map((entry) => `
      <option value="${entry.value}">${entry.label}</option>
    `).join("");

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
          <form class="create-class-form">
            <label>
              <span>Nom de la classe</span>
              <input name="name" placeholder="Ex : 6eme A" maxlength="120" required ${this.isCreating ? "disabled" : ""}>
            </label>
            <label>
              <span>Niveau</span>
              <select name="level" required ${this.isCreating ? "disabled" : ""}>
                <option value="">Selectionnez un niveau</option>
                ${levelOptions}
              </select>
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" rows="4" placeholder="Groupe pilote, objectifs, remarques..." ${this.isCreating ? "disabled" : ""}></textarea>
            </label>
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

  private classDetailTemplate(classroom: Classroom): string {
    return `
      <section class="detail-panel">
        <div class="detail-top">
          <article><span>Code</span><strong>${escapeHtml(classroom.code ?? "Non renseigne")}</strong></article>
          <article><span>Niveau</span><strong>${escapeHtml(this.formatLevel(classroom.level))}</strong></article>
          <article><span>Creation</span><strong>${escapeHtml(formatDate(classroom.createdAt))}</strong></article>
          <article><span>Eleves suivis</span><strong>${this.progressRows.length}</strong></article>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Eleve</th>
                <th>Demarrees</th>
                <th>Terminees</th>
                <th>Progression</th>
                <th>Derniere activite</th>
              </tr>
            </thead>
            <tbody>
              ${this.progressRows.length === 0 ? `
                <tr><td colspan="5">Aucune progression disponible.</td></tr>
              ` : this.progressRows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.user !== undefined ? `${row.user.firstName} ${row.user.lastName}` : `Eleve #${row.userId ?? "?"}`)}</td>
                  <td>${row.startedChapters}</td>
                  <td>${row.completedChapters}</td>
                  <td>${row.completionRate}%</td>
                  <td>${escapeHtml(formatDate(row.lastActivityAt))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
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
        overflow: hidden;
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
      :host label span,
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
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
        min-width: 0;
        overflow: hidden;
      }

      :host .class-card button {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
        display: grid;
        gap: 14px;
        padding: 18px 20px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        overflow: hidden;
      }

      :host .class-card button:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-card.is-archived {
        opacity: 0.72;
      }

      :host .class-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: center;
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
        align-items: center;
        flex-wrap: nowrap;
        gap: 8px;
        min-width: 0;
        overflow: hidden;
      }

      :host .class-card h2 {
        margin: 0;
        flex: 1 1 auto;
        min-width: 0;
        font-size: 1.3rem;
        font-weight: 900;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

      :host .class-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
        min-width: 0;
        overflow: hidden;
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .class-card-date {
        max-width: 100%;
      }

      :host .class-card-date strong {
        display: block;
        white-space: nowrap;
      }

      :host .class-description {
        margin: 0;
        min-width: 0;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
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

      :host .create-class-form {
        display: grid;
        gap: 14px;
      }

      :host label {
        display: grid;
        gap: 7px;
      }

      :host input,
      :host select,
      :host textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host input,
      :host select {
        min-height: 44px;
      }

      :host textarea {
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

      :host .detail-top strong {
        color: #fff;
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
