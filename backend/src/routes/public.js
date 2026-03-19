import { Router } from "express";
import { listByType, getSettings } from "../db/repository.js";

const router = Router();

router.get("/public", async (_req, res, next) => {
  try {
    const [releases, artists, events, settings] = await Promise.all([
      listByType("releases"),
      listByType("artists"),
      listByType("events"),
      getSettings()
    ]);

    res.json({
      data: {
        releases,
        artists,
        events,
        settings
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
