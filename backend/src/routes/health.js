import { Router } from "express";
import dns from "node:dns/promises";
import net from "node:net";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { classifyDatabaseError, sanitizeDatabaseErrorCode } from "../utils/dbError.js";
import { logger } from "../utils/logger.js";

const router = Router();

function getSafeDatabaseTarget() {
  const value = String(config.databaseUrl || "").trim();
  if (!value) {
    return { parse: "failed" };
  }

  try {
    const url = new URL(value);
    return {
      parse: "ok",
      host: url.hostname || null,
      port: url.port || null,
      database: (url.pathname || "").replace(/^\//, "") || null,
      sslmode: (url.searchParams.get("sslmode") || "").toLowerCase() || null
    };
  } catch {
    return { parse: "failed" };
  }
}

async function runConnectivityProbe(target, connectionTimeoutMs) {
  const host = String(target?.host || "").trim();
  const port = Number(target?.port || 5432);
  const startedAt = Date.now();
  const probeTimeoutMs = Math.max(1000, Math.min(3000, Number(connectionTimeoutMs) || 2000));

  if (!host || !Number.isFinite(port) || port <= 0) {
    return {
      attempted: false,
      reason: "invalid_target",
      dns: { resolved: false, errorCode: null, recordsCount: 0 },
      tcp: { reachable: false, errorCode: null, timeoutMs: probeTimeoutMs },
      durationMs: 0
    };
  }

  const result = {
    attempted: true,
    dns: { resolved: false, errorCode: null, recordsCount: 0 },
    tcp: { reachable: false, errorCode: null, timeoutMs: probeTimeoutMs },
    durationMs: 0
  };

  try {
    const records = await dns.lookup(host, { all: true });
    result.dns.resolved = Array.isArray(records) && records.length > 0;
    result.dns.recordsCount = Array.isArray(records) ? records.length : 0;
  } catch (error) {
    result.dns.errorCode = sanitizeDatabaseErrorCode(error) || String(error?.code || "").trim().toUpperCase() || null;
  }

  result.tcp = await new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (payload) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(payload);
    };

    socket.setTimeout(probeTimeoutMs);
    socket.once("connect", () => {
      finalize({ reachable: true, errorCode: null, timeoutMs: probeTimeoutMs });
    });
    socket.once("timeout", () => {
      finalize({ reachable: false, errorCode: "ETIMEDOUT", timeoutMs: probeTimeoutMs });
    });
    socket.once("error", (error) => {
      finalize({
        reachable: false,
        errorCode: sanitizeDatabaseErrorCode(error) || String(error?.code || "").trim().toUpperCase() || null,
        timeoutMs: probeTimeoutMs
      });
    });

    socket.connect(port, host);
  });

  result.durationMs = Date.now() - startedAt;
  return result;
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "core64-api", time: new Date().toISOString() });
});

router.get("/health/db", async (req, res) => {
  const startedAt = Date.now();
  const target = getSafeDatabaseTarget();
  const connectionTimeoutMs = config.dbConnectionTimeoutMs;

  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "ok",
      service: "core64-api",
      durationMs: Date.now() - startedAt,
      connectionTimeoutMs,
      target,
      time: new Date().toISOString()
    });
  } catch (error) {
    const kind = classifyDatabaseError(error);
    const dbCode = sanitizeDatabaseErrorCode(error);
    const shouldProbe = new Set(["timeout", "network", "connection", "dns"]).has(kind);
    const probe = shouldProbe ? await runConnectivityProbe(target, connectionTimeoutMs) : null;
    logger.error("health.db.check_failed", {
      requestId: String(res.getHeader("x-request-id") || ""),
      method: req.method,
      path: req.path,
      kind,
      dbCode,
      target,
      error
    });
    res.status(503).json({
      status: "degraded",
      database: "unavailable",
      code: "DB_UNAVAILABLE",
      error: "Database connectivity check failed",
      details: { kind, dbCode, durationMs: Date.now() - startedAt, connectionTimeoutMs, target, probe },
      time: new Date().toISOString()
    });
  }
});

export default router;
