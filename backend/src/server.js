import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import collectionRoutes from "./routes/collections.js";
import settingsRoutes from "./routes/settings.js";
import contactRoutes from "./routes/contactRequests.js";
import publicRoutes from "./routes/public.js";
import auditRoutes from "./routes/auditLogs.js";

const app = express();

app.use(cors({
  origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", publicRoutes);
app.use("/api", collectionRoutes);
app.use("/api", settingsRoutes);
app.use("/api", contactRoutes);
app.use("/api", auditRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: error.flatten() });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`CORE64 API listening on port ${config.port}`);
});
