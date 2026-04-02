import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

if (!config.databaseUrl) {
  console.warn("DATABASE_URL is empty. API calls to DB will fail until it is configured.");
}

export const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
  connectionTimeoutMillis: 8000,
  query_timeout: 10000,
  statement_timeout: 10000,
  keepAlive: true,
  ssl: config.dbSsl
    ? {
        rejectUnauthorized: config.dbSslRejectUnauthorized
      }
    : false
});
