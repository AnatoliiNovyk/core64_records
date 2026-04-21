import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { sendApiError } from "../utils/apiError.js";

export function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "12h" });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return sendApiError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      error: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const subject = String(decoded && decoded.sub ? decoded.sub : "").trim();
    if (subject !== "env-admin") {
      throw new Error("Invalid token subject");
    }

    req.user = {
      ...decoded,
      sub: subject,
      username: String(decoded && decoded.username ? decoded.username : "admin").trim() || "admin"
    };

    return next();
  } catch (_error) {
    return sendApiError(res, {
      status: 401,
      code: "AUTH_INVALID_TOKEN",
      error: "Invalid token"
    });
  }
}
