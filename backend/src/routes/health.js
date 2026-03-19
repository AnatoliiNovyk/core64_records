import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "core64-api", time: new Date().toISOString() });
});

export default router;
