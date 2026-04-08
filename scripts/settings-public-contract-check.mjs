#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUrl = (process.env.CORE64_API_BASE || "http://localhost:3000/api").replace(/\/+$/, "");
const requestTimeoutMs = Number(process.env.CORE64_CONTRACT_TIMEOUT_MS || 15000);

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

function getSettingsPayload(value) {
  return value && typeof value === "object" ? value : {};
}

async function run() {
  const envAdminPassword = String(process.env.CORE64_ADMIN_PASSWORD || "").trim();
  const backendEnvAdminPassword = readAdminPasswordFromBackendEnv();
  const adminPassword = envAdminPassword || backendEnvAdminPassword || "core64admin";

  const report = {
    baseUrl,
    checks: {},
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

    const currentSettings = await requestJson("/settings", { headers: authHeaders });
    ensureOk(currentSettings, "GET /settings");

    originalSettings = getSettingsPayload(currentSettings.json?.data);

    const marker = Date.now();
    const expectedTitle = `CONTRACT TITLE ${marker}`;
    const expectedAbout = `CONTRACT ABOUT ${marker}`;
    const expectedMission = `CONTRACT MISSION ${marker}`;
    const updatedSettings = {
      ...originalSettings,
      title: expectedTitle,
      about: expectedAbout,
      mission: expectedMission
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

    const ukTitle = String(publicUk.json?.data?.settings?.title || "");
    const ukAbout = String(publicUk.json?.data?.settings?.about || "");
    const ukMission = String(publicUk.json?.data?.settings?.mission || "");
    const enTitle = String(publicEn.json?.data?.settings?.title || "");
    const enAbout = String(publicEn.json?.data?.settings?.about || "");
    const enMission = String(publicEn.json?.data?.settings?.mission || "");

    report.checks.expected = { title: expectedTitle, about: expectedAbout, mission: expectedMission };
    report.checks.publicUk = { title: ukTitle, about: ukAbout, mission: ukMission };
    report.checks.publicEn = { title: enTitle, about: enAbout, mission: enMission };

    if (ukTitle !== expectedTitle || ukAbout !== expectedAbout || ukMission !== expectedMission || enTitle !== expectedTitle || enAbout !== expectedAbout || enMission !== expectedMission) {
      report.passed = false;
      throw new Error("Public settings payload did not reflect saved title/about/mission values");
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
