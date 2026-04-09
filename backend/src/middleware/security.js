import { config } from "../config.js";

// Compatibility-focused CSP baseline for current static frontend stack.
// Keep this permissive enough for existing inline handlers/CDN scripts until strict CSP refactor.
const CSP_BASE_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://js.hcaptcha.com https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https: http:",
  "connect-src 'self' https: http: https://hcaptcha.com https://*.hcaptcha.com https://www.google.com",
  "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google.com",
  "media-src 'self' data: https: http:"
];

const reportUri = String(config.cspReportUri || "").trim();
const CONTENT_SECURITY_POLICY = [
  ...CSP_BASE_DIRECTIVES,
  ...(reportUri ? [`report-uri ${reportUri}`] : [])
].join("; ");

function resolveClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (forwardedFor) return forwardedFor;
  if (req.ip) return String(req.ip);
  if (req.socket && req.socket.remoteAddress) return String(req.socket.remoteAddress);
  return "unknown";
}

function normalizePathSegment(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function resolveRequestScope(req) {
  const method = String(req.method || "GET").trim().toUpperCase() || "GET";
  const baseUrl = normalizePathSegment(req.baseUrl);

  let routePath = "";
  if (typeof req.route?.path === "string") {
    routePath = normalizePathSegment(req.route.path);
  } else if (req.route?.path instanceof RegExp) {
    routePath = String(req.route.path);
  }

  if (!routePath) {
    routePath = normalizePathSegment(req.path) || "/";
  }

  const fullPath = `${baseUrl}${routePath}` || "/";
  return `${method}:${fullPath}`;
}

export function applySecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (config.cspMode === "enforce" || config.cspMode === "both") {
    res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }
  if (config.cspMode === "report-only" || config.cspMode === "both") {
    res.setHeader("Content-Security-Policy-Report-Only", CONTENT_SECURITY_POLICY);
  }

  if (config.nodeEnv === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return next();
}

export function createRateLimiter(options = {}) {
  const {
    windowMs = 60_000,
    max = 10,
    errorCode = "RATE_LIMITED",
    errorMessage = "Too many requests. Please try again later."
  } = options;

  const normalizedWindowMs = Math.max(1000, Number(windowMs) || 60_000);
  const normalizedMax = Math.max(1, Number(max) || 10);
  const hits = new Map();

  const cleanupExpired = (now) => {
    if (hits.size < 5000) return;
    for (const [key, entry] of hits.entries()) {
      if (!entry || entry.resetAt <= now) {
        hits.delete(key);
      }
      if (hits.size < 4000) break;
    }
  };

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    cleanupExpired(now);

    const key = `${resolveClientIp(req)}:${resolveRequestScope(req)}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + normalizedWindowMs });
      return next();
    }

    if (current.count >= normalizedMax) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        status: 429,
        code: errorCode,
        error: errorMessage
      });
    }

    current.count += 1;
    hits.set(key, current);
    return next();
  };
}
