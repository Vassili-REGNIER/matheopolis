import { icon } from "../../../../utils/icons.js";
import { BaseGame } from "../BaseGame.js";

const challenges = [
  { question: "101010", answer: "42", hint: "32 + 8 + 2" },
  { question: "1111", answer: "15", hint: "8 + 4 + 2 + 1" },
  { question: "100000", answer: "32", hint: "Une seule puissance de deux est active." }
];

export class BaseConversionGame extends BaseGame {
  private currentIndex = 0;
  private score = 0;

  public start(): void {
    this.renderChallenge("");
  }

  public override destroy(): void {
    super.destroy();
  }

  public showHint(): void {
    const current = challenges[this.currentIndex];
    this.renderChallenge(current?.hint ?? "Regardez les puissances de 2.");
  }

  private renderChallenge(message: string, tone: "good" | "bad" | "info" = "info"): void {
    this.clearListeners();
    const current = challenges[this.currentIndex];
    if (current === undefined) {
      this.complete(this.score, "base-conversion-complete");
      return;
    }

    this.container.innerHTML = `
      <article class="bc-card">
        <header>
          <p>Mission : Convertisseur</p>
          <h1>Conversion de base</h1>
          <span>Transformez les nombres binaires en base 10.</span>
        </header>
        <section class="bc-question">
          <span>Binaire</span>
          <strong>${current.question}</strong>
        </section>
        <form>
          <label>
            <span>Valeur en base 10</span>
            <input name="answer" type="number" autocomplete="off" required>
          </label>
          <p class="bc-message" data-tone="${tone}">${message}</p>
          <div class="bc-actions">
            <button type="submit" class="submit-button">${icon("check")} Valider</button>
          </div>
        </form>
        <footer>${this.currentIndex + 1} / ${challenges.length} - Score ${this.score}</footer>
      </article>
      ${this.style()}
    `;

    const form = this.container.querySelector<HTMLFormElement>("form");
    if (form !== null) {
      this.listen(form, "submit", (event) => {
        event.preventDefault();
        const answer = String(new FormData(form).get("answer") ?? "").trim();
        if (answer === current.answer) {
          this.score += 20;
          this.currentIndex += 1;
          this.renderChallenge("Bonne conversion.", "good");
        } else {
          this.renderChallenge("Ce n'est pas encore la bonne valeur.", "bad");
        }
      });
    }
  }

  private style(): string {
    return `
      <style>
        .bc-card { width:min(720px,100%); margin:0 auto; padding:30px; border:1px solid rgba(212,175,55,.34); border-radius:18px; background:rgba(15,23,42,.84); color:#fff; box-shadow:var(--matheo-shadow); }
        .bc-card header { text-align:center; margin-bottom:24px; }
        .bc-card header p,.bc-question span,.bc-card label span { color:#d4af37; font-size:.75rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .bc-card h1 { margin:6px 0; font-family:var(--font-title); font-size:clamp(2.2rem,6vw,3.6rem); }
        .bc-card header span { color:rgba(250,249,246,.7); }
        .bc-question { text-align:center; padding:18px; border-radius:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14); margin-bottom:18px; }
        .bc-question strong { display:block; font-size:clamp(2.4rem,8vw,4rem); letter-spacing:.08em; color:#fff; }
        .bc-card form { display:grid; gap:12px; }
        .bc-card label { display:grid; gap:8px; }
        .bc-card input { height:48px; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:0 14px; background:rgba(255,255,255,.06); color:#fff; }
        .bc-message { min-height:24px; margin:0; color:rgba(250,249,246,.68); }
        .bc-message[data-tone="good"] { color:#7cf29a; }
        .bc-message[data-tone="bad"] { color:#ff6f8f; }
        .bc-card footer { color:rgba(250,249,246,.55); font-size:.9rem; }
      </style>
    `;
  }
}
