import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "12h" });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
