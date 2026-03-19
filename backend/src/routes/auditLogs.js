import { Router } from "express";
import { listAuditFacets, listAuditLogs } from "../db/repository.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidToken(value) {
  return /^[a-zA-Z0-9_\-:.]+$/.test(value);
}

router.get("/audit-logs/facets", requireAuth, async (_req, res, next) => {
  try {
    const data = await listAuditFacets();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get("/audit-logs", requireAuth, async (req, res, next) => {
  try {
    const limitRaw = Number(req.query.limit);
    const pageRaw = Number(req.query.page);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 50;
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const q = String(req.query.q || "").trim();
    const action = String(req.query.action || "").trim();
    const entity = String(req.query.entity || "").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    if (!Number.isInteger(limit) || !Number.isInteger(page)) {
      return res.status(400).json({ error: "Invalid pagination parameters" });
    }

    if (q.length > 120) {
      return res.status(400).json({ error: "Query is too long" });
    }

    if (action && !isValidToken(action)) {
      return res.status(400).json({ error: "Invalid action filter" });
    }

    if (entity && !isValidToken(entity)) {
      return res.status(400).json({ error: "Invalid entity filter" });
    }

    if (from && !isValidDateOnly(from)) {
      return res.status(400).json({ error: "Invalid 'from' date format. Use YYYY-MM-DD" });
    }

    if (to && !isValidDateOnly(to)) {
      return res.status(400).json({ error: "Invalid 'to' date format. Use YYYY-MM-DD" });
    }

    if (from && to && from > to) {
      return res.status(400).json({ error: "Invalid date range: 'from' must be <= 'to'" });
    }

    const result = await listAuditLogs({ limit, page, q, action, entity, from, to });
    res.json({ data: { items: result.items, limit, page, total: result.total } });
  } catch (error) {
    next(error);
  }
});

export default router;
