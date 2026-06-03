import type { RiddleQuestion } from "../../../../models/GameConfig.js";
import { escapeHtml, isRecord, readNumber, readString } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";

interface NoteItem {
  note: string;
  fraction: string;
  frequency: number;
}

export class PianoFractionsGame extends BaseGame {
  private readonly notes: NoteItem[] = this.readNotes(this.params.notes);
  private readonly missions: RiddleQuestion[] = this.params.questions;
  private currentIndex = 0;
  private score = 0;
  private mistakes = 0;
  private message = "";
  private messageTone: "good" | "bad" = "good";
  private missionHint = "Etape 1 : reduis la fraction. Etape 2 : trouve sa quinte.";
  private audioContext: AudioContext | null = null;

  public start(): void {
    this.renderGame();
  }

  public override destroy(): void {
    if (this.audioContext !== null) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    super.destroy();
  }

  public showHint(): void {
    const current = this.missions[this.currentIndex];
    if (current === undefined) {
      return;
    }
    this.missionHint = `Indice : ${current.hint}`;
    this.message = this.missionHint;
    this.messageTone = "good";
    this.renderGame();
  }

  private renderGame(activeNote = ""): void {
    this.clearListeners();
    this.updateProgress(this.score, this.mistakes, this.currentIndex);
    const current = this.missions[this.currentIndex];
    if (current === undefined) {
      this.complete(this.score, "piano-fractions-complete");
      return;
    }

    this.container.innerHTML = `
      <article class="fm-card">
        <div class="fm-melody">
          ${this.missions.map((mission, index) => `<span class="${index < this.currentIndex ? "done" : ""}">${index < this.currentIndex ? escapeHtml(mission.answer) : "?"}</span>`).join("")}
        </div>
        <section class="fm-piano-area">
          <p>Cliquez sur la note qui correspond a la <strong>quinte</strong> de la fraction reduite.</p>
          <div class="fm-piano">
            ${this.notes.map((note) => `
              <button type="button" data-note="${escapeHtml(note.note)}" class="${activeNote === note.note ? "active" : ""}">
                <span>${escapeHtml(note.note)}</span>
                <small>${escapeHtml(note.fraction)}</small>
              </button>
            `).join("")}
          </div>
        </section>
        <p class="fm-message ${this.messageTone}">${escapeHtml(this.message)}</p>
        <div class="fm-actions">
          <button type="button" data-action="melody">Ecouter la melodie</button>
          <button type="button" data-action="restart">Recommencer</button>
        </div>
      </article>
      ${this.style()}
    `;

    this.container.querySelectorAll<HTMLButtonElement>("[data-note]").forEach((button) => {
      this.listen(button, "click", () => {
        const noteName = button.dataset.note ?? "";
        const note = this.notes.find((item) => item.note === noteName);
        if (note !== undefined) {
          this.handleNote(note);
        }
      });
    });

    const melody = this.container.querySelector<HTMLButtonElement>('[data-action="melody"]');
    if (melody !== null) {
      this.listen(melody, "click", () => this.playMelody());
    }

    const restart = this.container.querySelector<HTMLButtonElement>('[data-action="restart"]');
    if (restart !== null) {
      this.listen(restart, "click", () => {
        this.currentIndex = 0;
        this.score = 0;
        this.mistakes = 0;
        this.message = "";
        this.missionHint = "Etape 1 : reduis la fraction. Etape 2 : trouve sa quinte.";
        this.renderGame();
      });
    }
  }

  private handleNote(note: NoteItem): void {
    const current = this.missions[this.currentIndex];
    if (current === undefined) {
      return;
    }

    this.playFrequency(note.frequency);
    if (note.note === current.answer) {
      const metadata = isRecord(current.metadata) ? current.metadata : {};
      const reduced = readString(metadata.reduced, current.question);
      const targetFraction = readString(metadata.targetFraction, note.fraction);
      this.score += 10;
      this.currentIndex += 1;
      this.message = `Bravo ! ${current.question} = ${reduced}. Sa quinte est ${targetFraction} (${note.note}).`;
      this.messageTone = "good";
      if (this.currentIndex >= this.missions.length) {
        this.missionHint = "Melodie terminee ! Laurence a resolu l'enigme des quintes.";
        this.renderGame(note.note);
        window.setTimeout(() => this.complete(this.score, "piano-fractions-complete"), 900);
      } else {
        this.missionHint = "Etape 1 : reduis la fraction. Etape 2 : trouve sa quinte.";
        this.renderGame(note.note);
      }
    } else {
      this.mistakes += 1;
      this.message = `Erreur. Reduisez d'abord ${current.question}, puis cherchez la quinte.`;
      this.messageTone = "bad";
      this.renderGame(note.note);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext !== null) {
      return this.audioContext;
    }
    const AudioContextCtor = window.AudioContext;
    if (AudioContextCtor === undefined) {
      return null;
    }
    this.audioContext = new AudioContextCtor();
    return this.audioContext;
  }

  private playFrequency(frequency: number, duration = 0.42): void {
    const context = this.getAudioContext();
    if (context === null) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  private playMelody(): void {
    this.missions.forEach((mission, index) => {
      const note = this.notes.find((item) => item.note === mission.answer);
      if (note !== undefined) {
        window.setTimeout(() => this.playFrequency(note.frequency, 0.34), index * 420);
      }
    });
  }

  private readNotes(value: unknown): NoteItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(isRecord)
      .map((item) => ({
        note: readString(item.note),
        fraction: readString(item.fraction),
        frequency: readNumber(item.frequency)
      }))
      .filter((item) => item.note !== "" && item.fraction !== "" && item.frequency > 0);
  }

  private style(): string {
    return `
      <style>
        .fm-card { width:100%; margin:0; padding:24px; color:#f8f7ff; }
        .fm-card header p,.fm-piano-area p { color:#b8bdd5; line-height:1.6; }
        .fm-melody { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:18px 0; }
        .fm-melody span { min-width:54px; padding:9px 12px; border-radius:999px; background:rgba(255,255,255,.08); color:#dce0f5; text-align:center; font-weight:900; }
        .fm-melody span.done { background:rgba(213,184,54,.2); color:#fff4a8; }
        .fm-piano-area { background:rgba(20,24,46,.72); border:1px solid rgba(213,184,54,.18); border-radius:18px; padding:18px; }
        .fm-piano { display:flex; justify-content:center; align-items:stretch; min-height:210px; gap:4px; padding:12px; background:#11162c; border-radius:14px; overflow-x:auto; }
        .fm-piano button { width:92px; min-width:72px; height:200px; background:linear-gradient(#fff,#dadde8); color:#171b33; border:1px solid #c8cad6; border-radius:0 0 14px 14px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding:0 6px 16px; font-weight:900; transition:transform .12s,box-shadow .12s,background .12s; }
        .fm-piano button:hover { transform:translateY(4px); }
        .fm-piano button.active { background:linear-gradient(#fff7c2,#d5b836); box-shadow:0 0 28px rgba(213,184,54,.44); transform:translateY(7px); }
        .fm-piano small { opacity:.7; margin-top:4px; }
        .fm-message { min-height:34px; text-align:center; font-weight:900; }
        .fm-message.good { color:#d5b836; }
        .fm-message.bad { color:#ff8fa3; }
        .fm-actions { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
        .fm-actions button { min-height:42px; border:1px solid rgba(213,184,54,.24); border-radius:10px; background:rgba(255,255,255,.08); color:#f8f7ff; padding:0 16px; font-weight:900; }
        @media (max-width:820px){ .fm-piano button{width:72px;min-width:64px;height:180px;} }
      </style>
    `;
  }
}
