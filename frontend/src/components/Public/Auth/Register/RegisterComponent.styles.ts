export function registerStyles(): string {
  return `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        position: relative;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 24px;
        background: linear-gradient(135deg, #1e3a8a, #312e81 52%, #5b21b6);
      }

      :host .pattern {
        position: absolute;
        inset: 0;
        opacity: 0.1;
        background-image:
          linear-gradient(rgba(212, 175, 55, 0.28) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 175, 55, 0.28) 1px, transparent 1px);
        background-size: 64px 64px;
      }

      :host [hidden] {
        display: none !important;
      }

      :host .register-card {
        position: relative;
        z-index: 1;
        width: min(520px, 100%);
        max-height: calc(100dvh - 48px);
        overflow-y: auto;
        padding: 30px;
        border: 1px solid rgba(212, 175, 55, 0.34);
        border-radius: 22px;
        background: rgba(15, 23, 42, 0.86);
        box-shadow: var(--matheo-shadow);
        backdrop-filter: blur(18px);
      }

      :host .icon {
        width: 18px;
        height: 18px;
      }

      :host .back-button,
      :host .login-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0;
        border: 0;
        background: transparent;
        color: rgba(250, 249, 246, 0.44);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host .back-button:hover,
      :host .login-link:hover {
        color: var(--matheo-gold);
      }

      :host .register-heading {
        margin: 28px 0 24px;
        text-align: center;
      }

      :host .emblem {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        color: var(--matheo-gold);
      }

      :host .emblem .icon {
        width: 52px;
        height: 52px;
      }

      :host h1 {
        margin: 0;
        color: #fff;
        font-size: 1.85rem;
      }

      :host .role-tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      :host .role-tabs button {
        min-height: 44px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: rgba(255, 255, 255, 0.46);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      :host .role-tabs button[data-active="true"] {
        border-color: var(--matheo-gold);
        color: var(--matheo-gold);
      }

      :host form {
        display: grid;
        gap: 14px;
      }

      :host .two-cols {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      :host label {
        display: grid;
        gap: 7px;
      }

      :host label span {
        color: rgba(250, 249, 246, 0.7);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      :host input {
        width: 100%;
        height: 46px;
        padding: 0 13px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        outline: none;
        background: rgba(255, 255, 255, 0.055);
        color: #fff;
      }

      :host input:focus {
        border-color: rgba(212, 175, 55, 0.72);
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
      }

      :host .role-note,
      :host .academic-note,
      :host .form-message {
        min-height: 20px;
        margin: 0;
        color: rgba(250, 249, 246, 0.58);
        font-size: 0.86rem;
        line-height: 1.4;
      }

      :host .academic-note {
        color: var(--matheo-gold);
      }

      :host .form-message[data-tone="good"] {
        color: var(--matheo-green);
      }

      :host .form-message[data-tone="bad"] {
        color: var(--matheo-danger);
      }

      :host .submit-button {
        min-height: 50px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 0;
        border-radius: 10px;
        background: var(--matheo-gold);
        color: #0f172a;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      :host .login-link {
        margin: 22px auto 0;
        display: flex;
      }

      @media (max-width: 540px) {
        :host .two-cols {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 420px) {
        :host {
          padding: 16px;
        }

        :host .register-card {
          max-height: calc(100dvh - 32px);
          padding: 24px 20px;
          border-radius: 18px;
        }

        :host .role-tabs {
          grid-template-columns: 1fr;
        }

        :host h1 {
          font-size: 1.5rem;
        }
      }
    `;
}
