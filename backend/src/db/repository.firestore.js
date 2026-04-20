import { config } from "../config.js";
import { resolveLanguage } from "../i18n/language.js";
import { getFirestoreDb } from "./firestoreClient.js";

const SECTION_SETTINGS_DEFAULTS = [
  {
    sectionKey: "releases",
    sortOrder: 1,
    isEnabled: true,
    titleUk: "ОСТАННІ РЕЛІЗИ",
    titleEn: "LATEST RELEASES",
    menuTitleUk: "РЕЛІЗИ",
    menuTitleEn: "RELEASES"
  },
  {
    sectionKey: "artists",
    sortOrder: 2,
    isEnabled: true,
    titleUk: "АРТИСТИ ЛЕЙБЛУ",
    titleEn: "LABEL ARTISTS",
    menuTitleUk: "АРТИСТИ",
    menuTitleEn: "ARTISTS"
  },
  {
    sectionKey: "events",
    sortOrder: 3,
    isEnabled: true,
    titleUk: "АФІША ПОДІЙ",
    titleEn: "EVENT SCHEDULE",
    menuTitleUk: "ПОДІЇ",
    menuTitleEn: "EVENTS"
  },
  {
    sectionKey: "sponsors",
    sortOrder: 4,
    isEnabled: true,
    titleUk: "СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ",
    titleEn: "SPONSORS, PARTNERS AND FRIENDS",
    menuTitleUk: "СПОНСОРИ",
    menuTitleEn: "SPONSORS"
  },
  {
    sectionKey: "contact",
    sortOrder: 5,
    isEnabled: true,
    titleUk: "ЗВ'ЯЗАТИСЯ З НАМИ",
    titleEn: "CONTACT US",
    menuTitleUk: "КОНТАКТИ",
    menuTitleEn: "CONTACT"
  }
];

const HERO_SUBTITLE_DEFAULT = "Neurofunk • Drum & Bass • Breakbeat • Techstep";
const COLLECTION_BY_TYPE = new Set(["releases", "artists", "events", "sponsors"]);
const RELEASE_TYPES = new Set(["single", "ep", "album", "remix"]);
const CONTACT_REQUEST_STATUS = new Set(["new", "in_progress", "done"]);
const AUDIT_LOG_DETAILS_MAX_CHARS = 8192;
const AUDIT_LOG_CHANGED_FIELDS_PREVIEW_MAX = 40;
const AUDIT_LOG_ORDER_PREVIEW_MAX = 20;
const AUDIT_LOG_LIST_CHANGED_FIELDS_MAX = 120;
const AUDIT_LOG_LIST_VALUE_MAX_CHARS = 256;
const AUDIT_LOG_DATA_URL_PATTERN = /^data:([^;,]+)(?:;[^,]*)?,/i;
const DEFAULT_AUDIT_LATENCY_SETTINGS = {
  auditLatencyGoodMaxMs: 300,
  auditLatencyWarnMaxMs: 800
};

const ENTITY_TRANSLATED_FIELDS = {
  releases: ["title", "artist", "genre"],
  artists: ["name", "genre", "bio"],
  events: ["title", "venue", "description"],
  sponsors: ["name", "shortDescription"]
};

function toCamelCase(value) {
  return String(value || "").replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function nowIsoString() {
  return new Date().toISOString();
}

function toIsoString(value, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : fallback;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const converted = value.toDate();
      if (converted instanceof Date && Number.isFinite(converted.getTime())) {
        return converted.toISOString();
      }
    }

    if (typeof value.seconds === "number") {
      const millis = (value.seconds * 1000) + Math.floor(Number(value.nanoseconds || 0) / 1_000_000);
      const parsed = new Date(millis);
      return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
    }
  }

  return fallback;
}

function normalizeLanguageCode(rawValue) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  if (!/^[a-z]{2}(?:-[a-z]{2})?$/.test(normalized)) {
    return "";
  }
  return normalized;
}

function clonePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...value };
}

function toSafeString(value, fallback = "") {
  const normalized = String(value === undefined || value === null ? fallback : value).trim();
  return normalized;
}

function toAuditDate(value, fallback = 0) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

function isObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function omitNilKeys(value) {
  if (!isObjectLike(value)) return {};
  return Object.entries(value).reduce((acc, [key, entry]) => {
    if (entry === null || entry === undefined) return acc;
    acc[key] = entry;
    return acc;
  }, {});
}

function sanitizeReleaseType(value) {
  const normalized = toSafeString(value, "single").toLowerCase();
  return RELEASE_TYPES.has(normalized) ? normalized : "single";
}

async function getNextNumericId(sequenceKey, collectionName = sequenceKey) {
  const db = await getFirestoreDb();
  const countersRef = db.collection("_meta").doc("counters");

  return db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(countersRef);
    const counterData = counterSnapshot.exists ? counterSnapshot.data() || {} : {};
    let currentCounter = toBoundedInteger(counterData[sequenceKey], 0, 0, Number.MAX_SAFE_INTEGER);

    if (!currentCounter) {
      try {
        const maxSnapshot = await transaction.get(
          db.collection(collectionName)
            .orderBy("id", "desc")
            .limit(1)
        );

        if (!maxSnapshot.empty) {
          const maxRow = maxSnapshot.docs[0].data() || {};
          currentCounter = toBoundedInteger(maxRow.id, 0, 0, Number.MAX_SAFE_INTEGER);
        }
      } catch (_error) {
        currentCounter = 0;
      }
    }

    const nextCounter = currentCounter + 1;
    transaction.set(countersRef, {
      [sequenceKey]: nextCounter,
      updatedAt: nowIsoString()
    }, { merge: true });

    return nextCounter;
  });
}

async function findDocumentByNumericId(collectionName, id) {
  const normalizedId = toBoundedInteger(id, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedId) return null;

  const db = await getFirestoreDb();
  const collectionRef = db.collection(collectionName);

  const directRef = collectionRef.doc(String(normalizedId));
  const directSnapshot = await directRef.get();
  if (directSnapshot.exists) {
    return {
      ref: directRef,
      snapshot: directSnapshot,
      data: directSnapshot.data() || {}
    };
  }

  const byIdSnapshot = await collectionRef
    .where("id", "==", normalizedId)
    .limit(1)
    .get();

  if (byIdSnapshot.empty) return null;
  const snapshot = byIdSnapshot.docs[0];
  return {
    ref: snapshot.ref,
    snapshot,
    data: snapshot.data() || {}
  };
}

function normalizeReleaseStoragePayload(payload, fallback = {}) {
  const merged = {
    ...clonePlainObject(fallback),
    ...clonePlainObject(payload)
  };

  const releaseDate = normalizeIsoDate(readRawField(merged, ["releaseDate", "release_date"]))
    || `${deriveYearFromDateOrFallback("", readRawField(merged, ["year"]))}-01-01`;

  return {
    title: toSafeString(readRawField(merged, ["title"]), ""),
    artist: toSafeString(readRawField(merged, ["artist"]), ""),
    genre: toSafeString(readRawField(merged, ["genre"]), ""),
    releaseType: sanitizeReleaseType(readRawField(merged, ["releaseType", "release_type"])),
    releaseDate,
    year: deriveYearFromDateOrFallback(releaseDate, readRawField(merged, ["year"])),
    image: toSafeString(readRawField(merged, ["image"]), ""),
    link: toSafeString(readRawField(merged, ["link"]), ""),
    ticketLink: toSafeString(readRawField(merged, ["ticketLink", "ticket_link"]), "")
  };
}

function normalizeArtistStoragePayload(payload, fallback = {}) {
  const merged = {
    ...clonePlainObject(fallback),
    ...clonePlainObject(payload)
  };

  return {
    name: toSafeString(readRawField(merged, ["name"]), ""),
    genre: toSafeString(readRawField(merged, ["genre"]), ""),
    bio: toSafeString(readRawField(merged, ["bio"]), ""),
    image: toSafeString(readRawField(merged, ["image"]), ""),
    soundcloud: toSafeString(readRawField(merged, ["soundcloud"]), ""),
    instagram: toSafeString(readRawField(merged, ["instagram"]), "")
  };
}

function normalizeEventStoragePayload(payload, fallback = {}) {
  const merged = {
    ...clonePlainObject(fallback),
    ...clonePlainObject(payload)
  };

  return {
    title: toSafeString(readRawField(merged, ["title"]), ""),
    date: toSafeString(readRawField(merged, ["date"]), ""),
    time: toSafeString(readRawField(merged, ["time"]), ""),
    venue: toSafeString(readRawField(merged, ["venue"]), ""),
    description: toSafeString(readRawField(merged, ["description"]), ""),
    image: toSafeString(readRawField(merged, ["image"]), ""),
    ticketLink: toSafeString(readRawField(merged, ["ticketLink", "ticket_link"]), "")
  };
}

