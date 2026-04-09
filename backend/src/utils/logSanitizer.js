const REDACTED_VALUE = "[REDACTED]";

const SENSITIVE_TOKENS = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "captcha",
  "attachmentdataurl",
  "databaseurl",
  "jwt",
  "adminpassword"
];

function toSafeInteger(value, fallback, minValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minValue) {
    return fallback;
  }
  return parsed;
}

function normalizeOptions(options = {}) {
  return {
    maxDepth: toSafeInteger(options.maxDepth, 5, 1),
    maxArrayLength: toSafeInteger(options.maxArrayLength, 30, 1),
    maxObjectKeys: toSafeInteger(options.maxObjectKeys, 50, 1),
    maxStringLength: toSafeInteger(options.maxStringLength, 2048, 32)
  };
}

function isSensitiveKey(key) {
  const normalized = String(key || "").trim().toLowerCase();
  if (!normalized) return false;
  return SENSITIVE_TOKENS.some((token) => normalized.includes(token));
}

function truncateString(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...[TRUNCATED:${value.length - maxLength}]`;
}

function summarizeDataUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed.startsWith("data:")) return null;

  const commaIndex = trimmed.indexOf(",");
  const meta = commaIndex >= 0 ? trimmed.slice(0, commaIndex) : trimmed;
  const mime = meta.slice(5).split(";")[0] || "unknown";
  return `[DATA_URL:${mime};length=${trimmed.length}]`;
}

function sanitizeErrorObject(error, options, depth) {
  const stackValue = typeof error.stack === "string" ? error.stack.split("\n").slice(0, 6).join("\n") : "";
  return {
    name: truncateString(String(error.name || "Error"), options.maxStringLength),
    message: truncateString(String(error.message || ""), options.maxStringLength),
    ...(stackValue ? { stack: truncateString(stackValue, options.maxStringLength) } : {}),
    ...sanitizeObject(error, options, depth + 1, true)
  };
}

function sanitizeArray(values, options, depth) {
  if (!Array.isArray(values)) return [];

  const truncated = values.length > options.maxArrayLength;
  const slice = values.slice(0, options.maxArrayLength);
  const normalized = slice.map((entry) => sanitizeValue(entry, options, depth + 1));

  if (truncated) {
    normalized.push(`[TRUNCATED_ARRAY:${values.length - options.maxArrayLength}]`);
  }

  return normalized;
}

function sanitizeObject(value, options, depth, skipErrorShape = false) {
  if (!value || typeof value !== "object") return {};

  const entries = Object.entries(value);
  const truncated = entries.length > options.maxObjectKeys;
  const slice = truncated ? entries.slice(0, options.maxObjectKeys) : entries;

  const output = {};
  for (const [key, raw] of slice) {
    if (isSensitiveKey(key)) {
      output[key] = REDACTED_VALUE;
      continue;
    }
    output[key] = sanitizeValue(raw, options, depth + 1);
  }

  if (truncated) {
    output.__truncatedKeys = entries.length - options.maxObjectKeys;
  }

  if (!skipErrorShape) {
    const constructorName = String(value?.constructor?.name || "");
    if (constructorName && constructorName !== "Object") {
      output.__type = constructorName;
    }
  }

  return output;
}

function sanitizeValue(value, options, depth) {
  if (value === null || value === undefined) return value;

  if (depth > options.maxDepth) {
    return "[TRUNCATED_DEPTH]";
  }

  const valueType = typeof value;
  if (valueType === "string") {
    const dataUrlSummary = summarizeDataUrl(value);
    if (dataUrlSummary) return dataUrlSummary;
    return truncateString(value, options.maxStringLength);
  }

  if (valueType === "number" || valueType === "boolean" || valueType === "bigint") {
    return value;
  }

  if (valueType === "function") {
    return "[FUNCTION]";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value, options, depth);
  }

  if (value instanceof Error) {
    return sanitizeErrorObject(value, options, depth);
  }

  if (valueType === "object") {
    return sanitizeObject(value, options, depth);
  }

  return truncateString(String(value), options.maxStringLength);
}

export function sanitizeForLog(value, options = {}) {
  const normalizedOptions = normalizeOptions(options);

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return sanitizeObject(value, normalizedOptions, 0);
  }

  return sanitizeValue(value, normalizedOptions, 0);
}

export const LOG_REDACTED_VALUE = REDACTED_VALUE;
