#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configuredBaseUrl = String(process.env.CORE64_API_BASE || "http://localhost:3000/api").trim().replace(/\/+$/, "");
let baseUrl = configuredBaseUrl;
const timeoutCandidate = process.env.CORE64_CONTRACT_TIMEOUT_MS || process.env.CORE64_SMOKE_TIMEOUT_MS;
const requestTimeoutMs = (() => {
  const parsed = Number(timeoutCandidate);
  if (Number.isFinite(parsed) && parsed >= 1000) {
    return parsed;
  }
  return 15000;
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readAdminPasswordFromBackendEnv() {
  try {
    const envPath = path.resolve(__dirname, "../backend/.env");
    if (!fs.existsSync(envPath)) return "";

    const raw = fs.readFileSync(envPath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || match[1] !== "ADMIN_PASSWORD") continue;

      const rawValue = String(match[2] || "").trim();
      if (!rawValue) return "";

      const isDoubleQuoted = rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2;
      const isSingleQuoted = rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2;
      if (isDoubleQuoted || isSingleQuoted) {
        return rawValue.slice(1, -1);
      }

      return rawValue.split("#")[0].trim();
    }
  } catch (_error) {
    return "";
  }

  return "";
}

function buildLocalhostFallbackBaseUrl(urlValue) {
  try {
    const parsed = new URL(urlValue);
    if (parsed.hostname.toLowerCase() !== "localhost") {
      return "";
    }
    parsed.hostname = "127.0.0.1";
    return parsed.toString().replace(/\/+$/, "");
  } catch (_error) {
    return "";
  }
}

function isFetchFailedError(error) {
  return /fetch failed/i.test(String(error?.message || ""));
}

function withTimeout(signal, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("request timeout")), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  return {
    signal: controller.signal,
    cancel() {
      clearTimeout(timeoutId);
    }
  };
}

async function requestJson(routePath, options = {}) {
  const timeout = withTimeout(options.signal, requestTimeoutMs);
  try {
    const response = await fetch(`${baseUrl}${routePath}`, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
      signal: timeout.signal
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_error) {
      json = null;
    }

    return { response, json, text };
  } finally {
    timeout.cancel();
  }
}

async function resolveReachableBaseUrl(preferredBaseUrl) {
  const fallbackBaseUrl = buildLocalhostFallbackBaseUrl(preferredBaseUrl);
  const candidates = [preferredBaseUrl];
  if (fallbackBaseUrl && fallbackBaseUrl !== preferredBaseUrl) {
    candidates.push(fallbackBaseUrl);
  }

  let lastError = null;
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const timeout = withTimeout(undefined, requestTimeoutMs);
    try {
      const health = await fetch(`${candidate}/health`, { signal: timeout.signal });
      if (!health.ok) {
        throw new Error(`health probe failed with ${health.status}`);
      }

      if (index > 0) {
        console.warn(`API error contract verifier preflight switched API base to ${candidate}.`);
      }
      return candidate;
    } catch (error) {
      lastError = error;
      const hasNextCandidate = index + 1 < candidates.length;
      if (hasNextCandidate && isFetchFailedError(error)) {
        console.warn(`API error contract verifier preflight failed for ${candidate} (${error.message}). Retrying with ${candidates[index + 1]} ...`);
        continue;
      }
      throw new Error(`API preflight failed for ${candidate}: ${error.message}`);
    } finally {
      timeout.cancel();
    }
  }

  throw new Error(`API preflight failed: ${lastError?.message || "unknown error"}`);
}

function ensureOk(result, label) {
  if (result.response.ok) return;
  const details = result.json ? JSON.stringify(result.json) : result.text;
  throw new Error(`${label} failed with ${result.response.status}: ${details}`);
}

function asErrorPayload(value) {
  return value && typeof value === "object" ? value : {};
}

function normalizeFieldErrors(payload, key) {
  const candidate = payload?.details?.fieldErrors?.[key];
  return Array.isArray(candidate) ? candidate : [];
}