function normalizeSponsorStoragePayload(payload, fallback = {}) {
  const merged = {
    ...clonePlainObject(fallback),
    ...clonePlainObject(payload)
  };

  return {
    name: toSafeString(readRawField(merged, ["name"]), ""),
    shortDescription: toSafeString(readRawField(merged, ["shortDescription", "short_description"]), ""),
    logo: toSafeString(readRawField(merged, ["logo"]), ""),
    link: toSafeString(readRawField(merged, ["link"]), ""),
    sortOrder: toBoundedInteger(readRawField(merged, ["sortOrder", "sort_order"]), 0, 0, 9999)
  };
}

function normalizeEntityStoragePayload(type, payload, fallback = {}) {
  if (type === "releases") return normalizeReleaseStoragePayload(payload, fallback);
  if (type === "artists") return normalizeArtistStoragePayload(payload, fallback);
  if (type === "events") return normalizeEventStoragePayload(payload, fallback);
  if (type === "sponsors") return normalizeSponsorStoragePayload(payload, fallback);
  return clonePlainObject(payload);
}

function mergeEntityTranslations(type, existingTranslations, incomingI18n, baseRow) {
  const translatedFields = ENTITY_TRANSLATED_FIELDS[type] || [];
  if (translatedFields.length === 0) {
    return clonePlainObject(existingTranslations);
  }

  const nextTranslations = clonePlainObject(existingTranslations);
  const source = isObjectLike(incomingI18n) ? incomingI18n : {};

  Object.entries(source).forEach(([rawLanguageCode, translationPayload]) => {
    const languageCode = normalizeLanguageCode(rawLanguageCode);
    if (!languageCode || !isObjectLike(translationPayload)) return;

    const existingLanguageRow = clonePlainObject(nextTranslations[languageCode]);
    const nextLanguageRow = {
      ...existingLanguageRow
    };

    translatedFields.forEach((field) => {
      const snakeField = toSnakeCase(field);
      const incomingValue = readRawField(translationPayload, [field, snakeField]);
      const fallbackValue = toSafeString(readRawField(baseRow, [field, snakeField]), "");
      nextLanguageRow[field] = incomingValue === undefined
        ? fallbackValue
        : toSafeString(incomingValue, fallbackValue);
    });

    nextTranslations[languageCode] = nextLanguageRow;
  });

  return nextTranslations;
}

function normalizeReleaseTrackPayload(payload, fallbackSortOrder = 0) {
  const source = clonePlainObject(payload);
  const hasAudioDataUrl = Object.prototype.hasOwnProperty.call(source, "audioDataUrl")
    || Object.prototype.hasOwnProperty.call(source, "audio_data_url");

  return {
    title: toSafeString(readRawField(source, ["title"]), ""),
    audioDataUrl: toSafeString(readRawField(source, ["audioDataUrl", "audio_data_url"]), ""),
    hasAudioDataUrl,
    durationSeconds: toBoundedInteger(readRawField(source, ["durationSeconds", "duration_seconds"]), 0, 0, 86400),
    sortOrder: toBoundedInteger(readRawField(source, ["sortOrder", "sort_order"]), fallbackSortOrder, 0, 9999)
  };
}

function normalizeReleaseTrackRow(source, fallbackDocId = "") {
  const row = clonePlainObject(source);
  const id = normalizeEntityId(readRawField(row, ["id"]), fallbackDocId, 0);
  return {
    id,
    releaseId: toBoundedInteger(readRawField(row, ["releaseId", "release_id"]), 0, 1, Number.MAX_SAFE_INTEGER),
    title: toSafeString(readRawField(row, ["title"]), ""),
    audioDataUrl: toSafeString(readRawField(row, ["audioDataUrl", "audio_data_url"]), ""),
    durationSeconds: toBoundedInteger(readRawField(row, ["durationSeconds", "duration_seconds"]), 0, 0, 86400),
    sortOrder: toBoundedInteger(readRawField(row, ["sortOrder", "sort_order"]), 0, 0, 9999),
    createdAt: toIsoString(readRawField(row, ["createdAt", "created_at"]), ""),
    updatedAt: toIsoString(readRawField(row, ["updatedAt", "updated_at"]), "")
  };
}

function mapReleaseTrackToApi(row, options = {}) {
  const normalized = normalizeReleaseTrackRow(row, String(readRawField(row, ["id"]) || ""));
  const includeAudioDataUrl = options.includeAudioDataUrl !== false;
  const includeUpdatedAt = !!options.includeUpdatedAt;

  const response = {
    id: normalized.id,
    releaseId: normalized.releaseId,
    title: normalized.title,
    durationSeconds: normalized.durationSeconds,
    sortOrder: normalized.sortOrder
  };

  if (includeAudioDataUrl) {
    response.audioDataUrl = normalized.audioDataUrl;
  }

  if (includeUpdatedAt) {
    response.updatedAt = normalized.updatedAt;
  }

  return response;
}

function mapContactRequestToApi(source, fallbackDocId = "") {
  const row = clonePlainObject(source);
  const id = normalizeEntityId(readRawField(row, ["id"]), fallbackDocId, 0);
  const createdAt = toIsoString(readRawField(row, ["createdAt", "created_at"]), nowIsoString());
  const statusRaw = toSafeString(readRawField(row, ["status"]), "new").toLowerCase();
  const status = CONTACT_REQUEST_STATUS.has(statusRaw) ? statusRaw : "new";

  const attachmentName = toSafeString(readRawField(row, ["attachmentName", "attachment_name"]), "");
  const attachmentType = toSafeString(readRawField(row, ["attachmentType", "attachment_type"]), "");
  const attachmentDataUrl = toSafeString(readRawField(row, ["attachmentDataUrl", "attachment_data", "attachment_data_url"]), "");

  return {
    id,
    name: toSafeString(readRawField(row, ["name"]), ""),
    email: toSafeString(readRawField(row, ["email"]), ""),
    subject: toSafeString(readRawField(row, ["subject"]), ""),
    message: toSafeString(readRawField(row, ["message"]), ""),
    attachmentName,
    attachmentType,
    attachmentDataUrl,
    attachment_name: attachmentName,
    attachment_type: attachmentType,
    attachment_data: attachmentDataUrl,
    status,
    created_at: createdAt,
    createdAt
  };
}

function safeSerializeJson(value) {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : "{}";
  } catch (_error) {
    return "{}";
  }
}

function toStringArrayPreview(values, maxItems) {
  if (!Array.isArray(values)) return [];
  return values
    .slice(0, maxItems)
    .map((value) => toSafeString(value, ""))
    .filter(Boolean);
}

function compactAuditDetailsSummary(details, originalLength) {
  const source = toSafeString(details?.source, "").slice(0, 120) || null;
  const settingsDiff = isObjectLike(details?.diff?.settings) ? details.diff.settings : null;
  const sectionsDiff = isObjectLike(details?.diff?.sections) ? details.diff.sections : null;

  const settingsChangedFields = toStringArrayPreview(
    settingsDiff?.changedFields,
    AUDIT_LOG_CHANGED_FIELDS_PREVIEW_MAX
  );
  const settingsRedactedFields = toStringArrayPreview(
    settingsDiff?.redactedFields,
    AUDIT_LOG_CHANGED_FIELDS_PREVIEW_MAX
  );
  const previousOrder = toStringArrayPreview(sectionsDiff?.previousOrder, AUDIT_LOG_ORDER_PREVIEW_MAX);
  const nextOrder = toStringArrayPreview(sectionsDiff?.nextOrder, AUDIT_LOG_ORDER_PREVIEW_MAX);

  const compactDiff = omitNilKeys({
    ...(settingsDiff ? {
      settings: omitNilKeys({
        changedCount: toBoundedInteger(settingsDiff.changedCount, 0, 0, Number.MAX_SAFE_INTEGER),
        changedFields: settingsChangedFields,
        omittedChangedFields: Array.isArray(settingsDiff.changedFields)
          ? Math.max(0, settingsDiff.changedFields.length - settingsChangedFields.length)
          : null,
        redactedFields: settingsRedactedFields,
        omittedRedactedFields: Array.isArray(settingsDiff.redactedFields)
          ? Math.max(0, settingsDiff.redactedFields.length - settingsRedactedFields.length)
          : null
      })
    } : {}),
    ...(sectionsDiff ? {
      sections: omitNilKeys({
        changedRowCount: toBoundedInteger(sectionsDiff.changedRowCount, 0, 0, Number.MAX_SAFE_INTEGER),
        changedFieldCount: toBoundedInteger(sectionsDiff.changedFieldCount, 0, 0, Number.MAX_SAFE_INTEGER),
        orderChanged: sectionsDiff.orderChanged === true,
        previousOrder,
        omittedPreviousOrder: Array.isArray(sectionsDiff.previousOrder)
          ? Math.max(0, sectionsDiff.previousOrder.length - previousOrder.length)
          : null,
        nextOrder,
        omittedNextOrder: Array.isArray(sectionsDiff.nextOrder)
          ? Math.max(0, sectionsDiff.nextOrder.length - nextOrder.length)
          : null,
        addedCount: Array.isArray(sectionsDiff.added) ? sectionsDiff.added.length : null,
        removedCount: Array.isArray(sectionsDiff.removed) ? sectionsDiff.removed.length : null,
        updatedCount: Array.isArray(sectionsDiff.updated) ? sectionsDiff.updated.length : null
      })
    } : {})
  });

  return omitNilKeys({
    isCompact: true,
    truncated: true,
    originalLength,
    source,
    hasDiff: Object.keys(compactDiff).length > 0 ? true : null,
    diff: Object.keys(compactDiff).length > 0 ? compactDiff : null
  });
}

