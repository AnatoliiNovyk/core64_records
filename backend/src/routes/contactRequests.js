import { Router } from "express";
import { contactRequestSchema, contactRequestStatusSchema } from "../middleware/validate.js";
import { createContactRequest, listContactRequests, updateContactRequestStatus, writeAuditLog } from "../db/repository.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyContactCaptcha } from "../services/captcha.js";

const router = Router();

router.get("/contact-requests", requireAuth, async (_req, res, next) => {
  try {
    const data = await listContactRequests();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/contact-requests", async (req, res, next) => {
  try {
    const validated = contactRequestSchema.parse(req.body);
    const captchaCheck = await verifyContactCaptcha(validated.captchaToken, req.ip);
    if (!captchaCheck.ok) {
      return res.status(400).json({
        error: "Validation failed",
        details: {
          formErrors: [],
          fieldErrors: {
            captchaToken: [captchaCheck.message || "Captcha verification failed"]
          }
        }
      });
    }

    const data = await createContactRequest(validated);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch("/contact-requests/:id", requireAuth, async (req, res, next) => {
  try {
    const validated = contactRequestStatusSchema.parse(req.body);
    const data = await updateContactRequestStatus(Number(req.params.id), validated.status);
    if (!data) {
      return res.status(404).json({ error: "Contact request not found" });
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
