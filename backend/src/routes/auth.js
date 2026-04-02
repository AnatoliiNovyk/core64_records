import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { createToken, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const password = String(req.body.password || "");

    // Emergency path: if ADMIN_PASSWORD matches, allow login even when DB is degraded.
    if (password && password === config.adminPassword) {
      const token = createToken({ sub: "env-admin", username: "admin" });
      return res.json({ data: { token } });
    }

    const userResult = await pool.query("SELECT id, username, password_hash FROM admin_users LIMIT 1");

    if (!userResult.rows[0]) {
      return res.status(500).json({
        code: "AUTH_ADMIN_NOT_INITIALIZED",
        error: "Admin user is not initialized"
      });
    }

    const user = userResult.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        code: "AUTH_INVALID_CREDENTIALS",
        error: "Invalid credentials"
      });
    }

    const token = createToken({ sub: user.id, username: user.username });
    return res.json({ data: { token } });
  } catch (error) {
    console.error("Login route failed", error);
    return res.status(503).json({
      code: "AUTH_SERVICE_UNAVAILABLE",
      error: "Authentication service is temporarily unavailable"
    });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ data: { id: req.user.sub, username: req.user.username } });
});

export default router;
