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
  dbConnectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 15000),
  dbQueryTimeoutMs: toNumber(process.env.DB_QUERY_TIMEOUT_MS, 10000),
  dbStatementTimeoutMs: toNumber(process.env.DB_STATEMENT_TIMEOUT_MS, 10000),
  authRateLimitWindowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000),
  authRateLimitMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  contactRateLimitWindowMs: toNumber(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 60000),
  contactRateLimitMax: toNumber(process.env.CONTACT_RATE_LIMIT_MAX, 20),
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

const validateDatabaseUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "DATABASE_URL is required.";
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return "DATABASE_URL must be a valid postgres URL. If password contains special characters (@, #, %, !), URL-encode them (for example @ -> %40, # -> %23).";
  }

  const protocol = String(parsed.protocol || "").toLowerCase();
  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    return "DATABASE_URL must start with postgres:// or postgresql://.";
  }

  if (!String(parsed.hostname || "").trim()) {
    return "DATABASE_URL must include a database host.";
  }

  const dbName = String(parsed.pathname || "").replace(/^\//, "").trim();
  if (!dbName) {
    return "DATABASE_URL must include a database name path (for example /postgres).";
  }

  if (String(parsed.hash || "").trim()) {
    return "DATABASE_URL must not contain URL fragment/hash. URL-encode password special characters instead of raw '#' or '@'.";
  }

  return null;
};

export const validateConfig = () => {
  const errors = [];
  const isProduction = config.nodeEnv === "production";

  if (!config.supportedLanguages.includes(config.defaultLanguage)) {
    errors.push("DEFAULT_LANGUAGE must be included in SUPPORTED_LANGUAGES.");
  }

  const databaseUrlError = validateDatabaseUrl(config.databaseUrl);
  if (databaseUrlError) {
    errors.push(databaseUrlError);
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
