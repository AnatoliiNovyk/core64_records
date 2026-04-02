import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "core64-api", time: new Date().toISOString() });
});

router.get("/health/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "ok", service: "core64-api", time: new Date().toISOString() });
  } catch (error) {
    console.error("DB health check failed", error);
    res.status(503).json({
      status: "degraded",
      database: "unavailable",
      code: "DB_UNAVAILABLE",
      error: "Database connectivity check failed",
      time: new Date().toISOString()
    });
  }
});

export default router;
