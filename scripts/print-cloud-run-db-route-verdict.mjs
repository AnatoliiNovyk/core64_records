#!/usr/bin/env node

const strict = process.argv.includes("--strict");
const serviceRaw = String(process.env.CLOUD_RUN_SERVICE_JSON || "").trim();
const dbUrlRaw = String(process.env.DATABASE_URL_VALUE || "").trim();

function done(payload, exitCode = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function parseService(raw) {
  if (!raw) {
    return { ok: false, error: "missing_service_json" };
  }

  try {
    const service = JSON.parse(raw);
    const annotations = service?.spec?.template?.metadata?.annotations || {};
    const vpcAccessConnector = typeof annotations["run.googleapis.com/vpc-access-connector"] === "string"
      ? annotations["run.googleapis.com/vpc-access-connector"]
      : null;
    const vpcAccessEgress = typeof annotations["run.googleapis.com/vpc-access-egress"] === "string"
      ? annotations["run.googleapis.com/vpc-access-egress"]
      : null;

    return {
      ok: true,
      vpcAccessConnector,
      vpcAccessEgress
    };
  } catch {
    return { ok: false, error: "invalid_service_json" };
  }
}

function parseDb(raw) {
  if (!raw) {
    return { ok: false, error: "missing_database_url" };
  }

  try {
    const url = new URL(raw);
    const database = (url.pathname || "").replace(/^\//, "") || null;
    const sslmode = url.searchParams.get("sslmode");
    return {
      ok: true,
      host: url.hostname || null,
      port: url.port || null,
      database,
      sslmode: sslmode || null
    };
  } catch {
    return { ok: false, error: "invalid_database_url" };
  }
}

function isIpv4(host) {
  if (!host) return false;
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function classifyDbHost(host) {
  if (!host) return "unknown";

  const normalized = host.toLowerCase();

  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") {
    return "private-ip";
  }

  if (isIpv4(normalized)) {
    const [a, b] = normalized.split(".").map(Number);
    if (a === 10) return "private-ip";
    if (a === 172 && b >= 16 && b <= 31) return "private-ip";
    if (a === 192 && b === 168) return "private-ip";
    if (a === 127) return "private-ip";
    if (a === 169 && b === 254) return "private-ip";
    if (a === 100 && b >= 64 && b <= 127) return "private-ip";
    return "public-ip";
  }

  if (normalized.endsWith(".internal") || normalized.endsWith(".local")) {
    return "private-hostname";
  }

  return "public-hostname";
}

function evaluateRoute(serviceInfo, dbInfo, dbHostKind) {
  const hasConnector = Boolean(serviceInfo.vpcAccessConnector);
  const egress = serviceInfo.vpcAccessEgress;
  const host = String(dbInfo.host || "").toLowerCase();
  const sslmode = String(dbInfo.sslmode || "").toLowerCase();
  const isSupabasePooler = host.endsWith(".pooler.supabase.com") || host.includes(".pooler.");

  // Supabase pooler endpoints are expected to use TLS explicitly for predictable behavior.
  if (isSupabasePooler && sslmode !== "require") {
    return {
      verdict: "incompatible",
      reason: "missing_sslmode_require_for_pooler_endpoint",
      hint: "DATABASE_URL points to a pooler endpoint but sslmode is not 'require'. Add ?sslmode=require to the connection string."
    };
  }

  if (!hasConnector && dbHostKind === "private-ip") {
    return {
      verdict: "incompatible",
      reason: "missing_vpc_connector_for_private_db_ip",
      hint: "Cloud Run has no VPC connector, but DATABASE_URL host is private IP. Configure connector and egress routing."
    };
  }

  if (hasConnector && egress === "private-ranges-only" && dbHostKind === "public-ip") {
    return {
      verdict: "incompatible",
      reason: "private_ranges_only_with_public_db_ip",
      hint: "Cloud Run egress is private-ranges-only, but DATABASE_URL host is public IP. Use all-traffic or move DB endpoint to private range."
    };
  }

  if (hasConnector && egress === "private-ranges-only" && dbHostKind === "public-hostname") {
    return {
      verdict: "unknown",
      reason: "hostname_resolution_unknown_under_private_ranges_only",
      hint: "DB host is a public-looking hostname while egress is private-ranges-only. Confirm DNS resolves to private range from Cloud Run."
    };
  }

  return {
    verdict: "compatible",
    reason: "no_obvious_route_mismatch_detected",
    hint: "No high-confidence connector/egress mismatch detected from static metadata."
  };
}

const serviceInfo = parseService(serviceRaw);
const dbInfo = parseDb(dbUrlRaw);

if (!serviceInfo.ok || !dbInfo.ok) {
  done(
    {
      cloudRun: {
        parse: serviceInfo.ok ? "ok" : "failed",
        error: serviceInfo.ok ? null : serviceInfo.error,
        vpcAccessConnector: serviceInfo.vpcAccessConnector || null,
        vpcAccessEgress: serviceInfo.vpcAccessEgress || null
      },
      database: {
        parse: dbInfo.ok ? "ok" : "failed",
        error: dbInfo.ok ? null : dbInfo.error,
        host: dbInfo.host || null,
        port: dbInfo.port || null,
        database: dbInfo.database || null,
        sslmode: dbInfo.sslmode || null
      },
      dbHostKind: dbInfo.ok ? classifyDbHost(dbInfo.host) : "unknown",
      routeVerdict: "unknown",
      reason: "insufficient_inputs",
      hint: "Could not parse Cloud Run service JSON or DATABASE_URL metadata."
    },
    strict ? 1 : 0
  );
}

const dbHostKind = classifyDbHost(dbInfo.host);
const route = evaluateRoute(serviceInfo, dbInfo, dbHostKind);

const shouldFail = strict && route.verdict === "incompatible";

done(
  {
    cloudRun: {
      parse: "ok",
      vpcAccessConnector: serviceInfo.vpcAccessConnector,
      vpcAccessEgress: serviceInfo.vpcAccessEgress
    },
    database: {
      parse: "ok",
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      sslmode: dbInfo.sslmode
    },
    dbHostKind,
    routeVerdict: route.verdict,
    reason: route.reason,
    hint: route.hint
  },
  shouldFail ? 1 : 0
);
