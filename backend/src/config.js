import dotenv from "dotenv";

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
  defaultLanguage: readEnvString("DEFAULT_LANGUAGE", "uk").toLowerCase(),
  supportedLanguages: readEnvString("SUPPORTED_LANGUAGES", "uk,en")
    .split(",")
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean),
  databaseUrl: readEnvString("DATABASE_URL"),
  dbConnectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 8000),
  dbQueryTimeoutMs: toNumber(process.env.DB_QUERY_TIMEOUT_MS, 10000),
  dbStatementTimeoutMs: toNumber(process.env.DB_STATEMENT_TIMEOUT_MS, 10000),
  dbSsl: toBoolean(process.env.DB_SSL, true),
  dbSslRejectUnauthorized: toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
  dbSslAllowSelfSigned: toBoolean(process.env.DB_SSL_ALLOW_SELF_SIGNED, false),
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

  if (!config.supportedLanguages.includes(config.defaultLanguage)) {
    errors.push("DEFAULT_LANGUAGE must be included in SUPPORTED_LANGUAGES.");
  }

  if (!config.databaseUrl) {
    errors.push("DATABASE_URL is required.");
  }

  if (!Number.isInteger(config.dbConnectionTimeoutMs) || config.dbConnectionTimeoutMs < 1000) {
    errors.push("DB_CONNECTION_TIMEOUT_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.dbQueryTimeoutMs) || config.dbQueryTimeoutMs < 1000) {
    errors.push("DB_QUERY_TIMEOUT_MS must be an integer >= 1000.");
  }

  if (!Number.isInteger(config.dbStatementTimeoutMs) || config.dbStatementTimeoutMs < 1000) {
    errors.push("DB_STATEMENT_TIMEOUT_MS must be an integer >= 1000.");
  }

  if (isProduction) {
    if (config.corsOrigin.includes("*")) {
      errors.push("CORS_ORIGIN must not include '*' in production.");
    }

    if (!config.dbSsl) {
      errors.push("DB_SSL must be true in production.");
    }

    if (!config.dbSslRejectUnauthorized && !config.dbSslAllowSelfSigned) {
      errors.push(
        "In production, set DB_SSL_REJECT_UNAUTHORIZED=true or explicitly opt-in DB_SSL_ALLOW_SELF_SIGNED=true for managed DB certificate chains."
      );
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
