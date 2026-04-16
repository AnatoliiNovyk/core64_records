function buildNotImplementedError(operationName) {
  const error = new Error(`Firestore repository operation is not implemented yet: ${operationName}`);
  error.code = "FIRESTORE_NOT_IMPLEMENTED";
  error.status = 503;
  return error;
}

async function notImplemented(operationName) {
  throw buildNotImplementedError(operationName);
}

export async function listByType(type, requestedLanguage) {
  return notImplemented("listByType");
}

export async function createByType(type, payload) {
  return notImplemented("createByType");
}

export async function updateByType(type, id, payload) {
  return notImplemented("updateByType");
}

export async function deleteByType(type, id) {
  return notImplemented("deleteByType");
}

export async function getReleaseById(releaseId) {
  return notImplemented("getReleaseById");
}

export async function listReleaseTracksByReleaseId(releaseId) {
  return notImplemented("listReleaseTracksByReleaseId");
}

export async function listReleaseTrackMetaByReleaseId(releaseId) {
  return notImplemented("listReleaseTrackMetaByReleaseId");
}

export async function getReleaseTrackById(releaseId, trackId) {
  return notImplemented("getReleaseTrackById");
}

export async function replaceReleaseTracksByReleaseId(releaseId, tracksPayload = []) {
  return notImplemented("replaceReleaseTracksByReleaseId");
}

export async function createReleaseTrackByReleaseId(releaseId, trackPayload = {}) {
  return notImplemented("createReleaseTrackByReleaseId");
}

export async function updateReleaseTrackById(releaseId, trackId, trackPayload = {}) {
  return notImplemented("updateReleaseTrackById");
}

export async function deleteReleaseTrackById(releaseId, trackId) {
  return notImplemented("deleteReleaseTrackById");
}

export async function getPublicSettings(requestedLanguage) {
  return notImplemented("getPublicSettings");
}

export async function getAdminSectionSettings() {
  return notImplemented("getAdminSectionSettings");
}

export async function getPublicSectionSettings(requestedLanguage) {
  return notImplemented("getPublicSectionSettings");
}

export async function saveSectionSettings(sectionsPayload) {
  return notImplemented("saveSectionSettings");
}

export async function saveSettingsBundle(payload, requestedLanguage) {
  return notImplemented("saveSettingsBundle");
}

export async function getAdminSettings(requestedLanguage) {
  return notImplemented("getAdminSettings");
}

export async function saveSettings(payload, requestedLanguage) {
  return notImplemented("saveSettings");
}

export async function createContactRequest(payload) {
  return notImplemented("createContactRequest");
}

export async function listContactRequests() {
  return notImplemented("listContactRequests");
}

export async function updateContactRequestStatus(id, status) {
  return notImplemented("updateContactRequestStatus");
}

export async function writeAuditLog({ entityType, entityId, action, actor, details }) {
  return notImplemented("writeAuditLog");
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
  return notImplemented("listAuditLogs");
}

export async function listAuditFacets() {
  return notImplemented("listAuditFacets");
}