function compactAuditDetailsForStorage(details) {
  const normalizedDetails = isObjectLike(details) ? details : {};
  const serialized = safeSerializeJson(normalizedDetails);

  if (serialized.length <= AUDIT_LOG_DETAILS_MAX_CHARS) {
    return normalizedDetails;
  }

  const compactSummary = compactAuditDetailsSummary(normalizedDetails, serialized.length);
  const compactSerialized = safeSerializeJson(compactSummary);
  if (compactSerialized.length <= AUDIT_LOG_DETAILS_MAX_CHARS) {
    return compactSummary;
  }

  return {
    isCompact: true,
    truncated: true,
    originalLength: serialized.length,
    preview: serialized.slice(0, AUDIT_LOG_DETAILS_MAX_CHARS)
  };
}

function compactAuditListValue(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dataUrlMatch = trimmed.match(AUDIT_LOG_DATA_URL_PATTERN);
    if (dataUrlMatch) {
      const mimeType = toSafeString(dataUrlMatch[1], "unknown").toLowerCase();
      return `[DATA_URL:${mimeType};length=${trimmed.length}]`;
    }

    if (value.length > AUDIT_LOG_LIST_VALUE_MAX_CHARS) {
      const omittedChars = value.length - AUDIT_LOG_LIST_VALUE_MAX_CHARS;
      return `${value.slice(0, AUDIT_LOG_LIST_VALUE_MAX_CHARS)}...[+${omittedChars} chars]`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, AUDIT_LOG_ORDER_PREVIEW_MAX).map((item) => compactAuditListValue(item));
  }

  if (isObjectLike(value)) {
    return { isCompact: true };
  }

  return value;
}

function compactAuditSettingsDiffForList(settingsDiff) {
  if (!isObjectLike(settingsDiff)) return null;

  const changedFields = toStringArrayPreview(settingsDiff.changedFields, AUDIT_LOG_LIST_CHANGED_FIELDS_MAX);
  const redactedFields = toStringArrayPreview(settingsDiff.redactedFields, AUDIT_LOG_LIST_CHANGED_FIELDS_MAX);
  const rawChanges = isObjectLike(settingsDiff.changes) ? settingsDiff.changes : {};

  const effectiveFields = changedFields.length > 0
    ? changedFields
    : Object.keys(rawChanges)
      .map((field) => toSafeString(field, ""))
      .filter(Boolean)
      .slice(0, AUDIT_LOG_LIST_CHANGED_FIELDS_MAX);

  const changes = {};
  effectiveFields.forEach((field) => {
    const rawChange = rawChanges[field];
    if (isObjectLike(rawChange)) {
      changes[field] = {
        before: compactAuditListValue(readRawField(rawChange, ["before"])),
        after: compactAuditListValue(readRawField(rawChange, ["after"]))
      };
      return;
    }

    changes[field] = {
      before: "[COMPACT]",
      after: "[COMPACT]"
    };
  });

  const changedCount = Number.isFinite(Number(settingsDiff.changedCount))
    ? Number(settingsDiff.changedCount)
    : effectiveFields.length;

  return omitNilKeys({
    changedCount,
    changedFields: effectiveFields,
    redactedFields,
    changes
  });
}

function compactAuditSectionsDiffForList(sectionsDiff) {
  if (!isObjectLike(sectionsDiff)) return null;

  const previousOrder = toStringArrayPreview(sectionsDiff.previousOrder, AUDIT_LOG_ORDER_PREVIEW_MAX);
  const nextOrder = toStringArrayPreview(sectionsDiff.nextOrder, AUDIT_LOG_ORDER_PREVIEW_MAX);

  return omitNilKeys({
    changedRowCount: toBoundedInteger(sectionsDiff.changedRowCount, 0, 0, Number.MAX_SAFE_INTEGER),
    changedFieldCount: toBoundedInteger(sectionsDiff.changedFieldCount, 0, 0, Number.MAX_SAFE_INTEGER),
    orderChanged: sectionsDiff.orderChanged === true,
    previousOrder,
    nextOrder,
    addedCount: Array.isArray(sectionsDiff.added) ? sectionsDiff.added.length : null,
    removedCount: Array.isArray(sectionsDiff.removed) ? sectionsDiff.removed.length : null,
    updatedCount: Array.isArray(sectionsDiff.updated) ? sectionsDiff.updated.length : null
  });
}

function compactAuditDetailsForList(details) {
  if (!details) return { isCompact: true };

  if (!isObjectLike(details)) {
    return {
      isCompact: true,
      valuePreview: String(details).slice(0, 512)
    };
  }

  const source = typeof details.source === "string"
    ? details.source.slice(0, 120)
    : null;

  const settingsDiff = compactAuditSettingsDiffForList(details?.diff?.settings);
  const sectionsDiff = compactAuditSectionsDiffForList(details?.diff?.sections);
  const compactDiff = omitNilKeys({
    ...(settingsDiff ? { settings: settingsDiff } : {}),
    ...(sectionsDiff ? { sections: sectionsDiff } : {})
  });

  const settingsChangedCount = Number.isFinite(Number(settingsDiff?.changedCount))
    ? Number(settingsDiff.changedCount)
    : null;
  const sectionsChangedRowCount = Number.isFinite(Number(sectionsDiff?.changedRowCount))
    ? Number(sectionsDiff.changedRowCount)
    : null;

  return omitNilKeys({
    isCompact: true,
    source,
    hasDiff: Object.keys(compactDiff).length > 0 || Object.prototype.hasOwnProperty.call(details, "diff") ? true : null,
    diff: Object.keys(compactDiff).length > 0 ? compactDiff : null,
    settingsChangedCount,
    sectionsChangedRowCount
  });
}

function getAuditFilterTimeRange({ from = "", to = "" }) {
  const fromText = toSafeString(from, "");
  const toText = toSafeString(to, "");
  const fromTime = fromText ? toAuditDate(`${fromText}T00:00:00`, NaN) : null;
  const toTime = toText ? toAuditDate(`${toText}T23:59:59.999`, NaN) : null;
  return {
    fromTime: Number.isFinite(fromTime) ? fromTime : null,
    toTime: Number.isFinite(toTime) ? toTime : null
  };
}

function buildNotImplementedError(operationName) {
  const error = new Error(`Firestore repository operation is not implemented yet: ${operationName}`);
  error.code = "FIRESTORE_NOT_IMPLEMENTED";
  error.status = 503;
  return error;
}

function toSnakeCase(value) {
  return String(value || "").replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function toBoundedInteger(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.round(numeric);
  if (normalized < min) return min;
  if (normalized > max) return max;
  return normalized;
}

function normalizeIsoDate(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return formatDateToLocalIso(value, "");
  }

  const rawValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const localIso = formatDateToLocalIso(rawValue, "");
  if (localIso) return localIso;

  const match = rawValue.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  return match ? match[1] : "";
}

