import { pool } from "./pool.js";
import { config } from "../config.js";
import { resolveLanguage } from "../i18n/language.js";

const SECTION_SETTINGS_DEFAULTS = [
  { sectionKey: "releases", sortOrder: 1, isEnabled: true, titleUk: "ОСТАННІ РЕЛІЗИ", titleEn: "LATEST RELEASES" },
  { sectionKey: "artists", sortOrder: 2, isEnabled: true, titleUk: "АРТИСТИ ЛЕЙБЛУ", titleEn: "LABEL ARTISTS" },
  { sectionKey: "events", sortOrder: 3, isEnabled: true, titleUk: "АФІША ПОДІЙ", titleEn: "EVENT SCHEDULE" },
  { sectionKey: "sponsors", sortOrder: 4, isEnabled: true, titleUk: "СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ", titleEn: "SPONSORS, PARTNERS AND FRIENDS" }
];

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
        titleEn: String(row.titleEn || row.title_en || row.defaultTitle || fallback.titleEn).trim() || fallback.titleEn
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
      title: language === "en" ? row.titleEn : row.titleUk
    }));
}

const DEFAULT_AUDIT_LATENCY_SETTINGS = {
  auditLatencyGoodMaxMs: 300,
  auditLatencyWarnMaxMs: 800
};

function isMissingAuditLatencyColumnsError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42703" && message.includes("audit_latency_");
}

function withDefaultAuditLatencySettings(row) {
  if (!row) return null;
  const nextGood = Number.isFinite(Number(row.auditLatencyGoodMaxMs))
    ? Number(row.auditLatencyGoodMaxMs)
    : DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyGoodMaxMs;
  const nextWarn = Number.isFinite(Number(row.auditLatencyWarnMaxMs))
    ? Number(row.auditLatencyWarnMaxMs)
    : DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyWarnMaxMs;

  return {
    ...row,
    auditLatencyGoodMaxMs: nextGood,
    auditLatencyWarnMaxMs: nextWarn
  };
}

