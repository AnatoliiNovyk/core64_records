import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { settingsSchema, sectionSettingsSchema } from "../middleware/validate.js";
import { getAdminSettings, saveSettings, getAdminSectionSettings, saveSectionSettings, saveSettingsBundle } from "../db/repository.js";

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

router.put("/settings/bundle", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body.data || req.body;
    const settings = settingsSchema.parse(payload.settings || {});
    const sectionPayload = sectionSettingsSchema.parse({ sections: payload.sections || [] });
    const data = await saveSettingsBundle({ settings, sections: sectionPayload.sections });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get("/settings/sections", requireAuth, async (_req, res, next) => {
  try {
    const sections = await getAdminSectionSettings();
    res.json({ data: { sections } });
  } catch (error) {
    next(error);
  }
});

router.put("/settings/sections", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body.data || req.body;
    const validated = sectionSettingsSchema.parse(payload);
    const sections = await saveSectionSettings(validated.sections);
    res.json({ data: { sections } });
  } catch (error) {
    next(error);
  }
});

export default router;
