import { BaseGame } from "../BaseGame.js";

interface NoteItem {
  note: string;
  fraction: string;
  frequency: number;
}

interface MissionItem {
  displayed: string;
  reduced: string;
  targetNote: string;
  targetFraction: string;
}

const notes: NoteItem[] = [
  { note: "DO", fraction: "1", frequency: 261.63 },
  { note: "RE", fraction: "9/8", frequency: 294.33 },
  { note: "MI", fraction: "81/64", frequency: 331.12 },
  { note: "FA", fraction: "4/3", frequency: 348.84 },
  { note: "SOL", fraction: "3/2", frequency: 392.45 },
  { note: "LA", fraction: "27/16", frequency: 441.5 },
  { note: "SI", fraction: "243/128", frequency: 496.67 },
  { note: "DO+", fraction: "2", frequency: 523.25 }
];

const missions: MissionItem[] = [
  { displayed: "2/2", reduced: "1", targetNote: "SOL", targetFraction: "3/2" },
  { displayed: "6/4", reduced: "3/2", targetNote: "RE", targetFraction: "9/8" },
  { displayed: "18/16", reduced: "9/8", targetNote: "LA", targetFraction: "27/16" },
  { displayed: "54/32", reduced: "27/16", targetNote: "MI", targetFraction: "81/64" },
  { displayed: "162/128", reduced: "81/64", targetNote: "SI", targetFraction: "243/128" },
  { displayed: "16/12", reduced: "4/3", targetNote: "DO+", targetFraction: "2" }
];

export class PianoFractionsGame extends BaseGame {
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
    const current = missions[this.currentIndex];
    if (current === undefined) {
      return;
    }
    this.missionHint = `Indice : ${current.displayed} se reduit en ${current.reduced}. Multipliez par 3/2 puis ramenez sous 2 si besoin.`;
    this.message = this.missionHint;
    this.messageTone = "good";
    this.renderGame();
  }

  private renderGame(activeNote = ""): void {
    this.clearListeners();
    const current = missions[this.currentIndex];
    if (current === undefined) {
      this.complete(this.score, "piano-fractions-complete");
      return;
    }

    this.container.innerHTML = `
      <article class="fm-card">
        <header>
          <div class="fm-badge">Mission : Les quintes cachees</div>
          <h1>Le piano de Pythagore</h1>
          <p>Simplifiez la fraction affichee, puis trouvez la note qui correspond a sa <strong>quinte</strong>.</p>
        </header>
        <section class="fm-stats">
          <div><span>Score</span><strong>${this.score}</strong></div>
          <div><span>Note</span><strong>${Math.min(this.currentIndex + 1, missions.length)}/${missions.length}</strong></div>
          <div><span>Erreurs</span><strong>${this.mistakes}</strong></div>
        </section>
        <section class="fm-mission">
          <span>Fraction a analyser</span>
          <strong>${current.displayed}</strong>
          <p>${this.missionHint}</p>
        </section>
        <div class="fm-melody">
          ${missions.map((mission, index) => `<span class="${index < this.currentIndex ? "done" : ""}">${index < this.currentIndex ? mission.targetNote : "?"}</span>`).join("")}
        </div>
        <section class="fm-piano-area">
          <p>Cliquez sur la note qui correspond a la <strong>quinte</strong> de la fraction reduite.</p>
          <div class="fm-piano">
            ${notes.map((note) => `
              <button type="button" data-note="${note.note}" class="${activeNote === note.note ? "active" : ""}">
                <span>${note.note}</span>
                <small>${note.fraction}</small>
              </button>
            `).join("")}
          </div>
        </section>
        <p class="fm-message ${this.messageTone}">${this.message}</p>
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
        const note = notes.find((item) => item.note === noteName);
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
    const current = missions[this.currentIndex];
    if (current === undefined) {
      return;
    }

    this.playFrequency(note.frequency);
    if (note.note === current.targetNote) {
      this.score += 10;
      this.currentIndex += 1;
      this.message = `Bravo ! ${current.displayed} = ${current.reduced}. Sa quinte est ${current.targetFraction} (${note.note}).`;
      this.messageTone = "good";
      if (this.currentIndex >= missions.length) {
        this.missionHint = "Melodie terminee ! Laurence a resolu l'enigme des quintes.";
        this.renderGame(note.note);
        window.setTimeout(() => this.complete(this.score, "piano-fractions-complete"), 900);
      } else {
        this.missionHint = "Etape 1 : reduis la fraction. Etape 2 : trouve sa quinte.";
        this.renderGame(note.note);
      }
    } else {
      this.mistakes += 1;
      this.message = `Erreur. Reduisez d'abord ${current.displayed}, puis cherchez la quinte.`;
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
    missions.forEach((mission, index) => {
      const note = notes.find((item) => item.note === mission.targetNote);
      if (note !== undefined) {
        window.setTimeout(() => this.playFrequency(note.frequency, 0.34), index * 420);
      }
    });
  }

  private style(): string {
    return `
      <style>
        .fm-card { width:min(980px,100%); margin:0 auto; padding:30px; border:1px solid rgba(213,184,54,.38); border-radius:18px; background:linear-gradient(135deg,#171b33,#20275a 58%,#2f3187); box-shadow:var(--matheo-shadow); color:#f8f7ff; }
        .fm-card header { text-align:center; margin-bottom:22px; }
        .fm-badge { display:inline-block; padding:7px 13px; border-radius:999px; background:rgba(91,44,179,.56); color:#d5b836; font-weight:900; font-size:.84rem; border:1px solid rgba(213,184,54,.22); }
        .fm-card h1 { margin:12px 0 0; font-family:var(--font-title); font-size:clamp(2rem,4vw,3.8rem); line-height:.95; }
        .fm-card header p,.fm-mission p,.fm-piano-area p { color:#b8bdd5; line-height:1.6; }
        .fm-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:22px 0; }
        .fm-stats div { background:rgba(22,26,50,.78); padding:15px; border-radius:14px; text-align:center; border:1px solid rgba(213,184,54,.2); }
        .fm-stats span,.fm-mission span { display:block; color:#d5b836; font-size:.82rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
        .fm-stats strong { font-size:1.5rem; }
        .fm-mission { text-align:center; padding:14px 16px; border-radius:14px; background:rgba(20,24,46,.86); border:1px solid rgba(213,184,54,.26); }
        .fm-mission strong { display:block; font-size:clamp(2rem,4vw,3.2rem); color:#fff; margin:4px 0; }
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
        @media (max-width:820px){ .fm-stats{grid-template-columns:1fr;} .fm-piano button{width:72px;min-width:64px;height:180px;} }
      </style>
    `;
  }
}
