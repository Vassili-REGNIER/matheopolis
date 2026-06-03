import { BaseComponent } from "../../../BaseComponent.js";
import type { Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class ClassManagementComponent extends BaseComponent {
  private classes: Classroom[] = [];
  private selectedClassId: number | null = null;
  private progressRows: StudentChapterProgressSummary[] = [];

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
    const form = this.query<HTMLFormElement>(".class-form");
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

  private async createClass(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (name.length === 0) {
      return;
    }

    try {
      const classroom = await this.services.teacherClasses.createClass({
        name,
        description: description || null
      });
      this.classes = [classroom, ...this.classes.filter((item) => item.id !== classroom.id)];
      form.reset();
      this.renderView();
    } catch (error) {
      this.renderView(error instanceof Error ? error.message : "Creation impossible.");
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

  private renderView(message = ""): void {
    const selected = this.classes.find((item) => item.id === this.selectedClassId) ?? null;
    this.render(`
      <header class="view-header">
        ${selected !== null ? `<button class="back-classes" type="button">${icon("arrowLeft")}</button>` : ""}
        <div>
          <p>Classes</p>
          <h1>${selected === null ? "Mes Classes" : escapeHtml(selected.name)}</h1>
          <span>${selected === null ? "Selectionnez une classe pour voir les progressions." : `Code : ${escapeHtml(selected.code ?? "Non renseigne")}`}</span>
        </div>
      </header>
      ${selected === null ? this.classListTemplate(message) : this.classDetailTemplate(selected)}
    `, this.style());
    this.bindEvents();
  }

  private classListTemplate(message: string): string {
    return `
      <form class="class-form">
        <div class="form-grid">
          <label>
            <span>Nom de la classe</span>
            <input name="name" placeholder="Ex : 4eme C" required>
          </label>
          <label>
            <span>Description</span>
            <input name="description" placeholder="Groupe pilote">
          </label>
          <button type="submit">${icon("plus")} Creer une classe</button>
        </div>
        <p class="message">${escapeHtml(message)}</p>
      </form>
      <div class="class-grid">
        ${this.classes.length === 0 ? `
          <article class="empty">${icon("users")}<p>Aucune classe creee.</p></article>
        ` : this.classes.map((classroom) => `
          <article class="class-card">
            <button type="button" data-class-id="${classroom.id}" aria-label="Ouvrir ${escapeHtml(classroom.name)}">
              <span class="class-icon">${icon("users")}</span>
              <span class="class-title">${escapeHtml(classroom.name)}</span>
              <span class="class-code">${escapeHtml(classroom.code ?? "Sans code")}</span>
              ${icon("chevronRight")}
            </button>
          </article>
        `).join("")}
      </div>
    `;
  }

  private classDetailTemplate(classroom: Classroom): string {
    return `
      <section class="detail-panel">
        <div class="detail-top">
          <article><span>Code</span><strong>${escapeHtml(classroom.code ?? "Non renseigne")}</strong></article>
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

  private style(): string {
    return `
      :host .view-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host label span,
      :host .detail-top span {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0 0 6px;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .back-classes {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.68);
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .class-form {
        margin-bottom: 22px;
        padding: 18px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .form-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: 12px;
        align-items: end;
      }

      :host label {
        display: grid;
        gap: 7px;
      }

      :host input {
        height: 44px;
        padding: 0 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .class-form button {
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
      }

      :host .message {
        min-height: 20px;
        margin: 10px 0 0;
        color: var(--matheo-danger);
      }

      :host .class-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      :host .class-card,
      :host .empty,
      :host .detail-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
        overflow: hidden;
      }

      :host .class-card button {
        width: 100%;
        min-height: 168px;
        display: grid;
        grid-template-columns: 1fr auto;
        align-content: start;
        gap: 8px;
        padding: 20px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
      }

      :host .class-card button:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-icon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .class-title {
        grid-column: 1 / -1;
        margin-top: 10px;
        font-size: 1.2rem;
        font-weight: 900;
      }

      :host .class-code {
        color: rgba(250, 249, 246, 0.58);
        font-family: Consolas, monospace;
        font-size: 0.85rem;
      }

      :host .empty {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 22px;
        color: rgba(250, 249, 246, 0.62);
      }

      :host .detail-panel {
        padding: 22px;
      }

      :host .detail-top {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
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
        :host .class-grid,
        :host .detail-top {
          grid-template-columns: 1fr;
        }

        :host .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
