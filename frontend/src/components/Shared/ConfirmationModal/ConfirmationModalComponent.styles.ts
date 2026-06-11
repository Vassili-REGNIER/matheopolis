export function confirmationModalStyles(): string {
  return `
    :host {
      display: block;
    }

    :host .create-modal {
      position: fixed;
      inset: 0;
      z-index: 70;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow-y: auto;
      background: rgba(2, 6, 23, 0.72);
      backdrop-filter: blur(4px);
    }

    :host .create-modal-panel {
      width: min(560px, 100%);
      max-height: calc(100dvh - 48px);
      overflow-y: auto;
      padding: 22px;
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 14px;
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

    :host .modal-header p {
      margin: 0 0 6px;
      color: var(--matheo-gold);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    :host .modal-header h2 {
      margin: 0;
      color: #fff;
      font-size: 1.6rem;
      line-height: 1.2;
    }

    :host .modal-copy {
      margin: 0 0 18px;
      color: rgba(250, 249, 246, 0.72);
      line-height: 1.55;
    }

    :host .modal-copy p {
      margin: 0;
    }

    :host .modal-copy strong {
      color: #fff;
    }

    :host .modal-message {
      margin: 0 0 18px;
      color: var(--matheo-danger);
    }

    :host .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    :host .modal-actions-split {
      flex-wrap: wrap;
    }

    :host .modal-actions-split .modal-cancel,
    :host .modal-actions-split .modal-submit {
      flex: 1 1 180px;
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

    :host .modal-submit-danger {
      background: #dc2626;
      color: #fff;
    }

    :host .modal-submit-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    :host .modal-submit:disabled,
    :host .modal-cancel:disabled,
    :host .modal-close:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    :host .icon {
      width: 20px;
      height: 20px;
      flex: none;
    }

    :host .student-password-result {
      display: grid;
      gap: 7px;
      margin-top: 14px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(212, 175, 55, 0.1);
    }

    :host .student-password-result span {
      color: var(--matheo-gold);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    :host .student-password-result strong {
      color: #fff;
      font-size: 1.25rem;
      letter-spacing: 0.04em;
      overflow-wrap: anywhere;
    }

    @media (max-width: 520px) {
      :host .create-modal {
        place-items: start center;
        padding: 14px;
      }

      :host .create-modal-panel {
        max-height: calc(100dvh - 28px);
        padding: 18px;
      }

      :host .modal-header h2 {
        font-size: 1.35rem;
      }

      :host .modal-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      :host .modal-cancel,
      :host .modal-submit {
        width: 100%;
      }
    }
  `;
}
