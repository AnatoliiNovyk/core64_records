import { Router } from "express";
import {
  artistSchema,
  eventSchema,
  releaseSchema,
  sponsorSchema,
  videoSchema,
  validateBody
} from "../middleware/validate.js";
import {
  createByType,
  deleteByType,
  listByType,
  updateByType
} from "../db/repository.adapter.js";
import { resolveLanguage } from "../i18n/language.js";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { createRateLimiter } from "../middleware/security.js";
import { sendApiError } from "../utils/apiError.js";

const router = Router();
const collectionsMutationRateLimiter = createRateLimiter({
  windowMs: config.collectionsRateLimitWindowMs,
  max: config.collectionsRateLimitMax,
  errorCode: "COLLECTIONS_RATE_LIMITED",
  errorMessage: "Too many collection updates. Please try again later."
});

const schemaMap = {
  releases: releaseSchema,
  artists: artistSchema,
  events: eventSchema,
  sponsors: sponsorSchema,
  videos: videoSchema
};

router.get("/:type(releases|artists|events|sponsors|videos)", async (req, res, next) => {
  try {
    const language = resolveLanguage(req.query.lang);
    const data = await listByType(req.params.type, language);
    res.json({ data, language });
  } catch (error) {
    next(error);
  }
});

router.post("/:type(releases|artists|events|sponsors|videos)", requireAuth, collectionsMutationRateLimiter, async (req, res, next) => {
  try {
    const schema = schemaMap[req.params.type];
    const validated = schema.parse(req.body);
    const created = await createByType(req.params.type, validated);
    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

router.put("/:type(releases|artists|events|sponsors|videos)/:id", requireAuth, collectionsMutationRateLimiter, async (req, res, next) => {
  try {
    const schema = schemaMap[req.params.type];
    const validated = schema.partial().parse(req.body);
    const updated = await updateByType(req.params.type, Number(req.params.id), validated);
    if (!updated) {
      return sendApiError(res, {
        status: 404,
        code: "COLLECTION_ITEM_NOT_FOUND",
        error: "Item not found",
        meta: {
          type: req.params.type,
          id: Number(req.params.id)
        }
      });
    }
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:type(releases|artists|events|sponsors|videos)/:id", requireAuth, collectionsMutationRateLimiter, async (req, res, next) => {
  try {
    await deleteByType(req.params.type, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
