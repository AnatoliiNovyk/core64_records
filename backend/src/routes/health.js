import { Router } from "express";
import { getFirestoreDb } from "../db/firestoreClient.js";
import { config } from "../config.js";
import { sanitizeDatabaseErrorCode } from "../utils/dbError.js";
import { logger } from "../utils/logger.js";

const router = Router();

function getSafeDatabaseTarget() {
  return {
    backend: "firestore",
    projectId: String(config.firestoreProjectId || "").trim() || null,
    databaseId: String(config.firestoreDatabaseId || "(default)").trim() || "(default)"
  };
}

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "core64-api",
    dataBackend: config.dataBackend,
    time: new Date().toISOString()
  });
});

router.get("/health/db", async (req, res) => {
  const startedAt = Date.now();
  const target = getSafeDatabaseTarget();
  try {
    const firestore = await getFirestoreDb();
    await firestore.collection("_health").doc("ping").get();

    return res.json({
      status: "ok",
      database: "ok",
      service: "core64-api",
      backend: "firestore",
      durationMs: Date.now() - startedAt,
      target,
      time: new Date().toISOString()
    });
  } catch (error) {
    logger.error("health.db.firestore_check_failed", {
      requestId: String(res.getHeader("x-request-id") || ""),
      method: req.method,
      path: req.path,
      target,
      error
    });

    return res.status(503).json({
      status: "degraded",
      database: "unavailable",
      code: "DB_UNAVAILABLE",
      error: "Database connectivity check failed",
      details: {
        kind: "firestore",
        dbCode: sanitizeDatabaseErrorCode(error),
        durationMs: Date.now() - startedAt,
        target
      },
      time: new Date().toISOString()
    });
  }
});

export default router;
