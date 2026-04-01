import { Router } from "express";
import { listByType, getPublicSettings } from "../db/repository.js";
import { resolveLanguage } from "../i18n/language.js";

const router = Router();

router.get("/public", async (req, res, next) => {
  try {
    const language = resolveLanguage(req.query.lang);
    const [releases, artists, events, sponsors, settings] = await Promise.all([
      listByType("releases", language),
      listByType("artists", language),
      listByType("events", language),
      listByType("sponsors", language),
      getPublicSettings(language)
    ]);

    res.json({
      data: {
        language,
        releases,
        artists,
        events,
        sponsors,
        settings
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