function formatDateToLocalIso(value, fallback = "") {
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return fallback;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deriveYearFromDateOrFallback(releaseDate, fallbackYear = "") {
  const isoDate = normalizeIsoDate(releaseDate);
  if (isoDate) return isoDate.slice(0, 4);

  const rawYear = String(fallbackYear || "").trim();
  if (/^\d{4}$/.test(rawYear)) return rawYear;

  return String(new Date().getFullYear());
}

function getSectionDefaultsMap() {
  return SECTION_SETTINGS_DEFAULTS.reduce((acc, entry) => {
    acc[entry.sectionKey] = entry;
    return acc;
  }, {});
}

function normalizeSectionSettingsForAdmin(rows) {
  const defaultsMap = getSectionDefaultsMap();
  const normalized = Array.isArray(rows)
    ? rows.map((row) => {
      const sectionKey = String(row.sectionKey || row.section_key || "").trim();
      const fallback = defaultsMap[sectionKey] || null;
      if (!sectionKey || !fallback) return null;

      return {
        sectionKey,
        sortOrder: Number.isFinite(Number(row.sortOrder ?? row.sort_order))
          ? Number(row.sortOrder ?? row.sort_order)
          : fallback.sortOrder,
        isEnabled: typeof row.isEnabled === "boolean"
          ? row.isEnabled
          : (typeof row.is_enabled === "boolean" ? row.is_enabled : fallback.isEnabled),
        titleUk: String(row.titleUk || row.title_uk || row.defaultTitle || fallback.titleUk).trim() || fallback.titleUk,
        titleEn: String(row.titleEn || row.title_en || row.defaultTitle || fallback.titleEn).trim() || fallback.titleEn,
        menuTitleUk: String(row.menuTitleUk || row.menu_title_uk || row.titleUk || row.title_uk || fallback.menuTitleUk || fallback.titleUk).trim() || fallback.menuTitleUk || fallback.titleUk,
        menuTitleEn: String(row.menuTitleEn || row.menu_title_en || row.titleEn || row.title_en || fallback.menuTitleEn || fallback.titleEn).trim() || fallback.menuTitleEn || fallback.titleEn
      };
    }).filter(Boolean)
    : [];

  const missing = SECTION_SETTINGS_DEFAULTS
    .filter((entry) => !normalized.some((item) => item.sectionKey === entry.sectionKey))
    .map((entry) => ({ ...entry }));

  return [...normalized, ...missing].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.sectionKey.localeCompare(right.sectionKey);
  });
}

function normalizeSectionSettingsForPublic(rows, requestedLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const adminRows = normalizeSectionSettingsForAdmin(rows);
  return adminRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((row) => ({
      sectionKey: row.sectionKey,
      sortOrder: row.sortOrder,
      isEnabled: row.isEnabled,
      title: language === "en" ? row.titleEn : row.titleUk,
      menuTitle: language === "en" ? row.menuTitleEn : row.menuTitleUk
    }));
}

function getTranslationByLanguage(source, languageCode) {
  if (!source || typeof source !== "object") return null;
  const translations = source.translations;
  if (!translations || typeof translations !== "object") return null;
  const translation = translations[languageCode];
  return translation && typeof translation === "object" ? translation : null;
}

function readRawField(source, keys = []) {
  const normalizedSource = source && typeof source === "object" ? source : {};
  const normalizedKeys = Array.isArray(keys) ? keys : [keys];

  for (const key of normalizedKeys) {
    if (!key) continue;
    if (!Object.prototype.hasOwnProperty.call(normalizedSource, key)) continue;
    const value = normalizedSource[key];
    if (value === undefined || value === null || value === "") continue;
    return value;
  }

  return undefined;
}

