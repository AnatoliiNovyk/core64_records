import { pool } from "./pool.js";

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

export async function listByType(type) {
  const config = tableConfig[type];
  const orderClause = type === "sponsors" ? "ORDER BY sort_order ASC, id ASC" : "ORDER BY id ASC";
  const result = await pool.query(`SELECT * FROM ${config.table} ${orderClause}`);
  return result.rows.map((row) => fromDbRow(type, row));
}

export async function createByType(type, payload) {
  const config = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;
  const mapped = config.columns.map((column) => {
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
  const query = `INSERT INTO ${config.table} (${config.columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, mapped);
  return fromDbRow(type, result.rows[0]);
}

export async function updateByType(type, id, payload) {
  const config = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;
  const assignments = [];
  const values = [];

  Object.entries(normalizedPayload).forEach(([key, value]) => {
    if (key === "id") return;
    const [dbKey, dbValue] = toDbValue(key, value);
    if (!config.columns.includes(dbKey)) return;
    values.push(dbValue);
    assignments.push(`${dbKey} = $${values.length}`);
  });

  values.push(id);
  const result = await pool.query(
    `UPDATE ${config.table} SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );

  return result.rows[0] ? fromDbRow(type, result.rows[0]) : null;
}

export async function deleteByType(type, id) {
  const config = tableConfig[type];
  await pool.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
}

const PUBLIC_SETTINGS_SELECT = `
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
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_error_message AS "contactCaptchaErrorMessage",
    contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
    contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings
  ORDER BY id ASC
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
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings
  ORDER BY id ASC
  LIMIT 1
`;

export async function getPublicSettings() {
  const result = await pool.query(PUBLIC_SETTINGS_SELECT);
  return result.rows[0] || null;
}

export async function getAdminSettings() {
  const result = await pool.query(ADMIN_SETTINGS_SELECT);
  return result.rows[0] || null;
}

export async function saveSettings(payload) {
  const existing = await getAdminSettings();
  if (!existing) {
    const insert = await pool.query(
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
    return await getAdminSettings();
  }

  const updated = await pool.query(
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
  const updatedId = updated.rows[0] && updated.rows[0].id;
  if (!updatedId) return null;
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
