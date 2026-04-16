import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import * as postgresRepository from "./repository.js";
import * as firestoreRepository from "./repository.firestore.js";

const FIRESTORE_NOT_IMPLEMENTED_CODE = "FIRESTORE_NOT_IMPLEMENTED";

function isDualMode() {
  return config.dataBackend === "dual";
}

function getReadRepository() {
  if (config.dataBackend === "firestore") {
    return firestoreRepository;
  }
  return postgresRepository;
}

function getPrimaryWriteRepository() {
  if (config.dataBackend === "firestore") {
    return firestoreRepository;
  }
  return postgresRepository;
}

function getShadowWriteRepository() {
  if (!isDualMode()) {
    return null;
  }
  return firestoreRepository;
}

async function executeRead(operationName, args) {
  const repository = getReadRepository();
  return repository[operationName](...args);
}

async function executeWrite(operationName, args) {
  const repository = getPrimaryWriteRepository();
  const result = await repository[operationName](...args);

  const shadowRepository = getShadowWriteRepository();
  if (!shadowRepository) {
    return result;
  }

  try {
    await shadowRepository[operationName](...args);
    logger.debug("db.shadow_write.completed", {
      operationName,
      backend: "firestore"
    });
  } catch (error) {
    const code = String(error?.code || "").trim().toUpperCase();
    if (code === FIRESTORE_NOT_IMPLEMENTED_CODE) {
      logger.info("db.shadow_write.skipped", {
        operationName,
        backend: "firestore",
        reason: code
      });
      return result;
    }

    logger.warn("db.shadow_write.failed", {
      operationName,
      backend: "firestore",
      error
    });
  }

  return result;
}

export async function listByType(type, requestedLanguage = config.defaultLanguage) {
  return executeRead("listByType", [type, requestedLanguage]);
}

export async function createByType(type, payload) {
  return executeWrite("createByType", [type, payload]);
}

export async function updateByType(type, id, payload) {
  return executeWrite("updateByType", [type, id, payload]);
}

export async function deleteByType(type, id) {
  return executeWrite("deleteByType", [type, id]);
}

export async function getReleaseById(releaseId) {
  return executeRead("getReleaseById", [releaseId]);
}

export async function listReleaseTracksByReleaseId(releaseId) {
  return executeRead("listReleaseTracksByReleaseId", [releaseId]);
}

export async function listReleaseTrackMetaByReleaseId(releaseId) {
  return executeRead("listReleaseTrackMetaByReleaseId", [releaseId]);
}

export async function getReleaseTrackById(releaseId, trackId) {
  return executeRead("getReleaseTrackById", [releaseId, trackId]);
}

export async function replaceReleaseTracksByReleaseId(releaseId, tracksPayload = []) {
  return executeWrite("replaceReleaseTracksByReleaseId", [releaseId, tracksPayload]);
}

export async function createReleaseTrackByReleaseId(releaseId, trackPayload = {}) {
  return executeWrite("createReleaseTrackByReleaseId", [releaseId, trackPayload]);
}

export async function updateReleaseTrackById(releaseId, trackId, trackPayload = {}) {
  return executeWrite("updateReleaseTrackById", [releaseId, trackId, trackPayload]);
}

export async function deleteReleaseTrackById(releaseId, trackId) {
  return executeWrite("deleteReleaseTrackById", [releaseId, trackId]);
}

export async function getPublicSettings(requestedLanguage = config.defaultLanguage) {
  return executeRead("getPublicSettings", [requestedLanguage]);
}

export async function getAdminSectionSettings() {
  return executeRead("getAdminSectionSettings", []);
}

export async function getPublicSectionSettings(requestedLanguage = config.defaultLanguage) {
  return executeRead("getPublicSectionSettings", [requestedLanguage]);
}

export async function saveSectionSettings(sectionsPayload) {
  return executeWrite("saveSectionSettings", [sectionsPayload]);
}

export async function saveSettingsBundle(payload, requestedLanguage = config.defaultLanguage) {
  return executeWrite("saveSettingsBundle", [payload, requestedLanguage]);
}

export async function getAdminSettings(requestedLanguage = config.defaultLanguage) {
  return executeRead("getAdminSettings", [requestedLanguage]);
}

export async function saveSettings(payload, requestedLanguage = config.defaultLanguage) {
  return executeWrite("saveSettings", [payload, requestedLanguage]);
}

export async function createContactRequest(payload) {
  return executeWrite("createContactRequest", [payload]);
}

export async function listContactRequests() {
  return executeRead("listContactRequests", []);
}

export async function updateContactRequestStatus(id, status) {
  return executeWrite("updateContactRequestStatus", [id, status]);
}

export async function writeAuditLog({ entityType, entityId, action, actor, details }) {
  return executeWrite("writeAuditLog", [{ entityType, entityId, action, actor, details }]);
}

export async function listAuditLogs({
  limit = 100,
  page = 1,
  q = "",
  action = "",
  entity = "",
  from = "",
  to = ""
} = {}) {
  return executeRead("listAuditLogs", [{ limit, page, q, action, entity, from, to }]);
}

export async function listAuditFacets() {
  return executeRead("listAuditFacets", []);
}
