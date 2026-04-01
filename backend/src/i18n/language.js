import { config } from "../config.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

export function resolveLanguage(requestedLanguage) {
  const normalized = normalize(requestedLanguage);
  if (config.supportedLanguages.includes(normalized)) {
    return normalized;
  }
  return config.defaultLanguage;
}