function evaluateShape({ result, expectedStatus, expectedCode, expectedError }) {
  const payload = asErrorPayload(result.json);
  const statusValue = Number(payload.status);
  const codeValue = String(payload.code || "").trim();
  const errorValue = String(payload.error || "").trim();

  return {
    status: result.response.status,
    payloadStatus: Number.isFinite(statusValue) ? statusValue : null,
    code: codeValue || null,
    error: errorValue || null,
    ok:
      result.response.status === expectedStatus
      && statusValue === expectedStatus
      && codeValue === expectedCode
      && errorValue === expectedError,
    payload
  };
}

async function run() {
  baseUrl = await resolveReachableBaseUrl(baseUrl);

  const envAdminPassword = String(process.env.CORE64_ADMIN_PASSWORD || "").trim();
  const backendAdminPassword = readAdminPasswordFromBackendEnv();
  const adminPassword = envAdminPassword || backendAdminPassword || "core64admin";

  const report = {
    baseUrl,
    requestTimeoutMs,
    checks: {},
    passed: true
  };

  const authRequired = await requestJson("/settings");
  const authRequiredShape = evaluateShape({
    result: authRequired,
    expectedStatus: 401,
    expectedCode: "AUTH_REQUIRED",
    expectedError: "Unauthorized"
  });
  report.checks.authRequired = authRequiredShape;
  if (!authRequiredShape.ok) {
    report.passed = false;
  }

  const login = await requestJson("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: adminPassword })
  });
  ensureOk(login, "POST /auth/login");

  const token = String(login.json?.data?.token || "").trim();
  if (!token) {
    throw new Error("POST /auth/login returned no token");
  }

  const authHeaders = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };

  const settingsResult = await requestJson("/settings", { headers: authHeaders });
  ensureOk(settingsResult, "GET /settings");

  const settingsPayload = settingsResult.json?.data && typeof settingsResult.json.data === "object"
    ? settingsResult.json.data
    : null;

  if (!settingsPayload) {
    throw new Error("GET /settings returned invalid payload");
  }

  const invalidSettingsResult = await requestJson("/settings", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      data: {
        ...settingsPayload,
        email: "not-an-email"
      }
    })
  });

  const invalidSettingsShape = evaluateShape({
    result: invalidSettingsResult,
    expectedStatus: 400,
    expectedCode: "VALIDATION_FAILED",
    expectedError: "Validation failed"
  });
  const invalidEmailFieldErrors = normalizeFieldErrors(invalidSettingsShape.payload, "email");
  invalidSettingsShape.emailFieldErrorPresent = invalidEmailFieldErrors.length > 0;
  invalidSettingsShape.ok = invalidSettingsShape.ok && invalidSettingsShape.emailFieldErrorPresent;
  report.checks.settingsValidation = invalidSettingsShape;
  if (!invalidSettingsShape.ok) {
    report.passed = false;
  }

  const releaseNotFoundResult = await requestJson("/releases/999999999", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ title: "missing release contract check" })
  });
  const releaseNotFoundShape = evaluateShape({
    result: releaseNotFoundResult,
    expectedStatus: 404,
    expectedCode: "COLLECTION_ITEM_NOT_FOUND",
    expectedError: "Item not found"
  });
  report.checks.collectionNotFound = releaseNotFoundShape;
  if (!releaseNotFoundShape.ok) {
    report.passed = false;
  }

  const contactNotFoundResult = await requestJson("/contact-requests/999999999", {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ status: "done" })
  });
  const contactNotFoundShape = evaluateShape({
    result: contactNotFoundResult,
    expectedStatus: 404,
    expectedCode: "CONTACT_REQUEST_NOT_FOUND",
    expectedError: "Contact request not found"
  });
  report.checks.contactRequestNotFound = contactNotFoundShape;
  if (!contactNotFoundShape.ok) {
    report.passed = false;
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("API error contract verification failed:", error?.message || error);
  process.exit(1);
});
