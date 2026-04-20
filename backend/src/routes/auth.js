import { Router } from "express";
import { config } from "../config.js";
import { createToken, requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/security.js";
import { sendApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

const router = Router();

const authLoginRateLimiter = createRateLimiter({
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  errorCode: "AUTH_RATE_LIMITED",
  errorMessage: "Too many login attempts. Please try again later."
});

router.post("/auth/login", authLoginRateLimiter, async (req, res) => {
  try {
    const password = String(req.body?.password || "").trim();

    if (!password) {
      return sendApiError(res, {
        status: 400,
        code: "AUTH_PASSWORD_REQUIRED",
        error: "Password is required"
      });
    }

    if (!config.adminPassword || password !== config.adminPassword) {
      return sendApiError(res, {
        status: 401,
        code: "AUTH_INVALID_CREDENTIALS",
        error: "Invalid credentials"
      });
    }

    const token = createToken({ sub: "env-admin", username: "admin" });
    return res.json({ data: { token } });
  } catch (error) {
    logger.error("auth.login.failed", {
      requestId: String(res.getHeader("x-request-id") || ""),
      method: req.method,
      path: req.path,
      error
    });

    return sendApiError(res, {
      status: 503,
      code: "AUTH_SERVICE_UNAVAILABLE",
      error: "Authentication service is temporarily unavailable"
    });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ data: { id: req.user.sub, username: req.user.username } });
});

export default router;
