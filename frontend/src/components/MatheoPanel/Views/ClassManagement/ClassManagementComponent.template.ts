import type { Classroom } from "../../../../models/Class.js";
import type {
  ClassFormModalData,
  ClassFormValues,
  ClassManagementDetailData,
  ClassManagementHeaderData,
  ClassManagementListData,
  ProgressExportModalData,
  StudentsImportModalData
} from "../../../../models/components/ClassManagement.js";
import { escapeHtml, clampPercent } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";
import {
  classLevelOptions,
  formatClassCreatedAt,
  formatClassLevel,
  formatLastActivity,
  formatStudentName,
  formatStudentUsername
} from "./utils/classManagementFormatters.js";

export function classManagementLoadingTemplate(): string {
  return `<div class="view-loading">Chargement des classes...</div>`;
}

export function classManagementShellTemplate(): string {
  return `
    <div data-class-management-header></div>
    <div data-class-management-body></div>
    <div data-class-management-modals></div>
    <div data-confirmation-modals></div>
  `;
}

export function classManagementStudentProgressHostTemplate(): string {
  return `<div class="student-progress-host" data-student-progress-host></div>`;
}

export function classManagementHeaderTemplate(data: ClassManagementHeaderData): string {
  const selected = data.selected;

  return `
    <header class="view-header">
      ${selected !== null ? `<button class="back-classes" type="button" data-back-classes>${icon("arrowLeft")}</button>` : ""}
      <div class="view-header-copy">
        <p>Classes</p>
        <h1>${selected === null ? "Mes Classes" : escapeHtml(selected.name)}</h1>
        <span>${selected === null
          ? "Consultez vos groupes et leurs progressions."
          : ``}</span>
      </div>
      ${selected === null ? `
        <button class="open-create-modal" type="button" data-create-class-request>
          ${icon("plus")}
          Nouvelle classe
        </button>
      ` : `
        <div class="view-header-actions">
          <button class="export-progress" type="button" data-export-progress ${data.isExporting ? "disabled" : ""}>
            ${icon("download")}
            ${data.isExporting ? "Export..." : "Exporter"}
          </button>
          <button class="open-import-modal" type="button" data-open-import-modal>
            ${icon("upload")}
            Importer des élèves
          </button>
          <div class="view-header-menu">
            ${classMenuTemplate(selected.id, data.openMenuClassId)}
          </div>
        </div>
      `}
    </header>
  `;
}

