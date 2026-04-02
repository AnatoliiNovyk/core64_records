#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const targetSslmode = String(process.env.DB_POOLER_SSLMODE || "require").trim() || "require";
const rawDatabaseUrl = String(process.env.DATABASE_URL_VALUE || "");
const outputRawUrl = process.argv.includes("--raw-url");
const strict = process.argv.includes("--strict");
const acceptedPoolerSslModes = new Set(["require", "verify-ca", "verify-full"]);

function done(payload, code = 0) {
  if (outputRawUrl) {
    process.stdout.write(String(payload.updatedDatabaseUrl || ""));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }

  if (code !== 0) process.exit(code);
}

export function setDatabaseUrlPoolerSslmode(raw, sslmode = "require") {
  const original = String(raw ?? "");
  const normalizedSslmode = String(sslmode || "require").trim().toLowerCase() || "require";

  if (!acceptedPoolerSslModes.has(normalizedSslmode)) {
    return {
      ok: false,
      changed: false,
      reason: "invalid_target_sslmode",
      targetSslmode: normalizedSslmode,
      allowedSslModes: Array.from(acceptedPoolerSslModes),
      updatedDatabaseUrl: ""
    };
  }

  if (!original) {
    return {
      ok: false,
      changed: false,
      reason: "empty",
      targetSslmode: normalizedSslmode,
      updatedDatabaseUrl: ""
    };
  }

  let url;
  try {
    url = new URL(original);
  } catch {
    return {
      ok: false,
      changed: false,
      reason: "invalid_url",
      targetSslmode: normalizedSslmode,
      updatedDatabaseUrl: ""
    };
  }

  const host = String(url.hostname || "").toLowerCase();
  const isPooler = host.includes(".pooler.") || host.endsWith(".pooler.supabase.com");
  if (!isPooler) {
    return {
      ok: true,
      changed: false,
      reason: "not_pooler_endpoint",
      targetSslmode: normalizedSslmode,
      updatedDatabaseUrl: url.toString()
    };
  }

  const currentSslmode = String(url.searchParams.get("sslmode") || "").trim().toLowerCase();
  if (currentSslmode === normalizedSslmode) {
    return {
      ok: true,
      changed: false,
      reason: "already_target_sslmode",
      targetSslmode: normalizedSslmode,
      updatedDatabaseUrl: url.toString()
    };
  }

  url.searchParams.set("sslmode", normalizedSslmode);
  return {
    ok: true,
    changed: true,
    reason: currentSslmode ? "replaced_sslmode" : "appended_sslmode",
    targetSslmode: normalizedSslmode,
    previousSslmode: currentSslmode || null,
    updatedDatabaseUrl: url.toString()
  };
}

const invokedAsScript = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedAsScript) {
  const result = setDatabaseUrlPoolerSslmode(rawDatabaseUrl, targetSslmode);
  done(result, strict && !result.ok ? 1 : 0);
}
