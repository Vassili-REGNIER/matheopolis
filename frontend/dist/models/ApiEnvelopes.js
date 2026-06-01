export class ApiError extends Error {
    status;
    codeName;
    details;
    constructor(status, error) {
        super(error.message);
        this.name = "ApiError";
        this.status = status;
        this.codeName = error.code;
        this.details = error.details ?? {};
    }
}
export function unwrapEnvelope(envelope) {
    if (!envelope.success || envelope.data === null) {
        throw new ApiError(500, envelope.error ?? {
            code: "INVALID_ENVELOPE",
            message: "The API response envelope is invalid."
        });
    }
    return envelope.data;
}
