import { BaseComponent } from "../../../BaseComponent.js";
import {
  formatExploredChapters,
  type ProgressMetricsWithTotal
} from "../../../../models/services/ProgressMetrics.js";
import type { AppServices } from "../../../../models/services/AppServices.js";
import { displayName, type User } from "../../../../models/User.js";
import { escapeHtml, formatDate } from "../../../../utils/dom.js";
import { icon } from "../../../../utils/icons.js";

export class ProfileComponent extends BaseComponent {
  public constructor(
    container: HTMLElement,
    private readonly services: AppServices
  ) {
    super(container, "matheo-profile-view");
  }

  public init(): void {
    this.render(`<div class="view-loading">Chargement du profil...</div>`, this.style());
    void this.load();
  }

  protected bindEvents(): void {}

  private async load(): Promise<void> {
    const user = await this.services.users.getCurrentProfile();
    if (user === null) {
      this.render(`<p class="view-loading">Aucun profil chargé.</p>`, this.style());
      return;
    }
    const metrics = await this.services.progressMetrics.loadFromChapters(this.services.chapters);

    this.render(`
      <header class="view-header">
        <p>Profil - <span>${escapeHtml(user.role)}</span> </p>
        <h1>${escapeHtml(displayName(user))}</h1>
      </header>
      <section class="profile-grid">
        ${this.profileCards(user, metrics).join("")}
      </section>
    `, this.style());
  }

  private profileCards(user: User, metrics: ProgressMetricsWithTotal): string[] {
    const cards: string[] = [
      `<article>${icon("user")}<div><span>Pseudo</span><strong>${escapeHtml(user.username)}</strong></div></article>`
    ];

    if (user.role !== "student") {
      cards.push(
        `<article>${icon("file")}<div><span>Email</span><strong>${escapeHtml(user.email ?? "Non renseigné")}</strong></div></article>`
      );
    }

    if (user.role === "student") {
      cards.push(
        `<article>${icon("users")}<div><span>Classe</span><strong>${escapeHtml(this.classLabel(user))}</strong></div></article>`
      );
    }

    cards.push(
      `<article>${icon("book")}<div><span>Chapitres explorés</span><strong>${formatExploredChapters(metrics)}</strong></div></article>`,
      `<article>${icon("map")}<div><span>Progression chapitres</span><strong>${metrics.totalProgress}%</strong></div></article>`,
      `<article>${icon("clock")}<div><span>Compte créé</span><strong>${escapeHtml(formatDate(user.createdAt))}</strong></div></article>`
    );

    return cards;
  }

  private classLabel(user: User): string {
    if (user.classId === null) {
      return "Aucune";
    }

    return user.className ?? `#${user.classId}`;
  }

  private style(): string {
    return `
      :host {
        display: block;
      }

      :host .view-loading {
        color: rgba(250, 249, 246, 0.66);
      }

      :host .view-header {
        margin-bottom: 26px;
      }

      :host .view-header p,
      :host .profile-grid span {
        margin: 0 0 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .view-header h1 {
        margin: 0 0 8px;
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      :host .view-header > span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      :host .profile-grid article {
        display: flex;
        align-items: center;
        gap: 16px;
        min-height: 116px;
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .icon {
        width: 36px;
        height: 36px;
        color: var(--matheo-gold);
      }

      :host strong {
        display: block;
        color: #fff;
        overflow-wrap: anywhere;
      }

      @media (max-width: 680px) {
        :host .profile-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
