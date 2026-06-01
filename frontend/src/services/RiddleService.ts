import { ApiError, unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type {
  Puzzle,
  PuzzleListEnvelopeData,
  RiddleAttemptEnvelopeData,
  RiddleProgress,
  RiddleProgressEnvelopeData,
  RiddleStartEnvelopeData
} from "../models/Progress.js";
import type { ApiClient } from "./ApiClient.js";
import type { AuthService } from "./AuthService.js";

const fallbackPuzzles: Puzzle[] = [
  {
    id: 999,
    slug: "matheopolis-quiz",
    title: "L'Histoire de Laurence",
    statement: "Testez vos connaissances sur le livre.",
    position: 0,
    isActive: true
  },
  {
    id: 0,
    slug: "base-conversion",
    title: "Conversion de base",
    statement: "Passer d'une base a l'autre.",
    position: 1,
    isActive: true
  },
  {
    id: 1,
    slug: "thales-ratio",
    title: "Theoreme de Thales",
    statement: "Triangles et proportionnalite.",
    position: 2,
    isActive: true
  },
  {
    id: 2,
    slug: "piano-fractions",
    title: "Fractions musicales",
    statement: "La lecon de piano.",
    position: 3,
    isActive: true
  }
];

export class RiddleService {
  public constructor(
    private readonly api: ApiClient,
    private readonly auth: AuthService
  ) {}

  public async listPuzzles(): Promise<Puzzle[]> {
    try {
      const envelope = await this.api.get<PuzzleListEnvelopeData>("/api/puzzles");
      return unwrapEnvelope(envelope).items.sort((left, right) => left.position - right.position);
    } catch {
      return fallbackPuzzles;
    }
  }

  public async startRiddle(riddleId: number): Promise<RiddleStartEnvelopeData> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.startLocalRiddle(riddleId);
    }

    try {
      const envelope = await this.api.post<RiddleStartEnvelopeData>(`/api/riddles/${riddleId}/start`);
      return unwrapEnvelope(envelope);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        return this.startLocalRiddle(riddleId);
      }
      throw error;
    }
  }

  public async getProgress(riddleId: number): Promise<RiddleProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.readLocalProgress(riddleId);
    }

    try {
      const envelope = await this.api.get<RiddleProgressEnvelopeData>(`/api/riddles/${riddleId}/progress`);
      return unwrapEnvelope(envelope).progress;
    } catch {
      return this.readLocalProgress(riddleId);
    }
  }

  public async submitAttempt(riddleId: number, answer: string, playToken: string): Promise<RiddleProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      const progress = this.readLocalProgress(riddleId);
      const updated: RiddleProgress = {
        ...progress,
        status: "in_progress",
        attemptCount: progress.attemptCount + 1,
        lastAttemptAt: new Date().toISOString()
      };
      this.writeLocalProgress(updated);
      return updated;
    }

    try {
      const envelope = await this.api.post<RiddleAttemptEnvelopeData>(`/api/riddles/${riddleId}/attempt`, {
        answer,
        playToken
      });
      return unwrapEnvelope(envelope).attempt.progress;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        const progress = this.readLocalProgress(riddleId);
        const updated: RiddleProgress = {
          ...progress,
          status: "in_progress",
          attemptCount: progress.attemptCount + 1,
          lastAttemptAt: new Date().toISOString()
        };
        this.writeLocalProgress(updated);
        return updated;
      }
      throw error;
    }
  }

  public async completeRiddle(riddleId: number, playToken: string): Promise<RiddleProgress> {
    const user = await this.auth.getMe();
    if (user === null || this.auth.isLocalOnlyUser(user) || user.role !== "student") {
      return this.completeLocalRiddle(riddleId);
    }

    try {
      const envelope = await this.api.post<RiddleProgressEnvelopeData>(`/api/riddles/${riddleId}/complete`, {
        playToken
      });
      return unwrapEnvelope(envelope).progress;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 409)) {
        return this.completeLocalRiddle(riddleId);
      }
      throw error;
    }
  }

  public async submitScore(riddleId: number, score: number, playToken: string): Promise<RiddleProgress> {
    await this.submitAttempt(riddleId, String(score), playToken);
    return await this.completeRiddle(riddleId, playToken);
  }

  private startLocalRiddle(riddleId: number): RiddleStartEnvelopeData {
    const progress = this.readLocalProgress(riddleId);
    const updated: RiddleProgress = {
      ...progress,
      status: "in_progress",
      startedAt: progress.startedAt ?? new Date().toISOString()
    };
    this.writeLocalProgress(updated);
    return {
      progress: updated,
      playToken: `local-token-${riddleId}-${Date.now()}`
    };
  }

  private completeLocalRiddle(riddleId: number): RiddleProgress {
    const progress = this.readLocalProgress(riddleId);
    const completed: RiddleProgress = {
      ...progress,
      status: "completed",
      completedAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString()
    };
    this.writeLocalProgress(completed);
    return completed;
  }

  private readLocalProgress(riddleId: number): RiddleProgress {
    const raw = window.localStorage.getItem(`matheopolis.progress.${riddleId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw) as RiddleProgress;
      } catch {
        window.localStorage.removeItem(`matheopolis.progress.${riddleId}`);
      }
    }

    return {
      riddleId,
      studentId: 0,
      status: "not_started",
      attemptCount: 0,
      startedAt: null,
      completedAt: null,
      lastAttemptAt: null
    };
  }

  private writeLocalProgress(progress: RiddleProgress): void {
    window.localStorage.setItem(`matheopolis.progress.${progress.riddleId}`, JSON.stringify(progress));
  }
}
