import type { RiddleQuestion } from "../GameConfig.js";

export interface FractalLevel {
  question: RiddleQuestion;
  prompt: string;
  hint?: string;
  targetDepth: number;
  targetAngle: number;
}

export interface BranchTask {
  x: number;
  y: number;
  angleRad: number;
  length: number;
  depth: number;
  maxDepth: number;
  targetAngle: number;
}
