import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { settingsSchema } from "../middleware/validate.js";
import { getAdminSettings, saveSettings } from "../db/repository.js";

const router = Router();

router.get("/settings", requireAuth, async (_req, res, next) => {
  try {
    const data = await getAdminSettings();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body.data || req.body;
    const validated = settingsSchema.parse(payload);
    const data = await saveSettings(validated);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
