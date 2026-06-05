import { escapeHtml, isRecord, readNumber } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";

interface FractalLevel {
  prompt: string;
  hint: string;
  targetDepth: number;
  targetAngle: number;
}

interface BranchTask {
  x: number;
  y: number;
  angleRad: number;
  length: number;
  depth: number;
  maxDepth: number;
  targetAngle: number;
}

const baseFrequencies = [
  130.81, 155.56, 174.61, 196, 233.08, 261.63, 311.13, 349.23,
  392, 466.16, 523.25, 622.25, 698.46, 783.99, 932.33
];

export class FractalLuthierGame extends BaseGame {
  private readonly levels = this.readLevels();
  private currentLevelIndex = 0;
  private currentDepth = 4;
  private currentAngle = 45;
  private score = 0;
  private mistakes = 0;
  private message = "";
  private messageTone: "neutral" | "good" | "bad" = "neutral";
  private audioContext: AudioContext | null = null;
  private animationId: number | null = null;
  private animationStack: BranchTask[] = [];
  private isPlaying = false;
  private isTargetMode = false;

  public start(): void {
    this.renderGame();
  }

  public override destroy(): void {
    this.stopAnimation();
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

    const level = this.currentLevel;
    if (level === undefined) {
      return;
    }

    this.message = `Indice : ${level.hint}`;
    this.messageTone = "good";
    this.renderGame();
  }

  private get currentLevel(): FractalLevel | undefined {
    return this.levels[this.currentLevelIndex];
  }

  private renderGame(): void {
    this.clearListeners();
    this.stopAnimation();

    if (this.completed) {
      this.container.innerHTML = `
        <article class="fl-card">
          <div class="fl-complete">
            <strong>Atelier accorde</strong>
            <p>${escapeHtml(this.message)}</p>
          </div>
        </article>
        ${this.style()}
      `;
      return;
    }

    const level = this.currentLevel;
    if (level === undefined) {
      this.markCompleted(this.score, "fractal-luthier-complete");
      return;
    }

    this.updateProgress(this.score, this.mistakes, this.currentLevelIndex);
    this.notifyValidate(false);

    this.container.innerHTML = `
      <article class="fl-card">
        <header class="fl-header">
          <div>
            <span>Niveau ${this.currentLevelIndex + 1} / ${this.levels.length}</span>
            <h2>Le defi du luthier fractal</h2>
          </div>
          <strong>${escapeHtml(level.prompt)}</strong>
        </header>

        <div class="fl-toolbar">
          <button type="button" data-action="target">Ecouter la melodie cible</button>
          <button type="button" data-action="test">Tester mon arbre</button>
        </div>

        <section class="fl-controls" aria-label="Parametres de la fractale">
          <label>
            <span>Complexite</span>
            <strong>${this.currentDepth}</strong>
            <input type="range" min="1" max="8" step="1" value="${this.currentDepth}" data-control="depth">
          </label>
          <label>
            <span>Angle</span>
            <strong>${this.currentAngle} deg</strong>
            <input type="range" min="10" max="90" step="1" value="${this.currentAngle}" data-control="angle">
          </label>
        </section>

        <canvas class="fl-canvas" width="900" height="360" aria-label="Visualisation de l'arbre musical"></canvas>
        <p class="fl-message ${this.messageTone}">${escapeHtml(this.message)}</p>
      </article>
      ${this.style()}
    `;

    this.drawIdleTree();
    this.bindControls();
  }

  private bindControls(): void {
    const depthInput = this.container.querySelector<HTMLInputElement>('[data-control="depth"]');
    if (depthInput !== null) {
      this.listen(depthInput, "input", () => {
        this.currentDepth = Number.parseInt(depthInput.value, 10);
        this.renderGame();
      });
    }

    const angleInput = this.container.querySelector<HTMLInputElement>('[data-control="angle"]');
    if (angleInput !== null) {
      this.listen(angleInput, "input", () => {
        this.currentAngle = Number.parseInt(angleInput.value, 10);
        this.renderGame();
      });
    }

    const targetButton = this.container.querySelector<HTMLButtonElement>('[data-action="target"]');
    if (targetButton !== null) {
      this.listen(targetButton, "click", () => {
        const level = this.currentLevel;
        if (level === undefined) {
          return;
        }
        this.message = "Ecoutez la cible : la forme et la melodie donnent les deux indices.";
        this.messageTone = "neutral";
        this.startAnimatedTree(level.targetDepth, level.targetAngle, true);
      });
    }

    const testButton = this.container.querySelector<HTMLButtonElement>('[data-action="test"]');
    if (testButton !== null) {
      this.listen(testButton, "click", () => {
        this.message = "Verification de votre arbre musical...";
        this.messageTone = "neutral";
        this.startAnimatedTree(this.currentDepth, this.currentAngle, false);
      });
    }
  }

