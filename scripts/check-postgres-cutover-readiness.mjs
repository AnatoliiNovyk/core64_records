#!/usr/bin/env node

import dns from "node:dns/promises";
import net from "node:net";
import { evaluateDatabaseUrlPolicy } from "./check-database-url-policy.mjs";

const strict = process.argv.includes("--strict");
const timeoutArg = process.argv.find((arg) => arg.startsWith("--timeout-ms="));

function toPositiveTimeout(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  return rounded >= 250 ? rounded : fallback;
}

const timeoutMs = toPositiveTimeout(timeoutArg ? timeoutArg.split("=")[1] : undefined, 5000);
const databaseUrlValue = String(process.env.DATABASE_URL_VALUE || process.env.DATABASE_URL || "").trim();

function done(payload, code = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (code !== 0) {
    process.exit(code);
  }
}

function toSnapshot(rawUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const resolvedPort = Number(url.port || 5432);
    if (!Number.isInteger(resolvedPort) || resolvedPort <= 0 || resolvedPort > 65535) {
      return null;
    }

    return {
      protocol: url.protocol.replace(":", "") || null,
      host: url.hostname || null,
      port: String(url.port || "") || null,
      resolvedPort,
      database: (url.pathname || "").replace(/^\//, "") || null,
      sslmode: url.searchParams.get("sslmode") || null
    };
  } catch {
    return null;
  }
}

function withTimeout(promise, ms, timeoutErrorCode) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: false,
          errorCode: timeoutErrorCode,
          errorMessage: `Operation timed out after ${ms}ms`
        });
      }, ms);
    })
  ]);
}

async function runDnsProbe(host, probeTimeoutMs) {
  const startedAt = Date.now();
  try {
    const lookupResult = await withTimeout(
      dns.lookup(host, { all: true }),
      probeTimeoutMs,
      "DNS_TIMEOUT"
    );

    if (lookupResult && lookupResult.ok === false) {
      return {
        ok: false,
        durationMs: Date.now() - startedAt,
        errorCode: lookupResult.errorCode,
        errorMessage: lookupResult.errorMessage,
        addresses: []
      };
    }

    const addresses = Array.isArray(lookupResult)
      ? lookupResult.map((entry) => ({
          address: String(entry?.address || ""),
          family: Number(entry?.family || 0)
        }))
      : [];

    return {
      ok: addresses.length > 0,
      durationMs: Date.now() - startedAt,
      addresses,
      errorCode: addresses.length > 0 ? null : "DNS_EMPTY_RESULT",
      errorMessage: addresses.length > 0 ? null : "DNS lookup returned no addresses"
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      addresses: [],
      errorCode: String(error?.code || "DNS_ERROR"),
      errorMessage: String(error?.message || "DNS lookup failed")
    };
  }
}

async function runTcpProbe(host, port, probeTimeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (payload) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        ...payload,
        durationMs: Date.now() - startedAt
      });
    };

    socket.setTimeout(probeTimeoutMs);

    socket.once("connect", () => {
      finalize({
        ok: true,
        errorCode: null,
        errorMessage: null
      });
    });

    socket.once("timeout", () => {
      finalize({
        ok: false,
        errorCode: "TCP_TIMEOUT",
        errorMessage: `TCP connection timed out after ${probeTimeoutMs}ms`
      });
    });

    socket.once("error", (error) => {
      finalize({
        ok: false,
        errorCode: String(error?.code || "TCP_ERROR"),
        errorMessage: String(error?.message || "TCP connection failed")
      });
    });

    socket.connect(port, host);
  });
}

function buildHint({ policy, target, dnsProbe, tcpProbe }) {
  if (!policy.valid) {
    return `DATABASE_URL policy failed: ${policy.reason}. ${policy.hint}`;
  }

  if (!target) {
    return "DATABASE_URL parse failed. Verify URL syntax and URL-encoded credentials.";
  }

  if (!dnsProbe.ok) {
    if (dnsProbe.errorCode === "DNS_TIMEOUT") {
      return "DNS lookup timed out. Verify host name and DNS reachability from the current environment.";
    }
    return "DNS lookup failed. Verify DATABASE_URL host and network routing before cutover.";
  }

  if (!tcpProbe.ok) {
    if (tcpProbe.errorCode === "ECONNREFUSED") {
      return "TCP connection was refused. Verify DB host/port and firewall rules.";
    }
    if (tcpProbe.errorCode === "ETIMEDOUT" || tcpProbe.errorCode === "TCP_TIMEOUT") {
      return "TCP connection timed out. Verify network path, Cloud Run egress routing, and target DB availability.";
    }
    return "TCP preflight failed. Verify host, port, SSL/network policies, and access controls.";
  }

  return "Postgres cutover preflight passed: URL policy, DNS, and TCP checks are healthy.";
}

async function main() {
  const policy = evaluateDatabaseUrlPolicy(databaseUrlValue);
  const target = toSnapshot(databaseUrlValue);

  const checks = {
    dns: {
      ok: false,
      skipped: true,
      durationMs: null,
      addresses: [],
      errorCode: null,
      errorMessage: null
    },
    tcp: {
      ok: false,
      skipped: true,
      durationMs: null,
      errorCode: null,
      errorMessage: null
    }
  };

  if (target?.host) {
    const dnsProbe = await runDnsProbe(target.host, timeoutMs);
    checks.dns = {
      ok: !!dnsProbe.ok,
      skipped: false,
      durationMs: dnsProbe.durationMs,
      addresses: dnsProbe.addresses,
      errorCode: dnsProbe.errorCode,
      errorMessage: dnsProbe.errorMessage
    };

    if (dnsProbe.ok) {
      const tcpProbe = await runTcpProbe(target.host, target.resolvedPort, timeoutMs);
      checks.tcp = {
        ok: !!tcpProbe.ok,
        skipped: false,
        durationMs: tcpProbe.durationMs,
        errorCode: tcpProbe.errorCode,
        errorMessage: tcpProbe.errorMessage
      };
    }
  }

  const preflightPassed = policy.valid && checks.dns.ok && checks.tcp.ok;
  const status = !policy.valid || !target
    ? "failed"
    : preflightPassed
      ? "ok"
      : "degraded";

  const payload = {
    status,
    preflightPassed,
    strict,
    timeoutMs,
    policy,
    target: target
      ? {
          protocol: target.protocol,
          host: target.host,
          port: target.port,
          resolvedPort: target.resolvedPort,
          database: target.database,
          sslmode: target.sslmode
        }
      : null,
    checks,
    hint: buildHint({
      policy,
      target,
      dnsProbe: checks.dns,
      tcpProbe: checks.tcp
    })
  };

  const exitCode = strict && !preflightPassed ? 1 : 0;
  done(payload, exitCode);
}

main().catch((error) => {
  done(
    {
      status: "failed",
      preflightPassed: false,
      strict,
      timeoutMs,
      hint: "Unexpected preflight runtime failure.",
      error: {
        code: String(error?.code || "UNEXPECTED_ERROR"),
        message: String(error?.message || error)
      }
    },
    1
  );
});
