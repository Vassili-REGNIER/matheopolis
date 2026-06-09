export function classManagementStyles(): string {
  return `
      :host {
        display: block;
        min-width: 0;
        max-width: 100%;
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
      :host .class-form label span,
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

      :host .open-create-modal,
      :host .modal-submit,
      :host .empty-state button {
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
      }

      :host .back-classes,
      :host .modal-close,
      :host .modal-cancel {
        border: 0;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(250, 249, 246, 0.78);
      }

      :host .back-classes {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 10px;
      }

      :host .icon {
        width: 20px;
        height: 20px;
      }

      :host .class-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        align-items: stretch;
        gap: 16px;
      }

      :host .class-card,
      :host .empty-state,
      :host .detail-panel,
      :host .create-modal-panel {
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
      }

      :host .class-card {
        position: relative;
        display: flex;
        min-width: 0;
        height: 100%;
      }

      :host .class-card-menu-wrap,
      :host .view-header-menu {
        position: relative;
        z-index: 3;
      }

      :host .class-card:has(.class-menu-trigger[aria-expanded="true"]) {
        z-index: 4;
      }

      :host .class-card-menu-wrap {
        position: absolute;
        top: 10px;
        right: 10px;
      }

      :host .class-menu-trigger {
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

      :host .class-menu-trigger:hover,
      :host .class-menu-trigger[aria-expanded="true"] {
        background: rgba(212, 175, 55, 0.18);
        color: #fff;
      }

      :host .class-menu {
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

      :host .class-menu-item {
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

      :host .class-menu-item + .class-menu-item {
        margin-top: 4px;
      }

      :host .class-menu-item:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      :host .class-menu-item:disabled {
        color: rgba(250, 249, 246, 0.38);
        cursor: not-allowed;
      }

      :host .class-menu-item-danger {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.14);
      }

      :host .class-menu-item-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.24);
        color: #fff;
      }

      :host .class-card-open {
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

      :host .class-card-open:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-card.is-archived {
        opacity: 0.72;
      }

      :host .class-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }

      :host .class-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: rgba(212, 175, 55, 0.12);
        color: var(--matheo-gold);
        flex: none;
      }

      :host .class-card-title-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      :host .class-card h2 {
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

      :host .class-card-badges {
        display: inline-flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 6px;
        flex: none;
      }

      :host .class-level {
        display: inline-flex;
        align-items: center;
        flex: none;
        min-height: 28px;
        padding: 0 11px;
        border-radius: 999px;
        background: rgba(212, 175, 55, 0.14);
        color: var(--matheo-gold);
        font-size: 0.88rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .class-badge {
        display: inline-flex;
        align-items: center;
        flex: none;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(250, 249, 246, 0.62);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .class-description {
        margin: 0;
        min-width: 0;
        min-height: 1.35em;
        color: rgba(250, 249, 246, 0.55);
        font-size: 0.9rem;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host .class-card-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 12px 14px;
        align-items: end;
        min-width: 0;
        padding: 12px 14px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host .class-card-meta > div {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      :host .class-card-date {
        text-align: right;
      }

      :host .class-card-meta span {
        margin: 0;
        color: var(--matheo-gold);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .class-card-meta strong {
        color: rgba(250, 249, 246, 0.82);
        font-size: 0.92rem;
      }

      :host .class-card-meta > div:first-child strong {
        display: block;
        font-family: Consolas, monospace;
        overflow-wrap: anywhere;
      }

      :host .class-card-date {
        max-width: 100%;
      }

      :host .class-card-date strong {
        display: block;
        white-space: nowrap;
      }

      :host .class-card-action {
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

      :host .modal-close {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 10px;
      }

      :host .class-form {
        display: grid;
        gap: 14px;
      }

      :host .class-form label {
        display: grid;
        gap: 7px;
      }

      :host .class-form input,
      :host .class-form select,
      :host .class-form textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host .class-form input,
      :host .class-form select {
        min-height: 44px;
      }

      :host .class-form textarea {
        resize: vertical;
        min-height: 110px;
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
      }

      :host .modal-submit-danger:hover:not(:disabled) {
        background: #b91c1c;
      }

      :host .delete-modal-copy {
        margin: 0 0 18px;
        color: rgba(250, 249, 246, 0.72);
        line-height: 1.55;
      }

      :host .delete-modal-copy strong {
        color: #fff;
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

      :host .detail-stat > span {
        margin: 0;
      }

      :host .detail-stat strong,
      :host .detail-code-copy strong {
        color: #fff;
        font-size: 1rem;
        line-height: 1.35;
      }

      :host .detail-stat-empty {
        color: rgba(250, 249, 246, 0.72);
      }

      :host .detail-code-copy {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px 12px;
        padding: 10px 12px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        border-radius: 10px;
        background: rgba(212, 175, 55, 0.08);
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      :host .detail-code-copy:hover {
        background: rgba(212, 175, 55, 0.14);
        border-color: rgba(212, 175, 55, 0.45);
      }

      :host .detail-code-copy.is-copied {
        border-color: rgba(34, 197, 94, 0.45);
        background: rgba(34, 197, 94, 0.12);
      }

      :host .detail-code-copy strong {
        font-family: Consolas, monospace;
        overflow-wrap: anywhere;
      }

      :host .detail-code-copy-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--matheo-gold);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host .detail-code-copy.is-copied .detail-code-copy-action {
        color: #86efac;
      }

      :host .detail-code-copy .icon {
        width: 16px;
        height: 16px;
      }

      :host .student-name {
        color: #fff;
        font-weight: 700;
      }

      :host .student-username {
        font-family: Consolas, monospace;
        color: rgba(250, 249, 246, 0.82);
        overflow-wrap: anywhere;
      }

      :host .student-row {
        cursor: pointer;
      }

      :host .student-row:hover,
      :host .student-row:focus-visible {
        background: rgba(212, 175, 55, 0.08);
        outline: none;
      }

      :host .student-row:hover .student-name,
      :host .student-row:focus-visible .student-name {
        color: var(--matheo-gold);
      }

      :host .student-last-activity {
        white-space: nowrap;
      }

      :host .student-progress {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-width: 180px;
        max-width: 280px;
      }

      :host .student-progress-bar {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
      }

      :host .student-progress-bar > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(212, 175, 55, 0.85), rgba(212, 175, 55, 1));
      }

      :host .student-progress strong {
        color: #fff;
        font-size: 0.92rem;
        white-space: nowrap;
      }

      :host .students-progress-table td:first-child {
        min-width: 160px;
      }

      :host .table-wrap {
        overflow-x: auto;
      }

      :host table {
        width: 100%;
        border-collapse: collapse;
      }

      :host th,
      :host td {
        padding: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        text-align: left;
      }

      :host th {
        color: var(--matheo-gold);
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host td {
        color: rgba(250, 249, 246, 0.78);
      }

      @media (max-width: 1040px) {
        :host .detail-top {
          grid-template-columns: 1fr;
        }

        :host .view-header {
          flex-direction: column;
        }
      }

      @media (max-width: 680px) {
        :host .class-grid {
          grid-template-columns: 1fr;
        }

        :host .class-card-meta {
          grid-template-columns: 1fr auto;
        }

        :host .class-card-date {
          text-align: right;
        }
      }
    `;
}
