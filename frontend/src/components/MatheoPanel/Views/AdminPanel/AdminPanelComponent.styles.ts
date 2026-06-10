import { quizQuestionsSectionStyles } from "../shared/QuizQuestionsSection.js";

export function adminPanelStyles(): string {
  return `
      :host {
        display: block;
        min-width: 0;
        max-width: 100%;
      }

      :host .view-loading,
      :host .section-loading {
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

      :host .back-publications {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
        cursor: pointer;
        flex: none;
      }

      :host .detail-review-actions-floating {
        position: fixed;
        top: 32px;
        right: 32px;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(8px);
        box-shadow: 0 16px 38px rgba(2, 6, 23, 0.32);
      }

      :host .detail-review-actions-floating .detail-publish-button,
      :host .detail-review-actions-floating .detail-reject-button,
      :host .detail-review-actions-floating .detail-unpublish-button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 0.88rem;
        white-space: nowrap;
      }

      :host .detail-unpublish-button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 1px solid rgba(212, 175, 55, 0.42);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        font-weight: 900;
        cursor: pointer;
      }

      :host .detail-publish-button,
      :host .publication-publish-button,
      :host .question-draft-save,
      :host .modal-submit {
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
        cursor: pointer;
      }

      :host .detail-reject-button,
      :host .publication-reject-button,
      :host .modal-submit-danger {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 0;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.18);
        color: #fecaca;
        font-weight: 900;
        cursor: pointer;
      }

      :host .modal-submit-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.28);
        color: #fff;
      }

      :host .view-header-copy {
        flex: 1;
        min-width: 0;
      }

      :host .view-header p,
      :host .admin-section-header p,
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

      :host .view-header span,
      :host .admin-section-header span {
        color: rgba(250, 249, 246, 0.58);
      }

      :host .admin-sections {
        display: grid;
        gap: 22px;
      }

      :host .admin-section,
      :host .empty-state,
      :host .detail-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .admin-section {
        padding: 22px;
      }

      :host .admin-section-disabled {
        opacity: 0.72;
      }

      :host .admin-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      :host .admin-section-header h2 {
        margin: 0 0 6px;
        color: #fff;
        font-size: 1.45rem;
      }

      :host .admin-section-count {
        min-width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-weight: 900;
      }

      :host .admin-section-badge {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.78rem;
        font-weight: 800;
        white-space: nowrap;
      }

      :host .admin-section-placeholder,
      :host .empty-state {
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 24px;
      }

      :host .admin-section-placeholder h3,
      :host .empty-state h3 {
        margin: 0 0 6px;
        color: #fff;
      }

      :host .admin-section-placeholder p,
      :host .empty-state p {
        margin: 0;
        color: rgba(250, 249, 246, 0.58);
      }

      :host .publication-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        align-items: stretch;
        gap: 16px;
      }

      :host .publication-card {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      :host .publication-card:has(.publication-card-open:hover),
      :host .publication-card:has(.publication-card-actions:hover) {
        border-color: rgba(212, 175, 55, 0.42);
        background: rgba(15, 23, 42, 0.72);
      }

      :host .publication-card-open {
        flex: 1;
        width: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1.35em auto;
        gap: 12px;
        padding: 18px 20px 12px;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .publication-card:has(.publication-card-open:hover) .publication-card-open,
      :host .publication-card:has(.publication-card-actions:hover) .publication-card-open {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 0 20px 18px;
        flex: none;
        border-radius: 0 0 14px 14px;
      }

      :host .publication-card:has(.publication-card-actions:hover) .publication-card-actions {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-actions .publication-publish-button,
      :host .publication-card-actions .publication-reject-button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 0.88rem;
        white-space: nowrap;
      }

      :host .publication-card-action {
        color: rgba(250, 249, 246, 0.38);
        flex: none;
      }

      :host .publication-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }

      :host .publication-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        flex: none;
      }

      :host .publication-icon .icon {
        width: 20px;
        height: 20px;
      }

      :host .publication-card-title-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      :host .publication-card h2 {
        margin: 0;
        width: 100%;
        min-width: 0;
        font-size: 1.3rem;
        font-weight: 900;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .publication-card-badges {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      :host .publication-badge {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 11px;
        border-radius: 999px;
        background: rgba(251, 191, 36, 0.16);
        color: #fde68a;
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .publication-description {
        margin: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .publication-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
        padding: 12px 14px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .publication-card-meta > div {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      :host .publication-card-meta span {
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .publication-card-meta strong {
        color: rgba(250, 249, 246, 0.82);
        font-size: 0.92rem;
        overflow-wrap: anywhere;
      }

      :host .publication-card-date {
        text-align: right;
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

      :host .detail-stat {
        display: grid;
        gap: 8px;
        align-content: start;
        min-width: 0;
      }

      :host .detail-stat strong {
        color: #fff;
        font-size: 1rem;
        line-height: 1.35;
      }

      :host .detail-description {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      ${quizQuestionsSectionStyles()}

      :host .questionnaire-menu-trigger {
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

      :host .questionnaire-menu-trigger:hover,
      :host .questionnaire-menu-trigger[aria-expanded="true"] {
        background: rgba(212, 175, 55, 0.18);
        color: #fff;
      }

      :host .questionnaire-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 10;
        min-width: 168px;
        padding: 8px;
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 12px;
        background: linear-gradient(180deg, #1a2740 0%, #0f172a 100%);
        box-shadow:
          0 18px 40px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(212, 175, 55, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      :host .questionnaire-menu-item {
        width: 100%;
        min-height: 40px;
        display: block;
        padding: 0 12px;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        color: #f8fafc;
        font-size: 0.92rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      :host .questionnaire-menu-item + .questionnaire-menu-item {
        margin-top: 4px;
      }

      :host .questionnaire-menu-item:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      :host .questionnaire-menu-item-danger {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.14);
      }

      :host .questionnaire-menu-item-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .publication-publish-button {
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
        cursor: pointer;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      @media (max-width: 900px) {
        :host .view-header {
          flex-wrap: wrap;
        }

        :host .detail-top {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        :host .publication-card-meta {
          grid-template-columns: 1fr;
        }

        :host .publication-card-date {
          text-align: left;
        }
      }

      @media (max-width: 860px) {
        :host .detail-review-actions-floating {
          top: 22px;
          right: 22px;
          left: 22px;
          justify-content: stretch;
        }

        :host .detail-review-actions-floating .detail-publish-button,
        :host .detail-review-actions-floating .detail-reject-button,
        :host .detail-review-actions-floating .detail-unpublish-button {
          flex: 1;
        }
      }

      @media (max-width: 640px) {
        :host .detail-top {
          grid-template-columns: 1fr;
        }
      }
    `;
}
