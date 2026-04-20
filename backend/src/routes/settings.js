import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { settingsSchema, sectionSettingsSchema } from "../middleware/validate.js";
import {
  getAdminSettings,
  saveSettings,
  getAdminSectionSettings,
  saveSectionSettings,
  saveSettingsBundle,
  writeAuditLog
} from "../db/repository.adapter.js";
import { buildSettingsDiff, buildSectionSettingsDiff } from "../utils/settingsAuditDiff.js";
import { config } from "../config.js";
import { createRateLimiter } from "../middleware/security.js";
import { resolveLanguage } from "../i18n/language.js";
import { logger } from "../utils/logger.js";

const router = Router();
const settingsMutationRateLimiter = createRateLimiter({
  windowMs: config.settingsRateLimitWindowMs,
  max: config.settingsRateLimitMax,
  errorCode: "SETTINGS_RATE_LIMITED",
  errorMessage: "Too many settings updates. Please try again later."
});

function resolveAuditActor(req) {
  return String(req.user?.username || "admin").trim() || "admin";
}

async function writeSettingsAuditEntry({ action, actor, source, settingsDiff = null, sectionsDiff = null }) {
  const hasSettingsChanges = settingsDiff && settingsDiff.changedCount > 0;
  const hasSectionChanges = sectionsDiff && sectionsDiff.changedRowCount > 0;
  if (!hasSettingsChanges && !hasSectionChanges) return;

  const details = {
    source,
    diff: {
      ...(hasSettingsChanges ? { settings: settingsDiff } : {}),
      ...(hasSectionChanges ? { sections: sectionsDiff } : {})
    }
  };

  try {
    await writeAuditLog({
      entityType: "settings",
      entityId: null,
      action,
      actor,
      details
    });
  } catch (error) {
    logger.warn("settings.audit_write_failed", {
      action,
      actor,
      source,
      error
    });
  }
}

router.get("/settings", requireAuth, async (_req, res, next) => {
  try {
    const language = resolveLanguage(_req.query.lang);
    const data = await getAdminSettings(language);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", requireAuth, settingsMutationRateLimiter, async (req, res, next) => {
  try {
    const language = resolveLanguage(req.query.lang);
    const payload = req.body.data || req.body;
    const validated = settingsSchema.parse(payload);
    const beforeSettings = await getAdminSettings(language);
    const data = await saveSettings(validated, language);

    const settingsDiff = buildSettingsDiff(beforeSettings, data);
    await writeSettingsAuditEntry({
      action: "settings_updated",
      actor: resolveAuditActor(req),
      source: "/settings",
      settingsDiff
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.put("/settings/bundle", requireAuth, settingsMutationRateLimiter, async (req, res, next) => {
  try {
    const language = resolveLanguage(req.query.lang);
    const payload = req.body.data || req.body;
    const settings = settingsSchema.parse(payload.settings || {});
    const sectionPayload = sectionSettingsSchema.parse({ sections: payload.sections || [] });

    const [beforeSettings, beforeSections] = await Promise.all([
      getAdminSettings(language),
      getAdminSectionSettings()
    ]);

    const data = await saveSettingsBundle({ settings, sections: sectionPayload.sections }, language);

    const settingsDiff = buildSettingsDiff(beforeSettings, data.settings);
    const sectionsDiff = buildSectionSettingsDiff(beforeSections, data.sections);
    await writeSettingsAuditEntry({
      action: "settings_bundle_updated",
      actor: resolveAuditActor(req),
      source: "/settings/bundle",
      settingsDiff,
      sectionsDiff
    });

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

router.put("/settings/sections", requireAuth, settingsMutationRateLimiter, async (req, res, next) => {
  try {
    const payload = req.body.data || req.body;
    const validated = sectionSettingsSchema.parse(payload);

    const beforeSections = await getAdminSectionSettings();
    const sections = await saveSectionSettings(validated.sections);

    const sectionsDiff = buildSectionSettingsDiff(beforeSections, sections);
    await writeSettingsAuditEntry({
      action: "section_settings_updated",
      actor: resolveAuditActor(req),
      source: "/settings/sections",
      sectionsDiff
    });

    res.json({ data: { sections } });
  } catch (error) {
    next(error);
  }
});

export default router;
