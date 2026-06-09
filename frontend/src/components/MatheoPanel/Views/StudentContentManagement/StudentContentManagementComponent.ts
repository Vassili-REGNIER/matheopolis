import { BaseComponent } from "../../../BaseComponent.js";
import type { Classroom } from "../../../../models/Class.js";
import type { StudentContentManagementTemplateData } from "../../../../models/components/StudentContentManagement.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import type {
  StudentContentCatalog,
  StudentContentClassAccessRow,
  StudentContentItem
} from "../../../../models/StudentContentAccess.js";
import { STUDENT_CONTENT_SECTIONS } from "../../../../models/StudentContentAccess.js";
import { studentContentManagementStyles } from "./StudentContentManagementComponent.styles.js";
import {
  studentContentManagementLoadingTemplate,
  studentContentManagementViewTemplate
} from "./StudentContentManagementComponent.template.js";

export class StudentContentManagementComponent extends BaseComponent {
  private catalog: StudentContentCatalog = { sections: [] };
  private classes: Classroom[] = [];
  private openMenuKey: string | null = null;
  private loadingMenuKey: string | null = null;
  private accessRowsByKey: Record<string, StudentContentClassAccessRow[]> = {};
  private isLoading = true;
  private listMessage = "";

  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-student-content-management-view");
  }

  public init(): void {
    this.render(studentContentManagementLoadingTemplate(), studentContentManagementStyles());
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

        const wasOpen = this.openMenuKey === key;
        this.openMenuKey = wasOpen ? null : key;

        if (!wasOpen && this.openMenuKey !== null) {
          const item = this.findItemByKey(key);
          if (item !== undefined) {
            void this.ensureAccessRows(item);
          }
        }

        this.renderView();
      });
    });

    this.queryAll<HTMLButtonElement>("[data-access-toggle]").forEach((button) => {
      this.listen(button, "click", async (event) => {
        event.stopPropagation();
        if (button.disabled) {
          return;
        }

        const kind = button.dataset.contentKind;
        const contentId = Number.parseInt(button.dataset.contentId ?? "", 10);
        const classId = Number.parseInt(button.dataset.classId ?? "", 10);
        if (kind !== "chapter" && kind !== "quiz") {
          return;
        }
        if (Number.isNaN(contentId) || Number.isNaN(classId)) {
          return;
        }

        const item = this.findItem(kind, contentId);
        if (item === undefined || !item.canManageAccess) {
          return;
        }

        const menuKey = this.contentKey(item);
        const cachedRows = this.accessRowsByKey[menuKey];
        const nextAccess = !this.services.studentContentAccess.isClassAccessEnabled(item, classId, cachedRows);

        button.disabled = true;
        try {
          await this.services.studentContentAccess.setClassAccess(item, classId, nextAccess);
          delete this.accessRowsByKey[menuKey];
          await this.ensureAccessRows(item);
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
          this.loadingMenuKey = null;
          this.renderView();
        }
      });
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.renderView();

    try {
      const [catalog, classes] = await Promise.all([
        this.services.studentContentAccess.listContentCatalog(),
        this.services.studentContentAccess.listTeacherClasses()
      ]);
      this.catalog = catalog;
      this.classes = classes;
      this.accessRowsByKey = {};
      this.listMessage = "";
    } catch (error) {
      this.catalog = { sections: STUDENT_CONTENT_SECTIONS.map((section) => ({ id: section.id, items: [] })) };
      this.classes = [];
      this.listMessage = error instanceof Error ? error.message : "Chargement impossible.";
    } finally {
      this.isLoading = false;
      this.renderView();
    }
  }

  private async ensureAccessRows(item: StudentContentItem): Promise<void> {
    const key = this.contentKey(item);
    if (this.accessRowsByKey[key] !== undefined || this.loadingMenuKey === key) {
      return;
    }

    this.loadingMenuKey = key;
    this.renderView();

    try {
      this.accessRowsByKey[key] = await this.services.studentContentAccess.listClassAccessRows(item, this.classes);
      this.listMessage = "";
    } catch (error) {
      this.listMessage = error instanceof Error ? error.message : "Chargement des acces impossible.";
    } finally {
      this.loadingMenuKey = null;
      this.renderView();
    }
  }

  private renderView(): void {
    if (this.isLoading) {
      this.render(studentContentManagementLoadingTemplate(), studentContentManagementStyles());
      return;
    }

    this.render(
      studentContentManagementViewTemplate(this.getTemplateData()),
      studentContentManagementStyles()
    );
    this.bindEvents();
  }

  private findItem(kind: StudentContentItem["kind"], contentId: number): StudentContentItem | undefined {
    for (const section of this.catalog.sections) {
      const match = section.items.find((entry) => entry.kind === kind && entry.id === contentId);
      if (match !== undefined) {
        return match;
      }
    }

    return undefined;
  }

  private findItemByKey(key: string): StudentContentItem | undefined {
    for (const section of this.catalog.sections) {
      for (const item of section.items) {
        if (this.contentKey(item) === key) {
          return item;
        }
      }
    }

    return undefined;
  }

  private contentKey(item: StudentContentItem): string {
    return `${item.kind}-${item.id}`;
  }

  private getTemplateData(): StudentContentManagementTemplateData {
    return {
      catalog: this.catalog,
      sections: STUDENT_CONTENT_SECTIONS,
      classes: this.classes,
      openMenuKey: this.openMenuKey,
      loadingMenuKey: this.loadingMenuKey,
      listMessage: this.listMessage,
      accessRowsByKey: this.accessRowsByKey,
      classAccessByContentKey: this.getClassAccessByContentKey()
    };
  }

  private getClassAccessByContentKey(): Record<string, Record<number, boolean>> {
    const accessByContentKey: Record<string, Record<number, boolean>> = {};

    for (const section of this.catalog.sections) {
      for (const item of section.items) {
        const key = this.contentKey(item);
        const rows = this.accessRowsByKey[key];
        if (rows === undefined) {
          continue;
        }

        accessByContentKey[key] = {};
        for (const classroom of this.classes) {
          const row = rows.find((entry) => entry.classId === classroom.id);
          accessByContentKey[key][classroom.id] =
            row?.hasAccess ?? this.services.studentContentAccess.isClassAccessEnabled(item, classroom.id);
        }
      }
    }

    return accessByContentKey;
  }
}
