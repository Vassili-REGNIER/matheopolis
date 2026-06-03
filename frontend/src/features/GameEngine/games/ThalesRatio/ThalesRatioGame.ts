import { escapeHtml, isRecord } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";

export class ThalesRatioGame extends BaseGame {
  private readonly question = this.params.questions[0];
  private score = 0;
  private mistakes = 0;
  private message = "";
  private selected: string | null = null;

  public start(): void {
    this.renderGame();
  }

  public override destroy(): void {
    super.destroy();
  }

  public showHint(): void {
    this.message = this.question?.hint ?? "";
    this.renderGame();
  }

  private renderGame(): void {
    this.clearListeners();
    this.updateProgress(this.score, this.mistakes, 0);
    if (this.question === undefined) {
      this.container.innerHTML = `<article class="th-card"><p>Aucune question configuree.</p></article>${this.style()}`;
      return;
    }

    const question = this.question;
    const metadata = isRecord(question.metadata) ? question.metadata : {};
    const answers = this.readOptions(metadata.options);
    const largeTriangle = this.readTriangle(metadata.largeTriangle, "6", "x");
    const smallTriangle = this.readTriangle(metadata.smallTriangle, "4", "6");
    this.container.innerHTML = `
      <article class="th-card">
        <section class="diagram" aria-label="Schema de Thales">
          <div class="triangle large"><span>${escapeHtml(largeTriangle.side)}</span><strong>${escapeHtml(largeTriangle.unknown)}</strong></div>
          <div class="triangle small"><span>${escapeHtml(smallTriangle.side)}</span><strong>${escapeHtml(smallTriangle.unknown)}</strong></div>
        </section>
        <div class="answers">
          ${answers.map((answer) => `<button type="button" data-answer="${escapeHtml(answer)}" data-selected="${this.selected === answer ? "true" : "false"}">${escapeHtml(answer)}</button>`).join("")}
        </div>
        <p class="message">${escapeHtml(this.message)}</p>
      </article>
      ${this.style()}
    `;

    this.container.querySelectorAll<HTMLButtonElement>("[data-answer]").forEach((button) => {
      this.listen(button, "click", () => {
        const answer = button.dataset.answer ?? "";
        this.selected = answer;
        if (answer === question.answer) {
          this.score = 80;
          this.message = "Exact : les rapports sont egaux.";
          this.renderGame();
          window.setTimeout(() => this.complete(80, "thales-ratio-complete"), 650);
        } else {
          this.mistakes += 1;
          this.message = "Le rapport n'est pas conserve. Reessayez.";
          this.renderGame();
        }
      });
    });
  }

  private readOptions(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [this.question?.answer ?? ""].filter((answer) => answer !== "");
    }
    return value.filter((option): option is string => typeof option === "string");
  }

  private readTriangle(value: unknown, side: string, unknown: string): { side: string; unknown: string } {
    if (!isRecord(value)) {
      return { side, unknown };
    }
    return {
      side: typeof value.side === "string" ? value.side : side,
      unknown: typeof value.unknown === "string" ? value.unknown : unknown
    };
  }

  private style(): string {
    return `
      <style>
        .th-card { width:100%; margin:0; padding:24px; color:#fff; }
        .message { color:rgba(250,249,246,.7); }
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
