import type { NoteItem } from "../../../../models/game-engine/PianoFractions.js";
import type { RiddleQuestion } from "../../../../models/GameConfig.js";
import { escapeHtml, isRecord, readNumber, readString } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { chapterGameStyles } from "../shared/chapterGameStyles.js";

const defaultPianoNotes: NoteItem[] = [
  { note: "DO", fraction: "1", frequency: 261.63 },
  { note: "RE", fraction: "9/8", frequency: 294.33 },
  { note: "MI", fraction: "81/64", frequency: 331.12 },
  { note: "FA", fraction: "4/3", frequency: 348.84 },
  { note: "SOL", fraction: "3/2", frequency: 392.45 },
  { note: "LA", fraction: "27/16", frequency: 441.5 },
  { note: "SI", fraction: "243/128", frequency: 496.67 },
  { note: "DO+", fraction: "2", frequency: 523.25 }
];

export class PianoFractionsGame extends BaseGame {
  private readonly notes: NoteItem[] = this.readNotes(this.params.notes);
  private readonly melodyQuestions: RiddleQuestion[] = this.buildMelodyQuestions(this.params.questions);
  private readonly validationQuestion: RiddleQuestion | undefined = this.buildValidationQuestion(this.params.questions);
  private selectedNotes: NoteItem[] = [];
  private message = "";
  private messageTone: "good" | "bad" = "good";
  private score = 0;
  private mistakes = 0;
  private confirmedCount = 0;
  private audioContext: AudioContext | null = null;

  public start(): void {
    this.replaceDisplayedQuestions();
    this.syncProgress();
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
    if (this.completed) {
      return;
    }

    const nextQuestion = this.melodyQuestions[this.selectedNotes.length] ?? this.validationQuestion;
    if (nextQuestion === undefined) {
      return;
    }

    this.message = `Indice : ${nextQuestion.hint ?? "Réduisez la fraction avant de choisir la note."}`;
    this.messageTone = "good";
    this.renderGame();
  }

  public override async submitAnswer(): Promise<void> {
    if (this.completed || this.selectedNotes.length !== this.melodyQuestions.length) {
      return;
    }

    const result = await this.validateMelody();
    if (result.wrongCount === 0) {
      this.score = this.isPracticeMode() ? 0 : result.correctCount * 10;
      this.message = "Mélodie correcte ! La gamme de Pythagore la rejoue.";
      this.messageTone = "good";
      this.playMelody(this.selectedNotes);
      this.markCompleted(this.score, "piano-fractions-complete");
      this.syncProgress();
      this.renderGame();
      return;
    }

    if (!this.isPracticeMode()) {
      this.mistakes += result.wrongCount;
    }
    this.message = "La mélodie ne correspond pas encore à la suite attendue. Recommencez la séquence depuis le début.";
    this.messageTone = "bad";
    this.selectedNotes = [];
    this.confirmedCount = 0;
    this.syncProgress();
    this.renderGame();
  }

