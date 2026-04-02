import { Router } from "express";
import { pool } from "../db/pool.js";
import { classifyDatabaseError, sanitizeDatabaseErrorCode } from "../utils/dbError.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "core64-api", time: new Date().toISOString() });
});

router.get("/health/db", async (_req, res) => {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "ok",
      service: "core64-api",
      durationMs: Date.now() - startedAt,
      time: new Date().toISOString()
    });
  } catch (error) {
    const kind = classifyDatabaseError(error);
    const dbCode = sanitizeDatabaseErrorCode(error);
    console.error("DB health check failed", error);
    res.status(503).json({
      status: "degraded",
      database: "unavailable",
      code: "DB_UNAVAILABLE",
      error: "Database connectivity check failed",
      details: { kind, dbCode, durationMs: Date.now() - startedAt },
      time: new Date().toISOString()
    });
  }
});

export default router;
