import { pool } from "./pool.js";

const tableConfig = {
  releases: {
    table: "releases",
    columns: ["title", "artist", "genre", "year", "image", "link", "ticket_link"]
  },
  artists: {
    table: "artists",
    columns: ["name", "genre", "bio", "image", "soundcloud", "instagram"]
  },
  events: {
    table: "events",
    columns: ["title", "date", "time", "venue", "description", "image", "ticket_link"]
  }
};

function fromDbRow(type, row) {
  if (type === "releases") {
    return { ...row, ticketLink: row.ticket_link };
  }
  if (type === "events") {
    return { ...row, ticketLink: row.ticket_link };
  }
  return row;
}

function toDbValue(key, value) {
  if (key === "ticketLink") return ["ticket_link", value || ""];
  return [key, value];
}

export async function listByType(type) {
  const config = tableConfig[type];
  const result = await pool.query(`SELECT * FROM ${config.table} ORDER BY id ASC`);
  return result.rows.map((row) => fromDbRow(type, row));
}

export async function createByType(type, payload) {
  const config = tableConfig[type];
  const mapped = config.columns.map((column) => {
    const payloadKey = column === "ticket_link" ? "ticketLink" : column;
    return payload[payloadKey] || "";
  });

  const placeholders = mapped.map((_, index) => `$${index + 1}`).join(", ");
  const query = `INSERT INTO ${config.table} (${config.columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, mapped);
  return fromDbRow(type, result.rows[0]);
}

export async function updateByType(type, id, payload) {
  const config = tableConfig[type];
  const assignments = [];
  const values = [];

  Object.entries(payload).forEach(([key, value]) => {
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

export async function getSettings() {
  const result = await pool.query("SELECT title, about, mission, email FROM settings LIMIT 1");
  return result.rows[0] || null;
}

export async function saveSettings(payload) {
  const existing = await getSettings();
  if (!existing) {
    const insert = await pool.query(
      "INSERT INTO settings (title, about, mission, email) VALUES ($1, $2, $3, $4) RETURNING title, about, mission, email",
      [payload.title, payload.about, payload.mission, payload.email]
    );
    return insert.rows[0];
  }

  const updated = await pool.query(
    "UPDATE settings SET title = $1, about = $2, mission = $3, email = $4, updated_at = NOW() WHERE id = (SELECT id FROM settings LIMIT 1) RETURNING title, about, mission, email",
    [payload.title, payload.about, payload.mission, payload.email]
  );
  return updated.rows[0];
}

export async function createContactRequest(payload) {
  const result = await pool.query(
    "INSERT INTO contact_requests (name, email, subject, message, status) VALUES ($1, $2, $3, $4, 'new') RETURNING *",
    [payload.name, payload.email, payload.subject, payload.message]
  );
  return result.rows[0];
}

export async function listContactRequests() {
  const result = await pool.query(
    "SELECT id, name, email, subject, message, status, created_at FROM contact_requests ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function updateContactRequestStatus(id, status) {
  const result = await pool.query(
    "UPDATE contact_requests SET status = $1 WHERE id = $2 RETURNING id, name, email, subject, message, status, created_at",
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
