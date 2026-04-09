#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUrl = (process.env.CORE64_API_BASE || "http://localhost:3000/api").replace(/\/+$/, "");
const requestTimeoutMs = Number(process.env.CORE64_CONTRACT_TIMEOUT_MS || 15000);

const NEGATIVE_CASES = [
  {
    name: "empty_title",
    buildPayload: (basePayload) => ({ ...basePayload, title: "" }),
    expectedFields: ["title"]
  },
  {
    name: "captcha_enabled_without_provider",
    buildPayload: (basePayload) => ({
      ...basePayload,
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "none",
      contactCaptchaHcaptchaSiteKey: "",
      contactCaptchaHcaptchaSecretKey: "",
      contactCaptchaRecaptchaSiteKey: "",
      contactCaptchaRecaptchaSecretKey: ""
    }),
    expectedFields: ["contactCaptchaActiveProvider"]
  },
  {
    name: "hcaptcha_missing_keys",
    buildPayload: (basePayload) => ({
      ...basePayload,
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "hcaptcha",
      contactCaptchaHcaptchaSiteKey: "",
      contactCaptchaHcaptchaSecretKey: ""
    }),
    expectedFields: ["contactCaptchaHcaptchaSiteKey", "contactCaptchaHcaptchaSecretKey"]
  },
  {
    name: "warn_latency_not_greater_than_good",
    buildPayload: (basePayload) => ({
      ...basePayload,
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "hcaptcha",
      contactCaptchaHcaptchaSiteKey: "contract-site-key",
      contactCaptchaHcaptchaSecretKey: "contract-secret-key",
      auditLatencyGoodMaxMs: 700,
      auditLatencyWarnMaxMs: 600
    }),
    expectedFields: ["auditLatencyWarnMaxMs"]
  },
  {
    name: "invalid_allowed_domain",
    buildPayload: (basePayload) => ({
      ...basePayload,
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "hcaptcha",
      contactCaptchaHcaptchaSiteKey: "contract-site-key",
      contactCaptchaHcaptchaSecretKey: "contract-secret-key",
      contactCaptchaAllowedDomain: "bad domain!"
    }),
    expectedFields: ["contactCaptchaAllowedDomain"]
  }
];

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
      if (!match) continue;
      if (match[1] !== "ADMIN_PASSWORD") continue;

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
  return String(value ?? "");
}

function getFieldErrors(details) {
  if (!details || typeof details !== "object") return {};
  const fieldErrors = details.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return {};
  return fieldErrors;
}

function buildMismatchRecord(expectedSource, actualSource, field, expectedValue, actualValue) {
  return {
    expectedSource,
    actualSource,
    field,
    expected: normalizeText(expectedValue),
    actual: normalizeText(actualValue)
  };
}

function ensureFieldMatches(report, expectedSource, actualSource, field, expectedValue, actualValue) {
  if (normalizeText(expectedValue) === normalizeText(actualValue)) return;
  report.passed = false;
  report.checks.mismatches.push(buildMismatchRecord(expectedSource, actualSource, field, expectedValue, actualValue));
}

function buildExpectedContractValues(marker) {
  return {
    title: `CONTRACT TITLE ${marker}`,
    about: `CONTRACT ABOUT ${marker}`,
    mission: `CONTRACT MISSION ${marker}`,
    heroSubtitleUk: `CONTRACT HERO UK ${marker}`,
    heroSubtitleEn: `CONTRACT HERO EN ${marker}`,
    contactCaptchaErrorMessage: `CONTRACT CAPTCHA ERROR ${marker}`,
    contactCaptchaMissingTokenMessage: `CONTRACT CAPTCHA MISSING ${marker}`,
    contactCaptchaInvalidDomainMessage: `CONTRACT CAPTCHA DOMAIN ${marker}`
  };
}

async function runNegativeValidationCase({ caseName, payload, expectedFields, authHeaders }) {
  const result = await requestJson("/settings", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ data: payload })
  });

  const details = result.json?.details;
  const fieldErrors = getFieldErrors(details);
  const missingExpectedFields = expectedFields.filter((field) => !Array.isArray(fieldErrors[field]) || fieldErrors[field].length === 0);
  const passed = result.response.status === 400 && normalizeText(result.json?.error) === "Validation failed" && missingExpectedFields.length === 0;

  return {
    name: caseName,
    status: result.response.status,
    error: normalizeText(result.json?.error),
    expectedFields,
    missingExpectedFields,
    fieldErrors,
    passed
  };
}

function getSettingsPayload(value) {
  return value && typeof value === "object" ? value : {};
}

