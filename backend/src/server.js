import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { config, validateConfig } from "./config.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import collectionRoutes from "./routes/collections.js";
import settingsRoutes from "./routes/settings.js";
import contactRoutes from "./routes/contactRequests.js";
import publicRoutes from "./routes/public.js";
import auditRoutes from "./routes/auditLogs.js";
import securityRoutes from "./routes/security.js";
import { isDatabaseConnectivityError } from "./utils/dbError.js";
import { applySecurityHeaders } from "./middleware/security.js";
import { fromZodError, sendApiError } from "./utils/apiError.js";
import { requestLoggingMiddleware } from "./middleware/requestLogging.js";
import { logger } from "./utils/logger.js";

validateConfig();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(cors({
  origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
  credentials: true
}));
app.use(applySecurityHeaders);
app.use(express.json({ limit: "10mb" }));
app.use(requestLoggingMiddleware);
app.use("/api", securityRoutes);

app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    const normalizedPath = String(filePath || "").toLowerCase();
    const isHtmlEntrypoint = normalizedPath.endsWith("/index.html")
      || normalizedPath.endsWith("\\index.html")
      || normalizedPath.endsWith("/admin.html")
      || normalizedPath.endsWith("\\admin.html");

    if (isHtmlEntrypoint) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }
}));

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", publicRoutes);
app.use("/api", collectionRoutes);
app.use("/api", settingsRoutes);
app.use("/api", contactRoutes);
app.use("/api", auditRoutes);
app.use("/api", (_req, res) => {
  return sendApiError(res, {
    status: 404,
    code: "API_ROUTE_NOT_FOUND",
    error: "API route not found"
  });
});

app.get("/", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/admin", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.use((error, req, res, _next) => {
  const requestId = String(res.getHeader("x-request-id") || "");
  const errorContext = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    error
  };

  if (error instanceof ZodError) {
    logger.warn("http.request.validation_error", errorContext);
    return res.status(400).json(fromZodError(error));
  }

  const errorStatus = Number(error && (error.status || error.statusCode));
  if (errorStatus === 413 || (error && error.type === "entity.too.large")) {
    logger.warn("http.request.payload_too_large", errorContext);
    return sendApiError(res, {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      error: "Request payload is too large"
    });
  }

  if (isDatabaseConnectivityError(error)) {
    logger.error("http.request.database_unavailable", errorContext);
    return sendApiError(res, {
      status: 503,
      code: "DB_UNAVAILABLE",
      error: "Database is unavailable"
    });
  }

  logger.error("http.request.unhandled_error", errorContext);
  return sendApiError(res, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    error: "Internal server error"
  });
});

app.listen(config.port, () => {
  logger.info("api.server.started", {
    port: config.port,
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    requestLoggingEnabled: config.requestLoggingEnabled
  });
});
