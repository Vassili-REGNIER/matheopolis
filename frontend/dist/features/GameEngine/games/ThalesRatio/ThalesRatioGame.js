import { BaseGame } from "../BaseGame.js";
export class ThalesRatioGame extends BaseGame {
    message = "";
    selected = null;
    start() {
        this.renderGame();
    }
    destroy() {
        super.destroy();
    }
    showHint() {
        this.message = "Utilisez le rapport 6 / 4 = x / 6, donc x = 9.";
        this.renderGame();
    }
    renderGame() {
        this.clearListeners();
        const answers = ["7.5", "8", "9", "12"];
        this.container.innerHTML = `
      <article class="th-card">
        <header>
          <p>Mission : Triangles semblables</p>
          <h1>Theoreme de Thales</h1>
          <span>Retrouvez la longueur manquante dans deux triangles proportionnels.</span>
        </header>
        <section class="diagram" aria-label="Schema de Thales">
          <div class="triangle large"><span>6</span><strong>x</strong></div>
          <div class="triangle small"><span>4</span><strong>6</strong></div>
        </section>
        <div class="answers">
          ${answers.map((answer) => `<button type="button" data-answer="${answer}" data-selected="${this.selected === answer ? "true" : "false"}">${answer}</button>`).join("")}
        </div>
        <p class="message">${this.message}</p>
      </article>
      ${this.style()}
    `;
        this.container.querySelectorAll("[data-answer]").forEach((button) => {
            this.listen(button, "click", () => {
                const answer = button.dataset.answer ?? "";
                this.selected = answer;
                if (answer === "9") {
                    this.message = "Exact : les rapports sont egaux.";
                    this.renderGame();
                    window.setTimeout(() => this.complete(80, "thales-ratio-complete"), 650);
                }
                else {
                    this.message = "Le rapport n'est pas conserve. Reessayez.";
                    this.renderGame();
                }
            });
        });
    }
    style() {
        return `
      <style>
        .th-card { width:min(780px,100%); margin:0 auto; padding:28px; border:1px solid rgba(212,175,55,.34); border-radius:18px; background:linear-gradient(135deg,#171b33,#20275a 58%,#2f3187); color:#fff; box-shadow:var(--matheo-shadow); }
        .th-card header { text-align:center; margin-bottom:22px; }
        .th-card header p { color:#d4af37; font-size:.75rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .th-card h1 { margin:6px 0; font-family:var(--font-title); font-size:clamp(2.2rem,6vw,3.6rem); }
        .th-card header span,.message { color:rgba(250,249,246,.7); }
        .diagram { min-height:280px; display:flex; align-items:end; justify-content:center; gap:42px; padding:22px; border-radius:16px; background:rgba(15,23,42,.72); border:1px solid rgba(212,175,55,.22); }
        .triangle { position:relative; width:0; height:0; border-left:95px solid transparent; border-right:95px solid transparent; border-bottom:180px solid rgba(212,175,55,.28); filter:drop-shadow(0 12px 28px rgba(0,0,0,.28)); }
        .triangle.small { transform:scale(.72); transform-origin:bottom center; border-bottom-color:rgba(124,242,154,.24); }
        .triangle span,.triangle strong { position:absolute; color:#fff; font-weight:900; background:rgba(15,23,42,.76); padding:4px 8px; border-radius:999px; }
        .triangle span { left:-112px; bottom:72px; }
        .triangle strong { left:46px; bottom:72px; color:#d4af37; }
        .answers { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:18px; }
        .answers button { min-height:48px; border:1px solid rgba(212,175,55,.26); border-radius:10px; background:rgba(255,255,255,.06); color:#fff; font-weight:900; }
        .answers button:hover,.answers button[data-selected="true"] { background:#d4af37; color:#0f172a; }
        .message { min-height:24px; text-align:center; font-weight:800; }
        @media (max-width:700px){ .answers{grid-template-columns:repeat(2,1fr);} .diagram{gap:8px;} }
      </style>
    `;
    }
}
