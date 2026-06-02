import { BaseComponent } from "../../../BaseComponent.js";
import type { Puzzle, RiddleProgress, RiddleStatus } from "../../../../models/Progress.js";
import type { AppServices } from "../../../../services/AppServices.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon, type IconName } from "../../../../utils/icons.js";

export class ProgressComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-progress-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement de la progression...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {}

  private async load(): Promise<void> {
    const puzzles = await this.services.riddles.listPuzzles();
    const rows = await Promise.all(puzzles.map(async (puzzle) => ({
      puzzle,
      progress: await this.services.riddles.getProgress(puzzle.id)
    })));

    this.render(`
      <header class="view-header">
        <p>Progression</p>
        <h1>Mes enigmes</h1>
      </header>
      <div class="progress-list">
        ${rows.map((row) => this.rowTemplate(row.puzzle, row.progress)).join("")}
      </div>
    `, this.style());
  }

  private rowTemplate(puzzle: Puzzle, progress: RiddleProgress): string {
    const percent = this.services.progressMetrics.progressPercent(progress);
    return `
      <article>
        <div class="row-main">
          <div class="row-icon">${icon(this.puzzleIcon(puzzle.id))}</div>
          <h2>${escapeHtml(puzzle.title)}</h2>
        </div>
        <div class="row-meta">
          <span>${escapeHtml(this.statusLabel(progress.status))}</span>
          <span class="row-percent">${percent}%</span>
          <span>${progress.attemptCount} tentative(s)</span>
          <span>${escapeHtml(formatDate(progress.lastAttemptAt ?? progress.completedAt ?? progress.startedAt))}</span>
        </div>
        <div class="bar"><span style="width:${percent}%"></span></div>
      </article>
    `;
  }

  private puzzleIcon(puzzleId: number): IconName {
    return puzzleId === 999 ? "file" : "book";
  }

  private statusLabel(status: RiddleStatus): string {
    if (status === "completed") {
      return "Complété";
    }
    if (status === "in_progress") {
      return "En cours";
    }
    return "Non commencé";
  }

  private style(): string {
    return `
      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-loading,
      :host .view-header p {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .view-header p {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .progress-list {
        display: grid;
        gap: 14px;
      }

      :host article {
        padding: 20px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .row-main {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      :host .row-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
      }

      :host .icon {
        width: 22px;
        height: 22px;
      }

      :host .row-main h2 {
        margin: 0;
        color: #fff;
        line-height: 1.25;
      }

      :host .row-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin: 16px 0 10px;
        font-size: 0.82rem;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .row-percent {
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .bar {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: #312e81;
      }

      :host .bar span {
        display: block;
        height: 100%;
        background: var(--matheo-gold);
      }
    `;
  }
}