  private renderGame(activeNote = ""): void {
    this.clearListeners();

    if (this.completed) {
      this.container.innerHTML = `
        <article class="chapter-game-card fm-card">
          <div class="fm-melody">
            ${this.selectedNotes.map((mission) => `<span class="done">${escapeHtml(mission.note)}</span>`).join("")}
          </div>
          <p class="chapter-game-message fm-message good">${escapeHtml(this.message)}</p>
        </article>
        ${this.style()}
      `;
      return;
    }

    this.syncProgress();
    this.notifyValidate(true, this.selectedNotes.length === this.melodyQuestions.length);

    this.container.innerHTML = `
      <article class="chapter-game-card fm-card">
        <div class="fm-fractions">
          ${this.melodyQuestions.map((mission, index) => `<span class="${index < this.selectedNotes.length ? "done" : ""}">${escapeHtml(mission.question)}</span>`).join("")}
        </div>
        <div class="fm-melody">
          ${this.melodyQuestions.map((_, index) => {
            const selected = this.selectedNotes[index];
            return `<span class="${selected !== undefined ? "done" : ""}">${selected !== undefined ? escapeHtml(selected.note) : "?"}</span>`;
          }).join("")}
        </div>
        <section class="fm-piano-area">
          <p>Réduisez chaque fraction, multipliez par <strong>3/2</strong>, puis divisez par <strong>2</strong> si le résultat dépasse 2.</p>
          <div class="fm-piano">
            ${this.notes.map((note) => `
              <button type="button" data-note="${escapeHtml(note.note)}" class="${activeNote === note.note ? "active" : ""}">
                <span>${escapeHtml(note.note)}</span>
                <small>${escapeHtml(note.fraction)}</small>
              </button>
            `).join("")}
          </div>
        </section>
        <p class="chapter-game-message fm-message ${this.messageTone}">${escapeHtml(this.message)}</p>
        <div class="chapter-game-actions fm-actions">
          <button type="button" data-action="listen" ${this.selectedNotes.length === 0 ? "disabled" : ""}>Écouter la mélodie</button>
          <button type="button" data-action="undo" ${this.selectedNotes.length === 0 ? "disabled" : ""}>Annuler</button>
          <button type="button" data-action="restart" ${this.selectedNotes.length === 0 ? "disabled" : ""}>Recommencer</button>
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

    const listenButton = this.container.querySelector<HTMLButtonElement>('[data-action="listen"]');
    if (listenButton !== null) {
      this.listen(listenButton, "click", () => this.playMelody(this.selectedNotes));
    }

    const undoButton = this.container.querySelector<HTMLButtonElement>('[data-action="undo"]');
    if (undoButton !== null) {
      this.listen(undoButton, "click", () => {
        this.selectedNotes.pop();
        this.confirmedCount = Math.min(this.confirmedCount, this.selectedNotes.length);
        this.message = "";
        this.syncProgress();
        this.renderGame();
      });
    }

    const restartButton = this.container.querySelector<HTMLButtonElement>('[data-action="restart"]');
    if (restartButton !== null) {
      this.listen(restartButton, "click", () => {
        this.selectedNotes = [];
        this.confirmedCount = 0;
        this.message = "";
        this.syncProgress();
        this.renderGame();
      });
    }
  }

  private handleNote(note: NoteItem): void {
    if (this.selectedNotes.length >= this.melodyQuestions.length) {
      return;
    }

    this.selectedNotes.push(note);
    this.message = this.selectedNotes.length === this.melodyQuestions.length
      ? "La mélodie est complète. Validez pour vérifier vos calculs."
      : "Continuez la suite de fractions dans l'ordre.";
    this.messageTone = "good";
    this.playFrequency(note.frequency);
    this.syncProgress();
    this.renderGame(note.note);
  }

  private async validateMelody(): Promise<{ correctCount: number; wrongCount: number }> {
    if (this.validationQuestion === undefined) {
      return { correctCount: 0, wrongCount: this.melodyQuestions.length };
    }

    const answer = this.selectedNotes.map((note) => note.note).join(",");
    const validation = await this.context.validateAnswer({
      question: this.validationQuestion,
      questionIndex: 0,
      answer
    });

    if (validation.isCorrect) {
      this.confirmedCount = this.melodyQuestions.length;
      return {
        correctCount: this.melodyQuestions.length,
        wrongCount: 0
      };
    }

    return {
      correctCount: 0,
      wrongCount: this.melodyQuestions.length
    };
  }

  private syncProgress(): void {
    const currentIndex = Math.min(this.selectedNotes.length, Math.max(this.melodyQuestions.length - 1, 0));
    this.updateProgress(this.score, this.mistakes, currentIndex);
  }

  private buildMelodyQuestions(questions: RiddleQuestion[]): RiddleQuestion[] {
    if (questions.length !== 1) {
      return questions;
    }

    const [question] = questions;
    if (question === undefined) {
      return [];
    }

    const prompts = this.splitList(question.question);
    if (prompts.length <= 1) {
      return questions;
    }

    const answers = this.splitList(question.answer ?? "");

    return prompts.map((prompt, index) => ({
      ...question,
      id: undefined,
      question: prompt,
      answer: answers[index],
      hint: question.hint
    }));
  }

  private buildValidationQuestion(questions: RiddleQuestion[]): RiddleQuestion | undefined {
    if (questions.length === 0) {
      return undefined;
    }

    if (questions.length === 1) {
      return questions[0];
    }

    const [first] = questions;
    if (first === undefined) {
      return undefined;
    }

    const answers = questions.map((question) => question.answer ?? "");
    const hasAllAnswers = answers.every((answer) => answer !== "");

    return {
      ...first,
      question: questions.map((question) => question.question).join(","),
      answer: hasAllAnswers ? answers.join(",") : first.answer
    };
  }

  private replaceDisplayedQuestions(): void {
    if (this.params.questions === this.melodyQuestions) {
      return;
    }

    this.params.questions.splice(0, this.params.questions.length, ...this.melodyQuestions);
  }

  private splitList(value: string): string[] {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
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

  private playMelody(melody: NoteItem[]): void {
    melody.forEach((note, index) => {
      window.setTimeout(() => this.playFrequency(note.frequency, 0.34), index * 420);
    });
  }

  private readNotes(value: unknown): NoteItem[] {
    if (!Array.isArray(value)) {
      return defaultPianoNotes;
    }

    const notes = value
      .filter(isRecord)
      .map((item) => ({
        note: readString(item.note),
        fraction: readString(item.fraction),
        frequency: readNumber(item.frequency)
      }))
      .filter((item) => item.note !== "" && item.fraction !== "" && item.frequency > 0);

    return notes.length > 0 ? notes : defaultPianoNotes;
  }

  private style(): string {
    return `
      <style>
        ${chapterGameStyles()}
        .fm-card header p,.fm-piano-area p { color:#b8bdd5; line-height:1.6; }
        .fm-fractions,
        .fm-melody { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:18px 0; }
        .fm-fractions span,
        .fm-melody span { min-width:54px; padding:9px 12px; border-radius:999px; background:rgba(255,255,255,.08); color:#dce0f5; text-align:center; font-weight:900; }
        .fm-fractions span.done,
        .fm-melody span.done { background:rgba(213,184,54,.2); color:#fff4a8; }
        .fm-piano-area {
          min-width: 0;
          overflow: hidden;
          background:rgba(20,24,46,.72);
          border:1px solid rgba(213,184,54,.18);
          border-radius:18px;
          padding: clamp(12px, 2vw, 18px);
        }
        .fm-piano {
          display:flex;
          width: 100%;
          min-width: 0;
          justify-content:stretch;
          align-items:stretch;
          min-height: clamp(120px, 22vw, 210px);
          gap: clamp(2px, 0.4vw, 4px);
          padding: clamp(8px, 1.2vw, 12px);
          background:#11162c;
          border-radius:14px;
          overflow: hidden;
        }
        .fm-piano button {
          flex: 1 1 0;
          min-width: 0;
          width: auto;
          height: clamp(120px, 20vw, 200px);
          background:linear-gradient(#fff,#dadde8);
          color:#171b33;
          border:1px solid #c8cad6;
          border-radius:0 0 14px 14px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-end;
          padding:0 clamp(2px, 0.5vw, 6px) clamp(8px, 1.2vw, 16px);
          font-size: clamp(0.65rem, 1.6vw, 0.95rem);
          font-weight:900;
          transition:transform .12s,box-shadow .12s,background .12s;
        }
        .fm-piano button span,
        .fm-piano button small {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        .fm-piano button:hover { transform:translateY(4px); }
        .fm-piano button.active { background:linear-gradient(#fff7c2,#d5b836); box-shadow:0 0 28px rgba(213,184,54,.44); transform:translateY(7px); }
        .fm-piano small { opacity:.7; margin-top:4px; font-size: clamp(0.55rem, 1.2vw, 0.75rem); }
      </style>
    `;
  }
}
