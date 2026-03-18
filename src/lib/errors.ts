import {
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptInvalidVideoIdError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript-plus";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected error";
}

export function normalizeYtDlpError(
  error: unknown,
  details?: Record<string, unknown>
): HttpError {
  const message = errorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("video unavailable") ||
    lower.includes("this video is unavailable")
  ) {
    return new HttpError(404, "not_found", message);
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return new HttpError(429, "rate_limited", message, details);
  }

  return new HttpError(502, "upstream_error", message, details);
}

export function normalizeTranscriptError(error: unknown): HttpError {
  if (error instanceof YoutubeTranscriptInvalidVideoIdError) {
    return new HttpError(400, "invalid_video_id", "Invalid YouTube URL");
  }

  if (
    error instanceof YoutubeTranscriptVideoUnavailableError ||
    error instanceof YoutubeTranscriptDisabledError ||
    error instanceof YoutubeTranscriptNotAvailableError
  ) {
    return new HttpError(404, "transcript_unavailable", errorMessage(error));
  }

  if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
    return new HttpError(404, "transcript_language_unavailable", errorMessage(error), {
      lang: error.lang,
      availableLangs: error.availableLangs,
    });
  }

  if (error instanceof YoutubeTranscriptTooManyRequestError) {
    return new HttpError(429, "rate_limited", errorMessage(error));
  }

  return new HttpError(502, "transcript_upstream_error", errorMessage(error));
}

export function jsonError(error: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    status: 500,
    body: {
      error: errorMessage(error),
      code: "internal_error",
    },
  };
}

export function respondWithError(
  route: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const normalized = jsonError(error);
  const level = normalized.status >= 500 ? "error" : "warn";
  const payload = {
    route,
    ...context,
    status: normalized.status,
    code: normalized.body.code,
    error: normalized.body.error,
    details: normalized.body.details,
  };

  if (level === "error") {
    console.error("[api]", payload);
  } else {
    console.warn("[api]", payload);
  }

  return normalized;
}
