import { Router } from "express";
import { listByType, getPublicSettings } from "../db/repository.js";

const router = Router();

router.get("/public", async (_req, res, next) => {
  try {
    const [releases, artists, events, sponsors, settings] = await Promise.all([
      listByType("releases"),
      listByType("artists"),
      listByType("events"),
      listByType("sponsors"),
      getPublicSettings()
    ]);

    res.json({
      data: {
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