export function classManagementListTemplate(data: ClassManagementListData): string {
  return `
    ${data.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(data.listMessage)}</p>` : ""}
    <div class="class-grid">
      ${data.classes.length === 0 ? `
        <article class="empty-state">
          ${icon("users")}
          <div>
            <h2>Aucune classe pour le moment</h2>
            <p>Créez votre première classe pour générer un code d'inscription élève.</p>
            <button class="open-create-modal" type="button" data-create-class-request>${icon("plus")} Créer une classe</button>
          </div>
        </article>
      ` : data.classes.map((classroom) => classCardTemplate(classroom, data.openMenuClassId)).join("")}
    </div>
  `;
}

export function classManagementDetailTemplate(data: ClassManagementDetailData): string {
  const classroom = data.selected;
  const code = classroom.code?.trim() ?? "";

  return `
    ${data.listMessage.length > 0 ? `<p class="list-message">${escapeHtml(data.listMessage)}</p>` : ""}
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
          ` : `<strong class="detail-stat-empty">Non renseigné</strong>`}
        </article>
        <article class="detail-stat">
          <span>Niveau</span>
          <strong>${escapeHtml(formatClassLevel(classroom.level))}</strong>
        </article>
        <article class="detail-stat">
          <span>Création</span>
          <strong>${escapeHtml(formatClassCreatedAt(classroom.createdAt))}</strong>
        </article>
        <article class="detail-stat">
          <span>Élèves suivis</span>
          <strong>${data.progressRows.length}</strong>
        </article>
      </div>
      <div class="table-wrap">
        <table class="students-progress-table">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Identifiant</th>
              <th>Progression globale</th>
              <th>Dernière activité</th>
              <th class="student-actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.progressRows.length === 0 ? `
              <tr><td colspan="5">Aucun élève inscrit dans cette classe.</td></tr>
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
                <td class="student-actions-cell">
                  ${studentMenuTemplate(userId, studentName, data.openMenuStudentId)}
                </td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function classFormModalTemplate(data: ClassFormModalData): string {
  const isEdit = data.mode === "edit";
  const eyebrow = isEdit ? "Modification" : "Nouvelle classe";
  const title = isEdit ? "Modifier la classe" : "Créer une classe";
  const titleId = isEdit ? "edit-class-title" : "create-class-title";
  const submitLabel = isEdit ? `${icon("check")} Enregistrer` : `${icon("plus")} Créer la classe`;
  const processingLabel = isEdit ? "Enregistrement..." : "Création...";

  return `
    <div class="create-modal ${isEdit ? "edit-modal" : ""}" role="presentation" data-class-form-overlay>
      <section class="create-modal-panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <header class="modal-header">
          <div>
            <p>${eyebrow}</p>
            <h2 id="${titleId}">${title}</h2>
          </div>
          <button class="modal-close" type="button" data-class-form-cancel aria-label="Fermer" ${data.isProcessing ? "disabled" : ""}>
            ${icon("x")}
          </button>
        </header>
        <form class="class-form" data-class-form>
          ${classFormFieldsTemplate(data.isProcessing, data.values)}
          ${data.message.length > 0 ? `<p class="modal-message">${escapeHtml(data.message)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-class-form-cancel ${data.isProcessing ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="submit" ${data.isProcessing ? "disabled" : ""}>
              ${data.isProcessing ? processingLabel : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function studentsImportModalTemplate(data: StudentsImportModalData): string {
  return `
    <div class="create-modal import-modal" role="presentation" data-import-modal-overlay>
      <section class="create-modal-panel import-modal-panel" role="dialog" aria-modal="true" aria-labelledby="import-class-title">
        <header class="modal-header">
          <div>
            <p>Import CSV</p>
            <h2 id="import-class-title">Importer une classe</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            data-import-modal-cancel
            aria-label="Fermer"
            ${data.isImporting ? "disabled" : ""}
          >
            ${icon("x")}
          </button>
        </header>
        <form class="class-form import-form" data-import-form>
          <div class="import-instructions">
            <p>
              Sélectionnez un CSV contenant les élèves à créer pour cette classe. Les colonnes attendues sont
              <strong>nom</strong> puis <strong>prenom</strong>. Après validation, un fichier Excel au format CSV
              sera téléchargé avec les comptes créés, leurs identifiants et les mots de passe temporaires.
            </p>
            <pre><code>nom,prenom
Dupont,Jean
Martin,Lea</code></pre>
          </div>
          <label class="import-file-field">
            <span>Fichier CSV</span>
            <input
              name="csvFile"
              type="file"
              accept=".csv,text/csv"
              ${data.isImporting ? "disabled" : ""}
              required
            >
          </label>
          ${data.message.length > 0 ? `<p class="modal-message">${escapeHtml(data.message)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-import-modal-cancel ${data.isImporting ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="submit" ${data.isImporting ? "disabled" : ""}>
              ${data.isImporting ? "Import..." : `${icon("upload")} Importer`}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function progressExportModalTemplate(data: ProgressExportModalData): string {
  const chapterOptions = data.chapters
    .map((chapter) => `<option value="${chapter.id}">${escapeHtml(chapter.title)}</option>`)
    .join("");

  return `
    <div class="create-modal export-modal" role="presentation" data-export-modal-overlay>
      <section class="create-modal-panel export-modal-panel" role="dialog" aria-modal="true" aria-labelledby="export-progress-title">
        <header class="modal-header">
          <div>
            <p>Export CSV</p>
            <h2 id="export-progress-title">Exporter les résultats</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            data-export-modal-cancel
            aria-label="Fermer"
            ${data.isExporting ? "disabled" : ""}
          >
            ${icon("x")}
          </button>
        </header>
        <form class="class-form export-form" data-export-form>
          <fieldset class="export-mode-fieldset" ${data.isExporting ? "disabled" : ""}>
            <legend>Type d'export</legend>
            <label class="export-mode-option">
              <input type="radio" name="exportMode" value="overview">
              <span>Synthèse des chapitres</span>
            </label>
            <label class="export-mode-option">
              <input type="radio" name="exportMode" value="chapter">
              <span>Détail d'un chapitre</span>
            </label>
            <label class="export-mode-option">
              <input type="radio" name="exportMode" value="quiz">
              <span>Synthèse des quiz</span>
            </label>
            <label class="export-mode-option">
              <input type="radio" name="exportMode" value="quiz_detail">
              <span>Détail d'un quiz</span>
            </label>
          </fieldset>
          <label class="export-chapter-field" data-export-chapter-field hidden>
            <span>Choisir un chapitre</span>
            <select name="chapterId" ${data.isExporting || data.isLoadingOptions ? "disabled" : ""}>
              <option value="">${data.isLoadingOptions ? "Chargement des chapitres..." : "Choisir un chapitre"}</option>
              ${chapterOptions}
            </select>
          </label>
          <fieldset class="export-quiz-visibility-fieldset" data-export-quiz-visibility-field hidden>
            <legend>Type de quiz</legend>
            <label class="export-visibility-option">
              <input type="radio" name="quizVisibility" value="public">
              <span>Publique</span>
            </label>
            <label class="export-visibility-option">
              <input type="radio" name="quizVisibility" value="private">
              <span>Privé</span>
            </label>
          </fieldset>
          <label class="export-quiz-field" data-export-quiz-field hidden>
            <span>Choisir un quiz</span>
            <select name="quizId" ${data.isExporting || data.isLoadingOptions ? "disabled" : ""}>
              <option value="">Choisir un quiz</option>
            </select>
          </label>
          ${data.message.length > 0 ? `<p class="modal-message">${escapeHtml(data.message)}</p>` : ""}
          <div class="modal-actions">
            <button class="modal-cancel" type="button" data-export-modal-cancel ${data.isExporting ? "disabled" : ""}>
              Annuler
            </button>
            <button class="modal-submit" type="submit" data-export-submit disabled>
              ${data.isExporting ? "Téléchargement..." : `${icon("download")} Télécharger`}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function classCardTemplate(classroom: Classroom, openMenuClassId: number | null): string {
  const isArchived = classroom.archivedAt !== null && classroom.archivedAt !== undefined;
  const description = classroom.description?.trim() ?? "";
  const descriptionPreview = description.length > 90
    ? `${description.slice(0, 90)}...`
    : description;

  return `
    <article class="class-card ${isArchived ? "is-archived" : ""}">
      <div class="class-card-menu-wrap">
        ${classMenuTemplate(classroom.id, openMenuClassId)}
      </div>
      <button class="class-card-open" type="button" data-class-id="${classroom.id}" aria-label="Ouvrir ${escapeHtml(classroom.name)}">
        <div class="class-card-head">
          <span class="class-icon">${icon("users")}</span>
          <div class="class-card-title-row">
            <h2>${escapeHtml(classroom.name)}</h2>
            <div class="class-card-badges">
              <span class="class-level">${escapeHtml(formatClassLevel(classroom.level))}</span>
              ${isArchived ? `<span class="class-badge">Archivée</span>` : ""}
            </div>
          </div>
          <span class="class-card-action">${icon("chevronRight")}</span>
        </div>
        <p class="class-description">${descriptionPreview.length > 0 ? escapeHtml(descriptionPreview) : ""}</p>
        <div class="class-card-meta">
          <div>
            <span>Code</span>
            <strong>${escapeHtml(classroom.code ?? "Non renseigné")}</strong>
          </div>
          <div class="class-card-date">
            <span>Créée le</span>
            <strong>${escapeHtml(formatClassCreatedAt(classroom.createdAt))}</strong>
          </div>
        </div>
      </button>
    </article>
  `;
}

function classMenuTemplate(classId: number, openMenuClassId: number | null): string {
  const isOpen = openMenuClassId === classId;

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

function classFormFieldsTemplate(isDisabled: boolean, values?: ClassFormValues): string {
  const name = values?.name ?? "";
  const description = values?.description?.trim() ?? "";
  const level = values?.level;

  return `
    <label>
      <span>Nom de la classe</span>
      <input name="name" value="${escapeHtml(name)}" placeholder="Ex : 6e A" maxlength="120" required ${isDisabled ? "disabled" : ""}>
    </label>
    <label>
      <span>Niveau</span>
      <select name="level" required ${isDisabled ? "disabled" : ""}>
        <option value="">Sélectionnez un niveau</option>
        ${levelOptionsTemplate(level)}
      </select>
    </label>
    <label>
      <span>Description</span>
      <textarea name="description" rows="4" placeholder="Groupe pilote, objectifs, remarques..." ${isDisabled ? "disabled" : ""}>${escapeHtml(description)}</textarea>
    </label>
  `;
}

function levelOptionsTemplate(selectedLevel?: string | null): string {
  return classLevelOptions().map((entry) => `
    <option value="${entry.value}" ${entry.value === selectedLevel ? "selected" : ""}>${entry.label}</option>
  `).join("");
}

function studentMenuTemplate(
  studentId: number | undefined,
  studentName: string,
  openMenuStudentId: number | null
): string {
  if (studentId === undefined) {
    return "";
  }

  const isOpen = openMenuStudentId === studentId;

  return `
    <div class="student-menu-wrap">
      <button
        class="class-menu-trigger student-menu-trigger"
        type="button"
        data-menu-student-id="${studentId}"
        aria-label="Actions de ${escapeHtml(studentName)}"
        aria-expanded="${isOpen ? "true" : "false"}"
      >
        ${icon("moreVertical")}
      </button>
      ${isOpen ? `
        <div class="class-menu student-menu" role="menu">
          <button
            class="class-menu-item"
            type="button"
            data-reset-student-password-id="${studentId}"
            role="menuitem"
          >
            Régénérer le mot de passe
          </button>
          <button
            class="class-menu-item class-menu-item-danger"
            type="button"
            data-remove-student-id="${studentId}"
            role="menuitem"
          >
            Retirer l'élève
          </button>
        </div>
      ` : ""}
    </div>
  `;
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
