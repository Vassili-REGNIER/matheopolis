import { BaseComponent } from "../../../BaseComponent.js";
import type { ClassLevel, Classroom } from "../../../../models/Class.js";
import type { StudentContentItem } from "../../../../models/StudentContentAccess.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { escapeHtml } from "../../../../utils/dom.js";
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

export class StudentContentManagementComponent extends BaseComponent {
  private contentItems: StudentContentItem[] = [];
  private classes: Classroom[] = [];
  private openMenuKey: string | null = null;
  private isLoading = true;
  private listMessage = "";

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-student-content-management-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement du contenu...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {
    this.queryAll<HTMLButtonElement>("[data-content-menu-key]").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.stopPropagation();
        const key = button.dataset.contentMenuKey ?? "";
        if (key.length === 0) {
          return;
        }
        this.openMenuKey = this.openMenuKey === key ? null : key;
        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-access-toggle]").forEach((button) => {
      this.listen(button, "click", async (event) => {
        event.stopPropagation();
        const kind = button.dataset.contentKind;
        const contentId = Number.parseInt(button.dataset.contentId ?? "", 10);
        const classId = Number.parseInt(button.dataset.classId ?? "", 10);
        if (kind !== "chapter" && kind !== "quiz") {
          return;
        }
        if (Number.isNaN(contentId) || Number.isNaN(classId)) {
          return;
        }

        const item = this.contentItems.find((entry) => entry.kind === kind && entry.id === contentId);
        if (item === undefined) {
          return;
        }

        const nextAccess = !this.services.studentContentAccess.isClassAccessEnabled(item, classId);
        try {
          await this.services.studentContentAccess.setClassAccess(item, classId, nextAccess);
          this.listMessage = "";
        } catch (error) {
          this.listMessage = error instanceof Error ? error.message : "Mise a jour impossible.";
        }
        this.renderView();
      });
    });

    if (this.openMenuKey !== null) {
      this.listen(document, "click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const menuContainers = this.queryAll<HTMLElement>(".content-card-menu-wrap");
        const clickedInsideMenu = menuContainers.some((container) => container.contains(target));
        if (!clickedInsideMenu) {
          this.openMenuKey = null;
          this.renderView();
        }
      });
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.renderView();

    try {
      const [contentItems, classes] = await Promise.all([
        this.services.studentContentAccess.listContentItems(),
        this.services.studentContentAccess.listTeacherClasses()
      ]);
      this.contentItems = contentItems;
      this.classes = classes;
      this.listMessage = "";
    } catch (error) {
      this.contentItems = [];
      this.classes = [];
      this.listMessage = error instanceof Error ? error.message : "Chargement impossible.";
    } finally {
      this.isLoading = false;
      this.renderView();
    }
  }

  private renderView(): void {
    if (this.isLoading) {
      this.render(`<div class="view-loading">Chargement du contenu...</div>`, this.style());
      return;
    }

    const chapters = this.contentItems.filter((item) => item.kind === "chapter");
    const quizzes = this.contentItems.filter((item) => item.kind === "quiz");

    this.render(`
      <header class="view-header">
        <p>Contenu eleve</p>
        <h1>Gestion du contenu</h1>
        <span>Autorisez ou restreignez l'acces aux chapitres et QCM pour chaque classe.</span>
      </header>
      ${this.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(this.listMessage)}</p>` : ""}
      ${this.classes.length === 0 ? `
        <p class="empty-copy">Creez au moins une classe pour gerer les acces au contenu.</p>
      ` : ""}
      <section class="content-section">
        <h2>${icon("book")} Chapitres</h2>
        <div class="content-list">
          ${chapters.length === 0 ? `<p class="empty-copy">Aucun chapitre disponible.</p>` : chapters.map((item) => this.contentCardTemplate(item)).join("")}
        </div>
      </section>
      <section class="content-section">
        <h2>${icon("file")} QCM</h2>
        <div class="content-list">
          ${quizzes.length === 0 ? `<p class="empty-copy">Aucun QCM disponible.</p>` : quizzes.map((item) => this.contentCardTemplate(item)).join("")}
        </div>
      </section>
    `, this.style());
    this.bindEvents();
  }

  private contentCardTemplate(item: StudentContentItem): string {
    const menuKey = this.contentKey(item);
    const isOpen = this.openMenuKey === menuKey;
    const itemIcon = item.kind === "chapter" ? "book" : "file";

    return `
      <article class="content-card ${isOpen ? "is-menu-open" : ""}">
        <div class="content-card-menu-wrap">
          <button
            class="content-menu-trigger"
            type="button"
            data-content-menu-key="${menuKey}"
            aria-label="Gerer l'acces pour ${escapeHtml(item.title)}"
            aria-expanded="${isOpen ? "true" : "false"}"
          >
            ${icon("moreVertical")}
          </button>
          ${isOpen ? this.classAccessMenuTemplate(item) : ""}
        </div>
        <button class="content-card-trigger" type="button" data-content-menu-key="${menuKey}">
          <span class="content-icon">${icon(itemIcon)}</span>
          <div class="content-card-copy">
            <p>${item.kind === "chapter" ? "Chapitre" : "QCM"}</p>
            <h3>${escapeHtml(item.title)}</h3>
            ${item.description.length > 0 ? `<span>${escapeHtml(item.description)}</span>` : ""}
          </div>
          <span class="content-card-chevron">${icon("chevronRight")}</span>
        </button>
      </article>
    `;
  }

  private classAccessMenuTemplate(item: StudentContentItem): string {
    if (this.classes.length === 0) {
      return `
        <div class="content-class-menu" role="menu">
          <p class="menu-empty">Aucune classe disponible.</p>
        </div>
      `;
    }

    return `
      <div class="content-class-menu" role="menu">
        ${this.classes.map((classroom) => {
          const hasAccess = this.services.studentContentAccess.isClassAccessEnabled(item, classroom.id);
          return `
            <div class="content-class-row" role="menuitem">
              <div class="content-class-copy">
                <strong>${escapeHtml(classroom.name)}</strong>
                <span class="class-level">${escapeHtml(this.formatLevel(classroom.level))}</span>
              </div>
              <button
                class="access-toggle"
                type="button"
                data-access-toggle
                data-content-kind="${item.kind}"
                data-content-id="${item.id}"
                data-class-id="${classroom.id}"
                data-enabled="${hasAccess ? "true" : "false"}"
                aria-label="${hasAccess ? "Retirer l'acces" : "Autoriser l'acces"} pour ${escapeHtml(classroom.name)}"
              >
                <span></span>
              </button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  private contentKey(item: StudentContentItem): string {
    return `${item.kind}-${item.id}`;
  }

  private formatLevel(level: Classroom["level"]): string {
    if (level === null || level === undefined || level === "") {
      return "Niveau non renseigne";
    }

    const match = CLASS_LEVELS.find((entry) => entry.value === level);
    return match?.label ?? String(level);
  }

  private style(): string {
    return `
      :host {
        display: block;
        min-width: 0;
      }

      :host .view-loading,
      :host .empty-copy {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .list-message {
        margin: 0 0 18px;
        color: var(--matheo-danger);
      }

      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host .content-card-copy p,
      :host .content-section h2 {
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

      :host .content-section {
        margin-bottom: 28px;
      }

      :host .content-section h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-size: 0.82rem;
      }

      :host .content-list {
        display: grid;
        gap: 12px;
      }

      :host .content-card {
        position: relative;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .content-card.is-menu-open {
        z-index: 2;
      }

      :host .content-card-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 3;
      }

      :host .content-menu-trigger {
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

      :host .content-menu-trigger:hover,
      :host .content-menu-trigger[aria-expanded="true"] {
        background: rgba(212, 175, 55, 0.18);
        color: #fff;
      }

      :host .content-class-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 10;
        width: min(360px, calc(100vw - 120px));
        max-height: 320px;
        overflow: auto;
        padding: 8px;
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 12px;
        background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
      }

      :host .menu-empty {
        margin: 0;
        padding: 10px 12px;
        color: rgba(250, 249, 246, 0.62);
        font-size: 0.9rem;
      }

      :host .content-class-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
      }

      :host .content-class-row + .content-class-row {
        margin-top: 4px;
      }

      :host .content-class-row:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      :host .content-class-copy {
        min-width: 0;
        display: grid;
        gap: 4px;
      }

      :host .content-class-copy strong {
        color: #fff;
        font-size: 0.95rem;
        overflow-wrap: anywhere;
      }

      :host .class-level {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.72);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      :host .access-toggle {
        width: 54px;
        height: 28px;
        position: relative;
        flex: none;
        border: 0;
        border-radius: 999px;
        background: #4b5563;
        cursor: pointer;
      }

      :host .access-toggle[data-enabled="true"] {
        background: var(--matheo-gold);
      }

      :host .access-toggle span {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: transform 160ms ease;
      }

      :host .access-toggle[data-enabled="true"] span {
        transform: translateX(26px);
      }

      :host .content-card-trigger {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 18px 52px 18px 18px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .content-card-trigger:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .content-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .content-card-copy h3 {
        margin: 0 0 4px;
        color: #fff;
        line-height: 1.3;
      }

      :host .content-card-copy span {
        display: block;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        letter-spacing: normal;
        text-transform: none;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .content-card-chevron {
        color: rgba(250, 249, 246, 0.38);
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }
    `;
  }
}
