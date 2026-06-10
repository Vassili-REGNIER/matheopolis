import type {
  ChapterViewModel,
  GameHomeContentFilter,
  GameHomeContentTemplateData,
  GameHomeTemplateState
} from "../../models/components/GameHome.js";
import type { IconName } from "../../models/components/Icons.js";
import { escapeHtml } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";
import { footerTemplate } from "../Layout/Footer/FooterComponent.js";
import { floatingTopButtonTemplate } from "../Shared/FloatingTopButton/FloatingTopButton.js";

export function gameHomeLoadingTemplate(): string {
  return `
    <div class="loading-shell">
      <div class="loading-icon">${icon("map")}</div>
      <p>Chargement de la carte...</p>
    </div>
  `;
}

export function gameHomeShellTemplate(state: GameHomeTemplateState): string {
  const mapTitle = state.isGuestMode ? "Carte d'aventure" : "Carte de Progression";
  const playerBox = state.isGuestMode
    ? `<span class="player-mode">Mode invit&eacute;</span>`
    : `<strong>${escapeHtml(state.playerName)}</strong>`;
  const headerAction = state.isGuestMode
    ? `<button class="home-button" type="button" data-action="home">${icon("home")} Retour &agrave; l'accueil</button>`
    : `<button class="panel-button" type="button" data-route="/panel">${icon("graduation")} Math&eacute;oPanel</button>`;
  const statsGrid = state.isGuestMode ? "" : `
      <section class="stats-grid" aria-label="Progression">
        <article>${icon("book")}<div><strong>${state.exploredChaptersLabel}</strong><span>Chapitres explores</span></div></article>
        <article>${icon("map")}<div><strong>${state.totalProgress}%</strong><span>Progression totale</span></div></article>
      </section>
  `;

  return `
    <div id="game-home-top" class="map-top-anchor" aria-hidden="true"></div>
    <header class="map-header">
      <div class="header-inner">
        <div class="map-title">${icon("map")}<span>${mapTitle}</span></div>
        <div class="header-actions">
          <div class="player-box">
            <div>
              ${playerBox}
            </div>
            <div class="avatar">${icon("user")}</div>
          </div>
          ${headerAction}
        </div>
      </div>
    </header>

    <main class="map-main">
      ${state.isGuestMode ? `
        <section class="guest-banner">
          ${icon("sparkles")}
          <div>
            <h2>Mode Invit&eacute;</h2>
            <p>D&eacute;couvrez l'univers de Math&eacute;opolis. Cr&eacute;ez un compte pour retrouver votre aventure plus tard.</p>
          </div>
        </section>
      ` : ""}

      ${statsGrid}

      ${contentToolbarTemplate(state)}

      <div data-game-home-content></div>
    </main>
    ${footerTemplate()}
    ${floatingTopButtonTemplate()}
    <div data-game-home-modals></div>
  `;
}

export function gameHomeContentTemplate(data: GameHomeContentTemplateData): string {
  return `
    ${chaptersSectionTemplate(data.chapters, data.state)}
    ${quizSectionTemplate("Questionnaires prives", "lock", data.privateQuizzes, data.state)}
    ${quizSectionTemplate("Questionnaires officiels", "file", data.publicQuizzes, data.state)}
    ${emptyFilterStateTemplate(data.showEmptyFilterState)}
  `;
}

function contentToolbarTemplate(state: GameHomeTemplateState): string {
  const filters: Array<{ id: GameHomeContentFilter; label: string; iconName: IconName }> = [
    { id: "chapters", label: "Chapitres", iconName: "book" },
    { id: "private_quizzes", label: "Questionnaires prives", iconName: "lock" },
    { id: "public_quizzes", label: "Questionnaires publics", iconName: "file" }
  ];

  return `
    <section class="content-toolbar" aria-label="Recherche et filtres">
      <label class="search-field">
        <span class="search-icon" aria-hidden="true">${icon("search")}</span>
        <input
          type="search"
          data-content-search
          placeholder="Rechercher par titre..."
          value="${escapeHtml(state.searchQuery)}"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <div class="content-filters" role="group" aria-label="Filtrer par type de contenu">
        ${filters.map((filter) => {
          const isActive = state.activeContentFilters.has(filter.id);
          return `
            <button
              class="filter-chip${isActive ? " is-active" : ""}"
              type="button"
              data-content-filter="${filter.id}"
              aria-pressed="${isActive ? "true" : "false"}"
            >
              ${icon(filter.iconName)}
              ${escapeHtml(filter.label)}
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function emptyFilterStateTemplate(showEmptyFilterState: boolean): string {
  if (!showEmptyFilterState) {
    return "";
  }

  return `
    <p class="empty-filter-copy">
      Aucun contenu ne correspond a votre recherche ou a vos filtres.
    </p>
  `;
}

function chaptersSectionTemplate(items: ChapterViewModel[], state: GameHomeTemplateState): string {
  if (items.length === 0) {
    return "";
  }

  return `
      <section class="timeline">
        <h1>${icon("map")} Votre Voyage a travers l'Histoire</h1>
        <div class="chapter-list">
          ${items.map((chapter, index) => chapterCardTemplate(chapter, index, items.length, state)).join("")}
        </div>
      </section>
  `;
}

function quizSectionTemplate(
  title: string,
  titleIcon: IconName,
  items: ChapterViewModel[],
  state: GameHomeTemplateState
): string {
  if (items.length === 0) {
    return "";
  }

  return `
      <section class="timeline quiz-section">
        <h1>${icon(titleIcon)} ${title}</h1>
        <div class="chapter-list">
          ${items.map((item, index) => chapterCardTemplate(item, index, items.length, state)).join("")}
        </div>
      </section>
  `;
}

function chapterCardTemplate(
  chapter: ChapterViewModel,
  index: number,
  listLength: number,
  state: GameHomeTemplateState
): string {
  const enabled = chapter.enabled;
  const iconName = chapter.kind === "chapter"
    ? "book"
    : chapter.visibility === "private"
      ? "lock"
      : "file";
  const visibilityBadge = chapter.visibility === undefined
    ? ""
    : `<span class="visibility-badge ${chapter.visibility}">${chapter.visibility === "public" ? "Officiel" : "Prive"}</span>`;
  const progressRow = state.isGuestMode ? "" : `
            <div class="progress-row">
              <div><span>${escapeHtml(chapter.progressLabel)}</span><span>${chapter.progress}%</span></div>
              <div class="bar"><span style="width: ${chapter.progress}%"></span></div>
            </div>
  `;

  return `
    <article class="chapter-wrap">
      ${index < listLength - 1 ? '<div class="connector"></div>' : ""}
      <div class="chapter-card ${enabled ? "" : "disabled"} ${state.isGuestMode ? "guest-card" : ""}" data-route-target="${escapeHtml(chapter.route)}" data-quiz-id="${chapter.kind === "quiz" ? chapter.id : ""}" data-enabled="${enabled ? "true" : "false"}" tabindex="${enabled ? "0" : "-1"}">
        <div class="chapter-icon">${enabled ? icon(iconName) : icon("lock")}</div>
        <div class="chapter-content">
          <div class="chapter-top">
            <div>
              <div class="era-row">
                <p class="era">${escapeHtml(chapter.era)}</p>
                ${visibilityBadge}
              </div>
              <h2>${escapeHtml(chapter.title)}</h2>
              <p class="subtitle">${escapeHtml(chapter.subtitle)}</p>
            </div>
          </div>
          ${enabled ? progressRow : `
            <p class="locked-copy">Acces ferme par l'enseignant</p>
          `}
        </div>
      </div>
    </article>
  `;
}
