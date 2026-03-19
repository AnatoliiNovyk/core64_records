import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { createToken, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const password = String(req.body.password || "");
  const userResult = await pool.query("SELECT id, username, password_hash FROM admin_users LIMIT 1");

  if (!userResult.rows[0]) {
    return res.status(500).json({ error: "Admin user is not initialized" });
  }

  const user = userResult.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid && password !== config.adminPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createToken({ sub: user.id, username: user.username });
  return res.json({ data: { token } });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ data: { id: req.user.sub, username: req.user.username } });
});

export default router;