function toLanguageSuffix(languageCode) {
  const normalized = String(languageCode || "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function readLocalizedText(source, fieldName, languageCode, defaultLanguageCode, fallback = "", aliases = []) {
  const field = String(fieldName || "").trim();
  const snakeField = toSnakeCase(field);
  const normalizedFallback = String(fallback || "").trim();
  const langSuffix = toLanguageSuffix(languageCode);
  const defaultSuffix = toLanguageSuffix(defaultLanguageCode);

  const translationAliases = [field, snakeField, ...aliases].filter(Boolean);
  const langTranslation = getTranslationByLanguage(source, languageCode);
  const defaultTranslation = getTranslationByLanguage(source, defaultLanguageCode);

  const fromLangTranslation = readRawField(langTranslation, translationAliases);
  if (fromLangTranslation !== undefined) return String(fromLangTranslation).trim();

  const fromDefaultTranslation = readRawField(defaultTranslation, translationAliases);
  if (fromDefaultTranslation !== undefined) return String(fromDefaultTranslation).trim();

  const rootKeys = [
    `${field}${langSuffix}`,
    `${snakeField}_${String(languageCode || "").trim().toLowerCase()}`,
    `${field}${defaultSuffix}`,
    `${snakeField}_${String(defaultLanguageCode || "").trim().toLowerCase()}`,
    field,
    snakeField,
    ...aliases
  ].filter(Boolean);

  const fromRoot = readRawField(source, rootKeys);
  if (fromRoot !== undefined) return String(fromRoot).trim();

  return normalizedFallback;
}

function normalizeEntityId(rawValue, fallbackDocId = "", fallbackIndex = 0) {
  const direct = toBoundedInteger(rawValue, 0, 1, Number.MAX_SAFE_INTEGER);
  if (direct) return direct;

  const fromDocId = toBoundedInteger(fallbackDocId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (fromDocId) return fromDocId;

  return Math.max(1, Number(fallbackIndex) + 1);
}

function normalizeEntityRow(type, source, fallbackDocId = "", index = 0, language = config.defaultLanguage, defaultLanguage = config.defaultLanguage) {
  const row = source && typeof source === "object" ? source : {};
  const id = normalizeEntityId(row.id, fallbackDocId, index);

  if (type === "releases") {
    const releaseDate = normalizeIsoDate(readRawField(row, ["releaseDate", "release_date"]))
      || `${deriveYearFromDateOrFallback("", readRawField(row, ["year"]))}-01-01`;

    return {
      id,
      title: readLocalizedText(row, "title", language, defaultLanguage, ""),
      artist: readLocalizedText(row, "artist", language, defaultLanguage, ""),
      genre: readLocalizedText(row, "genre", language, defaultLanguage, ""),
      releaseType: String(readRawField(row, ["releaseType", "release_type"]) || "single").trim() || "single",
      releaseDate,
      year: deriveYearFromDateOrFallback(releaseDate, readRawField(row, ["year"])),
      image: String(readRawField(row, ["image"]) || "").trim(),
      link: String(readRawField(row, ["link"]) || "").trim(),
      ticketLink: String(readRawField(row, ["ticketLink", "ticket_link"]) || "").trim()
    };
  }

  if (type === "artists") {
    return {
      id,
      name: readLocalizedText(row, "name", language, defaultLanguage, ""),
      genre: readLocalizedText(row, "genre", language, defaultLanguage, ""),
      bio: readLocalizedText(row, "bio", language, defaultLanguage, ""),
      image: String(readRawField(row, ["image"]) || "").trim(),
      soundcloud: String(readRawField(row, ["soundcloud"]) || "").trim(),
      instagram: String(readRawField(row, ["instagram"]) || "").trim()
    };
  }

  if (type === "events") {
    return {
      id,
      title: readLocalizedText(row, "title", language, defaultLanguage, ""),
      date: String(readRawField(row, ["date"]) || "").trim(),
      time: String(readRawField(row, ["time"]) || "").trim(),
      venue: readLocalizedText(row, "venue", language, defaultLanguage, ""),
      description: readLocalizedText(row, "description", language, defaultLanguage, ""),
      image: String(readRawField(row, ["image"]) || "").trim(),
      ticketLink: String(readRawField(row, ["ticketLink", "ticket_link"]) || "").trim()
    };
  }

  if (type === "sponsors") {
    return {
      id,
      name: readLocalizedText(row, "name", language, defaultLanguage, ""),
      shortDescription: readLocalizedText(row, "shortDescription", language, defaultLanguage, "", ["short_description"]),
      logo: String(readRawField(row, ["logo"]) || "").trim(),
      link: String(readRawField(row, ["link"]) || "").trim(),
      sortOrder: toBoundedInteger(readRawField(row, ["sortOrder", "sort_order"]), 0, 0, 9999)
    };
  }

  return {
    id,
    ...row
  };
}

function compareEntityRows(type, left, right) {
  if (type === "sponsors") {
    const leftSort = toBoundedInteger(left?.sortOrder, 0, 0, 9999);
    const rightSort = toBoundedInteger(right?.sortOrder, 0, 0, 9999);
    if (leftSort !== rightSort) return leftSort - rightSort;
  }

  const leftId = toBoundedInteger(left?.id, 0, 0, Number.MAX_SAFE_INTEGER);
  const rightId = toBoundedInteger(right?.id, 0, 0, Number.MAX_SAFE_INTEGER);
  return leftId - rightId;
}

async function getSingleSettingsDocument() {
  const record = await getSingleSettingsDocumentRecord();
  return record ? record.data : null;
}

async function getSingleSettingsDocumentRecord() {
  const db = await getFirestoreDb();
  const collectionRef = db.collection("settings");
  const preferredDocIds = ["public", "main", "default", "settings", "1"];

  for (const docId of preferredDocIds) {
    const docSnapshot = await collectionRef.doc(docId).get();
    if (docSnapshot.exists) {
      return {
        id: docSnapshot.id,
        ref: docSnapshot.ref,
        data: docSnapshot.data() || {}
      };
    }
  }

  const snapshot = await collectionRef.limit(1).get();
  if (snapshot.empty) {
    return {
      id: "public",
      ref: collectionRef.doc("public"),
      data: null
    };
  }

  return {
    id: snapshot.docs[0].id,
    ref: snapshot.docs[0].ref,
    data: snapshot.docs[0].data() || {}
  };
}

function normalizeSectionSettingsDocument(source, fallbackDocId = "") {
  const row = source && typeof source === "object" ? source : {};
  const defaultsMap = getSectionDefaultsMap();

  const sectionKeyRaw = String(readRawField(row, ["sectionKey", "section_key"]) || fallbackDocId || "").trim();
  const fallback = defaultsMap[sectionKeyRaw] || null;

  if (!sectionKeyRaw || !fallback) {
    return null;
  }

  const titleUk = readLocalizedText(row, "title", "uk", "uk", fallback.titleUk, ["defaultTitle", "default_title"]);
  const titleEn = readLocalizedText(row, "title", "en", "en", fallback.titleEn, ["defaultTitle", "default_title"]);
  const menuTitleUk = readLocalizedText(row, "menuTitle", "uk", "uk", titleUk || fallback.menuTitleUk, ["menu_title", "navTitle", "nav_title"]);
  const menuTitleEn = readLocalizedText(row, "menuTitle", "en", "en", titleEn || fallback.menuTitleEn, ["menu_title", "navTitle", "nav_title"]);

  return {
    sectionKey: sectionKeyRaw,
    sortOrder: toBoundedInteger(readRawField(row, ["sortOrder", "sort_order"]), fallback.sortOrder, 1, 9999),
    isEnabled: readRawField(row, ["isEnabled", "is_enabled"]) !== undefined
      ? !!readRawField(row, ["isEnabled", "is_enabled"])
      : fallback.isEnabled,
    titleUk,
    titleEn,
    menuTitleUk,
    menuTitleEn
  };
}

async function notImplemented(operationName) {
  throw buildNotImplementedError(operationName);
}

export async function listByType(type, requestedLanguage = config.defaultLanguage) {
  if (!COLLECTION_BY_TYPE.has(type)) {
    throw new Error(`Unsupported collection type: ${type}`);
  }

  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const db = await getFirestoreDb();
  const snapshot = await db.collection(type).get();

  const rows = snapshot.docs
    .map((docSnapshot, index) => normalizeEntityRow(type, docSnapshot.data(), docSnapshot.id, index, language, defaultLanguage));

  return rows.sort((left, right) => compareEntityRows(type, left, right));
}

export async function createByType(type, payload) {
  if (!COLLECTION_BY_TYPE.has(type)) {
    throw new Error(`Unsupported collection type: ${type}`);
  }

  const db = await getFirestoreDb();
  const id = await getNextNumericId(type, type);
  const now = nowIsoString();
  const normalizedRow = normalizeEntityStoragePayload(type, payload, {});
  const mergedTranslations = mergeEntityTranslations(type, {}, payload && payload.i18n, normalizedRow);

  const documentRow = {
    id,
    ...normalizedRow,
    createdAt: now,
    updatedAt: now
  };

  if (Object.keys(mergedTranslations).length > 0) {
    documentRow.translations = mergedTranslations;
  }

  await db.collection(type).doc(String(id)).set(documentRow, { merge: true });

  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  return normalizeEntityRow(type, documentRow, String(id), 0, defaultLanguage, defaultLanguage);
}

export async function updateByType(type, id, payload) {
  if (!COLLECTION_BY_TYPE.has(type)) {
    throw new Error(`Unsupported collection type: ${type}`);
  }

  const found = await findDocumentByNumericId(type, id);
  if (!found) return null;

  const existing = clonePlainObject(found.data);
  const now = nowIsoString();
  const normalizedRow = normalizeEntityStoragePayload(type, payload, existing);
  const mergedTranslations = mergeEntityTranslations(type, existing.translations, payload && payload.i18n, normalizedRow);

  const patch = {
    id: normalizeEntityId(readRawField(existing, ["id"]), found.snapshot.id, 0),
    ...normalizedRow,
    updatedAt: now,
    createdAt: toIsoString(readRawField(existing, ["createdAt", "created_at"]), now)
  };

  if (Object.keys(mergedTranslations).length > 0) {
    patch.translations = mergedTranslations;
  }

  await found.ref.set(patch, { merge: true });
  const mergedRow = {
    ...existing,
    ...patch
  };

  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  return normalizeEntityRow(type, mergedRow, found.snapshot.id, 0, defaultLanguage, defaultLanguage);
}

export async function deleteByType(type, id) {
  if (!COLLECTION_BY_TYPE.has(type)) {
    throw new Error(`Unsupported collection type: ${type}`);
  }

  const found = await findDocumentByNumericId(type, id);
  if (!found) return;
  await found.ref.delete();
}

export async function getReleaseById(releaseId) {
  const found = await findDocumentByNumericId("releases", releaseId);
  if (!found) return null;
  return {
    id: normalizeEntityId(readRawField(found.data, ["id"]), found.snapshot.id, 0)
  };
}

export async function listReleaseTracksByReleaseId(releaseId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const db = await getFirestoreDb();
  const snapshot = await db.collection("release_tracks").where("releaseId", "==", normalizedReleaseId).get();
  const rows = snapshot.docs.map((doc) => mapReleaseTrackToApi({
    ...(doc.data() || {}),
    id: readRawField(doc.data() || {}, ["id"]) || doc.id
  }, { includeAudioDataUrl: true }));

  return rows.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.id - right.id;
  });
}

export async function listReleaseTrackMetaByReleaseId(releaseId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const db = await getFirestoreDb();
  const snapshot = await db.collection("release_tracks").where("releaseId", "==", normalizedReleaseId).get();
  const rows = snapshot.docs.map((doc) => mapReleaseTrackToApi({
    ...(doc.data() || {}),
    id: readRawField(doc.data() || {}, ["id"]) || doc.id
  }, { includeAudioDataUrl: false }));

  return rows.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.id - right.id;
  });
}

export async function getReleaseTrackById(releaseId, trackId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return null;

  const found = await findDocumentByNumericId("release_tracks", normalizedTrackId);
  if (!found) return null;

  const normalizedTrack = normalizeReleaseTrackRow(found.data, found.snapshot.id);
  if (normalizedTrack.releaseId !== normalizedReleaseId) return null;

  return mapReleaseTrackToApi({
    ...found.data,
    id: normalizedTrack.id,
    releaseId: normalizedTrack.releaseId,
    updatedAt: normalizedTrack.updatedAt
  }, {
    includeAudioDataUrl: true,
    includeUpdatedAt: true
  });
}

export async function replaceReleaseTracksByReleaseId(releaseId, tracksPayload = []) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const db = await getFirestoreDb();
  const tracksCollection = db.collection("release_tracks");
  const existingSnapshot = await tracksCollection.where("releaseId", "==", normalizedReleaseId).get();

  const payloadRows = Array.isArray(tracksPayload) ? tracksPayload : [];
  const now = nowIsoString();
  const batch = db.batch();

  existingSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  const createdRows = [];
  for (let index = 0; index < payloadRows.length; index += 1) {
    const normalizedPayload = normalizeReleaseTrackPayload(payloadRows[index], index + 1);
    const id = await getNextNumericId("release_tracks", "release_tracks");
    const row = {
      id,
      releaseId: normalizedReleaseId,
      title: normalizedPayload.title,
      audioDataUrl: normalizedPayload.audioDataUrl,
      durationSeconds: normalizedPayload.durationSeconds,
      sortOrder: normalizedPayload.sortOrder,
      createdAt: now,
      updatedAt: now
    };

    batch.set(tracksCollection.doc(String(id)), row, { merge: true });
    createdRows.push(mapReleaseTrackToApi(row, { includeAudioDataUrl: true }));
  }

  await batch.commit();
  return createdRows.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.id - right.id;
  });
}