async function upsertAdminSettings(queryable, payload) {
  const existing = await queryAdminSettings(queryable);
  if (!existing) {
    try {
      await queryable.query(
      `INSERT INTO settings (
        title,
        about,
        mission,
        email,
        instagram_url,
        youtube_url,
        soundcloud_url,
        radio_url,
        contact_captcha_enabled,
        contact_captcha_active_provider,
        contact_captcha_hcaptcha_site_key,
        contact_captcha_hcaptcha_secret_key,
        contact_captcha_recaptcha_site_key,
        contact_captcha_recaptcha_secret_key,
        contact_captcha_error_message,
        contact_captcha_missing_token_message,
        contact_captcha_invalid_domain_message,
        contact_captcha_allowed_domain,
        audit_latency_good_max_ms,
        audit_latency_warn_max_ms
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20
      ) RETURNING *`,
      [
        payload.title,
        payload.about,
        payload.mission,
        payload.email,
        payload.instagramUrl,
        payload.youtubeUrl,
        payload.soundcloudUrl,
        payload.radioUrl,
        payload.contactCaptchaEnabled,
        payload.contactCaptchaActiveProvider,
        payload.contactCaptchaHcaptchaSiteKey,
        payload.contactCaptchaHcaptchaSecretKey,
        payload.contactCaptchaRecaptchaSiteKey,
        payload.contactCaptchaRecaptchaSecretKey,
        payload.contactCaptchaErrorMessage,
        payload.contactCaptchaMissingTokenMessage,
        payload.contactCaptchaInvalidDomainMessage,
        payload.contactCaptchaAllowedDomain,
        payload.auditLatencyGoodMaxMs,
        payload.auditLatencyWarnMaxMs
      ]
      );
    } catch (error) {
      if (!isMissingAuditLatencyColumnsError(error)) throw error;
      await queryable.query(
        `INSERT INTO settings (
          title,
          about,
          mission,
          email,
          instagram_url,
          youtube_url,
          soundcloud_url,
          radio_url,
          contact_captcha_enabled,
          contact_captcha_active_provider,
          contact_captcha_hcaptcha_site_key,
          contact_captcha_hcaptcha_secret_key,
          contact_captcha_recaptcha_site_key,
          contact_captcha_recaptcha_secret_key,
          contact_captcha_error_message,
          contact_captcha_missing_token_message,
          contact_captcha_invalid_domain_message,
          contact_captcha_allowed_domain
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
          payload.title,
          payload.about,
          payload.mission,
          payload.email,
          payload.instagramUrl,
          payload.youtubeUrl,
          payload.soundcloudUrl,
          payload.radioUrl,
          payload.contactCaptchaEnabled,
          payload.contactCaptchaActiveProvider,
          payload.contactCaptchaHcaptchaSiteKey,
          payload.contactCaptchaHcaptchaSecretKey,
          payload.contactCaptchaRecaptchaSiteKey,
          payload.contactCaptchaRecaptchaSecretKey,
          payload.contactCaptchaErrorMessage,
          payload.contactCaptchaMissingTokenMessage,
          payload.contactCaptchaInvalidDomainMessage,
          payload.contactCaptchaAllowedDomain
        ]
      );
    }
    return;
  }

  try {
    await queryable.query(
      `UPDATE settings SET
      title = $1,
      about = $2,
      mission = $3,
      email = $4,
      instagram_url = $5,
      youtube_url = $6,
      soundcloud_url = $7,
      radio_url = $8,
      contact_captcha_enabled = $9,
      contact_captcha_active_provider = $10,
      contact_captcha_hcaptcha_site_key = $11,
      contact_captcha_hcaptcha_secret_key = $12,
      contact_captcha_recaptcha_site_key = $13,
      contact_captcha_recaptcha_secret_key = $14,
      contact_captcha_error_message = $15,
      contact_captcha_missing_token_message = $16,
      contact_captcha_invalid_domain_message = $17,
      contact_captcha_allowed_domain = $18,
      audit_latency_good_max_ms = $19,
      audit_latency_warn_max_ms = $20,
      updated_at = NOW()
    WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
    RETURNING id`,
    [
      payload.title,
      payload.about,
      payload.mission,
      payload.email,
      payload.instagramUrl,
      payload.youtubeUrl,
      payload.soundcloudUrl,
      payload.radioUrl,
      payload.contactCaptchaEnabled,
      payload.contactCaptchaActiveProvider,
      payload.contactCaptchaHcaptchaSiteKey,
      payload.contactCaptchaHcaptchaSecretKey,
      payload.contactCaptchaRecaptchaSiteKey,
      payload.contactCaptchaRecaptchaSecretKey,
      payload.contactCaptchaErrorMessage,
      payload.contactCaptchaMissingTokenMessage,
      payload.contactCaptchaInvalidDomainMessage,
      payload.contactCaptchaAllowedDomain,
      payload.auditLatencyGoodMaxMs,
      payload.auditLatencyWarnMaxMs
    ]
    );
  } catch (error) {
    if (!isMissingAuditLatencyColumnsError(error)) throw error;
    await queryable.query(
      `UPDATE settings SET
        title = $1,
        about = $2,
        mission = $3,
        email = $4,
        instagram_url = $5,
        youtube_url = $6,
        soundcloud_url = $7,
        radio_url = $8,
        contact_captcha_enabled = $9,
        contact_captcha_active_provider = $10,
        contact_captcha_hcaptcha_site_key = $11,
        contact_captcha_hcaptcha_secret_key = $12,
        contact_captcha_recaptcha_site_key = $13,
        contact_captcha_recaptcha_secret_key = $14,
        contact_captcha_error_message = $15,
        contact_captcha_missing_token_message = $16,
        contact_captcha_invalid_domain_message = $17,
        contact_captcha_allowed_domain = $18,
        updated_at = NOW()
      WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
      RETURNING id`,
      [
        payload.title,
        payload.about,
        payload.mission,
        payload.email,
        payload.instagramUrl,
        payload.youtubeUrl,
        payload.soundcloudUrl,
        payload.radioUrl,
        payload.contactCaptchaEnabled,
        payload.contactCaptchaActiveProvider,
        payload.contactCaptchaHcaptchaSiteKey,
        payload.contactCaptchaHcaptchaSecretKey,
        payload.contactCaptchaRecaptchaSiteKey,
        payload.contactCaptchaRecaptchaSecretKey,
        payload.contactCaptchaErrorMessage,
        payload.contactCaptchaMissingTokenMessage,
        payload.contactCaptchaInvalidDomainMessage,
        payload.contactCaptchaAllowedDomain
      ]
    );
  }
}

async function upsertSectionSettings(queryable, sectionsPayload) {
  const normalizedSections = normalizeSectionSettingsForAdmin(sectionsPayload);
  const defaultsMap = getSectionDefaultsMap();

  for (const section of normalizedSections) {
    const fallback = defaultsMap[section.sectionKey] || section;

    const upsertResult = await queryable.query(
      `INSERT INTO section_settings (section_key, sort_order, is_enabled, default_title)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (section_key)
       DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         is_enabled = EXCLUDED.is_enabled,
         default_title = EXCLUDED.default_title,
         updated_at = NOW()
       RETURNING id`,
      [
        section.sectionKey,
        section.sortOrder,
        section.isEnabled,
        section.titleUk || fallback.titleUk
      ]
    );

    const sectionId = upsertResult.rows[0] && upsertResult.rows[0].id;
    if (!sectionId) continue;

    await queryable.query(
      `INSERT INTO section_settings_i18n (section_settings_id, language_code, title)
       VALUES ($1, 'uk', $2)
       ON CONFLICT (section_settings_id, language_code)
       DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()`,
      [sectionId, section.titleUk || fallback.titleUk]
    );

    await queryable.query(
      `INSERT INTO section_settings_i18n (section_settings_id, language_code, title)
       VALUES ($1, 'en', $2)
       ON CONFLICT (section_settings_id, language_code)
       DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()`,
      [sectionId, section.titleEn || fallback.titleEn]
    );
  }
}

const tableConfig = {
  releases: {
    table: "releases",
    columns: ["title", "artist", "genre", "release_type", "release_date", "year", "image", "link", "ticket_link"]
  },
  artists: {
    table: "artists",
    columns: ["name", "genre", "bio", "image", "soundcloud", "instagram"]
  },
  events: {
    table: "events",
    columns: ["title", "date", "time", "venue", "description", "image", "ticket_link"]
  },
  sponsors: {
    table: "sponsors",
    columns: ["name", "short_description", "logo", "link", "sort_order"]
  }
};

const i18nReadConfig = {
  releases: {
    table: "releases",
    i18nTable: "releases_i18n",
    i18nEntityId: "release_id",
    translatedFields: ["title", "artist", "genre"]
  },
  artists: {
    table: "artists",
    i18nTable: "artists_i18n",
    i18nEntityId: "artist_id",
    translatedFields: ["name", "genre", "bio"]
  },
  events: {
    table: "events",
    i18nTable: "events_i18n",
    i18nEntityId: "event_id",
    translatedFields: ["title", "venue", "description"]
  },
  sponsors: {
    table: "sponsors",
    i18nTable: "sponsors_i18n",
    i18nEntityId: "sponsor_id",
    translatedFields: ["name", "short_description"]
  }
};

function toCamelCase(value) {
  return String(value).replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function getTranslationValue(translation, dbField, fallbackRow) {
  const camelField = toCamelCase(dbField);
  const rawValue = translation?.[camelField] ?? translation?.[dbField];
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return String(fallbackRow?.[dbField] ?? "");
  }
  return String(rawValue);
}

async function upsertEntityTranslations(type, entityId, payload, fallbackRow) {
  const i18nConfig = i18nReadConfig[type];
  if (!i18nConfig) return;

  const i18nPayload = payload?.i18n;
  if (!i18nPayload || typeof i18nPayload !== "object") return;

  const entries = Object.entries(i18nPayload);
  if (entries.length === 0) return;

  for (const [rawLanguage, translation] of entries) {
    if (!translation || typeof translation !== "object") continue;

    const normalizedLanguage = String(rawLanguage || "").trim().toLowerCase();
    if (!config.supportedLanguages.includes(normalizedLanguage)) continue;

    const fields = i18nConfig.translatedFields;
    const values = fields.map((field) => getTranslationValue(translation, field, fallbackRow));

    const columns = [i18nConfig.i18nEntityId, "language_code", ...fields];
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const updates = fields.map((field) => `${field} = EXCLUDED.${field}`).join(", ");

    await pool.query(
      `INSERT INTO ${i18nConfig.i18nTable} (${columns.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT (${i18nConfig.i18nEntityId}, language_code)
       DO UPDATE SET ${updates}, updated_at = NOW()`,
      [entityId, normalizedLanguage, ...values]
    );
  }
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

function normalizeReleasePayload(payload) {
  const rawPayload = payload && typeof payload === "object" ? payload : {};
  const releaseDate = normalizeIsoDate(rawPayload.releaseDate || rawPayload.release_date) || `${deriveYearFromDateOrFallback("", rawPayload.year)}-01-01`;
  const year = deriveYearFromDateOrFallback(releaseDate, rawPayload.year);

  return {
    ...rawPayload,
    releaseDate,
    year,
    releaseType: rawPayload.releaseType || rawPayload.release_type || "single"
  };
}

function fromDbRow(type, row) {
  if (type === "releases") {
    const releaseDate = normalizeIsoDate(row.release_date) || `${deriveYearFromDateOrFallback("", row.year)}-01-01`;
    return {
      ...row,
      ticketLink: row.ticket_link,
      releaseType: row.release_type || "single",
      releaseDate
    };
  }
  if (type === "events") {
    return { ...row, ticketLink: row.ticket_link };
  }
  if (type === "sponsors") {
    return {
      ...row,
      shortDescription: row.short_description || "",
      sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0
    };
  }
  return row;
}

function toDbValue(key, value) {
  if (key === "ticketLink") return ["ticket_link", value || ""];
  if (key === "releaseType") return ["release_type", value || "single"];
  if (key === "releaseDate") return ["release_date", normalizeIsoDate(value)];
  if (key === "shortDescription") return ["short_description", value || ""];
  if (key === "sortOrder") return ["sort_order", Number.isFinite(Number(value)) ? Number(value) : 0];
  return [key, value];
}

export async function listByType(type, requestedLanguage = config.defaultLanguage) {
  const entityConfig = tableConfig[type];
  const i18nConfig = i18nReadConfig[type];
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const orderClause = type === "sponsors" ? "ORDER BY sort_order ASC, id ASC" : "ORDER BY id ASC";

  if (!i18nConfig) {
    const result = await pool.query(`SELECT * FROM ${entityConfig.table} ${orderClause}`);
    return result.rows.map((row) => fromDbRow(type, row));
  }

  const translatedSelect = i18nConfig.translatedFields
    .map((field) => `COALESCE(i18n_lang.${field}, i18n_default.${field}, base.${field}) AS ${field}`)
    .join(",\n      ");

  const result = await pool.query(
    `SELECT
      base.*,
      ${translatedSelect}
    FROM ${i18nConfig.table} AS base
    LEFT JOIN ${i18nConfig.i18nTable} AS i18n_lang
      ON i18n_lang.${i18nConfig.i18nEntityId} = base.id
      AND i18n_lang.language_code = $1
    LEFT JOIN ${i18nConfig.i18nTable} AS i18n_default
      ON i18n_default.${i18nConfig.i18nEntityId} = base.id
      AND i18n_default.language_code = $2
    ${orderClause}`,
    [language, defaultLanguage]
  );

  return result.rows.map((row) => fromDbRow(type, row));
}

export async function createByType(type, payload) {
  const entityConfig = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;
  const mapped = entityConfig.columns.map((column) => {
    const payloadKey = column === "ticket_link"
      ? "ticketLink"
      : (column === "release_type"
        ? "releaseType"
        : (column === "release_date"
          ? "releaseDate"
          : (column === "short_description"
            ? "shortDescription"
            : (column === "sort_order" ? "sortOrder" : column))));
    return normalizedPayload[payloadKey] ?? "";
  });

  const placeholders = mapped.map((_, index) => `$${index + 1}`).join(", ");
  const query = `INSERT INTO ${entityConfig.table} (${entityConfig.columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, mapped);
  const baseRow = result.rows[0];
  await upsertEntityTranslations(type, baseRow.id, normalizedPayload, baseRow);
  return fromDbRow(type, baseRow);
}

export async function updateByType(type, id, payload) {
  const entityConfig = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;
  const assignments = [];
  const values = [];

  Object.entries(normalizedPayload).forEach(([key, value]) => {
    if (key === "id" || key === "i18n") return;
    const [dbKey, dbValue] = toDbValue(key, value);
    if (!entityConfig.columns.includes(dbKey)) return;
    values.push(dbValue);
    assignments.push(`${dbKey} = $${values.length}`);
  });

  let row = null;

  if (assignments.length > 0) {
    values.push(id);
    const result = await pool.query(
      `UPDATE ${entityConfig.table} SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );
    row = result.rows[0] || null;
  } else {
    const existing = await pool.query(`SELECT * FROM ${entityConfig.table} WHERE id = $1`, [id]);
    row = existing.rows[0] || null;
  }

  if (!row) return null;

  await upsertEntityTranslations(type, id, normalizedPayload, row);
  return fromDbRow(type, row);
}

export async function deleteByType(type, id) {
  const config = tableConfig[type];
  await pool.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
}

const PUBLIC_SETTINGS_SELECT = `
  SELECT
    COALESCE(s_i18n_lang.title, s_i18n_default.title, s.title) AS title,
    COALESCE(s_i18n_lang.about, s_i18n_default.about, s.about) AS about,
    COALESCE(s_i18n_lang.mission, s_i18n_default.mission, s.mission) AS mission,
    email,
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    COALESCE(s_i18n_lang.contact_captcha_error_message, s_i18n_default.contact_captcha_error_message, s.contact_captcha_error_message) AS "contactCaptchaErrorMessage",
    COALESCE(s_i18n_lang.contact_captcha_missing_token_message, s_i18n_default.contact_captcha_missing_token_message, s.contact_captcha_missing_token_message) AS "contactCaptchaMissingTokenMessage",
    COALESCE(s_i18n_lang.contact_captcha_invalid_domain_message, s_i18n_default.contact_captcha_invalid_domain_message, s.contact_captcha_invalid_domain_message) AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings AS s
  LEFT JOIN settings_i18n AS s_i18n_lang
    ON s_i18n_lang.settings_id = s.id
    AND s_i18n_lang.language_code = $1
  LEFT JOIN settings_i18n AS s_i18n_default
    ON s_i18n_default.settings_id = s.id
    AND s_i18n_default.language_code = $2
  ORDER BY s.id ASC
  LIMIT 1
`;

const ADMIN_SETTINGS_SELECT = `
  SELECT
    title,
    about,
    mission,
    email,
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    contact_captcha_error_message AS "contactCaptchaErrorMessage",
    contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
    contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain",
    audit_latency_good_max_ms AS "auditLatencyGoodMaxMs",
    audit_latency_warn_max_ms AS "auditLatencyWarnMaxMs"
  FROM settings
  ORDER BY id ASC
  LIMIT 1
`;

const LEGACY_ADMIN_SETTINGS_SELECT = `
  SELECT
    title,
    about,
    mission,
    email,
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    contact_captcha_error_message AS "contactCaptchaErrorMessage",
    contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
    contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings
  ORDER BY id ASC
  LIMIT 1
`;

async function queryAdminSettings(queryable) {
  try {
    const result = await queryable.query(ADMIN_SETTINGS_SELECT);
    return withDefaultAuditLatencySettings(result.rows[0] || null);
  } catch (error) {
    if (!isMissingAuditLatencyColumnsError(error)) throw error;
    const result = await queryable.query(LEGACY_ADMIN_SETTINGS_SELECT);
    return withDefaultAuditLatencySettings(result.rows[0] || null);
  }
}

export async function getPublicSettings(requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const result = await pool.query(PUBLIC_SETTINGS_SELECT, [language, defaultLanguage]);
  return result.rows[0] || null;
}

export async function getAdminSectionSettings() {
  try {
    const result = await pool.query(
      `SELECT
        base.section_key AS "sectionKey",
        base.sort_order AS "sortOrder",
        base.is_enabled AS "isEnabled",
        base.default_title AS "defaultTitle",
        i18n_uk.title AS "titleUk",
        i18n_en.title AS "titleEn"
      FROM section_settings AS base
      LEFT JOIN section_settings_i18n AS i18n_uk
        ON i18n_uk.section_settings_id = base.id
       AND i18n_uk.language_code = 'uk'
      LEFT JOIN section_settings_i18n AS i18n_en
        ON i18n_en.section_settings_id = base.id
       AND i18n_en.language_code = 'en'
      ORDER BY base.sort_order ASC, base.id ASC`
    );

    return normalizeSectionSettingsForAdmin(result.rows);
  } catch (_error) {
    return normalizeSectionSettingsForAdmin([]);
  }
}

export async function getPublicSectionSettings(requestedLanguage = config.defaultLanguage) {
  const adminSettings = await getAdminSectionSettings();
  return normalizeSectionSettingsForPublic(adminSettings, requestedLanguage);
}

export async function saveSectionSettings(sectionsPayload) {
  const client = await pool.connect();

  await client.query("BEGIN");
  try {
    await upsertSectionSettings(client, sectionsPayload);

    await client.query("COMMIT");
    return await getAdminSectionSettings();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveSettingsBundle(payload) {
  const client = await pool.connect();

  await client.query("BEGIN");
  try {
    await upsertAdminSettings(client, payload.settings);
    await upsertSectionSettings(client, payload.sections);
    await client.query("COMMIT");

    return {
      settings: await getAdminSettings(),
      sections: await getAdminSectionSettings()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAdminSettings() {
  return await queryAdminSettings(pool);
}

export async function saveSettings(payload) {
  await upsertAdminSettings(pool, payload);
  return await getAdminSettings();
}

export async function createContactRequest(payload) {
  const result = await pool.query(
    "INSERT INTO contact_requests (name, email, subject, message, attachment_name, attachment_type, attachment_data, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'new') RETURNING *",
    [
      payload.name,
      payload.email,
      payload.subject,
      payload.message,
      payload.attachmentName || "",
      payload.attachmentType || "",
      payload.attachmentDataUrl || ""
    ]
  );
  return result.rows[0];
}

export async function listContactRequests() {
  const result = await pool.query(
    "SELECT id, name, email, subject, message, attachment_name AS \"attachmentName\", attachment_type AS \"attachmentType\", attachment_data AS \"attachmentDataUrl\", status, created_at FROM contact_requests ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function updateContactRequestStatus(id, status) {
  const result = await pool.query(
    "UPDATE contact_requests SET status = $1 WHERE id = $2 RETURNING id, name, email, subject, message, attachment_name AS \"attachmentName\", attachment_type AS \"attachmentType\", attachment_data AS \"attachmentDataUrl\", status, created_at",
    [status, id]
  );
  return result.rows[0] || null;
}

export async function writeAuditLog({ entityType, entityId, action, actor, details }) {
  await pool.query(
    "INSERT INTO audit_logs (entity_type, entity_id, action, actor, details) VALUES ($1, $2, $3, $4, $5::jsonb)",
    [entityType, entityId ?? null, action, actor || "system", JSON.stringify(details || {})]
  );
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
  const filters = [];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    const idx = values.length;
    filters.push(`(
      actor ILIKE $${idx}
      OR action ILIKE $${idx}
      OR entity_type ILIKE $${idx}
      OR CAST(entity_id AS TEXT) ILIKE $${idx}
    )`);
  }

  if (action) {
    values.push(action);
    filters.push(`action = $${values.length}`);
  }

  if (entity) {
    values.push(entity);
    filters.push(`entity_type = $${values.length}`);
  }

  if (from) {
    values.push(`${from}T00:00:00`);
    filters.push(`created_at >= $${values.length}::timestamptz`);
  }

  if (to) {
    values.push(`${to}T23:59:59.999`);
    filters.push(`created_at <= $${values.length}::timestamptz`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const offset = (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 100);

  values.push(Number(limit) || 100);
  const limitPlaceholder = `$${values.length}`;
  values.push(offset);
  const offsetPlaceholder = `$${values.length}`;

  const query = `
    SELECT id, entity_type, entity_id, action, actor, details, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const countQuery = `SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(query, values),
    pool.query(countQuery, values.slice(0, values.length - 2))
  ]);

  return {
    items: itemsResult.rows,
    total: countResult.rows[0]?.total || 0
  };
}

export async function listAuditFacets() {
  const [actionsResult, entitiesResult] = await Promise.all([
    pool.query(
      "SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL AND action <> '' ORDER BY action ASC"
    ),
    pool.query(
      "SELECT DISTINCT entity_type FROM audit_logs WHERE entity_type IS NOT NULL AND entity_type <> '' ORDER BY entity_type ASC"
    )
  ]);

  return {
    actions: actionsResult.rows.map((row) => row.action),
    entities: entitiesResult.rows.map((row) => row.entity_type)
  };
}