async function run() {
  const envAdminPassword = String(process.env.CORE64_ADMIN_PASSWORD || "").trim();
  const backendEnvAdminPassword = readAdminPasswordFromBackendEnv();
  const adminPassword = envAdminPassword || backendEnvAdminPassword || "core64admin";

  const report = {
    baseUrl,
    checks: {
      mismatches: []
    },
    negativeChecks: [],
    passed: true
  };

  let token = "";
  let originalSettings = null;

  try {
    const login = await requestJson("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: adminPassword })
    });
    ensureOk(login, "POST /auth/login");

    token = String(login.json?.data?.token || "");
    if (!token) {
      throw new Error("POST /auth/login returned no token");
    }

    const authHeaders = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    };

    const authGuardCheck = await requestJson("/settings");
    report.checks.authGuard = {
      expectedStatus: 401,
      status: authGuardCheck.response.status,
      ok: authGuardCheck.response.status === 401
    };
    if (!report.checks.authGuard.ok) {
      report.passed = false;
      throw new Error(`GET /settings without token returned ${authGuardCheck.response.status}, expected 401`);
    }

    const currentSettings = await requestJson("/settings", { headers: authHeaders });
    ensureOk(currentSettings, "GET /settings");

    originalSettings = getSettingsPayload(currentSettings.json?.data);

    const marker = Date.now();
    const expectedValues = buildExpectedContractValues(marker);
    const updatedSettings = {
      ...originalSettings,
      title: expectedValues.title,
      about: expectedValues.about,
      mission: expectedValues.mission,
      heroSubtitleUk: expectedValues.heroSubtitleUk,
      heroSubtitleEn: expectedValues.heroSubtitleEn,
      contactCaptchaErrorMessage: expectedValues.contactCaptchaErrorMessage,
      contactCaptchaMissingTokenMessage: expectedValues.contactCaptchaMissingTokenMessage,
      contactCaptchaInvalidDomainMessage: expectedValues.contactCaptchaInvalidDomainMessage
    };

    const saveSettings = await requestJson("/settings", {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ data: updatedSettings })
    });
    ensureOk(saveSettings, "PUT /settings");

    const [publicUk, publicEn] = await Promise.all([
      requestJson("/public?lang=uk"),
      requestJson("/public?lang=en")
    ]);

    ensureOk(publicUk, "GET /public?lang=uk");
    ensureOk(publicEn, "GET /public?lang=en");

    const publicUkSettings = getSettingsPayload(publicUk.json?.data?.settings);
    const publicEnSettings = getSettingsPayload(publicEn.json?.data?.settings);

    report.checks.expected = expectedValues;
    report.checks.publicUk = {
      title: normalizeText(publicUkSettings.title),
      about: normalizeText(publicUkSettings.about),
      mission: normalizeText(publicUkSettings.mission),
      heroSubtitle: normalizeText(publicUkSettings.heroSubtitle),
      contactCaptchaErrorMessage: normalizeText(publicUkSettings.contactCaptchaErrorMessage),
      contactCaptchaMissingTokenMessage: normalizeText(publicUkSettings.contactCaptchaMissingTokenMessage),
      contactCaptchaInvalidDomainMessage: normalizeText(publicUkSettings.contactCaptchaInvalidDomainMessage)
    };
    report.checks.publicEn = {
      title: normalizeText(publicEnSettings.title),
      about: normalizeText(publicEnSettings.about),
      mission: normalizeText(publicEnSettings.mission),
      heroSubtitle: normalizeText(publicEnSettings.heroSubtitle),
      contactCaptchaErrorMessage: normalizeText(publicEnSettings.contactCaptchaErrorMessage),
      contactCaptchaMissingTokenMessage: normalizeText(publicEnSettings.contactCaptchaMissingTokenMessage),
      contactCaptchaInvalidDomainMessage: normalizeText(publicEnSettings.contactCaptchaInvalidDomainMessage)
    };

    const mirroredFields = [
      "title",
      "about",
      "mission",
      "contactCaptchaErrorMessage",
      "contactCaptchaMissingTokenMessage",
      "contactCaptchaInvalidDomainMessage"
    ];

    for (const field of mirroredFields) {
      ensureFieldMatches(report, "expected", "publicUk", field, expectedValues[field], publicUkSettings[field]);
      ensureFieldMatches(report, "expected", "publicEn", field, expectedValues[field], publicEnSettings[field]);
    }

    ensureFieldMatches(report, "expected.heroSubtitleUk", "publicUk.heroSubtitle", "heroSubtitle", expectedValues.heroSubtitleUk, publicUkSettings.heroSubtitle);
    ensureFieldMatches(report, "expected.heroSubtitleEn", "publicEn.heroSubtitle", "heroSubtitle", expectedValues.heroSubtitleEn, publicEnSettings.heroSubtitle);

    if (report.checks.mismatches.length > 0) {
      throw new Error("Public settings payload did not reflect expanded contract fields");
    }

    for (const testCase of NEGATIVE_CASES) {
      const result = await runNegativeValidationCase({
        caseName: testCase.name,
        payload: testCase.buildPayload(updatedSettings),
        expectedFields: testCase.expectedFields,
        authHeaders
      });

      report.negativeChecks.push(result);
      if (!result.passed) {
        report.passed = false;
        throw new Error(`Negative validation case failed: ${testCase.name}`);
      }
    }

    const postNegativeSettings = await requestJson("/settings", { headers: authHeaders });
    ensureOk(postNegativeSettings, "GET /settings after negative validation checks");
    const postNegativePayload = getSettingsPayload(postNegativeSettings.json?.data);
    report.checks.postNegative = {
      title: normalizeText(postNegativePayload.title),
      about: normalizeText(postNegativePayload.about),
      mission: normalizeText(postNegativePayload.mission),
      heroSubtitleUk: normalizeText(postNegativePayload.heroSubtitleUk),
      heroSubtitleEn: normalizeText(postNegativePayload.heroSubtitleEn)
    };

    const postNegativeFields = ["title", "about", "mission", "heroSubtitleUk", "heroSubtitleEn"];
    for (const field of postNegativeFields) {
      ensureFieldMatches(report, "expected", "postNegative", field, expectedValues[field], postNegativePayload[field]);
    }

    if (report.checks.mismatches.length > 0) {
      throw new Error("Settings state changed unexpectedly after negative validation checks");
    }
  } finally {
    if (token && originalSettings) {
      try {
        const restore = await requestJson("/settings", {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({ data: originalSettings })
        });

        report.checks.restore = {
          ok: restore.response.ok,
          status: restore.response.status
        };

        if (!restore.response.ok) {
          report.passed = false;
        }
      } catch (_restoreError) {
        report.checks.restore = { ok: false };
        report.passed = false;
      }
    } else {
      report.checks.restore = { ok: true, skipped: true };
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Contract check failed:", error?.message || error);
  process.exit(1);
});
