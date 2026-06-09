import type { Classroom } from "../../../../models/Class.js";
import type { StudentChapterProgressSummary } from "../../../../models/ChapterProgress.js";
import type { ClassManagementTemplateData, ClassFormValues } from "../../../../models/components/ClassManagement.js";
import { escapeHtml, clampPercent, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

const CLASS_LEVELS = [
  { value: "grade_6", label: "6e" },
  { value: "grade_7", label: "5e" },
  { value: "grade_8", label: "4e" },
  { value: "grade_9", label: "3e" },
  { value: "grade_10", label: "Seconde" },
  { value: "grade_11", label: "Premiere" },
  { value: "grade_12", label: "Terminale" }
];

export function classManagementLoadingTemplate(): string {
  return `<div class="view-loading">Chargement des classes...</div>`;
}

export function classManagementStudentProgressHostTemplate(): string {
  return `<div class="student-progress-host" data-student-progress-host></div>`;
}

export function classManagementViewTemplate(data: ClassManagementTemplateData): string {
  const selected = data.selected;

  return `
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
          ${classMenuTemplate(selected.id, data)}
        </div>
      `}
    </header>
    ${selected === null ? classListTemplate(data) : classDetailTemplate(selected, data)}
    ${data.isCreateModalOpen ? createModalTemplate(data) : ""}
    ${data.editTarget !== null ? editModalTemplate(data) : ""}
    ${data.deleteTarget !== null ? deleteModalTemplate(data) : ""}
  `;
}

function classListTemplate(data: ClassManagementTemplateData): string {
  return `
    ${data.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(data.listMessage)}</p>` : ""}
    <div class="class-grid">
      ${data.classes.length === 0 ? `
        <article class="empty-state">
          ${icon("users")}
          <div>
            <h2>Aucune classe pour le moment</h2>
            <p>Creez votre premiere classe pour generer un code d'inscription eleve.</p>
            <button class="open-create-modal" type="button">${icon("plus")} Creer une classe</button>
          </div>
        </article>
      ` : data.classes.map((classroom) => classCardTemplate(classroom, data)).join("")}
    </div>
  `;
}

function classCardTemplate(classroom: Classroom, data: ClassManagementTemplateData): string {
  const isArchived = classroom.archivedAt !== null && classroom.archivedAt !== undefined;
  const description = classroom.description?.trim() ?? "";
  const descriptionPreview = description.length > 90
    ? `${description.slice(0, 90)}...`
    : description;

  return `
    <article class="class-card ${isArchived ? "is-archived" : ""}">
      <div class="class-card-menu-wrap">
        ${classMenuTemplate(classroom.id, data)}
      </div>
      <button class="class-card-open" type="button" data-class-id="${classroom.id}" aria-label="Ouvrir ${escapeHtml(classroom.name)}">
        <div class="class-card-head">
          <span class="class-icon">${icon("users")}</span>
          <div class="class-card-title-row">
            <h2>${escapeHtml(classroom.name)}</h2>
            <div class="class-card-badges">
              <span class="class-level">${escapeHtml(formatLevel(classroom.level))}</span>
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
            <strong>${escapeHtml(formatCreatedAt(classroom.createdAt))}</strong>
          </div>
        </div>
      </button>
    </article>
  `;
}

