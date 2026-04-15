import { Router } from "express";
import { releaseTrackSchema, releaseTrackUpdateSchema, releaseTracksUpdateSchema } from "../middleware/validate.js";
import {
  createReleaseTrackByReleaseId,
  deleteReleaseTrackById,
  getReleaseTrackById,
  getReleaseById,
  listReleaseTrackMetaByReleaseId,
  listReleaseTracksByReleaseId,
  replaceReleaseTracksByReleaseId,
  updateReleaseTrackById
} from "../db/repository.js";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { createRateLimiter } from "../middleware/security.js";
import { sendApiError } from "../utils/apiError.js";

const router = Router();
const releaseTracksMutationRateLimiter = createRateLimiter({
  windowMs: config.collectionsRateLimitWindowMs,
  max: Math.max(config.collectionsRateLimitMax, 120),
  errorCode: "RELEASE_TRACKS_RATE_LIMITED",
  errorMessage: "Too many release track updates. Please try again later."
});

function parseReleaseId(rawValue) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric);
}

function parseTrackId(rawValue) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric);
}

function parseTrackAudioDataUrl(value) {
  const normalized = String(value || "").trim();
  const match = normalized.match(/^data:audio\/(mpeg|mp3|wav|x-wav|wave);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;

  const subtype = String(match[1] || "").toLowerCase();
  const base64Payload = String(match[2] || "").replace(/\s+/g, "");
  const contentType = subtype === "wav" || subtype === "x-wav" || subtype === "wave"
    ? "audio/wav"
    : "audio/mpeg";

  if (!base64Payload) return null;

  let buffer = null;
  try {
    buffer = Buffer.from(base64Payload, "base64");
  } catch (_error) {
    return null;
  }

  if (!buffer || !buffer.length) return null;
  return { contentType, buffer };
}

router.get("/release-tracks/:releaseId", async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const tracks = await listReleaseTracksByReleaseId(releaseId);
    return res.json({
      data: {
        releaseId,
        tracks
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/release-tracks/:releaseId/meta", async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const tracks = await listReleaseTrackMetaByReleaseId(releaseId);
    return res.json({
      data: {
        releaseId,
        tracks
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/release-tracks/:releaseId/:trackId/audio", async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    const trackId = parseTrackId(req.params.trackId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    if (!trackId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_TRACK_ID",
        error: "Invalid track id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const track = await getReleaseTrackById(releaseId, trackId);
    if (!track) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_TRACK_NOT_FOUND",
        error: "Release track not found",
        meta: { releaseId, trackId }
      });
    }

    const parsedAudio = parseTrackAudioDataUrl(track.audioDataUrl);
    if (!parsedAudio) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_TRACK_AUDIO_NOT_FOUND",
        error: "Release track audio not found",
        meta: { releaseId, trackId }
      });
    }

    res.setHeader("Content-Type", parsedAudio.contentType);
    res.setHeader("Content-Length", String(parsedAudio.buffer.length));
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(parsedAudio.buffer);
  } catch (error) {
    return next(error);
  }
});

router.put("/release-tracks/:releaseId", requireAuth, releaseTracksMutationRateLimiter, async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const validation = releaseTracksUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_VALIDATION_FAILED",
        error: firstError && firstError.message ? firstError.message : "Invalid release tracks payload"
      });
    }

    const tracks = await replaceReleaseTracksByReleaseId(releaseId, validation.data.tracks);
    return res.json({
      data: {
        releaseId,
        tracks
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/release-tracks/:releaseId", requireAuth, releaseTracksMutationRateLimiter, async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const validation = releaseTrackSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_VALIDATION_FAILED",
        error: firstError && firstError.message ? firstError.message : "Invalid release track payload"
      });
    }

    const track = await createReleaseTrackByReleaseId(releaseId, validation.data);
    return res.status(201).json({
      data: {
        releaseId,
        track
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/release-tracks/:releaseId/:trackId", requireAuth, releaseTracksMutationRateLimiter, async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    const trackId = parseTrackId(req.params.trackId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    if (!trackId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_TRACK_ID",
        error: "Invalid track id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const validation = releaseTrackUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_VALIDATION_FAILED",
        error: firstError && firstError.message ? firstError.message : "Invalid release track payload"
      });
    }

    const track = await updateReleaseTrackById(releaseId, trackId, validation.data);
    if (!track) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_TRACK_NOT_FOUND",
        error: "Release track not found",
        meta: { releaseId, trackId }
      });
    }

    return res.json({
      data: {
        releaseId,
        track
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/release-tracks/:releaseId/:trackId", requireAuth, releaseTracksMutationRateLimiter, async (req, res, next) => {
  try {
    const releaseId = parseReleaseId(req.params.releaseId);
    const trackId = parseTrackId(req.params.trackId);
    if (!releaseId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_RELEASE_ID",
        error: "Invalid release id"
      });
    }

    if (!trackId) {
      return sendApiError(res, {
        status: 400,
        code: "RELEASE_TRACKS_INVALID_TRACK_ID",
        error: "Invalid track id"
      });
    }

    const release = await getReleaseById(releaseId);
    if (!release) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_NOT_FOUND",
        error: "Release not found",
        meta: { releaseId }
      });
    }

    const removed = await deleteReleaseTrackById(releaseId, trackId);
    if (!removed) {
      return sendApiError(res, {
        status: 404,
        code: "RELEASE_TRACK_NOT_FOUND",
        error: "Release track not found",
        meta: { releaseId, trackId }
      });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
