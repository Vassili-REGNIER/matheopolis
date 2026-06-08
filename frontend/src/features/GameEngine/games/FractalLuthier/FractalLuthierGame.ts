import { escapeHtml, isRecord, readNumber } from "../../../../utils/dom.js";
import { BaseGame } from "../BaseGame.js";
import { chapterGameStyles } from "../shared/chapterGameStyles.js";

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

  public override submitAnswer(): void {
    if (this.completed || this.isPlaying) {
      return;
    }

    this.message = "Verification de votre arbre musical...";
    this.messageTone = "neutral";
    this.startAnimatedTree(this.currentDepth, this.currentAngle, false);
  }

  private get currentLevel(): FractalLevel | undefined {
    return this.levels[this.currentLevelIndex];
  }

  private renderGame(): void {
    this.clearListeners();
    this.stopAnimation();

    if (this.completed) {
      this.container.innerHTML = `
        <article class="chapter-game-card fl-card">
          <div class="fl-complete">
            <strong>Atelier accorde</strong>
            <p>${escapeHtml(this.message)}</p>
          </div>
        </article>
        ${this.style()}
      `;
      return;
    }

    if (this.currentLevel === undefined) {
      this.markCompleted(this.score, "fractal-luthier-complete");
      return;
    }

    this.updateProgress(this.score, this.mistakes, this.currentLevelIndex);
    this.notifyValidate(true);

    this.container.innerHTML = `
      <article class="chapter-game-card fl-card">
        <section class="fl-controls" aria-label="Parametres de la fractale">
          <label>
            <span>Complexite</span>
            <strong data-control-value="depth">${this.currentDepth}</strong>
            <input type="range" min="1" max="8" step="1" value="${this.currentDepth}" data-control="depth">
          </label>
          <label>
            <span>Angle</span>
            <strong data-control-value="angle">${this.currentAngle} deg</strong>
            <input type="range" min="10" max="90" step="1" value="${this.currentAngle}" data-control="angle">
          </label>
        </section>

        <section class="fl-tree-area" aria-label="Visualisation de l'arbre musical">
          <canvas class="fl-canvas" width="900" height="360"></canvas>
          <div class="chapter-game-actions fl-tree-actions">
            <button type="button" data-action="target">Ecouter la melodie cible</button>
          </div>
        </section>
        <p class="chapter-game-message fl-message ${this.messageTone}">${escapeHtml(this.message)}</p>
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
        this.updateControlValue("depth", String(this.currentDepth));
        this.drawIdleTree();
      });
    }

    const angleInput = this.container.querySelector<HTMLInputElement>('[data-control="angle"]');
    if (angleInput !== null) {
      this.listen(angleInput, "input", () => {
        this.currentAngle = Number.parseInt(angleInput.value, 10);
        this.updateControlValue("angle", `${this.currentAngle} deg`);
        this.drawIdleTree();
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
  }

  private updateControlValue(control: "depth" | "angle", value: string): void {
    const valueNode = this.container.querySelector<HTMLElement>(`[data-control-value="${control}"]`);
    if (valueNode !== null) {
      valueNode.textContent = value;
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
    this.notifyValidate(true, false);
    this.animateNextBranch(canvas, context);
  }

  private animateNextBranch(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    if (!this.isPlaying || this.animationStack.length === 0) {
      this.isPlaying = false;
      this.setControlsDisabled(false);
      if (!this.isTargetMode) {
        this.checkWinCondition();
        return;
      }
      this.notifyValidate(true);
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
        ${chapterGameStyles()}
        .fl-controls,
        .fl-complete {
          border: 1px solid rgba(213,184,54,.2);
          background: rgba(20,24,46,.72);
          border-radius: 14px;
        }
        .fl-controls input { width: 100%; }
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
        .fl-tree-area {
          display: grid;
          gap: 14px;
          padding: clamp(10px, 1.8vw, 16px);
        }
        .fl-canvas {
          display: block;
          width: 100%;
          height: min(38vh, 360px);
          background: #070b18;
        }
        .fl-tree-actions {
          justify-content: center;
        }
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
          .fl-controls {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }
}