function classMenuTemplate(classId: number, data: ClassManagementTemplateData): string {
  const isOpen = data.openMenuClassId === classId;

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

function deleteModalTemplate(data: ClassManagementTemplateData): string {
  if (data.deleteTarget === null) {
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
          <button class="modal-close" type="button" data-close-delete-modal aria-label="Fermer" ${data.isDeleting ? "disabled" : ""}>
            ${icon("x")}
          </button>
        </header>
        <p class="delete-modal-copy">
          La classe <strong>${escapeHtml(data.deleteTarget.name)}</strong> sera supprimée.
          Cette action est reversible uniquement par l'administration.
        </p>
        ${data.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(data.listMessage)}</p>` : ""}
        <div class="modal-actions">
          <button class="modal-cancel" type="button" data-close-delete-modal ${data.isDeleting ? "disabled" : ""}>
            Annuler
          </button>
          <button class="modal-submit modal-submit-danger" type="button" data-confirm-delete ${data.isDeleting ? "disabled" : ""}>
            ${data.isDeleting ? "Suppression..." : `${icon("trash")} Supprimer`}
          </button>
        </div>
      </section>
    </div>
  `;
}

function levelOptionsTemplate(selectedLevel?: string | null): string {
  return CLASS_LEVELS.map((entry) => `
    <option value="${entry.value}" ${entry.value === selectedLevel ? "selected" : ""}>${entry.label}</option>
  `).join("");
}

function classFormFieldsTemplate(isDisabled: boolean, values?: ClassFormValues): string {
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
        ${levelOptionsTemplate(level)}
      </select>
    </label>
    <label>
      <span>Description</span>
      <textarea name="description" rows="4" placeholder="Groupe pilote, objectifs, remarques..." ${isDisabled ? "disabled" : ""}>${escapeHtml(description)}</textarea>
    </label>
  `;
}

function createModalTemplate(data: ClassManagementTemplateData): string {
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
          ${classFormFieldsTemplate(data.isCreating)}
          ${data.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(data.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-modal ${data.isCreating ? "disabled" : ""}>Annuler</button>
            <button class="modal-submit" type="submit" ${data.isCreating ? "disabled" : ""}>
              ${data.isCreating ? "Creation..." : `${icon("plus")} Creer la classe`}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function editModalTemplate(data: ClassManagementTemplateData): string {
  if (data.editTarget === null) {
    return "";
  }

  const classroom = data.editTarget;

  return `
    <div class="create-modal edit-modal" role="presentation">
      <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-class-title">
        <header class="modal-header">
          <div>
            <p>Modification</p>
            <h2 id="edit-class-title">Modifier la classe</h2>
          </div>
          <button class="modal-close" type="button" data-close-edit-modal aria-label="Fermer" ${data.isUpdating ? "disabled" : ""}>
            ${icon("x")}
          </button>
        </header>
        <form class="class-form" data-form="edit">
          ${classFormFieldsTemplate(data.isUpdating, classroom)}
          ${data.listMessage.length > 0 ? `<p class="modal-message">${escapeHtml(data.listMessage)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-close-edit-modal ${data.isUpdating ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="submit" ${data.isUpdating ? "disabled" : ""}>
              ${data.isUpdating ? "Enregistrement..." : `${icon("check")} Enregistrer`}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function classDetailTemplate(classroom: Classroom, data: ClassManagementTemplateData): string {
  const code = classroom.code?.trim() ?? "";

  return `
    <section class="detail-panel">
      <div class="detail-top">
        <article class="detail-stat detail-stat-code">
          <span>Code</span>
          ${code.length > 0 ? `
            <button
              type="button"
              class="detail-code-copy ${data.codeCopied ? "is-copied" : ""}"
              data-copy-class-code="${escapeHtml(code)}"
              title="Copier le code d'inscription"
            >
              <strong>${escapeHtml(code)}</strong>
              <span class="detail-code-copy-action">
                ${icon(data.codeCopied ? "check" : "copy")}
                ${data.codeCopied ? "Copie !" : "Copier"}
              </span>
            </button>
          ` : `<strong class="detail-stat-empty">Non renseigne</strong>`}
        </article>
        <article class="detail-stat">
          <span>Niveau</span>
          <strong>${escapeHtml(formatLevel(classroom.level))}</strong>
        </article>
        <article class="detail-stat">
          <span>Creation</span>
          <strong>${escapeHtml(formatCreatedAt(classroom.createdAt))}</strong>
        </article>
        <article class="detail-stat">
          <span>Eleves suivis</span>
          <strong>${data.progressRows.length}</strong>
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
            ${data.progressRows.length === 0 ? `
              <tr><td colspan="4">Aucun eleve inscrit dans cette classe.</td></tr>
            ` : data.progressRows.map((row) => {
              const userId = row.user?.id ?? row.userId;
              const studentName = formatStudentName(row);

              return `
              <tr
                class="student-row"
                data-student-id="${userId ?? ""}"
                tabindex="0"
                role="button"
                aria-label="Voir la progression de ${escapeHtml(studentName)}"
              >
                <td class="student-name">${escapeHtml(studentName)}</td>
                <td class="student-username">${escapeHtml(formatStudentUsername(row))}</td>
                <td>${progressCellTemplate(row.completionRate)}</td>
                <td class="student-last-activity">${escapeHtml(formatLastActivity(row.lastActivityAt))}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function formatStudentName(row: StudentChapterProgressSummary): string {
  if (row.user !== undefined) {
    return `${row.user.firstName} ${row.user.lastName}`.trim();
  }

  return `Eleve #${row.userId ?? "?"}`;
}

function formatStudentUsername(row: StudentChapterProgressSummary): string {
  const username = row.user?.username?.trim();
  if (username !== undefined && username.length > 0) {
    return username;
  }

  return "Non renseigne";
}

function formatLastActivity(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Aucune activite";
  }

  return formatDate(value);
}

function progressCellTemplate(completionRate: number): string {
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

function formatLevel(level: Classroom["level"]): string {
  if (level === null || level === undefined || level === "") {
    return "Niveau non renseigne";
  }

  const match = CLASS_LEVELS.find((entry) => entry.value === level);
  return match?.label ?? String(level);
}

function formatCreatedAt(value: string): string {
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