  private startAnimatedTree(depth: number, angle: number, targetMode: boolean): void {
    const canvas = this.container.querySelector<HTMLCanvasElement>(".fl-canvas");
    const context = canvas?.getContext("2d") ?? null;
    if (canvas === null || context === null) {
      return;
    }

    this.stopAnimation();
    this.isPlaying = true;
    this.isTargetMode = targetMode;
    context.clearRect(0, 0, canvas.width, canvas.height);

    this.animationStack = [{
      x: canvas.width / 2,
      y: canvas.height - 18,
      angleRad: Math.PI / 2,
      length: 98,
      depth,
      maxDepth: depth,
      targetAngle: angle
    }];

    this.setControlsDisabled(true);
    this.animateNextBranch(canvas, context);
  }

  private animateNextBranch(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    if (!this.isPlaying || this.animationStack.length === 0) {
      this.isPlaying = false;
      this.setControlsDisabled(false);
      if (!this.isTargetMode) {
        this.checkWinCondition();
      }
      return;
    }

    const current = this.animationStack.shift();
    if (current === undefined || current.depth === 0) {
      this.animateNextBranch(canvas, context);
      return;
    }

    const xEnd = current.x + current.length * Math.cos(current.angleRad);
    const yEnd = current.y - current.length * Math.sin(current.angleRad);
    const progress = 1 - current.depth / current.maxDepth;

    context.beginPath();
    context.moveTo(current.x, current.y);
    context.lineTo(xEnd, yEnd);
    context.strokeStyle = this.isTargetMode
      ? "rgba(248, 247, 255, 0.24)"
      : `hsl(${44 + progress * 120}, 72%, 62%)`;
    context.lineWidth = Math.max(1.4, current.depth * 0.9);
    context.lineCap = "round";
    context.stroke();

    this.playBranchSound(current.maxDepth - current.depth, current.maxDepth, current.targetAngle);

    const angleShiftRad = current.targetAngle * Math.PI / 180;
    const newLength = current.length * 0.74;
    this.animationStack.push({
      x: xEnd,
      y: yEnd,
      angleRad: current.angleRad + angleShiftRad,
      length: newLength,
      depth: current.depth - 1,
      maxDepth: current.maxDepth,
      targetAngle: current.targetAngle
    });
    this.animationStack.push({
      x: xEnd,
      y: yEnd,
      angleRad: current.angleRad - angleShiftRad,
      length: newLength,
      depth: current.depth - 1,
      maxDepth: current.maxDepth,
      targetAngle: current.targetAngle
    });

    const delay = Math.max(70, (850 / current.maxDepth) * 0.9);
    this.animationId = window.setTimeout(() => this.animateNextBranch(canvas, context), delay);
  }

  private checkWinCondition(): void {
    const level = this.currentLevel;
    if (level === undefined) {
      return;
    }

    const angleDiff = Math.abs(this.currentAngle - level.targetAngle);
    if (this.currentDepth === level.targetDepth && angleDiff <= 5) {
      this.score += this.isPracticeMode() ? 0 : 10;
      this.currentLevelIndex += 1;
      this.updateProgress(this.score, this.mistakes, this.currentLevelIndex);
      if (this.currentLevelIndex >= this.levels.length) {
        this.message = "Harmonie parfaite ! Laurence comprend comment la forme peut devenir musique.";
        this.messageTone = "good";
        this.markCompleted(this.score, "fractal-luthier-complete");
        this.renderGame();
        return;
      }
      this.message = "Harmonie trouvee ! Passez a la fractale suivante.";
      this.messageTone = "good";
      this.currentDepth = 4;
      this.currentAngle = 45;
      this.renderGame();
      return;
    }

    if (!this.isPracticeMode()) {
      this.mistakes += 1;
    }
    this.updateProgress(this.score, this.mistakes, this.currentLevelIndex);
    this.message = "Dissonance : la forme ou la melodie ne correspond pas encore.";
    this.messageTone = "bad";
    this.renderGame();
  }

