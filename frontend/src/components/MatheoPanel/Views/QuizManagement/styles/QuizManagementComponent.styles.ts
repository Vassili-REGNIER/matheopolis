import { floatingTopButtonStyles } from "../../../../Shared/FloatingTopButton/FloatingTopButton.js";
import { quizQuestionsSectionStyles } from "../../shared/QuizQuestionsSection.js";

export function quizManagementStyles(): string {
  return `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
      position: relative;
    }

    :host .view-top-anchor {
      scroll-margin-top: 24px;
    }

    :host .view-loading,
    :host .list-message,
    :host .modal-message {
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

    :host .view-header-copy {
      flex: 1;
      min-width: 0;
    }

    :host .view-header p,
    :host .questionnaire-form label span,
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

    :host .view-header span {
      color: rgba(250, 249, 246, 0.58);
    }

    :host .open-create-questionnaire,
    :host .modal-submit,
    :host .empty-state button,
    :host .add-question-button,
    :host .question-draft-save {
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
      white-space: nowrap;
      cursor: pointer;
    }

    :host .modal-close,
    :host .modal-cancel {
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(250, 249, 246, 0.82);
      font-weight: 800;
      cursor: pointer;
    }

    :host .modal-close {
      width: 38px;
      height: 38px;
      min-height: 38px;
      display: grid;
      place-items: center;
      padding: 0;
    }

    :host .back-questionnaires {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(250, 249, 246, 0.78);
      cursor: pointer;
    }

    :host .icon {
      width: 20px;
      height: 20px;
    }

    :host .questionnaire-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      align-items: stretch;
      gap: 16px;
    }

    :host .questionnaire-card,
    :host .empty-state,
    :host .detail-panel,
    :host .create-modal-panel {
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.62);
    }

    :host .questionnaire-card {
      position: relative;
      display: flex;
      min-width: 0;
      height: 100%;
    }

    :host .questionnaire-card-menu-wrap,
    :host .view-header-menu {
      position: relative;
      z-index: 3;
    }

    :host .questionnaire-card:has(.questionnaire-menu-trigger[aria-expanded="true"]) {
      z-index: 4;
    }

    :host .questionnaire-card-menu-wrap {
      position: absolute;
      top: 10px;
      right: 10px;
    }

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
      min-width: 192px;
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
      white-space: nowrap;
      cursor: pointer;
    }

    :host .questionnaire-menu-item + .questionnaire-menu-item {
      margin-top: 4px;
    }

    :host .questionnaire-menu-item:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
    }

    :host .questionnaire-menu-item-disabled,
    :host .questionnaire-menu-item:disabled {
      color: rgba(250, 249, 246, 0.34);
      background: rgba(255, 255, 255, 0.02);
      cursor: not-allowed;
    }

    :host .questionnaire-menu-item-danger {
      color: #fecaca;
      background: rgba(239, 68, 68, 0.14);
    }

    :host .questionnaire-menu-item-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.24);
      color: #fff;
    }

    :host .questionnaire-card-open {
      width: 100%;
      min-width: 0;
      min-height: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-rows: auto 1.35em auto;
      gap: 12px;
      padding: 18px 52px 18px 20px;
      border: 0;
      background: transparent;
      color: #fff;
      text-align: left;
      cursor: pointer;
    }

    :host .questionnaire-card-open:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    :host .questionnaire-card-head {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      align-items: start;
      gap: 12px;
      min-width: 0;
    }

    :host .questionnaire-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      background: rgba(212, 175, 55, 0.12);
      color: var(--matheo-gold);
      flex: none;
    }

    :host .questionnaire-card-title-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-width: 0;
    }

    :host .questionnaire-card h2 {
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

    :host .questionnaire-card-badges {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    :host .questionnaire-status {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 11px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    :host .questionnaire-status-public,
    :host .questionnaire-status-private,
    :host .questionnaire-status-submitted {
      background: rgba(212, 175, 55, 0.14);
      color: var(--matheo-gold);
    }

    :host .questionnaire-status-not-submitted {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(250, 249, 246, 0.72);
    }

    :host .questionnaire-description {
      margin: 0;
      min-height: 1.35em;
      color: rgba(250, 249, 246, 0.55);
      font-size: 0.9rem;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host .questionnaire-card-meta {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 12px 14px;
      align-items: end;
      padding: 12px 14px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.04);
    }

    :host .questionnaire-card-meta > div {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    :host .questionnaire-card-date {
      text-align: right;
    }

    :host .questionnaire-card-meta span {
      color: var(--matheo-gold);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .questionnaire-card-meta strong {
      color: rgba(250, 249, 246, 0.82);
      font-size: 0.92rem;
    }

    :host .questionnaire-card-action {
      color: rgba(250, 249, 246, 0.38);
      flex: none;
    }

    :host .empty-state {
      grid-column: 1 / -1;
      display: flex;
      align-items: flex-start;
      gap: 18px;
      padding: 28px;
    }

    :host .empty-state .icon {
      width: 42px;
      height: 42px;
      color: var(--matheo-gold);
    }

    :host .empty-state h2 {
      margin: 0 0 8px;
      color: #fff;
    }

    :host .empty-state p {
      margin: 0 0 16px;
      color: rgba(250, 249, 246, 0.62);
    }

    :host .create-modal {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(2, 6, 23, 0.72);
      backdrop-filter: blur(4px);
    }

    :host .create-modal-panel {
      width: min(560px, 100%);
      padding: 22px;
      background: rgba(15, 23, 42, 0.96);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }

    :host .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    :host .modal-header h2 {
      font-size: 1.6rem;
    }

    :host .questionnaire-form {
      display: grid;
      gap: 14px;
    }

    :host .questionnaire-form label {
      display: grid;
      gap: 7px;
    }

    :host .questionnaire-form input,
    :host .questionnaire-form textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.055);
      color: #fff;
      font: inherit;
    }

    :host .questionnaire-form input {
      min-height: 44px;
    }

    :host .questionnaire-form textarea {
      resize: vertical;
      min-height: 110px;
    }

    :host .questionnaire-form input::placeholder,
    :host .questionnaire-form textarea::placeholder {
      color: rgba(250, 249, 246, 0.38);
    }

    :host .questionnaire-form input:focus,
    :host .questionnaire-form textarea:focus {
      outline: 2px solid rgba(212, 175, 55, 0.5);
      outline-offset: 2px;
      border-color: rgba(212, 175, 55, 0.52);
    }

    :host .questionnaire-form input:disabled,
    :host .questionnaire-form textarea:disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }

    :host .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    :host .modal-cancel,
    :host .modal-submit {
      min-height: 44px;
      padding: 0 16px;
      border-radius: 10px;
      font-weight: 800;
    }

    :host .modal-submit-danger {
      background: #dc2626;
      color: #fff;
      border: 0;
    }

    :host .modal-submit-danger:hover:not(:disabled) {
      background: #b91c1c;
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

    @media (max-width: 900px) {
      :host .view-header {
        flex-wrap: wrap;
      }

      :host .detail-top {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      :host .detail-top {
        grid-template-columns: 1fr;
      }

    }

    ${floatingTopButtonStyles()}
  `;
}
