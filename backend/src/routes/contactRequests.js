import { Router } from "express";
import { contactRequestSchema, contactRequestStatusSchema } from "../middleware/validate.js";
import {
  createContactRequest,
  getContactRequestAttachmentById,
  listContactRequests,
  updateContactRequestStatus,
  writeAuditLog
} from "../db/repository.adapter.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyContactCaptcha } from "../services/captcha.js";
import { config } from "../config.js";
import { createRateLimiter } from "../middleware/security.js";
import { sendApiError, sendValidationError } from "../utils/apiError.js";

const router = Router();

const contactCreateRateLimiter = createRateLimiter({
  windowMs: config.contactRateLimitWindowMs,
  max: config.contactRateLimitMax,
  errorCode: "CONTACT_RATE_LIMITED",
  errorMessage: "Too many contact requests. Please try again later."
});

const contactUpdateRateLimiter = createRateLimiter({
  windowMs: config.contactRequestUpdateRateLimitWindowMs,
  max: config.contactRequestUpdateRateLimitMax,
  errorCode: "CONTACT_REQUEST_UPDATE_RATE_LIMITED",
  errorMessage: "Too many contact status updates. Please try again later."
});

const CONTACT_REQUESTS_DEFAULT_LIMIT = 50;
const CONTACT_REQUESTS_MAX_LIMIT = 250;
const CONTACT_REQUESTS_QUERY_MAX_CHARS = 120;
const CONTACT_REQUEST_STATUSES = new Set(["new", "in_progress", "done"]);

function isTruthyQueryFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

router.get("/contact-requests", requireAuth, async (req, res, next) => {
  try {
    const includeAttachmentDataUrl = isTruthyQueryFlag(req.query.includeAttachmentDataUrl);

    const hasPage = req.query.page !== undefined;
    const hasLimit = req.query.limit !== undefined;
    const hasStatus = req.query.status !== undefined;
    const hasQuery = req.query.q !== undefined;
    const hasDate = req.query.date !== undefined;

    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);
    const status = String(req.query.status || "").trim().toLowerCase();
    const q = String(req.query.q || "").trim();
    const date = String(req.query.date || "").trim();

    if (hasPage && (!Number.isInteger(pageRaw) || pageRaw < 1)) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUESTS_INVALID_QUERY",
        error: "Invalid page parameter"
      });
    }

    if (hasLimit && (!Number.isInteger(limitRaw) || limitRaw < 1)) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUESTS_INVALID_QUERY",
        error: "Invalid limit parameter"
      });
    }

    if (q.length > CONTACT_REQUESTS_QUERY_MAX_CHARS) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUESTS_INVALID_QUERY",
        error: "Search query is too long"
      });
    }

    if (status && !CONTACT_REQUEST_STATUSES.has(status)) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUESTS_INVALID_QUERY",
        error: "Invalid status filter"
      });
    }

    if (date && !isValidDateOnly(date)) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUESTS_INVALID_QUERY",
        error: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    const page = hasPage ? pageRaw : 1;
    const limit = hasLimit
      ? Math.min(limitRaw, CONTACT_REQUESTS_MAX_LIMIT)
      : CONTACT_REQUESTS_DEFAULT_LIMIT;
    const returnMeta = hasPage || hasLimit || hasStatus || hasQuery || hasDate;

    const data = await listContactRequests({
      includeAttachmentDataUrl,
      page,
      limit,
      status,
      q,
      date,
      returnMeta
    });

    if (returnMeta) {
      return res.json({ data });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get("/contact-requests/:id/attachment", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return sendApiError(res, {
        status: 400,
        code: "CONTACT_REQUEST_INVALID_ID",
        error: "Invalid contact request id"
      });
    }

    const data = await getContactRequestAttachmentById(id);
    if (!data) {
      return sendApiError(res, {
        status: 404,
        code: "CONTACT_REQUEST_NOT_FOUND",
        error: "Contact request not found",
        meta: { id }
      });
    }

    if (!data.hasAttachment || !String(data.attachmentDataUrl || "").trim()) {
      return sendApiError(res, {
        status: 404,
        code: "CONTACT_REQUEST_ATTACHMENT_NOT_FOUND",
        error: "Contact request attachment not found",
        meta: { id }
      });
    }

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.post("/contact-requests", contactCreateRateLimiter, async (req, res, next) => {
  try {
    const validated = contactRequestSchema.parse(req.body);
    const captchaCheck = await verifyContactCaptcha(validated.captchaToken, {
      remoteIp: req.ip,
      origin: req.headers.origin || "",
      host: req.headers.host || ""
    });
    if (!captchaCheck.ok) {
      return sendValidationError(res, {
        formErrors: [],
        fieldErrors: {
          captchaToken: [captchaCheck.message || "Captcha verification failed"]
        }
      }, {
        code: "CONTACT_CAPTCHA_VALIDATION_FAILED"
      });
    }

    const data = await createContactRequest(validated);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch("/contact-requests/:id", requireAuth, contactUpdateRateLimiter, async (req, res, next) => {
  try {
    const validated = contactRequestStatusSchema.parse(req.body);
    const data = await updateContactRequestStatus(Number(req.params.id), validated.status);
    if (!data) {
      return sendApiError(res, {
        status: 404,
        code: "CONTACT_REQUEST_NOT_FOUND",
        error: "Contact request not found",
        meta: {
          id: Number(req.params.id)
        }
      });
    }

    await writeAuditLog({
      entityType: "contact_request",
      entityId: Number(req.params.id),
      action: "status_updated",
      actor: req.user?.username || "admin",
      details: { status: validated.status }
    });

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

export default router;
