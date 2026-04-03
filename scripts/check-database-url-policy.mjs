#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const strict = process.argv.includes("--strict");
const emitRemediationCommand = process.argv.includes("--emit-remediation-command");
const value = String(process.env.DATABASE_URL_VALUE || "");

function done(payload, code = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (code !== 0) process.exit(code);
}

function printPoolerSslmodeRemediation(payload) {
  if (!payload || payload.valid) return;
  if (payload.reason !== "unsupported_sslmode_for_pooler_endpoint") return;

  const targetSslmode = String(payload.remediation?.targetSslmode || "require");

  const projectId = process.env.GCP_PROJECT_ID || "<gcp-project-id>";
  const secretName = process.env.DATABASE_URL_SECRET_NAME || "DATABASE_URL";
  const currentUrlVar = "${CURRENT_DATABASE_URL}";

  console.error("Remediation command (safe; does not print secret value):");
  console.error(`CURRENT_DATABASE_URL=\"$(gcloud secrets versions access latest --project \"${projectId}\" --secret \"${secretName}\")\"`);
  console.error(`UPDATED_DATABASE_URL=\"$(DATABASE_URL_VALUE=\"${currentUrlVar}\" DB_POOLER_SSLMODE=\"${targetSslmode}\" node scripts/set-database-url-pooler-sslmode.mjs --raw-url --strict)\"`);
  console.error(`printf '%s' \"${"${UPDATED_DATABASE_URL}"}\" | gcloud secrets versions add \"${secretName}\" --project \"${projectId}\" --data-file=-`);
}

export function evaluateDatabaseUrlPolicy(raw) {
  const original = String(raw ?? "");

  const buildSnapshot = (url, sslmodeValue) => ({
    protocol: url.protocol.replace(":", "") || null,
    host: url.hostname || null,
    port: url.port || null,
    database: (url.pathname || "").replace(/^\//, "") || null,
    sslmode: sslmodeValue || null
  });

  if (!original) {
    return {
      valid: false,
      reason: "empty",
      hint: "DATABASE_URL secret is empty.",
      snapshot: { protocol: null, host: null, port: null, database: null, sslmode: null }
    };
  }

  if (/^["'].*["']$/.test(original)) {
    return {
      valid: false,
      reason: "wrapped_in_quotes",
      hint: "DATABASE_URL must not be wrapped in quotes.",
      snapshot: { protocol: null, host: null, port: null, database: null, sslmode: null }
    };
  }

  if (/\s/.test(original)) {
    return {
      valid: false,
      reason: "contains_whitespace",
      hint: "DATABASE_URL must not contain whitespace characters.",
      snapshot: { protocol: null, host: null, port: null, database: null, sslmode: null }
    };
  }

  if (!original.startsWith("postgres://") && !original.startsWith("postgresql://")) {
    return {
      valid: false,
      reason: "invalid_protocol",
      hint: "DATABASE_URL must start with postgres:// or postgresql://.",
      snapshot: { protocol: null, host: null, port: null, database: null, sslmode: null }
    };
  }

  let url;
  try {
    url = new URL(original);
  } catch {
    return {
      valid: false,
      reason: "invalid_url",
      hint: "DATABASE_URL is not a valid URL.",
      snapshot: { protocol: null, host: null, port: null, database: null, sslmode: null }
    };
  }

  const host = (url.hostname || "").toLowerCase();
  const sslmode = (url.searchParams.get("sslmode") || "").toLowerCase();
  const hasSslmodeParam = url.searchParams.has("sslmode");

  if (!host) {
    return {
      valid: false,
      reason: "missing_database_host",
      hint: "DATABASE_URL must include a database host.",
      snapshot: buildSnapshot(url, sslmode)
    };
  }

  const database = (url.pathname || "").replace(/^\//, "").trim();
  if (!database) {
    return {
      valid: false,
      reason: "missing_database_name",
      hint: "DATABASE_URL must include a database name path (for example /postgres).",
      snapshot: buildSnapshot(url, sslmode)
    };
  }

  const isPooler = host.includes(".pooler.") || host.endsWith(".pooler.supabase.com");
  const acceptedPoolerSslModes = new Set(["require", "verify-ca", "verify-full"]);

  if (isPooler && !acceptedPoolerSslModes.has(sslmode)) {
    const append = (url.search || "").length > 0 ? "&sslmode=require" : "?sslmode=require";
    const operation = hasSslmodeParam ? "replace" : "append";
    return {
      valid: false,
      reason: "unsupported_sslmode_for_pooler_endpoint",
      hint: `DATABASE_URL points to a pooler endpoint but sslmode is not in allowed modes (require, verify-ca, verify-full). ${operation === "replace" ? "Replace the existing sslmode with 'require'." : `Append '${append}' to the connection string.`}`,
      remediation: {
        action: "set_allowed_pooler_sslmode",
        legacyAction: "append_sslmode_require",
        operation,
        targetSslmode: "require",
        append,
        allowedSslModes: Array.from(acceptedPoolerSslModes)
      },
      snapshot: buildSnapshot(url, sslmode)
    };
  }

  return {
    valid: true,
    reason: "ok",
    hint: "DATABASE_URL policy check passed.",
    snapshot: buildSnapshot(url, sslmode)
  };
}

const invokedAsScript = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedAsScript) {
  const result = evaluateDatabaseUrlPolicy(value);
  if (emitRemediationCommand && strict && !result.valid) {
    printPoolerSslmodeRemediation(result);
  }
  done(result, strict && !result.valid ? 1 : 0);
}
