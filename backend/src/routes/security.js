import express from "express";
import { logger } from "../utils/logger.js";

const router = express.Router();

function safeText(value, max = 512) {
  return String(value || "").trim().slice(0, max);
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCspReportPayload(rawBody) {
  if (!rawBody) return null;

  if (Array.isArray(rawBody)) {
    return rawBody;
  }

  if (typeof rawBody === "object") {
    return rawBody;
  }

  if (typeof rawBody !== "string") {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function resolveRequestId(req, res) {
  const responseValue = String(res.getHeader("x-request-id") || "").trim();
  if (responseValue) return responseValue;

  const requestValue = String(req.headers["x-request-id"] || "").trim();
  return requestValue;
}

function summarizeLegacyReport(report) {
  if (!report || typeof report !== "object") return null;
  return {
    format: "csp-report",
    documentUri: safeText(report["document-uri"]),
    blockedUri: safeText(report["blocked-uri"]),
    violatedDirective: safeText(report["violated-directive"]),
    effectiveDirective: safeText(report["effective-directive"]),
    sourceFile: safeText(report["source-file"]),
    lineNumber: toNumberOrNull(report["line-number"])
  };
}

function summarizeReportingApi(report) {
  if (!report || typeof report !== "object") return null;
  const body = report.body && typeof report.body === "object" ? report.body : {};
  return {
    format: "reporting-api",
    documentUri: safeText(body.documentURL || body.documentUrl),
    blockedUri: safeText(body.blockedURL || body.blockedUrl),
    violatedDirective: safeText(body.violatedDirective),
    effectiveDirective: safeText(body.effectiveDirective),
    sourceFile: safeText(body.sourceFile),
    lineNumber: toNumberOrNull(body.lineNumber)
  };
}

function summarizeCspPayload(payload) {
  if (!payload) return null;

  if (Array.isArray(payload) && payload.length > 0) {
    return summarizeReportingApi(payload[0]);
  }

  if (payload["csp-report"] && typeof payload["csp-report"] === "object") {
    return summarizeLegacyReport(payload["csp-report"]);
  }

  if (payload.body && typeof payload.body === "object") {
    return summarizeReportingApi(payload);
  }

  return null;
}

router.post(
  "/security/csp-report",
  express.text({ type: "*/*", limit: "64kb" }),
  (req, res) => {
    const requestId = resolveRequestId(req, res);
    const payload = parseCspReportPayload(req.body);
    const summary = summarizeCspPayload(payload);

    if (summary) {
      logger.warn("security.csp.violation", {
        requestId,
        summary
      });
    } else {
      const rawSize = typeof req.body === "string" ? req.body.length : 0;
      logger.warn("security.csp.violation_unparsed", {
        requestId,
        contentType: safeText(req.headers["content-type"], 128),
        rawSize
      });
    }

    return res.status(204).end();
  }
);

export default router;
