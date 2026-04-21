import { getAdminSettings } from "../db/repository.adapter.js";

const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const CAPTCHA_VERIFY_TIMEOUT_MS = 10_000;

function normalizeCaptchaSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    enabled: !!source.contactCaptchaEnabled,
    provider: String(source.contactCaptchaActiveProvider || "none").trim().toLowerCase(),
    hcaptchaSecret: String(source.contactCaptchaHcaptchaSecretKey || "").trim(),
    recaptchaSecret: String(source.contactCaptchaRecaptchaSecretKey || "").trim(),
    errorMessage: String(source.contactCaptchaErrorMessage || "").trim() || "Не вдалося пройти перевірку captcha.",
    missingTokenMessage: String(source.contactCaptchaMissingTokenMessage || "").trim() || "Підтвердіть, що ви не робот.",
    invalidDomainMessage: String(source.contactCaptchaInvalidDomainMessage || "").trim() || "Відправка з цього домену заборонена.",
    allowedDomain: String(source.contactCaptchaAllowedDomain || "").trim().toLowerCase()
  };
}

function extractHostname(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`;
    return (new URL(candidate)).hostname.toLowerCase();
  } catch (_error) {
    return text.toLowerCase().replace(/^https?:\/\//i, "").split("/")[0];
  }
}

function isAllowedDomain(sourceHost, allowedDomain) {
  if (!allowedDomain) return true;
  if (!sourceHost) return false;
  return sourceHost === allowedDomain || sourceHost.endsWith(`.${allowedDomain}`);
}

async function verifyWithProvider({ verifyUrl, secret, token, remoteIp }) {
  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteIp) params.set("remoteip", String(remoteIp));

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, CAPTCHA_VERIFY_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: abortController.signal
    });
  } catch (error) {
    if (error && error.name === "AbortError") {
      return { success: false, errorCodes: ["timeout"] };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = {};
  }

  if (!response.ok) {
    return { success: false, errorCodes: ["http-error"] };
  }

  const success = !!(payload && payload.success === true);
  const errorCodes = Array.isArray(payload && payload["error-codes"])
    ? payload["error-codes"].filter((entry) => typeof entry === "string" && entry.trim())
    : [];
  return { success, errorCodes };
}

export async function verifyContactCaptcha(token, options = {}) {
  const settings = await getAdminSettings();
  const captchaSettings = normalizeCaptchaSettings(settings);

  if (!captchaSettings.enabled || captchaSettings.provider === "none") {
    return { ok: true };
  }

  const requestDomain = extractHostname(options.origin || options.host || "");
  if (!isAllowedDomain(requestDomain, captchaSettings.allowedDomain)) {
    return { ok: false, message: captchaSettings.invalidDomainMessage, code: "domain_not_allowed" };
  }

  const trimmedToken = String(token || "").trim();
  if (!trimmedToken) {
    return { ok: false, message: captchaSettings.missingTokenMessage, code: "token_required" };
  }

  let providerConfig = null;
  if (captchaSettings.provider === "hcaptcha") {
    providerConfig = { verifyUrl: HCAPTCHA_VERIFY_URL, secret: captchaSettings.hcaptchaSecret };
  } else if (captchaSettings.provider === "recaptcha_v2") {
    providerConfig = { verifyUrl: RECAPTCHA_VERIFY_URL, secret: captchaSettings.recaptchaSecret };
  }

  if (!providerConfig || !providerConfig.secret) {
    return { ok: false, message: captchaSettings.errorMessage, code: "provider_not_configured" };
  }

  try {
    const verification = await verifyWithProvider({
      verifyUrl: providerConfig.verifyUrl,
      secret: providerConfig.secret,
      token: trimmedToken,
      remoteIp: options.remoteIp
    });

    if (verification.success) {
      return { ok: true };
    }

    const suffix = verification.errorCodes && verification.errorCodes.length
      ? ` (${verification.errorCodes.join(", ")})`
      : "";
    return { ok: false, message: `${captchaSettings.errorMessage}${suffix}`, code: "verification_failed" };
  } catch (_error) {
    return { ok: false, message: captchaSettings.errorMessage, code: "verification_exception" };
  }
}
