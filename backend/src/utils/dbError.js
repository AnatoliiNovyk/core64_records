const NETWORK_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN"
]);

const TLS_CODES = new Set(["SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "ERR_TLS_CERT_ALTNAME_INVALID"]);
const AUTH_CODES = new Set(["28P01"]);

export const sanitizeDatabaseErrorCode = (error) => {
  const raw = String(error?.code || "").trim().toUpperCase();
  if (!raw) return null;
  if (/^[A-Z0-9_]{2,32}$/.test(raw)) return raw;
  return null;
};

export const classifyDatabaseError = (error) => {
  if (!error) return "unknown";

  const code = String(error.code || "").trim().toUpperCase();
  const message = String(error.message || "").toLowerCase();

  if (NETWORK_CODES.has(code)) return "network";
  if (TLS_CODES.has(code) || message.includes("certificate") || message.includes("tls")) return "tls";
  if (AUTH_CODES.has(code) || message.includes("authentication failed") || message.includes("password authentication")) {
    return "auth";
  }

  // PostgreSQL SQLSTATE class 08 = connection exception.
  if (/^08[A-Z0-9]{3}$/.test(code)) return "connection";

  if (code === "57014" || message.includes("statement timeout") || message.includes("query timeout") || message.includes("timeout")) {
    return "timeout";
  }

  if (message.includes("could not translate host name") || message.includes("getaddrinfo")) return "dns";
  if (message.includes("invalid connection string") || message.includes("connectionstring")) return "config";
  if (message.includes("connection") || message.includes("could not connect")) return "connection";

  return "unknown";
};

export const isDatabaseConnectivityError = (error) => {
  const kind = classifyDatabaseError(error);
  return kind !== "unknown";
};
