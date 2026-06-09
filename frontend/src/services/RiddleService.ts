import { unwrapEnvelope } from "../models/ApiEnvelopes.js";
import type {
  RiddleProgress,
  RiddleProgressEnvelopeData,
  SubmitRiddleResponseRequest,
  SubmitRiddleResponseResult
} from "../models/RiddleProgress.js";
import type { ApiClient } from "./ApiClient.js";

export class RiddleService {
  public constructor(private readonly api: ApiClient) {}

  public async startRiddle(riddleId: number): Promise<RiddleProgress> {
    const envelope = await this.api.post<RiddleProgressEnvelopeData>(`/api/riddles/${riddleId}/start`);
    return this.normalizeProgress(unwrapEnvelope(envelope).progress);
  }

  public async getProgress(riddleId: number): Promise<RiddleProgress> {
    const envelope = await this.api.get<RiddleProgressEnvelopeData>(`/api/riddles/${riddleId}/progress`);
    return this.normalizeProgress(unwrapEnvelope(envelope).progress);
  }

  public async submitResponse(
    riddleId: number,
    request: SubmitRiddleResponseRequest
  ): Promise<SubmitRiddleResponseResult> {
    const envelope = await this.api.post<SubmitRiddleResponseResult>(
      `/api/riddles/${riddleId}/responses`,
      request
    );
    const result = unwrapEnvelope(envelope);

    return {
      ...result,
      progress: this.normalizeProgress(result.progress)
    };
  }

  private normalizeProgress(progress: RiddleProgress): RiddleProgress {
    const { userId, studentId, ...rest } = progress;

    return {
      ...rest,
      userId: userId ?? studentId,
      studentId: studentId ?? userId
    };
  }
}
