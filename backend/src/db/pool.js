import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

if (!config.databaseUrl) {
  console.warn("DATABASE_URL is empty. API calls to DB will fail until it is configured.");
}

export const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
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
