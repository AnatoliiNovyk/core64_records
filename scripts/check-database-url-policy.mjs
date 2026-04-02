#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const strict = process.argv.includes("--strict");
const value = String(process.env.DATABASE_URL_VALUE || "");

function done(payload, code = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (code !== 0) process.exit(code);
}

export function evaluateDatabaseUrlPolicy(raw) {
  const original = String(raw ?? "");

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
  const isPooler = host.includes(".pooler.") || host.endsWith(".pooler.supabase.com");
  const acceptedPoolerSslModes = new Set(["require", "verify-ca", "verify-full"]);

  if (isPooler && !acceptedPoolerSslModes.has(sslmode)) {
    const append = (url.search || "").length > 0 ? "&sslmode=require" : "?sslmode=require";
    return {
      valid: false,
      reason: "unsupported_sslmode_for_pooler_endpoint",
      hint: `DATABASE_URL points to a pooler endpoint but sslmode is not in allowed modes (require, verify-ca, verify-full). Append '${append}' to the connection string.`,
      remediation: {
        action: "append_sslmode_require",
        append,
        allowedSslModes: Array.from(acceptedPoolerSslModes)
      },
      snapshot: {
        protocol: url.protocol.replace(":", "") || null,
        host: url.hostname || null,
        port: url.port || null,
        database: (url.pathname || "").replace(/^\//, "") || null,
        sslmode: sslmode || null
      }
    };
  }

  return {
    valid: true,
    reason: "ok",
    hint: "DATABASE_URL policy check passed.",
    snapshot: {
      protocol: url.protocol.replace(":", "") || null,
      host: url.hostname || null,
      port: url.port || null,
      database: (url.pathname || "").replace(/^\//, "") || null,
      sslmode: sslmode || null
    }
  };
}

const invokedAsScript = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedAsScript) {
  const result = evaluateDatabaseUrlPolicy(value);
  done(result, strict && !result.valid ? 1 : 0);
}
