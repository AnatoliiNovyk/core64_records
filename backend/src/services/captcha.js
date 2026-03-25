import { config } from "../config.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getCaptchaProvider() {
  const provider = String(config.contactCaptchaProvider || "none").trim().toLowerCase();
  return provider || "none";
}

export async function verifyContactCaptcha(token, remoteIp) {
  const provider = getCaptchaProvider();
  if (provider === "none") {
    return { ok: true };
  }

  if (provider !== "turnstile") {
    return { ok: false, message: "Unsupported captcha provider" };
  }

  const secret = String(config.contactCaptchaSecret || "").trim();
  if (!secret) {
    return { ok: false, message: "Captcha is not configured on server" };
  }

  const trimmedToken = String(token || "").trim();
  if (!trimmedToken) {
    return { ok: false, message: "Captcha token is required" };
  }

  try {
    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", trimmedToken);
    if (remoteIp) params.set("remoteip", String(remoteIp));

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const payload = await response.json();
    if (!response.ok) {
      return { ok: false, message: "Captcha verification request failed" };
    }

    if (payload && payload.success === true) {
      return { ok: true };
    }

    const errorCodes = Array.isArray(payload && payload["error-codes"])
      ? payload["error-codes"].filter((entry) => typeof entry === "string" && entry.trim())
      : [];

    const suffix = errorCodes.length ? ` (${errorCodes.join(", ")})` : "";
    return { ok: false, message: `Captcha verification failed${suffix}` };
  } catch (_error) {
    return { ok: false, message: "Captcha verification failed" };
  }
}