  private playBranchSound(depth: number, totalDepth: number, angle: number): void {
    const audioContext = this.getAudioContext();
    if (audioContext === null) {
      return;
    }

    const noteIndexRaw = Math.floor((depth / Math.max(totalDepth, 1)) * baseFrequencies.length);
    const noteIndex = Math.max(0, Math.min(noteIndexRaw, baseFrequencies.length - 1));
    const angleNormalization = (angle - 10) / 80;
    const octaveShift = Math.pow(2, 1 - angleNormalization * 2);
    const frequency = (baseFrequencies[noteIndex] ?? 261.63) * octaveShift;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(this.isTargetMode ? 0.12 : 0.22, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.28);
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

  private stopAnimation(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      window.clearTimeout(this.animationId);
      this.animationId = null;
    }
    this.animationStack = [];
  }

  private setControlsDisabled(disabled: boolean): void {
    this.container.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button,input").forEach((control) => {
      control.disabled = disabled;
    });
  }

  private drawIdleTree(): void {
    const canvas = this.container.querySelector<HTMLCanvasElement>(".fl-canvas");
    const context = canvas?.getContext("2d") ?? null;
    if (canvas === null || context === null) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(213, 184, 54, 0.08)";
    context.fillRect(0, canvas.height - 26, canvas.width, 2);
  }

  private readLevels(): FractalLevel[] {
    return this.params.questions
      .map((question) => {
        const metadata = isRecord(question.metadata) ? question.metadata : {};
        return {
          prompt: question.question,
          hint: question.hint,
          targetDepth: readNumber(metadata.targetDepth, 4),
          targetAngle: readNumber(metadata.targetAngle, 45)
        };
      })
      .filter((level) => level.targetDepth > 0 && level.targetAngle > 0);
  }

  private style(): string {
    return `
      <style>
        .fl-card {
          width: 100%;
          margin: 0;
          padding: clamp(12px, 2vw, 22px);
          color: #f8f7ff;
        }
        .fl-header {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
          gap: 14px;
          align-items: stretch;
          margin-bottom: 14px;
        }
        .fl-header > div,
        .fl-header > strong,
        .fl-controls,
        .fl-canvas,
        .fl-complete {
          border: 1px solid rgba(213,184,54,.2);
          background: rgba(20,24,46,.72);
          border-radius: 14px;
        }
        .fl-header > div,
        .fl-header > strong {
          padding: 14px;
        }
        .fl-header span {
          display: block;
          margin-bottom: 6px;
          color: #d5b836;
          font-weight: 900;
          font-size: .82rem;
        }
        .fl-header h2 {
          margin: 0;
          color: #fff;
          font-size: 1.15rem;
        }
        .fl-header > strong {
          color: rgba(248,247,255,.82);
          line-height: 1.5;
        }
        .fl-toolbar {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .fl-toolbar button,
        .fl-controls input {
          width: 100%;
        }
        .fl-toolbar button {
          min-height: 44px;
          border: 1px solid rgba(213,184,54,.26);
          border-radius: 10px;
          background: rgba(255,255,255,.08);
          color: #f8f7ff;
          font-weight: 900;
        }
        .fl-toolbar button:hover {
          background: #d5b836;
          color: #11162c;
        }
        .fl-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 14px;
          margin-bottom: 14px;
        }
        .fl-controls label {
          display: grid;
          gap: 8px;
        }
        .fl-controls span {
          color: rgba(248,247,255,.68);
          font-weight: 800;
        }
        .fl-controls strong {
          color: #d5b836;
          font-size: 1.15rem;
        }
        .fl-controls input {
          accent-color: #d5b836;
        }
        .fl-canvas {
          display: block;
          width: 100%;
          height: min(38vh, 360px);
          background:
            radial-gradient(circle at 50% 100%, rgba(213,184,54,.12), transparent 42%),
            #070b18;
        }
        .fl-message {
          min-height: 30px;
          text-align: center;
          font-weight: 900;
          color: rgba(248,247,255,.72);
        }
        .fl-message.good { color: #7cf29a; }
        .fl-message.bad { color: #ff8fa3; }
        .fl-complete {
          padding: 22px;
          text-align: center;
        }
        .fl-complete strong {
          display: block;
          margin-bottom: 8px;
          color: #d5b836;
          font-size: 1.25rem;
        }
        @media (max-width: 760px) {
          .fl-header,
          .fl-toolbar,
          .fl-controls {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }
}
