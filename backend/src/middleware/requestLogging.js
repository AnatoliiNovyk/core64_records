import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const REQUEST_ID_HEADER = "x-request-id";
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readHeader(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return String(value || "");
}

function readResponseHeader(res, name) {
  const value = res.getHeader(name);
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return String(value || "");
}

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveClientIp(req) {
  const forwardedFor = readHeader(req, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = readHeader(req, "x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return String(req.ip || req.socket?.remoteAddress || "");
}

function shouldLogBody(req) {
  return METHODS_WITH_BODY.has(String(req.method || "").toUpperCase());
}

function getBodySnapshot(req) {
  if (!shouldLogBody(req)) {
    return undefined;
  }

  const contentType = readHeader(req, "content-type").toLowerCase();
  if (contentType.includes("multipart/form-data")) {
    return "[MULTIPART_BODY_OMITTED]";
  }

  return req.body;
}

function getDurationMs(startedAtNs) {
  const elapsedNs = process.hrtime.bigint() - startedAtNs;
  return Math.round((Number(elapsedNs) / 1_000_000) * 1000) / 1000;
}

function getStatusLevel(statusCode) {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

export function requestLoggingMiddleware(req, res, next) {
  if (!config.requestLoggingEnabled) {
    return next();
  }

  const originalUrl = String(req.originalUrl || req.url || "");
  if (!originalUrl.startsWith("/api")) {
    return next();
  }

  const startedAtNs = process.hrtime.bigint();
  const incomingRequestId = readHeader(req, REQUEST_ID_HEADER).trim();
  const requestId = incomingRequestId || createRequestId();
  res.setHeader(REQUEST_ID_HEADER, requestId);

  logger.debug("http.request.started", {
    requestId,
    method: req.method,
    url: originalUrl,
    path: req.path,
    query: req.query || {},
    ip: resolveClientIp(req),
    userAgent: readHeader(req, "user-agent"),
    contentType: readHeader(req, "content-type"),
    body: getBodySnapshot(req)
  });

  let finalized = false;
  const finalize = (closedEarly) => {
    if (finalized) {
      return;
    }
    finalized = true;

    const statusCode = Number(res.statusCode || 0);
    const payload = {
      requestId,
      method: req.method,
      url: originalUrl,
      path: req.path,
      statusCode,
      durationMs: getDurationMs(startedAtNs),
      contentLength: readResponseHeader(res, "content-length")
    };

    if (closedEarly) {
      logger.warn("http.request.closed", {
        ...payload,
        closedEarly: true
      });
      return;
    }

    const statusLevel = getStatusLevel(statusCode);
    if (statusLevel === "error") {
      logger.error("http.request.completed", payload);
      return;
    }

    if (statusLevel === "warn") {
      logger.warn("http.request.completed", payload);
      return;
    }

    logger.info("http.request.completed", payload);
  };

  res.once("finish", () => finalize(false));
  res.once("close", () => {
    if (!res.writableEnded) {
      finalize(true);
    }
  });

  return next();
}
