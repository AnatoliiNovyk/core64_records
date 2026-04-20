import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: backendEnvPath });
// Keep optional root-level .env compatibility for local tooling, without overriding loaded values.
dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const readEnvString = (name, fallback = "") => {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export const config = {
  port: toNumber(process.env.PORT, 3000),
  nodeEnv: readEnvString("NODE_ENV", "development") || "development",
  dataBackend: readEnvString("DATA_BACKEND", "firestore").toLowerCase(),
  logLevel: readEnvString("LOG_LEVEL", "info").toLowerCase(),
  requestLoggingEnabled: toBoolean(process.env.REQUEST_LOGGING_ENABLED, true),
  requestLoggingMaxBodyChars: toNumber(process.env.REQUEST_LOGGING_MAX_BODY_CHARS, 2048),
  defaultLanguage: readEnvString("DEFAULT_LANGUAGE", "uk").toLowerCase(),
  supportedLanguages: readEnvString("SUPPORTED_LANGUAGES", "uk,en")
    .split(",")
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean),
  firestoreProjectId: readEnvString("FIRESTORE_PROJECT_ID"),
  firestoreDatabaseId: readEnvString("FIRESTORE_DATABASE_ID", "(default)"),
  authRateLimitWindowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000),
  authRateLimitMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  contactRateLimitWindowMs: toNumber(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 60000),
  contactRateLimitMax: toNumber(process.env.CONTACT_RATE_LIMIT_MAX, 20),
  collectionsRateLimitWindowMs: toNumber(process.env.COLLECTIONS_RATE_LIMIT_WINDOW_MS, 300000),
  collectionsRateLimitMax: toNumber(process.env.COLLECTIONS_RATE_LIMIT_MAX, 30),
  settingsRateLimitWindowMs: toNumber(process.env.SETTINGS_RATE_LIMIT_WINDOW_MS, 300000),
  settingsRateLimitMax: toNumber(process.env.SETTINGS_RATE_LIMIT_MAX, 20),
  contactRequestUpdateRateLimitWindowMs: toNumber(process.env.CONTACT_REQUEST_UPDATE_RATE_LIMIT_WINDOW_MS, 300000),
  contactRequestUpdateRateLimitMax: toNumber(process.env.CONTACT_REQUEST_UPDATE_RATE_LIMIT_MAX, 50),
  cspMode: readEnvString("CSP_MODE", "enforce").toLowerCase(),
  cspReportUri: readEnvString("CSP_REPORT_URI", "/api/security/csp-report"),
  jwtSecret: readEnvString("JWT_SECRET", "change-me") || "change-me",
  corsOrigin: readEnvString("CORS_ORIGIN", "*").split(",").map((v) => v.trim()),
  adminPassword: readEnvString("ADMIN_PASSWORD", "core64admin") || "core64admin",
  contactCaptchaProvider: readEnvString("CONTACT_CAPTCHA_PROVIDER", "none") || "none",
  contactCaptchaSecret: readEnvString("CONTACT_CAPTCHA_SECRET")
};

const weakSecrets = new Set([
  "change-me",
  "change-me-in-production",
  "core64-local-dev-secret",
  "core64admin",
  "password",
  "secret"
]);

const isWeakSecret = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || weakSecrets.has(normalized);
};

