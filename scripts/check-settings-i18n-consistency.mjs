#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUrl = (process.env.CORE64_API_BASE || "http://localhost:3000/api").replace(/\/+$/, "");
const requestTimeoutMs = Number(process.env.CORE64_CONSISTENCY_TIMEOUT_MS || 15000);

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

      const rawValue = match[2].trim();
      if (!rawValue) return "";

      const isDoubleQuoted = rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2;
      const isSingleQuoted = rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2;
      if (isDoubleQuoted || isSingleQuoted) {
        return rawValue.slice(1, -1);
      }

      return rawValue.split("#")[0].trim();
    }

    return "";
  } catch (_error) {
    return "";
  }
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

async function requestJson(pathname, options = {}) {
  const timeout = withTimeout(options.signal, requestTimeoutMs);
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
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

function ensureOk(result, context) {
  if (result.response.ok) return;
  const details = result.json || result.text || "Unknown error";
  throw new Error(`${context} failed with ${result.response.status}: ${JSON.stringify(details)}`);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function compare(report, expectedSource, actualSource, field, expectedValue, actualValue) {
  const expected = normalizeText(expectedValue);
  const actual = normalizeText(actualValue);
  if (expected === actual) return;

  report.passed = false;
  report.mismatches.push({
    expectedSource,
    actualSource,
    field,
    expected,
    actual
  });
}

async function run() {
  const envAdminPassword = normalizeText(process.env.CORE64_ADMIN_PASSWORD || "");
  const backendEnvAdminPassword = normalizeText(readAdminPasswordFromBackendEnv());
  const adminPassword = envAdminPassword || backendEnvAdminPassword || "core64admin";

  const report = {
    baseUrl,
    checks: {},
    mismatches: [],
    passed: true
  };

  const login = await requestJson("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: adminPassword })
  });
  ensureOk(login, "POST /auth/login");

  const token = normalizeText(login.json?.data?.token || "");
  if (!token) {
    throw new Error("POST /auth/login returned no token");
  }

  const authHeaders = { authorization: `Bearer ${token}` };

  const [adminSettingsResult, publicUkResult, publicEnResult] = await Promise.all([
    requestJson("/settings", { headers: authHeaders }),
    requestJson("/public?lang=uk"),
    requestJson("/public?lang=en")
  ]);

  ensureOk(adminSettingsResult, "GET /settings");
  ensureOk(publicUkResult, "GET /public?lang=uk");
  ensureOk(publicEnResult, "GET /public?lang=en");

  const adminSettings = adminSettingsResult.json?.data && typeof adminSettingsResult.json.data === "object"
    ? adminSettingsResult.json.data
    : {};

  const publicUkSettings = publicUkResult.json?.data?.settings && typeof publicUkResult.json.data.settings === "object"
    ? publicUkResult.json.data.settings
    : {};

  const publicEnSettings = publicEnResult.json?.data?.settings && typeof publicEnResult.json.data.settings === "object"
    ? publicEnResult.json.data.settings
    : {};

  report.checks.expected = {
    title: normalizeText(adminSettings.title),
    about: normalizeText(adminSettings.about),
    mission: normalizeText(adminSettings.mission),
    headerLogoUrl: normalizeText(adminSettings.headerLogoUrl),
    footerLogoUrl: normalizeText(adminSettings.footerLogoUrl),
    contactCaptchaErrorMessage: normalizeText(adminSettings.contactCaptchaErrorMessage),
    contactCaptchaMissingTokenMessage: normalizeText(adminSettings.contactCaptchaMissingTokenMessage),
    contactCaptchaInvalidDomainMessage: normalizeText(adminSettings.contactCaptchaInvalidDomainMessage),
    heroSubtitleUk: normalizeText(adminSettings.heroSubtitleUk),
    heroSubtitleEn: normalizeText(adminSettings.heroSubtitleEn)
  };

  report.checks.publicUk = {
    title: normalizeText(publicUkSettings.title),
    about: normalizeText(publicUkSettings.about),
    mission: normalizeText(publicUkSettings.mission),
    headerLogoUrl: normalizeText(publicUkSettings.headerLogoUrl),
    footerLogoUrl: normalizeText(publicUkSettings.footerLogoUrl),
    contactCaptchaErrorMessage: normalizeText(publicUkSettings.contactCaptchaErrorMessage),
    contactCaptchaMissingTokenMessage: normalizeText(publicUkSettings.contactCaptchaMissingTokenMessage),
    contactCaptchaInvalidDomainMessage: normalizeText(publicUkSettings.contactCaptchaInvalidDomainMessage),
    heroSubtitle: normalizeText(publicUkSettings.heroSubtitle)
  };

  report.checks.publicEn = {
    title: normalizeText(publicEnSettings.title),
    about: normalizeText(publicEnSettings.about),
    mission: normalizeText(publicEnSettings.mission),
    headerLogoUrl: normalizeText(publicEnSettings.headerLogoUrl),
    footerLogoUrl: normalizeText(publicEnSettings.footerLogoUrl),
    contactCaptchaErrorMessage: normalizeText(publicEnSettings.contactCaptchaErrorMessage),
    contactCaptchaMissingTokenMessage: normalizeText(publicEnSettings.contactCaptchaMissingTokenMessage),
    contactCaptchaInvalidDomainMessage: normalizeText(publicEnSettings.contactCaptchaInvalidDomainMessage),
    heroSubtitle: normalizeText(publicEnSettings.heroSubtitle)
  };

  const mirroredFields = [
    "title",
    "about",
    "mission",
    "headerLogoUrl",
    "footerLogoUrl",
    "contactCaptchaErrorMessage",
    "contactCaptchaMissingTokenMessage",
    "contactCaptchaInvalidDomainMessage"
  ];

  for (const field of mirroredFields) {
    compare(report, "adminSettings", "publicUkSettings", field, adminSettings[field], publicUkSettings[field]);
    compare(report, "adminSettings", "publicEnSettings", field, adminSettings[field], publicEnSettings[field]);
  }

  compare(report, "adminSettings.heroSubtitleUk", "publicUkSettings.heroSubtitle", "heroSubtitle", adminSettings.heroSubtitleUk, publicUkSettings.heroSubtitle);
  compare(report, "adminSettings.heroSubtitleEn", "publicEnSettings.heroSubtitle", "heroSubtitle", adminSettings.heroSubtitleEn, publicEnSettings.heroSubtitle);

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Settings i18n consistency check failed:", error?.message || error);
  process.exit(1);
});