export async function createReleaseTrackByReleaseId(releaseId, trackPayload = {}) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return null;

  const db = await getFirestoreDb();
  const id = await getNextNumericId("release_tracks", "release_tracks");
  const normalizedPayload = normalizeReleaseTrackPayload(trackPayload, 0);
  const now = nowIsoString();

  const row = {
    id,
    releaseId: normalizedReleaseId,
    title: normalizedPayload.title,
    audioDataUrl: normalizedPayload.audioDataUrl,
    durationSeconds: normalizedPayload.durationSeconds,
    sortOrder: normalizedPayload.sortOrder,
    createdAt: now,
    updatedAt: now
  };

  await db.collection("release_tracks").doc(String(id)).set(row, { merge: true });
  return mapReleaseTrackToApi(row, { includeAudioDataUrl: true });
}

export async function updateReleaseTrackById(releaseId, trackId, trackPayload = {}) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return null;

  const found = await findDocumentByNumericId("release_tracks", normalizedTrackId);
  if (!found) return null;

  const existingRow = normalizeReleaseTrackRow(found.data, found.snapshot.id);
  if (existingRow.releaseId !== normalizedReleaseId) return null;

  const normalizedPayload = normalizeReleaseTrackPayload(trackPayload, existingRow.sortOrder);
  const now = nowIsoString();

  const patch = {
    title: normalizedPayload.title,
    durationSeconds: normalizedPayload.durationSeconds,
    sortOrder: normalizedPayload.sortOrder,
    updatedAt: now
  };

  if (normalizedPayload.hasAudioDataUrl) {
    patch.audioDataUrl = normalizedPayload.audioDataUrl;
  }

  await found.ref.set(patch, { merge: true });
  const nextRow = {
    ...(found.data || {}),
    ...patch,
    id: existingRow.id,
    releaseId: normalizedReleaseId,
    createdAt: toIsoString(readRawField(found.data, ["createdAt", "created_at"]), now)
  };

  return mapReleaseTrackToApi(nextRow, { includeAudioDataUrl: true });
}

export async function deleteReleaseTrackById(releaseId, trackId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return false;

  const found = await findDocumentByNumericId("release_tracks", normalizedTrackId);
  if (!found) return false;

  const existingRow = normalizeReleaseTrackRow(found.data, found.snapshot.id);
  if (existingRow.releaseId !== normalizedReleaseId) return false;

  await found.ref.delete();
  return true;
}

export async function getPublicSettings(requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);

  const settings = await getSingleSettingsDocument();
  if (!settings) return null;

  return {
    title: readLocalizedText(settings, "title", language, defaultLanguage, ""),
    about: readLocalizedText(settings, "about", language, defaultLanguage, ""),
    mission: readLocalizedText(settings, "mission", language, defaultLanguage, ""),
    email: String(readRawField(settings, ["email"]) || "").trim(),
    headerLogoUrl: String(readRawField(settings, ["headerLogoUrl", "header_logo_url"]) || "").trim(),
    footerLogoUrl: String(readRawField(settings, ["footerLogoUrl", "footer_logo_url"]) || "").trim(),
    heroMainLogoDataUrl: String(readRawField(settings, ["heroMainLogoDataUrl", "hero_main_logo_data_url"]) || "").trim(),
    instagramUrl: String(readRawField(settings, ["instagramUrl", "instagram_url"]) || "").trim(),
    youtubeUrl: String(readRawField(settings, ["youtubeUrl", "youtube_url"]) || "").trim(),
    soundcloudUrl: String(readRawField(settings, ["soundcloudUrl", "soundcloud_url"]) || "").trim(),
    radioUrl: String(readRawField(settings, ["radioUrl", "radio_url"]) || "").trim(),
    contactCaptchaEnabled: !!readRawField(settings, ["contactCaptchaEnabled", "contact_captcha_enabled"]),
    contactCaptchaActiveProvider: String(readRawField(settings, ["contactCaptchaActiveProvider", "contact_captcha_active_provider"]) || "none").trim().toLowerCase() || "none",
    contactCaptchaHcaptchaSiteKey: String(readRawField(settings, ["contactCaptchaHcaptchaSiteKey", "contact_captcha_hcaptcha_site_key"]) || "").trim(),
    contactCaptchaRecaptchaSiteKey: String(readRawField(settings, ["contactCaptchaRecaptchaSiteKey", "contact_captcha_recaptcha_site_key"]) || "").trim(),
    contactCaptchaErrorMessage: readLocalizedText(
      settings,
      "contactCaptchaErrorMessage",
      language,
      defaultLanguage,
      "Не вдалося пройти перевірку captcha.",
      ["contact_captcha_error_message"]
    ),
    contactCaptchaMissingTokenMessage: readLocalizedText(
      settings,
      "contactCaptchaMissingTokenMessage",
      language,
      defaultLanguage,
      "Підтвердіть, що ви не робот.",
      ["contact_captcha_missing_token_message"]
    ),
    contactCaptchaInvalidDomainMessage: readLocalizedText(
      settings,
      "contactCaptchaInvalidDomainMessage",
      language,
      defaultLanguage,
      "Відправка з цього домену заборонена.",
      ["contact_captcha_invalid_domain_message"]
    ),
    contactCaptchaAllowedDomain: String(readRawField(settings, ["contactCaptchaAllowedDomain", "contact_captcha_allowed_domain"]) || "").trim().toLowerCase(),
    heroSubtitle: readLocalizedText(settings, "heroSubtitle", language, defaultLanguage, HERO_SUBTITLE_DEFAULT, ["hero_subtitle"])
  };
}

export async function getAdminSectionSettings() {
  const db = await getFirestoreDb();
  const snapshot = await db.collection("section_settings").get();

  const sections = snapshot.docs
    .map((docSnapshot) => normalizeSectionSettingsDocument(docSnapshot.data(), docSnapshot.id))
    .filter(Boolean);

  return normalizeSectionSettingsForAdmin(sections);
}

export async function getPublicSectionSettings(requestedLanguage = config.defaultLanguage) {
  const db = await getFirestoreDb();
  const snapshot = await db.collection("section_settings").get();

  const sections = snapshot.docs
    .map((docSnapshot) => normalizeSectionSettingsDocument(docSnapshot.data(), docSnapshot.id))
    .filter(Boolean);

  return normalizeSectionSettingsForPublic(sections, requestedLanguage);
}

export async function saveSectionSettings(sectionsPayload) {
  const normalizedSections = normalizeSectionSettingsForAdmin(sectionsPayload);
  const db = await getFirestoreDb();
  const collectionRef = db.collection("section_settings");
  const batch = db.batch();
  const now = nowIsoString();

  normalizedSections.forEach((section) => {
    const docRef = collectionRef.doc(section.sectionKey);
    batch.set(docRef, {
      sectionKey: section.sectionKey,
      sortOrder: section.sortOrder,
      isEnabled: section.isEnabled,
      defaultTitle: section.titleUk,
      titleUk: section.titleUk,
      titleEn: section.titleEn,
      menuTitleUk: section.menuTitleUk,
      menuTitleEn: section.menuTitleEn,
      updatedAt: now
    }, { merge: true });
  });

  await batch.commit();
  return getAdminSectionSettings();
}

export async function saveSettingsBundle(payload, requestedLanguage = config.defaultLanguage) {
  const source = clonePlainObject(payload);
  const settingsPayload = clonePlainObject(source.settings);
  const sectionsPayload = Array.isArray(source.sections) ? source.sections : [];

  const settings = await saveSettings(settingsPayload, requestedLanguage);
  const sections = await saveSectionSettings(sectionsPayload);

  return {
    settings,
    sections
  };
}

