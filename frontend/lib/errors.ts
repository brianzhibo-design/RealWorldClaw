export interface HttpErrorLike extends Error {
  status?: number;
  payload?: unknown;
}

interface DisplayErrorOptions {
  fallback?: string;
}

function extractMessageFromDetail(detail: unknown): string | null {
  if (!detail) return null;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item && typeof (item as { msg?: unknown }).msg === "string") {
          return (item as { msg: string }).msg;
        }
        return null;
      })
      .filter(Boolean) as string[];

    return parts.length > 0 ? parts.join("; ") : null;
  }

  if (typeof detail === "object" && detail !== null) {
    const maybeMessage = (detail as { message?: unknown; msg?: unknown }).message ?? (detail as { msg?: unknown }).msg;
    if (typeof maybeMessage === "string") return maybeMessage;
  }

  return null;
}

export function createHttpError(status: number, payload: unknown, statusText: string): HttpErrorLike {
  const payloadObj = payload as { detail?: unknown; message?: unknown } | null;
  const backendMessage =
    extractMessageFromDetail(payloadObj?.detail) ||
    (typeof payloadObj?.message === "string" ? payloadObj.message : null);

  const error = new Error(backendMessage || `Request failed (${status}${statusText ? ` ${statusText}` : ""})`) as HttpErrorLike;
  error.status = status;
  error.payload = payload;
  return error;
}

export function getDisplayErrorMessage(error: unknown, options: DisplayErrorOptions = {}): string {
  const fallback = options.fallback || "Request failed. Please try again.";

  const err = error as HttpErrorLike;
  const status = typeof err?.status === "number" ? err.status : undefined;

  if (status === 401) return "Please sign in and try again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status && status >= 500) return "Server is temporarily unavailable. Please try again shortly.";

  const backendMessage = extractMessageFromDetail((err?.payload as { detail?: unknown } | undefined)?.detail);
  if (backendMessage) return backendMessage;

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("load failed") ||
    lower.includes("fetch failed")
  ) {
    return "Unable to connect. Please check your network and try again.";
  }

  if (lower.includes("unauthorized") || lower.includes("token") || lower.includes("login")) {
    return "Please sign in and try again.";
  }

  return message || fallback;
}
