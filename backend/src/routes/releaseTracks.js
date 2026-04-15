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

function parseAudioByteRange(rangeHeader, totalSize) {
  const normalizedRange = String(rangeHeader || "").trim();
  if (!normalizedRange) return null;

  const match = normalizedRange.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) return { error: true };

  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return { error: true };

  let start = hasStart ? Number(match[1]) : null;
  let end = hasEnd ? Number(match[2]) : null;

  if (hasStart && (!Number.isFinite(start) || start < 0)) return { error: true };
  if (hasEnd && (!Number.isFinite(end) || end < 0)) return { error: true };

  if (!hasStart) {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return { error: true };
    start = Math.max(totalSize - suffixLength, 0);
    end = totalSize - 1;
  } else {
    if (!hasEnd || end >= totalSize) end = totalSize - 1;
    if (start >= totalSize || end < start) return { error: true };
  }

  return {
    start: Math.round(start),
    end: Math.round(end)
  };
}

function normalizeWeakEntityTag(value) {
  return String(value || "").trim().replace(/^W\//i, "");
}

function isIfNoneMatchSatisfied(ifNoneMatchHeader, currentEntityTag) {
  const headerValue = String(ifNoneMatchHeader || "").trim();
  if (!headerValue) return false;

  const currentTag = normalizeWeakEntityTag(currentEntityTag);
  if (!currentTag) return false;

  return headerValue
    .split(",")
    .map((candidate) => String(candidate || "").trim())
    .filter(Boolean)
    .some((candidate) => {
      if (candidate === "*") return true;
      return normalizeWeakEntityTag(candidate) === currentTag;
    });
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

    const totalSize = parsedAudio.buffer.length;
    const updatedAtNumeric = Number(track.updatedAt ? Date.parse(track.updatedAt) : NaN);
    const normalizedUpdatedAt = Number.isFinite(updatedAtNumeric) ? Math.round(updatedAtNumeric) : 0;
    const eTag = `W/"rt-${releaseId}-${trackId}-${normalizedUpdatedAt}-${totalSize}"`;
    res.setHeader("ETag", eTag);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

    if (isIfNoneMatchSatisfied(req.headers["if-none-match"], eTag)) {
      return res.status(304).send();
    }

    const parsedRange = parseAudioByteRange(req.headers.range, totalSize);
    if (parsedRange && parsedRange.error) {
      res.setHeader("Content-Range", `bytes */${totalSize}`);
      return res.status(416).send();
    }

    if (parsedRange) {
      const chunk = parsedAudio.buffer.subarray(parsedRange.start, parsedRange.end + 1);
      res.setHeader("Content-Type", parsedAudio.contentType);
      res.setHeader("Content-Length", String(chunk.length));
      res.setHeader("Content-Range", `bytes ${parsedRange.start}-${parsedRange.end}/${totalSize}`);
      return res.status(206).send(chunk);
    }

    res.setHeader("Content-Type", parsedAudio.contentType);
    res.setHeader("Content-Length", String(totalSize));
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
