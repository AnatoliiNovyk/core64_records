import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

const buildEffectiveConnectionString = (rawUrl) => {
  if (!rawUrl) return undefined;

  try {
    const parsed = new URL(rawUrl);
    const sslmode = String(parsed.searchParams.get("sslmode") || "").toLowerCase();
    const hasLibpqCompat = String(parsed.searchParams.get("uselibpqcompat") || "").toLowerCase() === "true";
    const shouldEnableLibpqCompat =
      config.dbSsl &&
      !config.dbSslRejectUnauthorized &&
      config.dbSslAllowSelfSigned &&
      (sslmode === "require" || sslmode === "verify-ca") &&
      !hasLibpqCompat;

    if (shouldEnableLibpqCompat) {
      // Keep current runtime behavior with pg-connection-string v2 when self-signed certs are explicitly allowed.
      parsed.searchParams.set("uselibpqcompat", "true");
      console.warn("DATABASE_URL adjusted with uselibpqcompat=true due to DB_SSL_ALLOW_SELF_SIGNED=true and sslmode policy.");
      return parsed.toString();
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
};

if (!config.databaseUrl) {
  console.warn("DATABASE_URL is empty. API calls to DB will fail until it is configured.");
}

export const pool = new Pool({
  connectionString: buildEffectiveConnectionString(config.databaseUrl),
  connectionTimeoutMillis: config.dbConnectionTimeoutMs,
  query_timeout: config.dbQueryTimeoutMs,
  statement_timeout: config.dbStatementTimeoutMs,
  keepAlive: true,
  ssl: config.dbSsl
    ? {
        rejectUnauthorized: config.dbSslRejectUnauthorized
      }
    : false
});
