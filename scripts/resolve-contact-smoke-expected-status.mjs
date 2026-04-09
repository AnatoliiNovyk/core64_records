#!/usr/bin/env node

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseOptionalStatusCode(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function resolveContactSmokeExpectedStatus({ explicitExpectedStatus, settings, captchaToken }) {
  const explicit = parseOptionalStatusCode(explicitExpectedStatus);
  if (Number.isFinite(explicit) && explicit >= 100 && explicit <= 599) {
    return {
      expectedStatus: explicit,
      source: "explicit_override",
      captchaMode: {
        enabled: null,
        provider: "unknown",
        active: null,
        hasToken: String(captchaToken || "").trim().length > 0
      }
    };
  }

  const settingsPayload = settings && typeof settings === "object" ? settings : {};
  const provider = String(settingsPayload.contactCaptchaActiveProvider || "none").trim().toLowerCase() || "none";
  const enabled = typeof settingsPayload.contactCaptchaEnabled === "boolean"
    ? settingsPayload.contactCaptchaEnabled
    : toBoolean(settingsPayload.contactCaptchaEnabled, false);
  const active = enabled && provider !== "none";
  const hasToken = String(captchaToken || "").trim().length > 0;

  if (active && !hasToken) {
    return {
      expectedStatus: 400,
      source: "captcha_enabled_missing_token",
      captchaMode: {
        enabled,
        provider,
        active,
        hasToken
      }
    };
  }

  return {
    expectedStatus: 201,
    source: active ? "captcha_enabled_with_token" : "captcha_disabled",
    captchaMode: {
      enabled,
      provider,
      active,
      hasToken
    }
  };
}
