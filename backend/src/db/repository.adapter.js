import { config } from "../config.js";
import * as firestoreRepository from "./repository.firestore.js";

const repository = firestoreRepository;

async function executeRead(operationName, args) {
  return repository[operationName](...args);
}

async function executeWrite(operationName, args) {
  return repository[operationName](...args);
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

export async function listContactRequests(options = {}) {
  return executeRead("listContactRequests", [options]);
}

export async function getContactRequestAttachmentById(id) {
  return executeRead("getContactRequestAttachmentById", [id]);
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
