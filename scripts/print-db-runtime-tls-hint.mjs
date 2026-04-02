#!/usr/bin/env node

const strict = process.argv.includes("--strict");
const value = String(process.env.DATABASE_URL_VALUE || "").trim();

const toBoolean = (raw, fallback) => {
  if (raw === undefined) return fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const dbSsl = toBoolean(process.env.DB_SSL, true);
const dbSslRejectUnauthorized = toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);
const dbSslAllowSelfSigned = toBoolean(process.env.DB_SSL_ALLOW_SELF_SIGNED, false);

function done(payload, code = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (code !== 0) {
    process.exit(code);
  }
}

function fail(reason) {
  done(
    {
      databaseUrlPresent: Boolean(value),
      databaseUrlParse: "failed",
      reason,
      runtimeTls: {
        dbSsl,
        dbSslRejectUnauthorized,
        dbSslAllowSelfSigned,
        wouldEnableLibpqCompat: false,
        effectiveLibpqCompat: false,
        effectiveSslmodeBehavior: "unknown",
        hint: "DATABASE_URL could not be parsed for runtime TLS hint."
      }
    },
    strict ? 1 : 0
  );
}

if (!value) {
  fail("empty_database_url");
}

let url;
try {
  url = new URL(value);
} catch {
  fail("invalid_database_url");
}

const host = String(url.hostname || "").toLowerCase();
const sslmode = String(url.searchParams.get("sslmode") || "").toLowerCase() || null;
const isPoolerEndpoint = host.includes(".pooler.") || host.endsWith(".pooler.supabase.com");
const uselibpqcompatExplicit = String(url.searchParams.get("uselibpqcompat") || "").toLowerCase() === "true";

const wouldEnableLibpqCompat =
  dbSsl && !dbSslRejectUnauthorized && dbSslAllowSelfSigned && (sslmode === "require" || sslmode === "verify-ca") && !uselibpqcompatExplicit;

const effectiveLibpqCompat = uselibpqcompatExplicit || wouldEnableLibpqCompat;

let effectiveSslmodeBehavior = "none";
if (sslmode === "require" || sslmode === "verify-ca") {
  effectiveSslmodeBehavior = effectiveLibpqCompat ? `libpq-${sslmode}` : "driver-aliases-verify-full";
} else if (sslmode === "verify-full") {
  effectiveSslmodeBehavior = "verify-full";
} else if (sslmode) {
  effectiveSslmodeBehavior = sslmode;
}

let hint = "Runtime TLS settings look consistent.";
if (!dbSsl) {
  hint = "DB_SSL is false. TLS is disabled by runtime config.";
} else if (wouldEnableLibpqCompat) {
  hint = "Runtime will append libpq compatibility semantics for sslmode require/verify-ca due to self-signed allowlist.";
} else if ((sslmode === "require" || sslmode === "verify-ca") && !effectiveLibpqCompat) {
  hint = "sslmode require/verify-ca may be treated as verify-full by current pg-connection-string behavior unless uselibpqcompat=true is applied.";
}

done({
  databaseUrlPresent: true,
  databaseUrlParse: "ok",
  snapshot: {
    host: url.hostname || null,
    port: url.port || null,
    database: (url.pathname || "").replace(/^\//, "") || null,
    sslmode,
    isPoolerEndpoint,
    uselibpqcompatExplicit
  },
  runtimeTls: {
    dbSsl,
    dbSslRejectUnauthorized,
    dbSslAllowSelfSigned,
    wouldEnableLibpqCompat,
    effectiveLibpqCompat,
    effectiveSslmodeBehavior,
    hint
  }
});
