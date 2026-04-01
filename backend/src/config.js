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

export const config = {
  port: toNumber(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  dbSsl: toBoolean(process.env.DB_SSL, true),
  dbSslRejectUnauthorized: toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
  dbSslAllowSelfSigned: toBoolean(process.env.DB_SSL_ALLOW_SELF_SIGNED, false),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  corsOrigin: (process.env.CORS_ORIGIN || "*").split(",").map((v) => v.trim()),
  adminPassword: process.env.ADMIN_PASSWORD || "core64admin",
  contactCaptchaProvider: process.env.CONTACT_CAPTCHA_PROVIDER || "none",
  contactCaptchaSecret: process.env.CONTACT_CAPTCHA_SECRET || ""
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

  if (!config.databaseUrl) {
    errors.push("DATABASE_URL is required.");
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
