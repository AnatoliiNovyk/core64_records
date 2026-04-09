function normalizeStatus(status, fallback = 500) {
  const parsed = Number(status);
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > 599) {
    return fallback;
  }
  return parsed;
}

function normalizeMessage(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeCode(value) {
  const text = String(value || "").trim();
  return text || null;
}

export function buildApiErrorPayload(options = {}) {
  const status = normalizeStatus(options.status, 500);
  const defaultMessage = status >= 500 ? "Internal server error" : "Request failed";

  const payload = {
    status,
    error: normalizeMessage(options.error, defaultMessage)
  };

  const code = normalizeCode(options.code);
  if (code) {
    payload.code = code;
  }

  if (options.details !== undefined) {
    payload.details = options.details;
  }

  if (options.meta !== undefined) {
    payload.meta = options.meta;
  }

  return payload;
}

export function sendApiError(res, options = {}) {
  const payload = buildApiErrorPayload(options);
  return res.status(payload.status).json(payload);
}

export function sendValidationError(res, details, options = {}) {
  return sendApiError(res, {
    status: 400,
    code: options.code || "VALIDATION_FAILED",
    error: options.error || "Validation failed",
    details
  });
}

export function fromZodError(error, options = {}) {
  const details = typeof error?.flatten === "function" ? error.flatten() : undefined;
  return buildApiErrorPayload({
    status: 400,
    code: options.code || "VALIDATION_FAILED",
    error: options.error || "Validation failed",
    details
  });
}