export async function getAdminSettings(requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const settings = await getSingleSettingsDocument();
  if (!settings) return null;

  const title = readLocalizedText(settings, "title", language, defaultLanguage, "");
  const about = readLocalizedText(settings, "about", language, defaultLanguage, "");
  const mission = readLocalizedText(settings, "mission", language, defaultLanguage, "");

  const titleUk = readLocalizedText(settings, "title", "uk", "uk", title);
  const titleEn = readLocalizedText(settings, "title", "en", "en", titleUk || title);
  const aboutUk = readLocalizedText(settings, "about", "uk", "uk", about);
  const aboutEn = readLocalizedText(settings, "about", "en", "en", aboutUk || about);
  const missionUk = readLocalizedText(settings, "mission", "uk", "uk", mission);
  const missionEn = readLocalizedText(settings, "mission", "en", "en", missionUk || mission);

  const heroSubtitleUk = readLocalizedText(settings, "heroSubtitle", "uk", "uk", HERO_SUBTITLE_DEFAULT, ["hero_subtitle"]);
  const heroSubtitleEn = readLocalizedText(settings, "heroSubtitle", "en", "en", HERO_SUBTITLE_DEFAULT, ["hero_subtitle"]);

  const auditLatencyGoodMaxMs = toBoundedInteger(
    readRawField(settings, ["auditLatencyGoodMaxMs", "audit_latency_good_max_ms"]),
    DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyGoodMaxMs,
    50,
    5000
  );
  const auditLatencyWarnMaxMs = toBoundedInteger(
    readRawField(settings, ["auditLatencyWarnMaxMs", "audit_latency_warn_max_ms"]),
    DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyWarnMaxMs,
    100,
    10000
  );

  return {
    title,
    about,
    mission,
    titleUk,
    titleEn,
    aboutUk,
    aboutEn,
    missionUk,
    missionEn,
    heroSubtitleUk,
    heroSubtitleEn,
    email: toSafeString(readRawField(settings, ["email"]), ""),
    headerLogoUrl: toSafeString(readRawField(settings, ["headerLogoUrl", "header_logo_url"]), ""),
    footerLogoUrl: toSafeString(readRawField(settings, ["footerLogoUrl", "footer_logo_url"]), ""),
    heroMainLogoDataUrl: toSafeString(readRawField(settings, ["heroMainLogoDataUrl", "hero_main_logo_data_url"]), ""),
    instagramUrl: toSafeString(readRawField(settings, ["instagramUrl", "instagram_url"]), ""),
    youtubeUrl: toSafeString(readRawField(settings, ["youtubeUrl", "youtube_url"]), ""),
    soundcloudUrl: toSafeString(readRawField(settings, ["soundcloudUrl", "soundcloud_url"]), ""),
    radioUrl: toSafeString(readRawField(settings, ["radioUrl", "radio_url"]), ""),
    contactCaptchaEnabled: !!readRawField(settings, ["contactCaptchaEnabled", "contact_captcha_enabled"]),
    contactCaptchaActiveProvider: toSafeString(readRawField(settings, ["contactCaptchaActiveProvider", "contact_captcha_active_provider"]), "none").toLowerCase() || "none",
    contactCaptchaHcaptchaSiteKey: toSafeString(readRawField(settings, ["contactCaptchaHcaptchaSiteKey", "contact_captcha_hcaptcha_site_key"]), ""),
    contactCaptchaHcaptchaSecretKey: toSafeString(readRawField(settings, ["contactCaptchaHcaptchaSecretKey", "contact_captcha_hcaptcha_secret_key"]), ""),
    contactCaptchaRecaptchaSiteKey: toSafeString(readRawField(settings, ["contactCaptchaRecaptchaSiteKey", "contact_captcha_recaptcha_site_key"]), ""),
    contactCaptchaRecaptchaSecretKey: toSafeString(readRawField(settings, ["contactCaptchaRecaptchaSecretKey", "contact_captcha_recaptcha_secret_key"]), ""),
    contactCaptchaErrorMessage: readLocalizedText(
      settings,
      "contactCaptchaErrorMessage",
      language,
      defaultLanguage,
      "Не вдалося пройти перевірку captcha.",
      ["contact_captcha_error_message"]
    ),
    contactCaptchaMissingTokenMessage: readLocalizedText(
      settings,
      "contactCaptchaMissingTokenMessage",
      language,
      defaultLanguage,
      "Підтвердіть, що ви не робот.",
      ["contact_captcha_missing_token_message"]
    ),
    contactCaptchaInvalidDomainMessage: readLocalizedText(
      settings,
      "contactCaptchaInvalidDomainMessage",
      language,
      defaultLanguage,
      "Відправка з цього домену заборонена.",
      ["contact_captcha_invalid_domain_message"]
    ),
    contactCaptchaAllowedDomain: toSafeString(readRawField(settings, ["contactCaptchaAllowedDomain", "contact_captcha_allowed_domain"]), "").toLowerCase(),
    auditLatencyGoodMaxMs,
    auditLatencyWarnMaxMs
  };
}

export async function saveSettings(payload, requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const record = await getSingleSettingsDocumentRecord();
  const existing = clonePlainObject(record && record.data ? record.data : {});
  const existingTranslations = clonePlainObject(existing.translations);
  const existingUk = clonePlainObject(existingTranslations.uk);
  const existingEn = clonePlainObject(existingTranslations.en);
  const source = clonePlainObject(payload);

  const localizedFromPayload = {
    title: toSafeString(source.title, ""),
    about: toSafeString(source.about, ""),
    mission: toSafeString(source.mission, ""),
    contactCaptchaErrorMessage: toSafeString(source.contactCaptchaErrorMessage, "Не вдалося пройти перевірку captcha."),
    contactCaptchaMissingTokenMessage: toSafeString(source.contactCaptchaMissingTokenMessage, "Підтвердіть, що ви не робот."),
    contactCaptchaInvalidDomainMessage: toSafeString(source.contactCaptchaInvalidDomainMessage, "Відправка з цього домену заборонена.")
  };

  const getExistingLocalizedField = (languageCode, fieldName) => {
    const existingTranslation = clonePlainObject(existingTranslations[languageCode]);
    const fromTranslation = readRawField(existingTranslation, [fieldName, toSnakeCase(fieldName)]);
    if (fromTranslation !== undefined) {
      return toSafeString(fromTranslation, "");
    }

    return readLocalizedText(existing, fieldName, languageCode, languageCode, "");
  };

  const resolveLocalizedField = (languageCode, fieldName) => {
    if (languageCode === language) {
      return localizedFromPayload[fieldName];
    }

    const existingValue = getExistingLocalizedField(languageCode, fieldName);
    if (existingValue) return existingValue;
    return localizedFromPayload[fieldName];
  };

  const resolveExplicitOrLocalizedField = (languageCode, fieldName, explicitFieldName) => {
    if (Object.prototype.hasOwnProperty.call(source, explicitFieldName)) {
      return toSafeString(source[explicitFieldName], "");
    }
    return resolveLocalizedField(languageCode, fieldName);
  };

  const heroSubtitleUk = toSafeString(source.heroSubtitleUk, HERO_SUBTITLE_DEFAULT) || HERO_SUBTITLE_DEFAULT;
  const heroSubtitleEn = toSafeString(source.heroSubtitleEn, HERO_SUBTITLE_DEFAULT) || HERO_SUBTITLE_DEFAULT;

  const localizedByLanguage = {
    uk: {
      title: resolveExplicitOrLocalizedField("uk", "title", "titleUk"),
      about: resolveExplicitOrLocalizedField("uk", "about", "aboutUk"),
      mission: resolveExplicitOrLocalizedField("uk", "mission", "missionUk"),
      contactCaptchaErrorMessage: resolveLocalizedField("uk", "contactCaptchaErrorMessage"),
      contactCaptchaMissingTokenMessage: resolveLocalizedField("uk", "contactCaptchaMissingTokenMessage"),
      contactCaptchaInvalidDomainMessage: resolveLocalizedField("uk", "contactCaptchaInvalidDomainMessage"),
      heroSubtitle: heroSubtitleUk
    },
    en: {
      title: resolveExplicitOrLocalizedField("en", "title", "titleEn"),
      about: resolveExplicitOrLocalizedField("en", "about", "aboutEn"),
      mission: resolveExplicitOrLocalizedField("en", "mission", "missionEn"),
      contactCaptchaErrorMessage: resolveLocalizedField("en", "contactCaptchaErrorMessage"),
      contactCaptchaMissingTokenMessage: resolveLocalizedField("en", "contactCaptchaMissingTokenMessage"),
      contactCaptchaInvalidDomainMessage: resolveLocalizedField("en", "contactCaptchaInvalidDomainMessage"),
      heroSubtitle: heroSubtitleEn
    }
  };

  const now = nowIsoString();
  const createdAt = toIsoString(readRawField(existing, ["createdAt", "created_at"]), now);
  const nextDoc = {
    id: toBoundedInteger(readRawField(existing, ["id"]), 1, 1, Number.MAX_SAFE_INTEGER),
    title: localizedFromPayload.title,
    about: localizedFromPayload.about,
    mission: localizedFromPayload.mission,
    email: toSafeString(source.email, ""),
    headerLogoUrl: toSafeString(source.headerLogoUrl, ""),
    footerLogoUrl: toSafeString(source.footerLogoUrl, ""),
    heroMainLogoDataUrl: toSafeString(source.heroMainLogoDataUrl, ""),
    instagramUrl: toSafeString(source.instagramUrl, ""),
    youtubeUrl: toSafeString(source.youtubeUrl, ""),
    soundcloudUrl: toSafeString(source.soundcloudUrl, ""),
    radioUrl: toSafeString(source.radioUrl, ""),
    contactCaptchaEnabled: !!source.contactCaptchaEnabled,
    contactCaptchaActiveProvider: toSafeString(source.contactCaptchaActiveProvider, "none").toLowerCase() || "none",
    contactCaptchaHcaptchaSiteKey: toSafeString(source.contactCaptchaHcaptchaSiteKey, ""),
    contactCaptchaHcaptchaSecretKey: toSafeString(source.contactCaptchaHcaptchaSecretKey, ""),
    contactCaptchaRecaptchaSiteKey: toSafeString(source.contactCaptchaRecaptchaSiteKey, ""),
    contactCaptchaRecaptchaSecretKey: toSafeString(source.contactCaptchaRecaptchaSecretKey, ""),
    contactCaptchaErrorMessage: localizedFromPayload.contactCaptchaErrorMessage,
    contactCaptchaMissingTokenMessage: localizedFromPayload.contactCaptchaMissingTokenMessage,
    contactCaptchaInvalidDomainMessage: localizedFromPayload.contactCaptchaInvalidDomainMessage,
    contactCaptchaAllowedDomain: toSafeString(source.contactCaptchaAllowedDomain, "").toLowerCase(),
    auditLatencyGoodMaxMs: toBoundedInteger(
      source.auditLatencyGoodMaxMs,
      DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyGoodMaxMs,
      50,
      5000
    ),
    auditLatencyWarnMaxMs: toBoundedInteger(
      source.auditLatencyWarnMaxMs,
      DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyWarnMaxMs,
      100,
      10000
    ),
    heroSubtitle: language === "en" ? localizedByLanguage.en.heroSubtitle : localizedByLanguage.uk.heroSubtitle,
    translations: {
      ...existingTranslations,
      uk: {
        ...existingUk,
        ...localizedByLanguage.uk
      },
      en: {
        ...existingEn,
        ...localizedByLanguage.en
      }
    },
    createdAt,
    updatedAt: now
  };

  const db = await getFirestoreDb();
  const settingsRef = record && record.ref
    ? record.ref
    : db.collection("settings").doc("public");

  await settingsRef.set(nextDoc, { merge: true });
  return getAdminSettings(language);
}

