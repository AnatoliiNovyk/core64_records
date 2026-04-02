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

validateConfig();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(cors({
  origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.use(express.static(publicDir));

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", publicRoutes);
app.use("/api", collectionRoutes);
app.use("/api", settingsRoutes);
app.use("/api", contactRoutes);
app.use("/api", auditRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

const isDatabaseConnectivityError = (error) => {
  if (!error) return false;

  const code = String(error.code || "").trim().toUpperCase();
  if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "SELF_SIGNED_CERT_IN_CHAIN"].includes(code)) {
    return true;
  }

  // PostgreSQL SQLSTATE class 08 = connection exception.
  if (/^08[A-Z0-9]{3}$/.test(code)) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  if (message.includes("timeout") || message.includes("certificate") || message.includes("connection") || message.includes("could not connect")) {
    return true;
  }

  return false;
};

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: error.flatten() });
  }

  if (isDatabaseConnectivityError(error)) {
    console.error("Database unavailable", error);
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "Database is unavailable"
    });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`CORE64 API listening on port ${config.port}`);
});
