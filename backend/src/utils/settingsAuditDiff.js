const SETTINGS_SECRET_FIELDS = new Set([
  "contactCaptchaHcaptchaSecretKey",
  "contactCaptchaRecaptchaSecretKey"
]);

const SETTINGS_TRACKED_FIELDS = [
  "title",
  "about",
  "mission",
  "heroSubtitleUk",
  "heroSubtitleEn",
  "email",
  "instagramUrl",
  "youtubeUrl",
  "soundcloudUrl",
  "radioUrl",
  "contactCaptchaEnabled",
  "contactCaptchaActiveProvider",
  "contactCaptchaHcaptchaSiteKey",
  "contactCaptchaHcaptchaSecretKey",
  "contactCaptchaRecaptchaSiteKey",
  "contactCaptchaRecaptchaSecretKey",
  "contactCaptchaErrorMessage",
  "contactCaptchaMissingTokenMessage",
  "contactCaptchaInvalidDomainMessage",
  "contactCaptchaAllowedDomain",
  "auditLatencyGoodMaxMs",
  "auditLatencyWarnMaxMs"
];

const SECTION_TRACKED_FIELDS = [
  "sortOrder",
  "isEnabled",
  "titleUk",
  "titleEn",
  "menuTitleUk",
  "menuTitleEn"
];

function normalizePrimitive(value) {
  if (value === undefined || value === null) return null;

  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  return JSON.stringify(value);
}

function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function primitiveEquals(left, right) {
  return normalizePrimitive(left) === normalizePrimitive(right);
}

function listsEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function normalizeSectionRow(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    sectionKey: String(source.sectionKey || "").trim(),
    sortOrder: normalizeNumber(source.sortOrder, 0),
    isEnabled: source.isEnabled !== false,
    titleUk: String(source.titleUk || ""),
    titleEn: String(source.titleEn || ""),
    menuTitleUk: String(source.menuTitleUk || ""),
    menuTitleEn: String(source.menuTitleEn || "")
  };
}

function toSectionMap(sections) {
  const map = new Map();
  const rows = Array.isArray(sections) ? sections : [];

  rows.forEach((row) => {
    const normalized = normalizeSectionRow(row);
    if (!normalized.sectionKey) return;
    map.set(normalized.sectionKey, normalized);
  });

  return map;
}

function toSortedSectionOrder(sections) {
  const rows = Array.isArray(sections) ? sections : [];

  return rows
    .map((row) => normalizeSectionRow(row))
    .filter((row) => !!row.sectionKey)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      return left.sectionKey.localeCompare(right.sectionKey);
    })
    .map((row) => row.sectionKey);
}

function toAuditSettingsValue(field, value) {
  if (SETTINGS_SECRET_FIELDS.has(field)) return "[REDACTED]";
  return normalizePrimitive(value);
}

export function buildSettingsDiff(previousSettings, nextSettings) {
  const previous = previousSettings && typeof previousSettings === "object" ? previousSettings : {};
  const next = nextSettings && typeof nextSettings === "object" ? nextSettings : {};

  const fields = Array.from(new Set([
    ...SETTINGS_TRACKED_FIELDS,
    ...Object.keys(previous),
    ...Object.keys(next)
  ]))
    .filter((field) => field && field !== "id")
    .sort((left, right) => left.localeCompare(right));

  const changedFields = [];
  const redactedFields = [];
  const changes = {};

  fields.forEach((field) => {
    const before = normalizePrimitive(previous[field]);
    const after = normalizePrimitive(next[field]);
    if (primitiveEquals(before, after)) return;

    const isRedacted = SETTINGS_SECRET_FIELDS.has(field);
    changedFields.push(field);
    if (isRedacted) {
      redactedFields.push(field);
    }

    changes[field] = {
      before: toAuditSettingsValue(field, before),
      after: toAuditSettingsValue(field, after),
      ...(isRedacted ? { redacted: true } : {})
    };
  });

  return {
    changedCount: changedFields.length,
    changedFields,
    redactedFields,
    changes
  };
}

export function buildSectionSettingsDiff(previousSections, nextSections) {
  const previousMap = toSectionMap(previousSections);
  const nextMap = toSectionMap(nextSections);

  const sectionKeys = Array.from(new Set([
    ...previousMap.keys(),
    ...nextMap.keys()
  ])).sort((left, right) => left.localeCompare(right));

  const added = [];
  const removed = [];
  const updated = [];
  let changedFieldCount = 0;

  sectionKeys.forEach((sectionKey) => {
    const before = previousMap.get(sectionKey) || null;
    const after = nextMap.get(sectionKey) || null;

    if (!before && after) {
      added.push(after);
      changedFieldCount += SECTION_TRACKED_FIELDS.length;
      return;
    }

    if (before && !after) {
      removed.push(before);
      changedFieldCount += SECTION_TRACKED_FIELDS.length;
      return;
    }

    const changedFields = [];
    const changes = {};

    SECTION_TRACKED_FIELDS.forEach((field) => {
      const beforeValue = normalizePrimitive(before[field]);
      const afterValue = normalizePrimitive(after[field]);
      if (primitiveEquals(beforeValue, afterValue)) return;

      changedFields.push(field);
      changes[field] = {
        before: beforeValue,
        after: afterValue
      };
    });

    if (changedFields.length === 0) return;

    changedFieldCount += changedFields.length;
    updated.push({
      sectionKey,
      changedFields,
      changes
    });
  });

  const previousOrder = toSortedSectionOrder(previousSections);
  const nextOrder = toSortedSectionOrder(nextSections);
  const orderChanged = !listsEqual(previousOrder, nextOrder);

  return {
    changedRowCount: added.length + removed.length + updated.length + (orderChanged ? 1 : 0),
    changedFieldCount,
    orderChanged,
    previousOrder,
    nextOrder,
    added,
    removed,
    updated
  };
}
