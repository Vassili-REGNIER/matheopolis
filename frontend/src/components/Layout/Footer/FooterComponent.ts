export function footerTemplate(): string {
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <section class="footer-section" aria-label="Porteur du projet">
          <h2>Porteur du projet</h2>
          <ul>
            <li>Julien Cassaigne</li>
            <li>Laurent Beddou</li>
          </ul>
        </section>

        <section class="footer-section" aria-label="Auteurs du livre">
          <h2>Auteurs du livre</h2>
          <ul>
            <li>Francis Loret</li>
            <li>Pierre Seguin</li>
            <li>Fabrice Lli</li>
          </ul>
        </section>

        <section class="footer-section" aria-label="Cr&eacute;ateurs du site">
          <h2>Cr&eacute;ateurs du site</h2>
          <ul>
            <li>Sofia Ach</li>
            <li>Maxime Arfi</li>
            <li>Heather Burbeck</li>
            <li>Ilian Marchitto</li>
            <li>Vassili R&eacute;gnier</li>
          </ul>
        </section>

        <div class="footer-bottom">
          <p><strong>Math&eacute;opolis</strong> 2026</p>
          <a href="#" aria-label="Consulter les mentions l&eacute;gales">Mentions l&eacute;gales</a>
        </div>
      </div>
    </footer>
  `;
}

export function footerStyles(hostSelector = ":host"): string {
  return `
    ${hostSelector} .site-footer {
      display: block;
      border-top: 1px solid rgba(212, 175, 55, 0.18);
      background: rgba(15, 23, 42, 0.96);
      color: rgba(250, 249, 246, 0.72);
    }

    ${hostSelector} .site-footer .footer-inner {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 22px 24px 18px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px 28px;
    }

    ${hostSelector} .site-footer .footer-section h2 {
      margin: 0 0 8px;
      color: var(--matheo-gold);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    ${hostSelector} .site-footer ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
    }

    ${hostSelector} .site-footer li {
      display: inline-flex;
      align-items: center;
      line-height: 1.45;
      font-size: 0.88rem;
      color: rgba(250, 249, 246, 0.78);
    }

    ${hostSelector} .site-footer li:not(:last-child)::after {
      content: "";
      width: 3px;
      height: 3px;
      margin-left: 10px;
      border-radius: 50%;
      background: rgba(212, 175, 55, 0.56);
    }

    ${hostSelector} .site-footer .footer-bottom {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px 24px;
      padding-top: 14px;
      border-top: 1px solid rgba(250, 249, 246, 0.1);
      color: rgba(250, 249, 246, 0.58);
      font-size: 0.86rem;
    }

    ${hostSelector} .site-footer p,
    ${hostSelector} .site-footer a {
      margin: 0;
    }

    ${hostSelector} .site-footer strong {
      color: rgba(250, 249, 246, 0.84);
    }

    ${hostSelector} .site-footer a {
      color: rgba(250, 249, 246, 0.7);
      text-decoration: none;
      border-bottom: 1px solid rgba(212, 175, 55, 0.34);
    }

    ${hostSelector} .site-footer a:hover {
      color: var(--matheo-gold);
      border-bottom-color: currentColor;
    }

    @media (max-width: 760px) {
      ${hostSelector} .site-footer .footer-inner {
        grid-template-columns: 1fr;
        padding: 22px 18px 18px;
      }

      ${hostSelector} .site-footer .footer-bottom {
        display: grid;
      }
    }
  `;
}
