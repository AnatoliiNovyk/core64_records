#!/usr/bin/env node

import { evaluateDatabaseUrlPolicy } from "./check-database-url-policy.mjs";

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
const dbPolicy = evaluateDatabaseUrlPolicy(dbUrlRaw);
const dbInfo = {
  host: dbPolicy.snapshot?.host || null,
  port: dbPolicy.snapshot?.port || null,
  database: dbPolicy.snapshot?.database || null,
  sslmode: dbPolicy.snapshot?.sslmode || null
};

if (!serviceInfo.ok) {
  done(
    {
      cloudRun: {
        parse: serviceInfo.ok ? "ok" : "failed",
        error: serviceInfo.ok ? null : serviceInfo.error,
        vpcAccessConnector: serviceInfo.vpcAccessConnector || null,
        vpcAccessEgress: serviceInfo.vpcAccessEgress || null
      },
      database: {
        parse: dbPolicy.valid ? "ok" : "failed",
        error: dbPolicy.valid ? null : dbPolicy.reason,
        host: dbInfo.host,
        port: dbInfo.port,
        database: dbInfo.database,
        sslmode: dbInfo.sslmode
      },
      dbHostKind: dbInfo.host ? classifyDbHost(dbInfo.host) : "unknown",
      routeVerdict: "unknown",
      reason: "insufficient_inputs",
      hint: "Could not parse Cloud Run service JSON or DATABASE_URL metadata."
    },
    strict ? 1 : 0
  );
}

if (!dbPolicy.valid) {
  const dbHostKind = dbInfo.host ? classifyDbHost(dbInfo.host) : "unknown";
  const payload = {
    cloudRun: {
      parse: "ok",
      vpcAccessConnector: serviceInfo.vpcAccessConnector,
      vpcAccessEgress: serviceInfo.vpcAccessEgress
    },
    database: {
      parse: "failed",
      error: dbPolicy.reason,
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      sslmode: dbInfo.sslmode
    },
    dbHostKind,
    routeVerdict: "incompatible",
    reason: dbPolicy.reason,
    hint: dbPolicy.hint
  };
  done(payload, strict ? 1 : 0);
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
