export interface ApiErrorObject {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiEnvelope<TData> {
  success: boolean;
  data: TData | null;
  error: ApiErrorObject | null;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly codeName: string;
  public readonly details: Record<string, unknown>;

  public constructor(status: number, error: ApiErrorObject) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.codeName = error.code;
    this.details = error.details ?? {};
  }
}

export function unwrapEnvelope<TData>(envelope: ApiEnvelope<TData>): TData {
  if (!envelope.success || envelope.data === null) {
    throw new ApiError(500, envelope.error ?? {
      code: "INVALID_ENVELOPE",
      message: "The API response envelope is invalid."
    });
  }

  return envelope.data;
}