export async function createContactRequest(payload) {
  const source = clonePlainObject(payload);
  const db = await getFirestoreDb();
  const id = await getNextNumericId("contact_requests", "contact_requests");
  const now = nowIsoString();

  const row = {
    id,
    name: toSafeString(source.name, ""),
    email: toSafeString(source.email, ""),
    subject: toSafeString(source.subject, ""),
    message: toSafeString(source.message, ""),
    attachmentName: toSafeString(source.attachmentName, ""),
    attachmentType: toSafeString(source.attachmentType, ""),
    attachmentDataUrl: toSafeString(source.attachmentDataUrl, ""),
    status: "new",
    createdAt: now,
    updatedAt: now
  };

  await db.collection("contact_requests").doc(String(id)).set(row, { merge: true });
  return mapContactRequestToApi(row, String(id));
}

export async function listContactRequests() {
  const db = await getFirestoreDb();
  const snapshot = await db.collection("contact_requests").get();
  const rows = snapshot.docs.map((docSnapshot) => mapContactRequestToApi(docSnapshot.data(), docSnapshot.id));
  return rows.sort((left, right) => toAuditDate(right.created_at) - toAuditDate(left.created_at));
}

export async function updateContactRequestStatus(id, status) {
  const normalizedStatusRaw = toSafeString(status, "").toLowerCase();
  if (!CONTACT_REQUEST_STATUS.has(normalizedStatusRaw)) {
    return null;
  }

  const found = await findDocumentByNumericId("contact_requests", id);
  if (!found) return null;

  const now = nowIsoString();
  await found.ref.set({
    status: normalizedStatusRaw,
    updatedAt: now
  }, { merge: true });

  return mapContactRequestToApi({
    ...(found.data || {}),
    status: normalizedStatusRaw,
    updatedAt: now
  }, found.snapshot.id);
}

export async function writeAuditLog({ entityType, entityId, action, actor, details }) {
  const db = await getFirestoreDb();
  const id = await getNextNumericId("audit_logs", "audit_logs");
  const now = nowIsoString();
  const hasEntityId = entityId !== undefined && entityId !== null && String(entityId).trim() !== "";
  const normalizedEntityId = hasEntityId && Number.isFinite(Number(entityId))
    ? Number(entityId)
    : null;

  const row = {
    id,
    entityType: toSafeString(entityType, ""),
    entityId: normalizedEntityId,
    action: toSafeString(action, ""),
    actor: toSafeString(actor, "system") || "system",
    details: compactAuditDetailsForStorage(details),
    createdAt: now,
    updatedAt: now
  };

  await db.collection("audit_logs").doc(String(id)).set(row, { merge: true });
  return true;
}

export async function listAuditLogs({
  limit = 100,
  page = 1,
  q = "",
  action = "",
  entity = "",
  from = "",
  to = ""
} = {}) {
  const normalizedLimit = toBoundedInteger(limit, 100, 1, 250);
  const normalizedPage = toBoundedInteger(page, 1, 1, 1_000_000);
  const normalizedQuery = toSafeString(q, "").toLowerCase();
  const normalizedAction = toSafeString(action, "");
  const normalizedEntity = toSafeString(entity, "");
  const { fromTime, toTime } = getAuditFilterTimeRange({ from, to });

  const db = await getFirestoreDb();
  const snapshot = await db.collection("audit_logs").get();

  const rows = snapshot.docs.map((docSnapshot) => {
    const row = clonePlainObject(docSnapshot.data());
    const createdAt = toIsoString(readRawField(row, ["createdAt", "created_at"]), nowIsoString());
    const entityIdRaw = readRawField(row, ["entityId", "entity_id"]);
    const entityId = entityIdRaw === undefined || entityIdRaw === null || String(entityIdRaw).trim() === ""
      ? null
      : (Number.isFinite(Number(entityIdRaw)) ? Number(entityIdRaw) : null);

    return {
      id: normalizeEntityId(readRawField(row, ["id"]), docSnapshot.id, 0),
      entity_type: toSafeString(readRawField(row, ["entityType", "entity_type"]), ""),
      entity_id: entityId,
      action: toSafeString(readRawField(row, ["action"]), ""),
      actor: toSafeString(readRawField(row, ["actor"]), ""),
      details: compactAuditDetailsForList(readRawField(row, ["details"])),
      created_at: createdAt
    };
  }).filter((row) => {
    if (normalizedAction && row.action !== normalizedAction) return false;
    if (normalizedEntity && row.entity_type !== normalizedEntity) return false;

    const createdAtTime = toAuditDate(row.created_at, NaN);
    if (fromTime !== null && Number.isFinite(createdAtTime) && createdAtTime < fromTime) return false;
    if (toTime !== null && Number.isFinite(createdAtTime) && createdAtTime > toTime) return false;

    if (normalizedQuery) {
      const haystack = [
        row.actor,
        row.action,
        row.entity_type,
        row.entity_id === null ? "" : String(row.entity_id)
      ].join(" ").toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });

  rows.sort((left, right) => toAuditDate(right.created_at) - toAuditDate(left.created_at));
  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    items: rows.slice(offset, offset + normalizedLimit),
    total: rows.length
  };
}

export async function listAuditFacets() {
  const db = await getFirestoreDb();
  const snapshot = await db.collection("audit_logs").get();

  const actionsSet = new Set();
  const entitiesSet = new Set();

  snapshot.docs.forEach((docSnapshot) => {
    const row = clonePlainObject(docSnapshot.data());
    const action = toSafeString(readRawField(row, ["action"]), "");
    const entityType = toSafeString(readRawField(row, ["entityType", "entity_type"]), "");
    if (action) actionsSet.add(action);
    if (entityType) entitiesSet.add(entityType);
  });

  return {
    actions: Array.from(actionsSet).sort((left, right) => left.localeCompare(right)),
    entities: Array.from(entitiesSet).sort((left, right) => left.localeCompare(right))
  };
}
