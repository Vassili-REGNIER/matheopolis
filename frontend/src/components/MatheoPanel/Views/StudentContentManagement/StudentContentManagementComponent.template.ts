import type { Classroom } from "../../../../models/Class.js";
import type { StudentContentManagementTemplateData } from "../../../../models/components/StudentContentManagement.js";
import type { IconName } from "../../../../models/components/Icons.js";
import type {
  StudentContentItem,
  StudentContentSectionMeta
} from "../../../../models/StudentContentAccess.js";
import { escapeHtml } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export function studentContentManagementLoadingTemplate(): string {
  return `<div class="view-loading">Chargement du contenu...</div>`;
}

export function studentContentManagementViewTemplate(data: StudentContentManagementTemplateData): string {
  return `
    <header class="view-header">
      <p>Contenu eleve</p>
      <h1>Gestion du contenu</h1>
      <span>Autorisez ou restreignez l'acces aux questionnaires et chapitres pour chaque classe.</span>
    </header>
    ${data.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(data.listMessage)}</p>` : ""}
    ${data.classes.length === 0 ? `
      <p class="empty-copy">Creez au moins une classe pour gerer les acces au contenu.</p>
    ` : ""}
    ${data.sections.map((section) => sectionTemplate(section, data)).join("")}
  `;
}

function sectionTemplate(section: StudentContentSectionMeta, data: StudentContentManagementTemplateData): string {
  const items = data.catalog.sections.find((entry) => entry.id === section.id)?.items ?? [];

  return `
    <section class="content-section">
      <header class="content-section-header">
        <h2>${icon(section.icon as IconName)} ${escapeHtml(section.label)}</h2>
        <p>${escapeHtml(section.description)}</p>
      </header>
      <div class="content-list">
        ${items.length === 0
          ? `<p class="empty-copy">Aucun contenu disponible dans cette section.</p>`
          : items.map((item) => contentCardTemplate(item, data)).join("")}
      </div>
    </section>
  `;
}

function contentCardTemplate(item: StudentContentItem, data: StudentContentManagementTemplateData): string {
  const menuKey = contentKey(item);
  const isOpen = data.openMenuKey === menuKey;
  const itemIcon: IconName =
    item.sectionId === "chapters" ? "book" : item.sectionId === "private_quizzes" ? "lock" : "file";
  const kindLabel =
    item.sectionId === "chapters" ? "Chapitre" : item.sectionId === "private_quizzes" ? "QCM prive" : "QCM officiel";

  return `
    <article class="content-card ${isOpen ? "is-menu-open" : ""}">
      <div class="content-card-menu-wrap">
        <button
          class="content-menu-trigger"
          type="button"
          data-content-menu-key="${menuKey}"
          aria-label="Gerer l'acces pour ${escapeHtml(item.title)}"
          aria-expanded="${isOpen ? "true" : "false"}"
          ${data.classes.length === 0 || !item.canManageAccess ? "disabled" : ""}
        >
          ${icon("moreVertical")}
        </button>
        ${isOpen ? classAccessMenuTemplate(item, data) : ""}
      </div>
      <button class="content-card-trigger" type="button" data-content-menu-key="${menuKey}">
        <span class="content-icon">${icon(itemIcon)}</span>
        <div class="content-card-copy">
          <p>${kindLabel}</p>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.description.length > 0 ? `<span>${escapeHtml(item.description)}</span>` : ""}
        </div>
        <span class="content-card-chevron">${icon("chevronRight")}</span>
      </button>
    </article>
  `;
}

function classAccessMenuTemplate(item: StudentContentItem, data: StudentContentManagementTemplateData): string {
  if (data.classes.length === 0) {
    return `
      <div class="content-class-menu" role="menu">
        <p class="menu-empty">Aucune classe disponible.</p>
      </div>
    `;
  }

  const menuKey = contentKey(item);
  if (data.loadingMenuKey === menuKey) {
    return `
      <div class="content-class-menu" role="menu">
        <p class="menu-empty">Chargement des acces...</p>
      </div>
    `;
  }

  const rows = data.accessRowsByKey[menuKey];
  if (rows === undefined) {
    return `
      <div class="content-class-menu" role="menu">
        <p class="menu-empty">Chargement des acces...</p>
      </div>
    `;
  }

  return `
    <div class="content-class-menu" role="menu">
      ${data.classes.map((classroom) => classAccessRowTemplate(classroom, item, data)).join("")}
    </div>
  `;
}

function classAccessRowTemplate(
  classroom: Classroom,
  item: StudentContentItem,
  data: StudentContentManagementTemplateData
): string {
  const menuKey = contentKey(item);
  const hasAccess = data.classAccessByContentKey[menuKey]?.[classroom.id] ?? false;

  return `
    <div class="content-class-row" role="menuitem">
      <div class="content-class-copy">
        <strong>${escapeHtml(classroom.name)}</strong>
        <span class="class-level">${escapeHtml(formatLevel(classroom.level))}</span>
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
        ${item.canManageAccess ? "" : "disabled"}
      >
        <span></span>
      </button>
    </div>
  `;
}

function contentKey(item: StudentContentItem): string {
  return `${item.kind}-${item.id}`;
}

function formatLevel(level: Classroom["level"]): string {
  if (level === null || level === undefined || level === "") {
    return "Niveau non renseigne";
  }

  const levels: Record<string, string> = {
    grade_6: "6e",
    grade_7: "5e",
    grade_8: "4e",
    grade_9: "3e",
    grade_10: "Seconde",
    grade_11: "Premiere",
    grade_12: "Terminale"
  };

  return levels[level] ?? String(level);
}
