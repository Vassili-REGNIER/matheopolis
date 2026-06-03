import { icon } from "../../../../utils/icons.js";
import { escapeHtml } from "../../../../utils/dom.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";
import { BaseGame } from "../BaseGame.js";

export class BaseConversionGame extends BaseGame {
  private readonly challenges: RiddleQuestion[] = this.params.questions;
  private currentIndex = 0;
  private score = 0;
  private mistakes = 0;

  public start(): void {
    this.renderChallenge("");
  }

  public override destroy(): void {
    super.destroy();
  }

  public showHint(): void {
    const current = this.challenges[this.currentIndex];
    this.renderChallenge(current?.hint ?? "Regardez les puissances de 2.");
  }

  private renderChallenge(message: string, tone: "good" | "bad" | "info" = "info"): void {
    this.clearListeners();
    this.updateProgress(this.score, this.mistakes, this.currentIndex);
    const current = this.challenges[this.currentIndex];
    if (current === undefined) {
      this.complete(this.score, "base-conversion-complete");
      return;
    }

    this.container.innerHTML = `
      <article class="bc-card">
        <form>
          <label>
            <span>Valeur en base 10</span>
            <input name="answer" type="number" autocomplete="off" required>
          </label>
          <p class="bc-message" data-tone="${tone}">${escapeHtml(message)}</p>
          <div class="bc-actions">
            <button type="submit" class="submit-button">${icon("check")} Valider</button>
          </div>
        </form>
        <footer>${this.currentIndex + 1} / ${this.challenges.length}</footer>
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
          this.mistakes += 1;
          this.renderChallenge("Ce n'est pas encore la bonne valeur.", "bad");
        }
      });
    }
  }

  private style(): string {
    return `
      <style>
        .bc-card { width:100%; margin:0; padding:24px; color:#fff; }
        .bc-card label span { color:#d4af37; font-size:.75rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
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
