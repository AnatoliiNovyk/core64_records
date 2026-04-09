import { config } from "../config.js";
import { sanitizeForLog } from "./logSanitizer.js";

const LOG_LEVEL_RANK = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function resolveActiveLevel() {
  const normalized = String(config.logLevel || "info").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVEL_RANK, normalized) ? normalized : "info";
}

function shouldLog(level) {
  const currentLevel = resolveActiveLevel();
  const currentRank = LOG_LEVEL_RANK[currentLevel];
  const targetRank = LOG_LEVEL_RANK[level];
  return targetRank >= currentRank;
}

function writeLine(level, line) {
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

function emit(level, event, payload = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeForLog(payload, {
      maxStringLength: config.requestLoggingMaxBodyChars
    })
  };

  writeLine(level, JSON.stringify(entry));
}

export const logger = {
  debug(event, payload) {
    emit("debug", event, payload);
  },

  info(event, payload) {
    emit("info", event, payload);
  },

  warn(event, payload) {
    emit("warn", event, payload);
  },

  error(event, payload) {
    emit("error", event, payload);
  }
};
