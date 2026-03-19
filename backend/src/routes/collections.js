import { Router } from "express";
import {
  artistSchema,
  eventSchema,
  releaseSchema,
  validateBody
} from "../middleware/validate.js";
import {
  createByType,
  deleteByType,
  listByType,
  updateByType
} from "../db/repository.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const schemaMap = {
  releases: releaseSchema,
  artists: artistSchema,
  events: eventSchema
};

router.get("/:type(releases|artists|events)", async (req, res, next) => {
  try {
    const data = await listByType(req.params.type);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/:type(releases|artists|events)", requireAuth, async (req, res, next) => {
  try {
    const schema = schemaMap[req.params.type];
    const validated = schema.parse(req.body);
    const created = await createByType(req.params.type, validated);
    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

router.put("/:type(releases|artists|events)/:id", requireAuth, async (req, res, next) => {
  try {
    const schema = schemaMap[req.params.type];
    const validated = schema.partial().parse(req.body);
    const updated = await updateByType(req.params.type, Number(req.params.id), validated);
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:type(releases|artists|events)/:id", requireAuth, async (req, res, next) => {
  try {
    await deleteByType(req.params.type, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
