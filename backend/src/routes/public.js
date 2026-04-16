import { Router } from "express";
import { listByType, getPublicSettings, getPublicSectionSettings } from "../db/repository.adapter.js";
import { resolveLanguage } from "../i18n/language.js";

const router = Router();

router.get("/public", async (req, res, next) => {
  try {
    const language = resolveLanguage(req.query.lang);
    const [releases, artists, events, sponsors, settings, sectionSettings] = await Promise.all([
      listByType("releases", language),
      listByType("artists", language),
      listByType("events", language),
      listByType("sponsors", language),
      getPublicSettings(language),
      getPublicSectionSettings(language)
    ]);

    res.json({
      data: {
        language,
        releases,
        artists,
        events,
        sponsors,
        settings,
        sectionSettings
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