export const validateConfig = () => {
  const errors = [];
  const isProduction = config.nodeEnv === "production";
  const allowedDataBackends = new Set(["firestore"]);
  const allowedLogLevels = new Set(["debug", "info", "warn", "error"]);
  const allowedCspModes = new Set(["enforce", "report-only", "both"]);

  if (!allowedDataBackends.has(config.dataBackend)) {
    errors.push("DATA_BACKEND must be: firestore.");
  }

  if (!allowedLogLevels.has(config.logLevel)) {
    errors.push("LOG_LEVEL must be one of: debug, info, warn, error.");
  }

  if (!Number.isInteger(config.requestLoggingMaxBodyChars) || config.requestLoggingMaxBodyChars < 128) {
    errors.push("REQUEST_LOGGING_MAX_BODY_CHARS must be an integer >= 128.");
  }

  if (!config.supportedLanguages.includes(config.defaultLanguage)) {
    errors.push("DEFAULT_LANGUAGE must be included in SUPPORTED_LANGUAGES.");
  }

  if (!Number.isInteger(config.authRateLimitWindowMs) || config.authRateLimitWindowMs < 1000) {
    errors.push("AUTH_RATE_LIMIT_WINDOW_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.authRateLimitMax) || config.authRateLimitMax < 1) {
    errors.push("AUTH_RATE_LIMIT_MAX must be an integer >= 1.");
  }

  if (!Number.isInteger(config.contactRateLimitWindowMs) || config.contactRateLimitWindowMs < 1000) {
    errors.push("CONTACT_RATE_LIMIT_WINDOW_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.contactRateLimitMax) || config.contactRateLimitMax < 1) {
    errors.push("CONTACT_RATE_LIMIT_MAX must be an integer >= 1.");
  }

  if (!Number.isInteger(config.collectionsRateLimitWindowMs) || config.collectionsRateLimitWindowMs < 1000) {
    errors.push("COLLECTIONS_RATE_LIMIT_WINDOW_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.collectionsRateLimitMax) || config.collectionsRateLimitMax < 1) {
    errors.push("COLLECTIONS_RATE_LIMIT_MAX must be an integer >= 1.");
  }

  if (!Number.isInteger(config.settingsRateLimitWindowMs) || config.settingsRateLimitWindowMs < 1000) {
    errors.push("SETTINGS_RATE_LIMIT_WINDOW_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.settingsRateLimitMax) || config.settingsRateLimitMax < 1) {
    errors.push("SETTINGS_RATE_LIMIT_MAX must be an integer >= 1.");
  }

  if (
    !Number.isInteger(config.contactRequestUpdateRateLimitWindowMs)
    || config.contactRequestUpdateRateLimitWindowMs < 1000
  ) {
    errors.push("CONTACT_REQUEST_UPDATE_RATE_LIMIT_WINDOW_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.contactRequestUpdateRateLimitMax) || config.contactRequestUpdateRateLimitMax < 1) {
    errors.push("CONTACT_REQUEST_UPDATE_RATE_LIMIT_MAX must be an integer >= 1.");
  }

  if (!allowedCspModes.has(config.cspMode)) {
    errors.push("CSP_MODE must be one of: enforce, report-only, both.");
  }

  if (config.cspReportUri) {
    const reportUri = String(config.cspReportUri).trim();
    const isRelative = reportUri.startsWith("/");
    const isAbsolute = reportUri.startsWith("http://") || reportUri.startsWith("https://");
    if (!isRelative && !isAbsolute) {
      errors.push("CSP_REPORT_URI must be an absolute URL or a path starting with '/'.");
    }
  }

  if (isProduction) {
    if (config.corsOrigin.includes("*")) {
      errors.push("CORS_ORIGIN must not include '*' in production.");
    }

    if (isWeakSecret(config.jwtSecret) || String(config.jwtSecret).trim().length < 24) {
      errors.push("JWT_SECRET must be a strong non-default value (at least 24 characters) in production.");
    }

    if (isWeakSecret(config.adminPassword) || String(config.adminPassword).trim().length < 12) {
      errors.push("ADMIN_PASSWORD must be a strong non-default value (at least 12 characters) in production.");
    }

    if (
      ["hcaptcha", "recaptcha_v2"].includes(config.contactCaptchaProvider) &&
      !String(config.contactCaptchaSecret || "").trim()
    ) {
      errors.push("CONTACT_CAPTCHA_SECRET is required when CONTACT_CAPTCHA_PROVIDER is hcaptcha or recaptcha_v2.");
    }
  }

  if (errors.length > 0) {
    const message = `Config validation failed:\n- ${errors.join("\n- ")}`;
    throw new Error(message);
  }
};
