// CORE64 Records - Admin Panel Logic (API-first with fallback)

const adapter = window.Core64DataAdapter;
let currentSection = "dashboard";
let sectionNavigationSeq = 0;
let logoutInProgress = false;
let resetDataInProgress = false;
let editingId = null;
let editingType = null;
let cache = {
    releases: [],
    artists: [],
    events: [],
    settings: {},
    contactRequests: [],
    auditLogs: [],
    auditFacets: { actions: [], entities: [] }
};
let contactsPage = 1;
const CONTACTS_PAGE_SIZE = 5;
const CONTACTS_MIN_PAGE = 1;
let auditPage = 1;
const AUDIT_PAGE_SIZE = 10;
const AUDIT_MIN_LIMIT = 1;
const AUDIT_MAX_LIMIT = 500;
const AUDIT_MAX_REFRESH_SECONDS = 3600;
let auditTotal = 0;
let auditAutoRefreshTimer = null;
let auditRefreshCountdownTimer = null;
let auditRefreshRemainingSec = 0;
let auditSearchDebounceTimer = null;
let contactsFilterDebounceTimer = null;
let auditRequestSeq = 0;
let auditRequestController = null;
let auditShortcutToastTimer = null;
let auditShortcutToastSequence = 0;
let auditRefreshHighlightTimer = null;
let manualAuditRefreshInProgress = false;
let manualAuditRefreshCooldownActive = false;
let manualAuditRefreshCooldownTimer = null;
let auditLatencyHistory = [];
let hasUnsavedAuditLatencyThresholdChanges = false;
let settingsUnsavedModalResolver = null;
let settingsUnsavedModalPreviousFocus = null;
let settingsUnsavedModalSequence = 0;
let settingsUnsavedToastTimer = null;
let settingsUnsavedToastActive = false;
let settingsUnsavedToastQueue = [];
let settingsUnsavedToastCurrent = null;
let settingsUnsavedToastSequence = 0;
let settingsUnsavedToastDeadlineMs = 0;
let settingsUnsavedToastRemainingMs = 0;
let settingsUnsavedToastReturnFocusEl = null;
let settingsUnsavedToastPausedByWindowBlur = false;
let settingsUnsavedToastPausedByVisibility = false;
let settingsUnsavedToastTouchActive = false;
let globalEventListenersBound = false;
let modalFormMissingWarned = false;
let modalOverlayMissingWarned = false;
const SETTINGS_UNSAVED_TOAST_DURATION_MS = 1800;
const SETTINGS_UNSAVED_TOAST_MIN_REMAINING_MS = 200;
const SETTINGS_UNSAVED_TOAST_QUEUE_LIMIT = 5;
const MANUAL_AUDIT_REFRESH_COOLDOWN_MS = 700;
const AUDIT_LATENCY_HISTORY_SIZE = 5;
const AUDIT_LATENCY_GOOD_MAX_MS = 300;
const AUDIT_LATENCY_WARN_MAX_MS = 800;
const AUDIT_UI_STATE_KEY = "core64_audit_ui_state";
let auditLatencyGoodMaxMs = AUDIT_LATENCY_GOOD_MAX_MS;
let auditLatencyWarnMaxMs = AUDIT_LATENCY_WARN_MAX_MS;

function getAdapterMethod(methodName) {
    if (!adapter || typeof adapter !== "object") return null;
    if (typeof methodName !== "string" || !methodName.trim()) return null;
    const method = adapter[methodName];
    return typeof method === "function" ? method : null;
}

function clampBoundedInteger(value, { fallback, min, max }) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(numericValue)));
}

function normalizeAuditLimit(value, fallback = AUDIT_PAGE_SIZE) {
    return clampBoundedInteger(value, {
        fallback,
        min: AUDIT_MIN_LIMIT,
        max: AUDIT_MAX_LIMIT
    });
}

function normalizeAuditPage(value, fallback = 1) {
    return clampBoundedInteger(value, {
        fallback,
        min: 1,
        max: Number.MAX_SAFE_INTEGER
    });
}

function normalizeAuditRefreshSeconds(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    const normalized = Math.trunc(numericValue);
    if (normalized <= 0) return 0;
    return Math.min(normalized, AUDIT_MAX_REFRESH_SECONDS);
}

function normalizeAuditFilterSelectValue(value, fallback = "all") {
    const text = String(value ?? "").trim();
    if (!text) return fallback;
    return text;
}

function normalizeAuditFilterControlValue(filterEl, fallback = "all") {
    if (!filterEl || !filterEl.isConnected) return fallback;
    const normalizedFilter = normalizeAuditFilterSelectValue(filterEl.value, fallback);
    if (filterEl.value !== normalizedFilter) {
        filterEl.value = normalizedFilter;
    }
    return normalizedFilter;
}

function normalizeAuditSearchControlValue(searchEl) {
    if (!searchEl || !searchEl.isConnected) return "";
    const rawValue = String(searchEl.value ?? "");
    const normalizedValue = typeof rawValue.normalize === "function" ? rawValue.normalize("NFKC") : rawValue;
    if (searchEl.value !== normalizedValue) {
        searchEl.value = normalizedValue;
    }
    return normalizedValue;
}

function normalizeAuditFilterOptionValues(values) {
    const source = Array.isArray(values) ? values : [];
    return Array.from(new Set(source
    .filter((entry) => typeof entry === "string")
        .map((entry) => normalizeAuditFilterSelectValue(entry, ""))
        .filter((entry) => entry && entry !== "all")))
        .sort();
}

const AUDIT_DATE_PRESET_ALLOWED_VALUES = ["all", "today", "24h", "7d", "custom"];

function normalizeAuditDatePreset(value, fallback = "all") {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim();
    return AUDIT_DATE_PRESET_ALLOWED_VALUES.includes(normalized) ? normalized : fallback;
}

function hasValidAuditDateRangeOrder(dateFrom, dateTo) {
    if (!dateFrom || !dateTo) return true;
    return dateFrom <= dateTo;
}

function normalizeAuditLimitControlValue(limitEl) {
    if (!limitEl || !limitEl.isConnected) return AUDIT_PAGE_SIZE;
    const normalizedLimit = normalizeAuditLimit(limitEl.value, AUDIT_PAGE_SIZE);
    const normalizedText = String(normalizedLimit);
    if (limitEl.value !== normalizedText) {
        limitEl.value = normalizedText;
    }
    return normalizedLimit;
}

function normalizeAuditRefreshControlValue(refreshEl) {
    if (!refreshEl || !refreshEl.isConnected) return 0;
    const normalizedRefreshSeconds = normalizeAuditRefreshSeconds(refreshEl.value);
    const normalizedText = String(normalizedRefreshSeconds);
    if (refreshEl.value !== normalizedText) {
        refreshEl.value = normalizedText;
    }
    return normalizedRefreshSeconds;
}

function getNormalizedAuditFilters() {
    const searchEl = document.getElementById("audit-search");
    const actionFilterEl = document.getElementById("audit-filter-action");
    const entityFilterEl = document.getElementById("audit-filter-entity");
    const dateFromEl = document.getElementById("audit-date-from");
    const dateToEl = document.getElementById("audit-date-to");

    const searchRaw = normalizeAuditSearchControlValue(searchEl);
    const actionFilter = normalizeAuditFilterControlValue(actionFilterEl, "all");
    const entityFilter = normalizeAuditFilterControlValue(entityFilterEl, "all");
    const dateFrom = dateFromEl && dateFromEl.isConnected ? normalizeIsoDateFilter(dateFromEl.value) : "";
    const dateTo = dateToEl && dateToEl.isConnected ? normalizeIsoDateFilter(dateToEl.value) : "";

    if (dateFromEl && dateFromEl.isConnected && dateFromEl.value !== dateFrom) {
        dateFromEl.value = dateFrom;
    }
    if (dateToEl && dateToEl.isConnected && dateToEl.value !== dateTo) {
        dateToEl.value = dateTo;
    }

    return {
        searchRaw,
        query: normalizeSearchText(searchRaw),
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo
    };
}

function normalizeContactsPage(value, fallback = CONTACTS_MIN_PAGE) {
    return clampBoundedInteger(value, {
        fallback,
        min: CONTACTS_MIN_PAGE,
        max: Number.MAX_SAFE_INTEGER
    });
}

function normalizeContactsStatusFilter(value) {
    return normalizeSupportedContactRequestStatus(value) || "all";
}

function normalizeContactsStatusControlValue(statusFilterEl) {
    if (!statusFilterEl || !statusFilterEl.isConnected) return "all";
    const normalizedStatusFilter = normalizeContactsStatusFilter(statusFilterEl.value);
    if (statusFilterEl.value !== normalizedStatusFilter) {
        statusFilterEl.value = normalizedStatusFilter;
    }
    return normalizedStatusFilter;
}

function normalizeContactsDateControlValue(dateFilterEl) {
    if (!dateFilterEl || !dateFilterEl.isConnected) return "";
    const normalizedDateFilter = normalizeIsoDateFilter(dateFilterEl.value);
    if (dateFilterEl.value !== normalizedDateFilter) {
        dateFilterEl.value = normalizedDateFilter;
    }
    return normalizedDateFilter;
}

function normalizeContactsSearchControlValue(searchEl) {
    if (!searchEl || !searchEl.isConnected) return "";
    const rawValue = String(searchEl.value ?? "");
    const normalizedValue = typeof rawValue.normalize === "function" ? rawValue.normalize("NFKC") : rawValue;
    if (searchEl.value !== normalizedValue) {
        searchEl.value = normalizedValue;
    }
    return normalizedValue;
}

function getNormalizedContactsFilters() {
    const statusFilterEl = document.getElementById("contacts-filter-status");
    const dateFilterEl = document.getElementById("contacts-filter-date");
    const searchEl = document.getElementById("contacts-search");
    const searchRaw = normalizeContactsSearchControlValue(searchEl);

    return {
        statusFilter: normalizeContactsStatusControlValue(statusFilterEl),
        dateFilter: normalizeContactsDateControlValue(dateFilterEl),
        query: normalizeSearchText(searchRaw)
    };
}

function normalizeIsoDateFilter(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function extractIsoDatePrefix(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    const prefixedMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
    if (!prefixedMatch) return "";
    return normalizeIsoDateFilter(prefixedMatch[1]);
}

function normalizeSearchText(value) {
    const text = String(value ?? "");
    const normalized = typeof text.normalize === "function" ? text.normalize("NFKC") : text;
    return normalized.trim().toLowerCase();
}

function formatDateToLocalIso(date, fallback = "") {
    if (!(date instanceof Date)) return fallback;
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp)) return fallback;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDateFilterKey(value) {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "string") {
        const normalizedIso = normalizeIsoDateFilter(value);
        if (normalizedIso) return normalizedIso;
        const prefixedIso = extractIsoDatePrefix(value);
        if (prefixedIso) return prefixedIso;
    }

    const date = value instanceof Date ? value : new Date(value);
    return formatDateToLocalIso(date, "");
}

function getComparableTimestamp(value) {
    const date = new Date(value);
    const timestamp = date.getTime();
    return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function formatDateTimeOrDash(value) {
    if (value === null || value === undefined || value === "") return "-";
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString("uk-UA") : "-";
}

function formatNowTimeOrFallback() {
    const now = new Date();
    const timestamp = now.getTime();
    return Number.isFinite(timestamp) ? now.toLocaleTimeString("uk-UA") : "--:--:--";
}

function getTodayIsoDateSafe() {
    const now = new Date();
    return formatDateToLocalIso(now, "unknown-date");
}

function safeSerializeDetails(details, fallback = "{}") {
    if (details === null || details === undefined) return fallback;
    if (typeof details !== "object") return String(details);

    try {
        return JSON.stringify(details);
    } catch (error) {
        console.warn("Failed to stringify details payload", error);
        return fallback;
    }
}

function normalizeRecordObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeRecordArray(value) {
    return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === "object") : [];
}

function normalizeAuditFacetsPayload(value) {
    const facets = normalizeRecordObject(value);
    return {
        actions: Array.isArray(facets.actions) ? facets.actions : [],
        entities: Array.isArray(facets.entities) ? facets.entities : []
    };
}

function parsePositiveMsValue(rawValue, fallback) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.round(value);
}

function getNormalizedLatencyThresholds(source = {}) {
    const good = parsePositiveMsValue(source.auditLatencyGoodMaxMs, AUDIT_LATENCY_GOOD_MAX_MS);
    const warnRaw = parsePositiveMsValue(source.auditLatencyWarnMaxMs, AUDIT_LATENCY_WARN_MAX_MS);
    const warn = Math.max(warnRaw, good + 1);
    return { good, warn };
}

function setAuditLatencyThresholdsDirtyState(isDirty) {
    const dirtyEl = document.getElementById("setting-audit-latency-dirty");
    hasUnsavedAuditLatencyThresholdChanges = !!isDirty;
    if (!dirtyEl) return;
    if (!dirtyEl.isConnected) return;
    dirtyEl.classList.toggle("hidden", !isDirty);
}

function handleUnsavedSettingsBeforeUnload(event) {
    if (!hasUnsavedAuditLatencyThresholdChanges) return;

    event.preventDefault();
    event.returnValue = "";
}

function updateSettingsUnsavedToastQueueBadge() {
    const badgeEl = document.getElementById("settings-unsaved-toast-queue");
    if (!badgeEl) return;
    if (!badgeEl.isConnected) return;

    const pendingCount = settingsUnsavedToastQueue.length;
    if (!pendingCount) {
        badgeEl.classList.add("hidden");
        badgeEl.textContent = "";
        badgeEl.removeAttribute("title");
        badgeEl.setAttribute("aria-label", "Відкладених повідомлень немає");
        return;
    }

    badgeEl.textContent = `+${pendingCount}`;
    const pendingText = `Відкладених повідомлень: ${pendingCount}`;
    badgeEl.setAttribute("title", pendingText);
    badgeEl.setAttribute("aria-label", pendingText);
    badgeEl.classList.remove("hidden");
}

function updateSettingsUnsavedToastAriaLabel() {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl) return;
    if (!toastEl.isConnected) return;

    const currentMessage = settingsUnsavedToastCurrent && settingsUnsavedToastCurrent.message
        ? settingsUnsavedToastCurrent.message
        : "";
    const pendingCount = settingsUnsavedToastQueue.length;

    if (!currentMessage && !pendingCount) {
        toastEl.removeAttribute("aria-label");
        toastEl.setAttribute("title", "Натисніть Enter, пробіл або Escape, щоб закрити");
        return;
    }

    if (!currentMessage && pendingCount) {
        const label = `Відкладених повідомлень: ${pendingCount}.`;
        toastEl.setAttribute("aria-label", label);
        toastEl.setAttribute("title", label);
        return;
    }

    if (!pendingCount) {
        const label = `${currentMessage}. Натисніть Enter, пробіл або Escape, щоб закрити.`;
        toastEl.setAttribute("aria-label", label);
        toastEl.setAttribute("title", label);
        return;
    }

    const label = `${currentMessage}. Відкладених повідомлень: ${pendingCount}. Натисніть Enter, пробіл або Escape, щоб закрити.`;
    toastEl.setAttribute("aria-label", label);
    toastEl.setAttribute("title", label);
}

function setSettingsUnsavedToastProgress(remainingMs, transitionMs = 0) {
    const progressEl = document.getElementById("settings-unsaved-toast-progress");
    if (!progressEl) return;
    if (!progressEl.isConnected) return;

    const clamped = Math.max(0, Math.min(SETTINGS_UNSAVED_TOAST_DURATION_MS, Math.round(remainingMs)));
    const percent = (clamped / SETTINGS_UNSAVED_TOAST_DURATION_MS) * 100;
    progressEl.style.transition = transitionMs > 0 ? `width ${transitionMs}ms linear` : "none";
    progressEl.style.width = `${percent}%`;
}

function prefersReducedMotion() {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateSettingsUnsavedToastProgress(transitionMs) {
    const progressEl = document.getElementById("settings-unsaved-toast-progress");
    if (!progressEl) return;
    if (!progressEl.isConnected) return;
    const toastSequenceAtAnimation = settingsUnsavedToastSequence;

    if (prefersReducedMotion()) {
        progressEl.style.transition = "none";
        return;
    }

    progressEl.style.transition = `width ${Math.max(SETTINGS_UNSAVED_TOAST_MIN_REMAINING_MS, transitionMs)}ms linear`;
    requestAnimationFrame(() => {
        if (toastSequenceAtAnimation !== settingsUnsavedToastSequence) return;
        if (!progressEl.isConnected) return;
        progressEl.style.width = "0%";
    });
}

function scheduleSettingsUnsavedToastAutoClose(delayMs = SETTINGS_UNSAVED_TOAST_DURATION_MS) {
    if (!settingsUnsavedToastActive) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) return;

    const safeDelay = Math.max(
        SETTINGS_UNSAVED_TOAST_MIN_REMAINING_MS,
        Number.isFinite(delayMs) ? Math.round(delayMs) : SETTINGS_UNSAVED_TOAST_DURATION_MS
    );

    if (settingsUnsavedToastTimer) {
        clearTimeout(settingsUnsavedToastTimer);
        settingsUnsavedToastTimer = null;
    }

    settingsUnsavedToastRemainingMs = safeDelay;

    if (document.hidden) {
        settingsUnsavedToastPausedByVisibility = true;
        settingsUnsavedToastPausedByWindowBlur = false;
        settingsUnsavedToastDeadlineMs = 0;
        setSettingsUnsavedToastProgress(safeDelay);
        return;
    }

    if (typeof document.hasFocus === "function" && !document.hasFocus()) {
        settingsUnsavedToastPausedByWindowBlur = true;
        settingsUnsavedToastPausedByVisibility = false;
        settingsUnsavedToastDeadlineMs = 0;
        setSettingsUnsavedToastProgress(safeDelay);
        return;
    }

    settingsUnsavedToastPausedByVisibility = false;
    settingsUnsavedToastPausedByWindowBlur = false;
    settingsUnsavedToastDeadlineMs = Date.now() + safeDelay;
    setSettingsUnsavedToastProgress(safeDelay);
    animateSettingsUnsavedToastProgress(safeDelay);
    const toastSequenceAtSchedule = settingsUnsavedToastSequence;
    const timeoutId = setTimeout(() => {
        if (settingsUnsavedToastTimer !== timeoutId) return;
        settingsUnsavedToastTimer = null;
        if (!settingsUnsavedToastActive) return;
        if (toastSequenceAtSchedule !== settingsUnsavedToastSequence) return;
        finalizeSettingsUnsavedToastDisplay();
    }, safeDelay);
    settingsUnsavedToastTimer = timeoutId;
}

function pauseSettingsUnsavedToastAutoClose() {
    if (!settingsUnsavedToastActive || !settingsUnsavedToastTimer) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) return;

    const remaining = settingsUnsavedToastDeadlineMs - Date.now();
    settingsUnsavedToastRemainingMs = Math.max(SETTINGS_UNSAVED_TOAST_MIN_REMAINING_MS, remaining);
    clearTimeout(settingsUnsavedToastTimer);
    settingsUnsavedToastTimer = null;
    setSettingsUnsavedToastProgress(settingsUnsavedToastRemainingMs);
}

function resumeSettingsUnsavedToastAutoClose() {
    if (!settingsUnsavedToastActive || settingsUnsavedToastTimer) return;
    if (settingsUnsavedToastPausedByWindowBlur || settingsUnsavedToastPausedByVisibility) return;
    if (settingsUnsavedToastTouchActive) return;
    if (typeof document.hasFocus === "function" && !document.hasFocus()) return;

    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) return;
    const activeEl = document.activeElement;
    if (typeof toastEl.matches === "function" && toastEl.matches(":hover")) return;
    if (activeEl && toastEl.contains(activeEl)) return;

    scheduleSettingsUnsavedToastAutoClose(
        settingsUnsavedToastRemainingMs || SETTINGS_UNSAVED_TOAST_DURATION_MS
    );
}

function updateSettingsUnsavedToastReturnFocus(event) {
    const toastEl = document.getElementById("settings-unsaved-toast");
    const candidate = event && event.relatedTarget;
    if (event && event.currentTarget && event.currentTarget !== toastEl) {
        return;
    }
    if (!toastEl || !toastEl.isConnected || !candidate || !toastEl.contains(candidate)) {
        return;
    }
    if (!candidate.isConnected) {
        return;
    }
    if (typeof candidate.focus !== "function") {
        return;
    }

    settingsUnsavedToastReturnFocusEl = candidate;
}

function handleSettingsUnsavedToastFocusIn(event) {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    updateSettingsUnsavedToastReturnFocus(event);
    pauseSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastFocusOut(event) {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    if (event && event.relatedTarget && toastEl.contains(event.relatedTarget)) {
        return;
    }

    resumeSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastTouchStart() {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    settingsUnsavedToastTouchActive = true;
    pauseSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastTouchEnd() {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    settingsUnsavedToastTouchActive = false;
    resumeSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastTouchCancel() {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    settingsUnsavedToastTouchActive = false;
    resumeSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastVisibilityChange() {
    if (!settingsUnsavedToastActive) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }

    if (document.hidden) {
        settingsUnsavedToastPausedByWindowBlur = false;
        settingsUnsavedToastPausedByVisibility = !!settingsUnsavedToastTimer;
        pauseSettingsUnsavedToastAutoClose();
        return;
    }

    if (!settingsUnsavedToastPausedByVisibility) return;
    if (typeof document.hasFocus === "function" && !document.hasFocus()) return;
    settingsUnsavedToastPausedByVisibility = false;
    resumeSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastWindowBlur() {
    if (!settingsUnsavedToastActive) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    if (document.hidden || settingsUnsavedToastPausedByVisibility) return;

    settingsUnsavedToastPausedByVisibility = false;
    settingsUnsavedToastPausedByWindowBlur = !!settingsUnsavedToastTimer;
    pauseSettingsUnsavedToastAutoClose();
}

function handleSettingsUnsavedToastWindowFocus() {
    if (!settingsUnsavedToastActive || document.hidden) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) {
        return;
    }
    if (typeof document.hasFocus === "function" && !document.hasFocus()) return;

    if (settingsUnsavedToastPausedByVisibility) {
        settingsUnsavedToastPausedByVisibility = false;
        resumeSettingsUnsavedToastAutoClose();
        return;
    }

    if (!settingsUnsavedToastPausedByWindowBlur) return;
    settingsUnsavedToastPausedByWindowBlur = false;
    resumeSettingsUnsavedToastAutoClose();
}

function finalizeSettingsUnsavedToastDisplay() {
    const toastSequenceAtFinalize = ++settingsUnsavedToastSequence;
    const toastEl = document.getElementById("settings-unsaved-toast");
    const activeEl = document.activeElement;
    const shouldRestoreFocus = !!(
        toastEl
        && toastEl.isConnected
        && activeEl
        && toastEl.contains(activeEl)
        && settingsUnsavedToastReturnFocusEl
        && settingsUnsavedToastReturnFocusEl.isConnected
        && typeof settingsUnsavedToastReturnFocusEl.focus === "function"
        && !toastEl.contains(settingsUnsavedToastReturnFocusEl)
    );

    if (settingsUnsavedToastTimer) {
        clearTimeout(settingsUnsavedToastTimer);
        settingsUnsavedToastTimer = null;
    }

    if (toastEl && toastEl.isConnected) {
        toastEl.classList.add("hidden");
        toastEl.setAttribute("aria-hidden", "true");
        toastEl.setAttribute("tabindex", "-1");
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");
    }

    settingsUnsavedToastActive = false;
    settingsUnsavedToastCurrent = null;
    settingsUnsavedToastDeadlineMs = 0;
    settingsUnsavedToastRemainingMs = 0;
    settingsUnsavedToastPausedByWindowBlur = false;
    settingsUnsavedToastPausedByVisibility = false;
    settingsUnsavedToastTouchActive = false;
    if (shouldRestoreFocus) {
        const restoreTarget = settingsUnsavedToastReturnFocusEl;
        requestAnimationFrame(() => {
            if (toastSequenceAtFinalize !== settingsUnsavedToastSequence) return;
            if (restoreTarget && restoreTarget.isConnected) {
                if (typeof restoreTarget.focus !== "function") return;
                try {
                    restoreTarget.focus();
                } catch (error) {
                    // Ignore rare focus failures when the previous target becomes temporarily unfocusable.
                }
            }
        });
    }
    settingsUnsavedToastReturnFocusEl = null;
    setSettingsUnsavedToastProgress(0);
    updateSettingsUnsavedToastQueueBadge();
    updateSettingsUnsavedToastAriaLabel();
    processSettingsUnsavedToastQueue();
}

function dismissSettingsUnsavedToast(event) {
    if (!settingsUnsavedToastActive) return;
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || !toastEl.isConnected) return;

    if (event && event.type === "keydown") {
        if (shouldIgnoreSettingsUnsavedKeydownEvent(event)) {
            return;
        }
        const isDismissKey = isSettingsUnsavedToastDismissKey(event);
        if (event.repeat) {
            return;
        }

        if (!isDismissKey) {
            return;
        }
        event.preventDefault();
    }

    finalizeSettingsUnsavedToastDisplay();
}

function isSettingsUnsavedToastSpaceKey(event) {
    if (!event) return false;
    const key = event.key;
    const code = event.code;
    const keyIdentifier = event.keyIdentifier;
    return key === " "
        || key === "Space"
        || key === "Spacebar"
        || code === "Space"
        || keyIdentifier === "Spacebar"
        || keyIdentifier === "U+0020"
        || event.keyCode === 32
        || event.which === 32;
}

function isSettingsUnsavedToastEnterKey(event) {
    if (!event) return false;
    const key = event.key;
    const code = event.code;
    const keyIdentifier = event.keyIdentifier;
    return key === "Enter"
        || key === "Return"
        || code === "Enter"
        || code === "NumpadEnter"
        || keyIdentifier === "Enter"
        || keyIdentifier === "U+000D"
        || event.keyCode === 13
        || event.which === 13;
}

function isSettingsUnsavedToastEscapeKey(event) {
    if (!event) return false;
    const key = event.key;
    const code = event.code;
    const keyIdentifier = event.keyIdentifier;
    return key === "Escape"
        || key === "Esc"
        || code === "Escape"
        || keyIdentifier === "Escape"
        || keyIdentifier === "U+001B"
        || event.keyCode === 27
        || event.which === 27;
}

function hasSettingsUnsavedModifierKeys(event) {
    if (!event) return false;
    let hasAltGraph = false;
    if (typeof event.getModifierState === "function") {
        try {
            hasAltGraph = !!event.getModifierState("AltGraph");
        } catch (error) {
            hasAltGraph = false;
        }
    }
    return event.ctrlKey || event.altKey || event.metaKey || hasAltGraph;
}

function isSettingsUnsavedTabKey(event) {
    if (!event) return false;
    const keyIdentifier = event.keyIdentifier;
    return event.key === "Tab"
        || event.code === "Tab"
        || keyIdentifier === "Tab"
        || keyIdentifier === "U+0009"
        || event.keyCode === 9
        || event.which === 9;
}

function shouldIgnoreSettingsUnsavedKeydownEvent(event) {
    if (!event) return true;
    if (event.defaultPrevented) return true;
    if (event.currentTarget && event.currentTarget.isConnected === false) return true;
    if (event.target && event.target.isConnected === false) return true;
    if (event.isComposing) return true;
    if (event.key === "Process" || event.code === "Process" || event.keyIdentifier === "Process" || event.keyIdentifier === "U+E00C" || event.keyCode === 229 || event.which === 229) return true;
    return hasSettingsUnsavedModifierKeys(event);
}

function isSettingsUnsavedToastDismissKey(event) {
    if (!event) return false;
    return isSettingsUnsavedToastEnterKey(event)
        || isSettingsUnsavedToastSpaceKey(event)
        || isSettingsUnsavedToastEscapeKey(event);
}

function handleSettingsUnsavedToastCloseButtonKeydown(event) {
    if (!event) return;
    if (shouldIgnoreSettingsUnsavedKeydownEvent(event)) return;
    if (event.repeat) return;
    const isDismissKey = isSettingsUnsavedToastDismissKey(event);
    const isEscape = isSettingsUnsavedToastEscapeKey(event);

    if (isEscape) {
        event.stopPropagation();
        dismissSettingsUnsavedToast(event);
        return;
    }

    if (isDismissKey) {
        event.stopPropagation();
    }
}

function processSettingsUnsavedToastQueue() {
    const toastEl = document.getElementById("settings-unsaved-toast");
    if (!toastEl || settingsUnsavedToastActive) return;
    if (!toastEl.isConnected) return;

    const activeEl = document.activeElement;
    if (activeEl && activeEl.isConnected && !toastEl.contains(activeEl) && typeof activeEl.focus === "function") {
        settingsUnsavedToastReturnFocusEl = activeEl;
    }

    const next = settingsUnsavedToastQueue.shift();
    updateSettingsUnsavedToastQueueBadge();
    updateSettingsUnsavedToastAriaLabel();
    if (!next) return;

    settingsUnsavedToastActive = true;
    settingsUnsavedToastCurrent = next;
    const toastSequenceAtShow = ++settingsUnsavedToastSequence;
    updateSettingsUnsavedToastAriaLabel();
    const { message, tone } = next;

    const isSuccess = tone === "success";
    const progressEl = document.getElementById("settings-unsaved-toast-progress");
    toastEl.setAttribute("aria-live", isSuccess ? "polite" : "assertive");
    toastEl.setAttribute("role", isSuccess ? "status" : "alert");
    toastEl.classList.toggle("border-amber-500/40", !isSuccess);
    toastEl.classList.toggle("bg-amber-900/30", !isSuccess);
    toastEl.classList.toggle("text-amber-200", !isSuccess);
    toastEl.classList.toggle("border-emerald-500/40", isSuccess);
    toastEl.classList.toggle("bg-emerald-900/30", isSuccess);
    toastEl.classList.toggle("text-emerald-200", isSuccess);
    toastEl.setAttribute("aria-hidden", "false");
    toastEl.setAttribute("tabindex", "0");
    if (progressEl && progressEl.isConnected) {
        progressEl.classList.toggle("bg-amber-300/80", !isSuccess);
        progressEl.classList.toggle("bg-emerald-300/80", isSuccess);
    }

    const messageEl = document.getElementById("settings-unsaved-toast-message");
    if (messageEl && messageEl.isConnected) {
        messageEl.textContent = "";
    } else {
        toastEl.textContent = "";
    }

    toastEl.classList.remove("hidden");
    requestAnimationFrame(() => {
        if (toastSequenceAtShow !== settingsUnsavedToastSequence) return;
        if (!settingsUnsavedToastActive) return;
        if (!toastEl || !toastEl.isConnected) {
            return;
        }
        if (messageEl && messageEl.isConnected && toastEl.contains(messageEl)) {
            messageEl.textContent = message;
        } else {
            toastEl.textContent = message;
        }
    });

    scheduleSettingsUnsavedToastAutoClose(SETTINGS_UNSAVED_TOAST_DURATION_MS);
}

function showSettingsUnsavedToast(message, tone = "warn") {
    const firstQueued = settingsUnsavedToastQueue.length
        ? settingsUnsavedToastQueue[0]
        : null;
    const lastQueued = settingsUnsavedToastQueue.length
        ? settingsUnsavedToastQueue[settingsUnsavedToastQueue.length - 1]
        : null;

    if (settingsUnsavedToastCurrent && settingsUnsavedToastCurrent.message === message && settingsUnsavedToastCurrent.tone === tone) {
        return;
    }

    if (lastQueued && lastQueued.message === message && lastQueued.tone === tone) {
        return;
    }

    if (firstQueued && firstQueued.message === message && firstQueued.tone === tone) {
        return;
    }

    const nextToast = { message, tone };

    if (tone === "warn") {
        settingsUnsavedToastQueue.unshift(nextToast);
    } else {
        settingsUnsavedToastQueue.push(nextToast);
    }

    if (settingsUnsavedToastQueue.length > SETTINGS_UNSAVED_TOAST_QUEUE_LIMIT) {
        if (tone === "warn") {
            settingsUnsavedToastQueue.pop();
        } else {
            settingsUnsavedToastQueue.shift();
        }
    }

    updateSettingsUnsavedToastQueueBadge();
    updateSettingsUnsavedToastAriaLabel();
    processSettingsUnsavedToastQueue();
}

function updateSettingsUnsavedModalDiffSummary() {
    const goodRowEl = document.getElementById("settings-unsaved-diff-good-row");
    const warnRowEl = document.getElementById("settings-unsaved-diff-warn-row");
    const goodDiffEl = document.getElementById("settings-unsaved-diff-good");
    const warnDiffEl = document.getElementById("settings-unsaved-diff-warn");
    const previewEl = document.getElementById("settings-unsaved-preview-status");
    const tooltipPreviewEl = document.getElementById("settings-unsaved-preview-tooltip");
    if (!goodRowEl || !warnRowEl || !goodDiffEl || !warnDiffEl || !previewEl || !tooltipPreviewEl) return;
    if (!goodRowEl.isConnected || !warnRowEl.isConnected || !goodDiffEl.isConnected || !warnDiffEl.isConnected || !previewEl.isConnected || !tooltipPreviewEl.isConnected) return;

    const persisted = getNormalizedLatencyThresholds(cache.settings || {});
    const goodInputEl = document.getElementById("setting-audit-latency-good-max");
    const warnInputEl = document.getElementById("setting-audit-latency-warn-max");
    const current = getNormalizedLatencyThresholds({
        auditLatencyGoodMaxMs: goodInputEl ? goodInputEl.value : persisted.good,
        auditLatencyWarnMaxMs: warnInputEl ? warnInputEl.value : persisted.warn
    });

    goodDiffEl.textContent = `${persisted.good} -> ${current.good}`;
    warnDiffEl.textContent = `${persisted.warn} -> ${current.warn}`;

    const goodChanged = persisted.good !== current.good;
    const warnChanged = persisted.warn !== current.warn;

    goodRowEl.classList.toggle("bg-amber-500/10", goodChanged);
    goodRowEl.classList.toggle("border", goodChanged);
    goodRowEl.classList.toggle("border-amber-500/30", goodChanged);

    warnRowEl.classList.toggle("bg-amber-500/10", warnChanged);
    warnRowEl.classList.toggle("border", warnChanged);
    warnRowEl.classList.toggle("border-amber-500/30", warnChanged);

    const avg = auditLatencyHistory.length
        ? Math.round(auditLatencyHistory.reduce((acc, value) => acc + value, 0) / auditLatencyHistory.length)
        : 0;

    previewEl.classList.remove("text-emerald-300", "text-amber-300", "text-red-300", "text-gray-200");

    if (!avg) {
        previewEl.classList.add("text-gray-200");
        previewEl.textContent = "немає даних";
        tooltipPreviewEl.textContent = `Пороги: до ${current.good}ms - добре, ${current.good + 1}-${current.warn}ms - помірно, понад ${current.warn}ms - повільно. Поточний стан: немає даних.`;
        return;
    }

    if (avg <= current.good) {
        previewEl.classList.add("text-emerald-300");
        previewEl.textContent = `добре (${avg} ms)`;
        tooltipPreviewEl.textContent = `Пороги: до ${current.good}ms - добре, ${current.good + 1}-${current.warn}ms - помірно, понад ${current.warn}ms - повільно. Поточний стан: добре (${avg} ms).`;
        return;
    }

    if (avg <= current.warn) {
        previewEl.classList.add("text-amber-300");
        previewEl.textContent = `помірно (${avg} ms)`;
        tooltipPreviewEl.textContent = `Пороги: до ${current.good}ms - добре, ${current.good + 1}-${current.warn}ms - помірно, понад ${current.warn}ms - повільно. Поточний стан: помірно (${avg} ms).`;
        return;
    }

    previewEl.classList.add("text-red-300");
    previewEl.textContent = `повільно (${avg} ms)`;
    tooltipPreviewEl.textContent = `Пороги: до ${current.good}ms - добре, ${current.good + 1}-${current.warn}ms - помірно, понад ${current.warn}ms - повільно. Поточний стан: повільно (${avg} ms).`;
}

function isSettingsUnsavedModalOpen() {
    const modalEl = document.getElementById("settings-unsaved-modal");
    return !!modalEl && modalEl.isConnected && !modalEl.classList.contains("hidden");
}

function getSettingsUnsavedModalFocusableElements() {
    const modalEl = document.getElementById("settings-unsaved-modal");
    if (!modalEl || !modalEl.isConnected) return [];

    return Array.from(modalEl.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
    .filter((el) => el.isConnected && typeof el.focus === "function" && !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
}

function handleSettingsUnsavedModalKeyboard(event) {
    if (!isSettingsUnsavedModalOpen()) return;
    if (event && event.target && event.target.isConnected === false) return;
    if (shouldIgnoreSettingsUnsavedKeydownEvent(event)) return;

    const isEscape = isSettingsUnsavedToastEscapeKey(event);
    if (isEscape) {
        if (event.repeat) return;
        event.preventDefault();
        resolveSettingsUnsavedNavigation("cancel");
        return;
    }

    const isTab = isSettingsUnsavedTabKey(event);
    if (!isTab) return;
    if (event.repeat) return;

    const focusable = getSettingsUnsavedModalFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
        if (active === first || !focusable.includes(active)) {
            event.preventDefault();
            if (!last || !last.isConnected) return;
            if (typeof last.focus !== "function") return;
            try {
                last.focus();
            } catch (error) {
                // Ignore focus failures when the modal re-renders during keyboard navigation.
            }
        }
        return;
    }

    if (active === last || !focusable.includes(active)) {
        event.preventDefault();
        if (!first || !first.isConnected) return;
        if (typeof first.focus !== "function") return;
        try {
            first.focus();
        } catch (error) {
            // Ignore focus failures when the modal re-renders during keyboard navigation.
        }
    }
}

function showSettingsUnsavedNavigationModal() {
    const modalSequenceAtShow = ++settingsUnsavedModalSequence;
    const modalEl = document.getElementById("settings-unsaved-modal");
    if (!modalEl || !modalEl.isConnected) {
        return Promise.resolve("cancel");
    }

    if (settingsUnsavedModalResolver) {
        const resolvePrevious = settingsUnsavedModalResolver;
        settingsUnsavedModalResolver = null;
        resolvePrevious("cancel");
    }

    updateSettingsUnsavedModalDiffSummary();
    settingsUnsavedModalPreviousFocus = document.activeElement;
    modalEl.classList.remove("hidden");

    const primaryBtn = document.getElementById("settings-unsaved-save-btn");
    if (primaryBtn) {
        requestAnimationFrame(() => {
            if (modalSequenceAtShow !== settingsUnsavedModalSequence) return;
            if (!modalEl.isConnected) return;
            if (!isSettingsUnsavedModalOpen()) return;
            if (!primaryBtn.isConnected) return;
            if (!modalEl.contains(primaryBtn)) return;
            if (typeof primaryBtn.focus !== "function") return;
            try {
                primaryBtn.focus();
            } catch (error) {
                // Ignore focus failures caused by transient browser state.
            }
        });
    }

    return new Promise((resolve) => {
        settingsUnsavedModalResolver = resolve;
    });
}

function resolveSettingsUnsavedNavigation(action) {
    const modalSequenceAtResolve = ++settingsUnsavedModalSequence;
    const modalEl = document.getElementById("settings-unsaved-modal");
    if (modalEl && modalEl.isConnected) {
        modalEl.classList.add("hidden");
    }

    if (settingsUnsavedModalPreviousFocus && typeof settingsUnsavedModalPreviousFocus.focus === "function") {
        const previous = settingsUnsavedModalPreviousFocus;
        settingsUnsavedModalPreviousFocus = null;
        requestAnimationFrame(() => {
            if (modalSequenceAtResolve !== settingsUnsavedModalSequence) return;
            if (!previous || !previous.isConnected) return;
            if (typeof previous.focus !== "function") return;
            if (modalEl && modalEl.isConnected && modalEl.contains(previous)) return;
            try {
                previous.focus();
            } catch (error) {
                // Ignore rare focus failures when browser blocks or element state changes mid-frame.
            }
        });
    }

    if (settingsUnsavedModalResolver) {
        const resolve = settingsUnsavedModalResolver;
        settingsUnsavedModalResolver = null;
        resolve(action || "cancel");
    }
}

function handleSettingsUnsavedBackdropClick(event) {
    if (!isSettingsUnsavedModalOpen()) return;
    if (!event || event.defaultPrevented) return;
    if (event.currentTarget && event.currentTarget.isConnected === false) return;
    if (event.target && event.target.isConnected === false) return;
    if (event.currentTarget && event.currentTarget.id !== "settings-unsaved-modal") return;
    if (typeof event.button === "number" && event.button !== 0) return;
    if (event.currentTarget && event.target !== event.currentTarget) return;
    if (event.target?.id !== "settings-unsaved-modal") return;
    resolveSettingsUnsavedNavigation("cancel");
}

function syncAuditLatencyThresholdsDirtyState() {
    const goodInputEl = document.getElementById("setting-audit-latency-good-max");
    const warnInputEl = document.getElementById("setting-audit-latency-warn-max");
    if (!goodInputEl || !warnInputEl) return;
    if (!goodInputEl.isConnected || !warnInputEl.isConnected) return;

    const current = getNormalizedLatencyThresholds({
        auditLatencyGoodMaxMs: goodInputEl.value,
        auditLatencyWarnMaxMs: warnInputEl.value
    });
    const persisted = getNormalizedLatencyThresholds(cache.settings || {});

    const isDirty = current.good !== persisted.good || current.warn !== persisted.warn;
    setAuditLatencyThresholdsDirtyState(isDirty);
}

function handleAuditLatencyThresholdInputsChanged() {
    const goodInputEl = document.getElementById("setting-audit-latency-good-max");
    const warnInputEl = document.getElementById("setting-audit-latency-warn-max");
    if (!goodInputEl || !warnInputEl) return;
    if (!goodInputEl.isConnected || !warnInputEl.isConnected) return;

    const current = getNormalizedLatencyThresholds({
        auditLatencyGoodMaxMs: goodInputEl.value,
        auditLatencyWarnMaxMs: warnInputEl.value
    });

    applyAuditLatencyThresholds({
        auditLatencyGoodMaxMs: current.good,
        auditLatencyWarnMaxMs: current.warn
    });

    syncAuditLatencyThresholdsDirtyState();
}

function applyAuditLatencyThresholds(settings = {}) {
    const { good: nextGood, warn: nextWarn } = getNormalizedLatencyThresholds(settings);

    auditLatencyGoodMaxMs = nextGood;
    auditLatencyWarnMaxMs = nextWarn;

    const avgLatencyEl = document.getElementById("audit-avg-latency");
    if (avgLatencyEl && avgLatencyEl.isConnected) {
        avgLatencyEl.setAttribute("title", getAuditLatencyThresholdHint());
    }

    renderAuditLatencyLegend();

    const sum = auditLatencyHistory.reduce((acc, value) => acc + value, 0);
    const avg = auditLatencyHistory.length ? Math.round(sum / auditLatencyHistory.length) : 0;
    updateAuditLatencyIndicator(avg);
}

async function loadAuditLatencyThresholdsFromSettings() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during audit latency thresholds load");
        if (sectionNavigationSeq !== navigationSeqAtLoad) return;
        if (currentSection !== sectionAtLoad) return;
        applyAuditLatencyThresholds({});
        return;
    }
    try {
        const settings = await getCollectionMethod.call(adapter, "settings");
        if (sectionNavigationSeq !== navigationSeqAtLoad) return;
        if (currentSection !== sectionAtLoad) return;
        applyAuditLatencyThresholds(settings || {});
    } catch (error) {
        console.warn("Failed to load audit latency thresholds from settings", error);
        if (sectionNavigationSeq !== navigationSeqAtLoad) return;
        if (currentSection !== sectionAtLoad) return;
        applyAuditLatencyThresholds({});
    }
}

function getAuditLatencyThresholdHint() {
    return `Пороги: до ${auditLatencyGoodMaxMs}ms - добре, ${auditLatencyGoodMaxMs + 1}-${auditLatencyWarnMaxMs}ms - помірно, понад ${auditLatencyWarnMaxMs}ms - повільно`;
}

function renderAuditLatencyLegend() {
    const goodEl = document.getElementById("audit-latency-legend-good");
    const warnEl = document.getElementById("audit-latency-legend-warn");
    const slowEl = document.getElementById("audit-latency-legend-slow");
    if (goodEl && goodEl.isConnected) goodEl.textContent = `добре: <= ${auditLatencyGoodMaxMs}ms`;
    if (warnEl && warnEl.isConnected) warnEl.textContent = `помірно: ${auditLatencyGoodMaxMs + 1}-${auditLatencyWarnMaxMs}ms`;
    if (slowEl && slowEl.isConnected) slowEl.textContent = `повільно: > ${auditLatencyWarnMaxMs}ms`;
}

function saveAuditUiState() {
    const {
        searchRaw,
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo
    } = getNormalizedAuditFilters();
    const datePresetEl = document.getElementById("audit-date-preset");
    const ecoModeEl = document.getElementById("audit-eco-mode");
    const limitEl = document.getElementById("audit-limit");
    const refreshEl = document.getElementById("audit-refresh-interval");
    const normalizedLimit = normalizeAuditLimitControlValue(limitEl);
    const normalizedRefreshInterval = normalizeAuditRefreshControlValue(refreshEl);

    const state = {
        search: searchRaw,
        action: actionFilter,
        entity: entityFilter,
        dateFrom,
        dateTo,
        datePreset: datePresetEl && datePresetEl.isConnected ? normalizeAuditDatePreset(datePresetEl.value, "all") : "all",
        ecoMode: ecoModeEl && ecoModeEl.isConnected ? !!ecoModeEl.checked : false,
        limit: String(normalizedLimit),
        refreshInterval: String(normalizedRefreshInterval),
        page: normalizeAuditPage(auditPage)
    };

    try {
        sessionStorage.setItem(AUDIT_UI_STATE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn("Failed to persist audit UI state", error);
    }
}

function loadAuditUiState() {
    try {
        const raw = sessionStorage.getItem(AUDIT_UI_STATE_KEY);
        if (!raw) return;

        const state = JSON.parse(raw);
        const searchEl = document.getElementById("audit-search");
        const actionEl = document.getElementById("audit-filter-action");
        const entityEl = document.getElementById("audit-filter-entity");
        const dateFromEl = document.getElementById("audit-date-from");
        const dateToEl = document.getElementById("audit-date-to");
        const datePresetEl = document.getElementById("audit-date-preset");
        const ecoModeEl = document.getElementById("audit-eco-mode");
        const limitEl = document.getElementById("audit-limit");
        const refreshEl = document.getElementById("audit-refresh-interval");

        if (searchEl && searchEl.isConnected) {
            searchEl.value = typeof state.search === "string" ? state.search : "";
        }
        if (actionEl && actionEl.isConnected) {
            actionEl.value = typeof state.action === "string" ? state.action : "all";
        }
        if (entityEl && entityEl.isConnected) {
            entityEl.value = typeof state.entity === "string" ? state.entity : "all";
        }
        if (dateFromEl && dateFromEl.isConnected) {
            dateFromEl.value = typeof state.dateFrom === "string" ? state.dateFrom : "";
        }
        if (dateToEl && dateToEl.isConnected) {
            dateToEl.value = typeof state.dateTo === "string" ? state.dateTo : "";
        }
        if (datePresetEl && datePresetEl.isConnected) {
            datePresetEl.value = normalizeAuditDatePreset(state.datePreset, "all");
        }
        if (ecoModeEl && ecoModeEl.isConnected) ecoModeEl.checked = !!state.ecoMode;
        if (limitEl && limitEl.isConnected) {
            limitEl.value = String(normalizeAuditLimit(state.limit, AUDIT_PAGE_SIZE));
            normalizeAuditLimitControlValue(limitEl);
        }
        if (refreshEl && refreshEl.isConnected) {
            refreshEl.value = String(normalizeAuditRefreshSeconds(state.refreshInterval));
            normalizeAuditRefreshControlValue(refreshEl);
        }
        getNormalizedAuditFilters();
        auditPage = normalizeAuditPage(state.page, 1);
    } catch (error) {
        console.warn("Failed to restore audit UI state", error);
    }
}

function stopAuditAutoRefresh() {
    if (auditAutoRefreshTimer) {
        clearInterval(auditAutoRefreshTimer);
        auditAutoRefreshTimer = null;
    }

    if (auditRefreshCountdownTimer) {
        clearInterval(auditRefreshCountdownTimer);
        auditRefreshCountdownTimer = null;
    }

    auditRefreshRemainingSec = 0;

    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    updateAuditRefreshBadge();
}

function cancelAuditRequest() {
    auditRequestSeq += 1;
    if (auditRequestController) {
        auditRequestController.abort();
        auditRequestController = null;
    }
}

function isAbortError(error) {
    return !!(error && (error.name === "AbortError" || String(error.message || "").toLowerCase().includes("aborted")));
}

function getAuditRefreshSeconds() {
    const intervalEl = document.getElementById("audit-refresh-interval");
    return normalizeAuditRefreshControlValue(intervalEl);
}

function isAuditEcoModeEnabled() {
    const ecoModeEl = document.getElementById("audit-eco-mode");
    if (!ecoModeEl || !ecoModeEl.isConnected) return false;
    return !!ecoModeEl.checked;
}

function updateAuditRefreshBadge() {
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const badge = document.getElementById("audit-refresh-status");
    if (!badge) return;
    if (!badge.isConnected) return;

    const seconds = getAuditRefreshSeconds();
    if (!seconds) {
        badge.textContent = "Автооновлення: вимкнено";
        return;
    }

    if (isAuditEcoModeEnabled()) {
        badge.textContent = `Автооновлення: економний режим (вручну, інтервал ${seconds}с)`;
        return;
    }

    if (currentSection === "audit" && document.hidden) {
        badge.textContent = `Автооновлення: пауза (вкладка неактивна, інтервал ${seconds}с)`;
        return;
    }

    if (currentSection === "audit" && auditRefreshRemainingSec > 0) {
        badge.textContent = `Автооновлення: через ${auditRefreshRemainingSec}с (кожні ${seconds}с)`;
        return;
    }

    badge.textContent = `Автооновлення: кожні ${seconds}с`;
}

function resetAuditRefreshCountdown(seconds) {
    if (!seconds) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    auditRefreshRemainingSec = seconds;
    updateAuditRefreshBadge();
}

function setupAuditAutoRefresh() {
    const sectionAtSetup = currentSection;
    const navigationSeqAtSetup = sectionNavigationSeq;
    stopAuditAutoRefresh();

    if (currentSection !== sectionAtSetup) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    updateAuditRefreshBadge();
    saveAuditUiState();

    const seconds = getAuditRefreshSeconds();
    if (!seconds || document.hidden || isAuditEcoModeEnabled()) return;

    if (currentSection !== sectionAtSetup) return;
    if (currentSection !== "audit") return;
    if (!auditSectionEl.isConnected) return;

    resetAuditRefreshCountdown(seconds);

    auditRefreshCountdownTimer = setInterval(() => {
        if (sectionNavigationSeq !== navigationSeqAtSetup) {
            stopAuditAutoRefresh();
            return;
        }
        if (currentSection !== sectionAtSetup || currentSection !== "audit" || !auditSectionEl.isConnected) {
            stopAuditAutoRefresh();
            return;
        }
        auditRefreshRemainingSec = Math.max(0, auditRefreshRemainingSec - 1);
        updateAuditRefreshBadge();
    }, 1000);

    auditAutoRefreshTimer = setInterval(() => {
        if (sectionNavigationSeq !== navigationSeqAtSetup) {
            stopAuditAutoRefresh();
            return;
        }
        if (currentSection !== sectionAtSetup || currentSection !== "audit" || !auditSectionEl.isConnected) {
            stopAuditAutoRefresh();
            return;
        }
        resetAuditRefreshCountdown(seconds);
        loadAuditLogs().catch((error) => {
            if (sectionNavigationSeq !== navigationSeqAtSetup) return;
            if (currentSection !== sectionAtSetup) return;
            if (currentSection !== "audit") return;
            if (!auditSectionEl.isConnected) return;
            if (isAbortError(error)) return;
            console.error("Audit auto-refresh failed", error);
        });
    }, seconds * 1000);
}

function handleAuditVisibilityChange() {
    const sectionAtVisibility = currentSection;
    const navigationSeqAtVisibility = sectionNavigationSeq;
    handleSettingsUnsavedToastVisibilityChange();

    if (currentSection !== "audit") return;
    if (currentSection !== sectionAtVisibility) return;

    if (document.hidden) {
        cancelAuditRequest();
        stopAuditAutoRefresh();
        updateAuditRefreshBadge();
        return;
    }

    if (currentSection !== sectionAtVisibility) return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    if (sectionNavigationSeq !== navigationSeqAtVisibility) return;

    setupAuditAutoRefresh();
    if (sectionNavigationSeq !== navigationSeqAtVisibility) return;
    loadAuditLogs().catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtVisibility) return;
        if (currentSection !== sectionAtVisibility) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        handleAuditLoadError(error, "Не вдалося оновити аудит після повернення на вкладку.");
    });
}

function toggleAuditEcoMode() {
    const sectionAtToggle = currentSection;
    const navigationSeqAtToggle = sectionNavigationSeq;
    if (currentSection !== sectionAtToggle) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    saveAuditUiState();
    setupAuditAutoRefresh();
    if (sectionNavigationSeq !== navigationSeqAtToggle) return;
    if (currentSection !== sectionAtToggle) return;
    if (currentSection !== "audit") return;
    if (!auditSectionEl.isConnected) return;
    updateAuditRefreshBadge();
}

function showApiStatus(message) {
    const statusEl = document.getElementById("api-status");
    if (!statusEl) return;
    if (!statusEl.isConnected) return;
    statusEl.textContent = message;
    statusEl.classList.remove("hidden");
}

function hideApiStatus() {
    const statusEl = document.getElementById("api-status");
    if (!statusEl) return;
    if (!statusEl.isConnected) return;
    statusEl.classList.add("hidden");
}

function showAuditError(message) {
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const el = document.getElementById("audit-error");
    if (!el) return;
    if (!el.isConnected) return;
    el.textContent = message;
    el.classList.remove("hidden");
}

function hideAuditError() {
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const el = document.getElementById("audit-error");
    if (!el) return;
    if (!el.isConnected) return;
    el.textContent = "";
    el.classList.add("hidden");
}

function renderAuditSkeleton() {
    const listEl = document.getElementById("audit-list");
    const paginationEl = document.getElementById("audit-pagination");
    if (!listEl || !listEl.isConnected) return;

    listEl.innerHTML = Array.from({ length: 3 }).map(() => `
        <div class="card p-4 rounded animate-pulse">
            <div class="h-4 bg-cyan-500/20 rounded w-1/3 mb-3"></div>
            <div class="h-3 bg-gray-600/40 rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-gray-600/30 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-gray-600/30 rounded w-5/6"></div>
        </div>
    `).join("");

    if (paginationEl && paginationEl.isConnected) {
        paginationEl.innerHTML = "";
    }
}

function setAuditLoading(isLoading) {
    if (isLoading && currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const el = document.getElementById("audit-loading");
    const listEl = document.getElementById("audit-list");
    if (!el || !el.isConnected) return;
    el.classList.toggle("hidden", !isLoading);

    if (listEl && listEl.isConnected) {
        listEl.setAttribute("aria-busy", isLoading ? "true" : "false");
    }

    if (isLoading && listEl && listEl.isConnected) {
        renderAuditSkeleton();
    }
}

function updateAuditShortcutHint() {
    const hintEl = document.getElementById("audit-shortcut-hint");
    if (!hintEl) return;
    if (!hintEl.isConnected) return;

    hintEl.textContent = `Підказка: ${getAuditShortcutLabel()} для швидкого оновлення`;
}

function getAuditShortcutLabel() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") || /Mac/i.test(navigator.userAgent || "");
    return isMac ? "Cmd+R" : "Ctrl+R";
}

function updateAuditLatencyIndicator(avgMs) {
    const dotEl = document.getElementById("audit-latency-dot");
    const avgLatencyEl = document.getElementById("audit-avg-latency");
    if (!dotEl || !avgLatencyEl) return;
    if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;

    const baseHint = getAuditLatencyThresholdHint();

    if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;

    dotEl.classList.remove("bg-emerald-400", "bg-amber-400", "bg-red-400", "bg-gray-500/70");
    avgLatencyEl.classList.remove("text-emerald-300", "text-amber-300", "text-red-300");

    if (!Number.isFinite(avgMs) || avgMs <= 0) {
        if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;
        dotEl.classList.add("bg-gray-500/70");
        avgLatencyEl.setAttribute("title", `${baseHint}. Поточний стан: немає даних.`);
        dotEl.setAttribute("aria-label", "Індикатор затримки: немає даних");
        return;
    }

    if (avgMs <= auditLatencyGoodMaxMs) {
        if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;
        dotEl.classList.add("bg-emerald-400");
        avgLatencyEl.classList.add("text-emerald-300");
        avgLatencyEl.setAttribute("title", `${baseHint}. Поточний стан: добре (${avgMs} ms).`);
        dotEl.setAttribute("aria-label", `Індикатор затримки: добре, ${avgMs} мс`);
        return;
    }

    if (avgMs <= auditLatencyWarnMaxMs) {
        if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;
        dotEl.classList.add("bg-amber-400");
        avgLatencyEl.classList.add("text-amber-300");
        avgLatencyEl.setAttribute("title", `${baseHint}. Поточний стан: помірно (${avgMs} ms).`);
        dotEl.setAttribute("aria-label", `Індикатор затримки: помірно, ${avgMs} мс`);
        return;
    }

    if (!dotEl.isConnected || !avgLatencyEl.isConnected) return;
    dotEl.classList.add("bg-red-400");
    avgLatencyEl.classList.add("text-red-300");
    avgLatencyEl.setAttribute("title", `${baseHint}. Поточний стан: повільно (${avgMs} ms).`);
    dotEl.setAttribute("aria-label", `Індикатор затримки: повільно, ${avgMs} мс`);
}

function showAuditShortcutToast(message) {
    const sectionAtToast = currentSection;
    const toastSequenceAtSchedule = ++auditShortcutToastSequence;
    const toastEl = document.getElementById("audit-shortcut-toast");
    if (!toastEl) return;
    if (!toastEl.isConnected) return;

    // Reset text first so screen readers re-announce identical consecutive messages.
    toastEl.textContent = "";
    toastEl.classList.remove("hidden");
    requestAnimationFrame(() => {
        if (toastSequenceAtSchedule !== auditShortcutToastSequence) return;
        if (currentSection !== sectionAtToast) return;
        if (currentSection !== "audit") return;
        if (!toastEl.isConnected) return;
        toastEl.textContent = message;
    });

    if (auditShortcutToastTimer) {
        clearTimeout(auditShortcutToastTimer);
        auditShortcutToastTimer = null;
    }

    if (currentSection !== sectionAtToast) return;
    if (currentSection !== "audit") return;
    if (!toastEl.isConnected) return;

    auditShortcutToastTimer = setTimeout(() => {
        if (toastSequenceAtSchedule !== auditShortcutToastSequence) {
            auditShortcutToastTimer = null;
            return;
        }
        if (currentSection !== sectionAtToast) {
            auditShortcutToastTimer = null;
            return;
        }
        if (!toastEl.isConnected) {
            auditShortcutToastTimer = null;
            return;
        }
        toastEl.classList.add("hidden");
        auditShortcutToastTimer = null;
    }, 1600);
}

function handleAuditKeyboardShortcuts(event) {
    if (isSettingsUnsavedModalOpen()) return;
    if (currentSection !== "audit") return;
    if (!event) return;
    if (event.defaultPrevented) return;
    if (event.currentTarget && event.currentTarget.isConnected === false) return;
    if (event.target && event.target.isConnected === false) return;
    if (event.isComposing) return;
    if (event.target && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/i.test(event.target.tagName || ""))) return;
    if (event && event.repeat) return;

    const isRefreshShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && String(event.key || "").toLowerCase() === "r";
    if (!isRefreshShortcut) return;

    const sectionAtShortcut = currentSection;
    const navigationSeqAtShortcut = sectionNavigationSeq;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    event.preventDefault();
    refreshAuditNow().then((updated) => {
        if (!updated) return;
        if (sectionNavigationSeq !== navigationSeqAtShortcut) return;
        if (currentSection !== sectionAtShortcut) return;
        if (currentSection !== "audit") return;
        const auditSectionEl = document.getElementById("section-audit");
        if (!auditSectionEl || !auditSectionEl.isConnected) return;
        showAuditShortcutToast(`Оновлено через ${getAuditShortcutLabel()}`);
    }).catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtShortcut) return;
        if (currentSection !== sectionAtShortcut) return;
        if (currentSection !== "audit") return;
        const auditSectionEl = document.getElementById("section-audit");
        if (!auditSectionEl || !auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        console.error("Audit shortcut refresh failed", error);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const sectionAtBootstrap = currentSection;
    const navigationSeqAtBootstrap = sectionNavigationSeq;
    const dashboardSectionEl = document.getElementById("section-dashboard");
    const ensureLocalDefaultsMethod = getAdapterMethod("ensureLocalDefaults");
    const isApiAvailableMethod = getAdapterMethod("isApiAvailable");
    if (ensureLocalDefaultsMethod) {
        ensureLocalDefaultsMethod.call(adapter);
    } else {
        console.warn("Adapter ensureLocalDefaults method is unavailable during bootstrap");
    }
    loadAuditUiState();
    renderAuditLatencyLegend();
    await loadAuditLatencyThresholdsFromSettings();
    if (sectionNavigationSeq !== navigationSeqAtBootstrap) return;
    if (currentSection === sectionAtBootstrap && dashboardSectionEl && dashboardSectionEl.isConnected) {
        updateAuditRefreshBadge();
        updateAuditShortcutHint();
    }
    if (!globalEventListenersBound) {
        document.addEventListener("visibilitychange", handleAuditVisibilityChange);
        document.addEventListener("keydown", handleSettingsUnsavedModalKeyboard);
        document.addEventListener("keydown", handleAuditKeyboardShortcuts);
        window.addEventListener("blur", handleSettingsUnsavedToastWindowBlur);
        window.addEventListener("focus", handleSettingsUnsavedToastWindowFocus);
        window.addEventListener("beforeunload", handleUnsavedSettingsBeforeUnload);
        globalEventListenersBound = true;
    }
    if (!isApiAvailableMethod) {
        if (sectionNavigationSeq !== navigationSeqAtBootstrap) return;
        if (currentSection !== sectionAtBootstrap) return;
        if (!dashboardSectionEl || !dashboardSectionEl.isConnected) return;
        showApiStatus("API недоступний. Відсутній метод перевірки у adapter.");
        return;
    }
    const apiReady = await isApiAvailableMethod.call(adapter);
    if (sectionNavigationSeq !== navigationSeqAtBootstrap) return;
    if (!apiReady) {
        if (currentSection !== sectionAtBootstrap) return;
        if (!dashboardSectionEl || !dashboardSectionEl.isConnected) return;
        showApiStatus("API недоступний. Перевірте, що backend запущений на http://localhost:3000.");
        return;
    }

    if (!dashboardSectionEl || !dashboardSectionEl.isConnected) return;
    if (currentSection !== sectionAtBootstrap) return;

    hideApiStatus();
    try {
        await checkAuth();
        if (sectionNavigationSeq !== navigationSeqAtBootstrap) return;
        if (currentSection !== sectionAtBootstrap) return;
        if (!dashboardSectionEl.isConnected) return;
        await loadDashboard();
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtBootstrap) return;
        console.error("Admin bootstrap failed", error);
        if (currentSection !== sectionAtBootstrap) return;
        if (!dashboardSectionEl.isConnected) return;
        showApiStatus("Не вдалося завантажити адмін-панель через API. Спробуйте перезапустити backend.");
    }
});

async function checkAuth() {
    const sectionAtAuth = currentSection;
    const navigationSeqAtAuth = sectionNavigationSeq;
    const loginScreen = document.getElementById("login-screen");
    const isAuthenticatedMethod = getAdapterMethod("isAuthenticated");
    if (!isAuthenticatedMethod) {
        console.warn("Adapter isAuthenticated method is unavailable");
        if (sectionNavigationSeq !== navigationSeqAtAuth) return;
        if (!loginScreen || !loginScreen.isConnected) return;
        if (currentSection !== sectionAtAuth) return;
        loginScreen.classList.remove("hidden");
        return;
    }
    const isAuth = await isAuthenticatedMethod.call(adapter);
    if (sectionNavigationSeq !== navigationSeqAtAuth) return;
    if (!loginScreen || !loginScreen.isConnected) return;
    if (currentSection !== sectionAtAuth) return;

    if (isAuth) {
        loginScreen.classList.add("hidden");
        return;
    }

    loginScreen.classList.remove("hidden");
}

async function handleLogin(e) {
    const sectionAtLogin = currentSection;
    const navigationSeqAtLogin = sectionNavigationSeq;
    e.preventDefault();
    const passwordInput = document.getElementById("admin-password");
    const errorEl = document.getElementById("login-error");
    const loginScreen = document.getElementById("login-screen");
    if (!passwordInput || !errorEl || !loginScreen || !passwordInput.isConnected || !errorEl.isConnected || !loginScreen.isConnected) {
        console.warn("Login form elements are unavailable");
        return;
    }
    const loginMethod = getAdapterMethod("login");
    if (!loginMethod) {
        errorEl.textContent = "Помилка авторизації: відсутній метод adapter.";
        errorEl.classList.remove("hidden");
        console.warn("Adapter login method is unavailable");
        return;
    }
    const password = passwordInput.value;

    try {
        const success = await loginMethod.call(adapter, password);
        if (sectionNavigationSeq !== navigationSeqAtLogin) return;
        if (currentSection !== sectionAtLogin) {
            return;
        }
        if (!passwordInput.isConnected || !errorEl.isConnected || !loginScreen.isConnected) {
            return;
        }
        if (!success) {
            errorEl.textContent = "Невірний пароль";
            errorEl.classList.remove("hidden");
            return;
        }

        loginScreen.classList.add("hidden");
        errorEl.classList.add("hidden");
        passwordInput.value = "";
        if (!loginScreen.isConnected || !passwordInput.isConnected || !errorEl.isConnected) {
            return;
        }
        if (currentSection !== "dashboard") {
            return;
        }
        await loadDashboard();
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtLogin) return;
        if (currentSection !== sectionAtLogin) {
            console.error("Login failed", error);
            return;
        }
        if (!loginScreen.isConnected) {
            console.error("Login failed", error);
            return;
        }
        if (!errorEl.isConnected) {
            console.error("Login failed", error);
            return;
        }
        errorEl.textContent = "Помилка авторизації. Спробуйте ще раз.";
        errorEl.classList.remove("hidden");
        console.error("Login failed", error);
    }
}

async function logout() {
    if (logoutInProgress) return;
    const sectionAtLogout = currentSection;
    const navigationSeqAtLogout = sectionNavigationSeq;
    const logoutMethod = getAdapterMethod("logout");
    if (!logoutMethod) {
        console.warn("Adapter logout method is unavailable");
        if (currentSection !== sectionAtLogout) return;
        alert("Не вдалося вийти: відсутній метод adapter.");
        return;
    }
    logoutInProgress = true;
    try {
        await logoutMethod.call(adapter);
        if (sectionNavigationSeq !== navigationSeqAtLogout) return;
        if (currentSection !== sectionAtLogout) return;
        location.reload();
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtLogout) return;
        if (currentSection !== sectionAtLogout) return;
        console.error("Logout failed", error);
        alert("Не вдалося вийти з адмін-панелі. Спробуйте ще раз.");
    } finally {
        logoutInProgress = false;
    }
}

function setActiveSection(section) {
    if (typeof section !== "string" || !section) return;
    const sectionEl = document.getElementById(`section-${section}`);
    if (!sectionEl || !sectionEl.isConnected) return;

    document.querySelectorAll(".section-content").forEach((el) => {
        if (!el.isConnected) return;
        el.classList.add("hidden");
    });

    sectionEl.classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach((el) => {
        if (!el.isConnected) return;
        el.classList.remove("active");
        const clickHandler = el.getAttribute("onclick") || "";
        if (clickHandler.includes(`'${section}'`)) {
            el.classList.add("active");
        }
    });
}

async function showSection(section) {
    if (typeof section !== "string" || !section) return;
    const transitionFromSection = currentSection;
    const sectionNavigationSeqAtStart = ++sectionNavigationSeq;
    const targetSectionEl = document.getElementById(`section-${section}`);
    if (!targetSectionEl || !targetSectionEl.isConnected) return;
    if (currentSection === "settings" && section !== "settings" && hasUnsavedAuditLatencyThresholdChanges) {
        const decision = await showSettingsUnsavedNavigationModal();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (currentSection !== "settings") return;

        if (decision === "save") {
            const saved = await saveSettings({ notifySuccess: false });
            if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
            if (currentSection !== "settings") return;
            if (!saved) {
                return;
            }
            showSettingsUnsavedToast("Зміни порогів збережено", "success");
        } else if (decision === "cancel") {
            return;
        } else if (decision === "discard") {
            showSettingsUnsavedToast("Незбережені зміни порогів відкинуто", "warn");
        }
    }

    if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
    if (currentSection !== transitionFromSection) return;

    if (section !== "audit") {
        auditShortcutToastSequence += 1;
        stopAuditAutoRefresh();
        cancelAuditRequest();
        setAuditLoading(false);
        cancelPendingAuditFiltersApply();

        if (auditShortcutToastTimer) {
            clearTimeout(auditShortcutToastTimer);
            auditShortcutToastTimer = null;
        }

        const auditShortcutToastEl = document.getElementById("audit-shortcut-toast");
        if (auditShortcutToastEl && auditShortcutToastEl.isConnected) {
            auditShortcutToastEl.classList.add("hidden");
        }

        if (auditRefreshHighlightTimer) {
            clearTimeout(auditRefreshHighlightTimer);
            auditRefreshHighlightTimer = null;
        }

        const auditSectionEl = document.getElementById("section-audit");
        if (auditSectionEl && auditSectionEl.isConnected) {
            auditSectionEl.classList.remove("ring-2", "ring-emerald-400/35", "ring-offset-2", "ring-offset-[#050505]", "transition-shadow", "duration-300");
        }

        if (manualAuditRefreshCooldownTimer) {
            clearTimeout(manualAuditRefreshCooldownTimer.id);
            manualAuditRefreshCooldownTimer = null;
        }
        manualAuditRefreshCooldownActive = false;
        manualAuditRefreshInProgress = false;
        setManualAuditRefreshButtonsDisabled(false);

        const refreshNowLabel = document.getElementById("audit-refresh-now-label");
        const refreshNowSpinner = document.getElementById("audit-refresh-now-spinner");
        const forceRefreshLabel = document.getElementById("audit-force-refresh-label");
        const forceRefreshSpinner = document.getElementById("audit-force-refresh-spinner");
        if (refreshNowLabel && refreshNowLabel.isConnected) {
            refreshNowLabel.textContent = "Оновити зараз";
        }
        if (refreshNowSpinner && refreshNowSpinner.isConnected) {
            refreshNowSpinner.classList.add("hidden");
        }
        if (forceRefreshLabel && forceRefreshLabel.isConnected) {
            forceRefreshLabel.textContent = "Форс-оновлення";
        }
        if (forceRefreshSpinner && forceRefreshSpinner.isConnected) {
            forceRefreshSpinner.classList.add("hidden");
        }
    }

    if (section !== "contacts") {
        cancelPendingContactsFiltersApply();
    }

    setActiveSection(section);
    if (!targetSectionEl.isConnected) return;
    currentSection = section;

    try {
        if (section === "dashboard") await loadDashboard();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "releases") await loadReleases();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "artists") await loadArtists();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "events") await loadEvents();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "settings") await loadSettings();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "contacts") await loadContacts();
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (section === "audit") {
            await loadAuditLogs();
            if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
            if (currentSection !== section) return;
            if (!targetSectionEl.isConnected) return;
            setupAuditAutoRefresh();
            applyManualAuditRefreshButtonsState();
            setRefreshNowButtonLoading(false);
            setForceRefreshButtonLoading(false);
        }
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        if (currentSection !== section) return;
        hideApiStatus();
    } catch (error) {
        if (isAbortError(error)) return;
        if (sectionNavigationSeq !== sectionNavigationSeqAtStart) return;
        console.error("Section load failed", error);
        if (currentSection !== section) return;
        if (!targetSectionEl.isConnected) return;
        showApiStatus("Помилка завантаження даних з API. Перевірте з'єднання з backend.");
    }
}

function sanitizeInput(text) {
    const sanitizeTextMethod = getAdapterMethod("sanitizeText");
    if (sanitizeTextMethod) {
        return sanitizeTextMethod.call(adapter, text);
    }

    const rawText = text === null || text === undefined ? "" : String(text);
    return rawText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function refreshCache() {
    const sectionAtRefresh = currentSection;
    const navigationSeqAtRefresh = sectionNavigationSeq;
    const dashboardSectionEl = document.getElementById("section-dashboard");
    if (sectionAtRefresh !== "dashboard") return;
    if (!dashboardSectionEl || !dashboardSectionEl.isConnected) return;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during refreshCache");
        return;
    }

    const releases = await getCollectionMethod.call(adapter, "releases");
    if (sectionNavigationSeq !== navigationSeqAtRefresh) return;
    if (currentSection !== sectionAtRefresh || currentSection !== "dashboard") return;
    if (!dashboardSectionEl.isConnected) return;
    const artists = await getCollectionMethod.call(adapter, "artists");
    if (sectionNavigationSeq !== navigationSeqAtRefresh) return;
    if (currentSection !== sectionAtRefresh || currentSection !== "dashboard") return;
    if (!dashboardSectionEl.isConnected) return;
    const events = await getCollectionMethod.call(adapter, "events");
    if (sectionNavigationSeq !== navigationSeqAtRefresh) return;
    if (currentSection !== sectionAtRefresh || currentSection !== "dashboard") return;
    if (!dashboardSectionEl.isConnected) return;
    const settings = await getCollectionMethod.call(adapter, "settings");
    if (sectionNavigationSeq !== navigationSeqAtRefresh) return;
    if (currentSection !== sectionAtRefresh || currentSection !== "dashboard") return;
    if (!dashboardSectionEl.isConnected) return;

    if (sectionNavigationSeq !== navigationSeqAtRefresh) return;
    if (currentSection !== sectionAtRefresh || currentSection !== "dashboard") return;
    if (!dashboardSectionEl.isConnected) return;
    cache.releases = normalizeRecordArray(releases);
    cache.artists = normalizeRecordArray(artists);
    cache.events = normalizeRecordArray(events);
    cache.settings = normalizeRecordObject(settings);
}

async function loadDashboard() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    await refreshCache();
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "dashboard") return;
    const dashboardSectionEl = document.getElementById("section-dashboard");
    if (!dashboardSectionEl || !dashboardSectionEl.isConnected) return;
    const releasesCountEl = document.getElementById("dash-releases");
    const artistsCountEl = document.getElementById("dash-artists");
    const eventsCountEl = document.getElementById("dash-events");
    const releases = normalizeRecordArray(cache.releases);
    const artists = normalizeRecordArray(cache.artists);
    const events = normalizeRecordArray(cache.events);

    if (releasesCountEl && releasesCountEl.isConnected) {
        releasesCountEl.textContent = releases.length;
    }
    if (artistsCountEl && artistsCountEl.isConnected) {
        artistsCountEl.textContent = artists.length;
    }
    if (eventsCountEl && eventsCountEl.isConnected) {
        eventsCountEl.textContent = events.length;
    }
}

async function loadReleases() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during loadReleases");
        if (currentSection !== sectionAtLoad) return;
        if (currentSection !== "releases") return;
        const releasesSectionEl = document.getElementById("section-releases");
        if (!releasesSectionEl || !releasesSectionEl.isConnected) return;
        alert("Не вдалося завантажити релізи: відсутній метод adapter.");
        return;
    }
    const nextReleases = await getCollectionMethod.call(adapter, "releases");
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "releases") return;
    const releases = normalizeRecordArray(nextReleases);
    cache.releases = releases;
    const releasesSectionEl = document.getElementById("section-releases");
    if (!releasesSectionEl || !releasesSectionEl.isConnected) return;
    const container = document.getElementById("releases-list");
    if (!container || !container.isConnected) return;

    container.innerHTML = releases.map((release) => {
        const safeTitle = sanitizeInput(release.title || "-");
        const safeArtist = sanitizeInput(release.artist || "-");
        const safeGenre = sanitizeInput(release.genre || "-");
        const safeYear = sanitizeInput(release.year || "-");
        const safeImage = sanitizeInput(release.image || "");
        const idArg = serializeInlineEntityIdArg(release.id);
        const disableActionAttr = idArg === null ? "disabled" : "";
        const editActionAttr = idArg === null ? "" : `onclick="editItem('release', ${idArg})"`;
        const deleteActionAttr = idArg === null ? "" : `onclick="deleteItem('release', ${idArg})"`;

        return `
            <div class="card p-4 rounded relative group">
                <div class="flex gap-4">
                    <img src="${safeImage}" class="w-24 h-24 object-cover rounded border border-cyan-500/30">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-white truncate">${safeTitle}</h4>
                        <p class="text-cyan-400 text-sm">${safeArtist}</p>
                        <p class="text-gray-500 text-xs uppercase mt-1">${safeGenre} • ${safeYear}</p>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button ${editActionAttr} ${disableActionAttr} class="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors disabled:opacity-50">Редагувати</button>
                    <button ${deleteActionAttr} ${disableActionAttr} class="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm transition-colors disabled:opacity-50">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

async function loadArtists() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during loadArtists");
        if (currentSection !== sectionAtLoad) return;
        if (currentSection !== "artists") return;
        const artistsSectionEl = document.getElementById("section-artists");
        if (!artistsSectionEl || !artistsSectionEl.isConnected) return;
        alert("Не вдалося завантажити артистів: відсутній метод adapter.");
        return;
    }
    const nextArtists = await getCollectionMethod.call(adapter, "artists");
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "artists") return;
    const artists = normalizeRecordArray(nextArtists);
    cache.artists = artists;
    const artistsSectionEl = document.getElementById("section-artists");
    if (!artistsSectionEl || !artistsSectionEl.isConnected) return;
    const container = document.getElementById("artists-list");
    if (!container || !container.isConnected) return;

    container.innerHTML = artists.map((artist) => {
        const safeName = sanitizeInput(artist.name || "-");
        const safeGenre = sanitizeInput(artist.genre || "-");
        const safeBio = sanitizeInput(artist.bio || "");
        const safeImage = sanitizeInput(artist.image || "");
        const idArg = serializeInlineEntityIdArg(artist.id);
        const disableActionAttr = idArg === null ? "disabled" : "";
        const editActionAttr = idArg === null ? "" : `onclick="editItem('artist', ${idArg})"`;
        const deleteActionAttr = idArg === null ? "" : `onclick="deleteItem('artist', ${idArg})"`;

        return `
            <div class="card p-4 rounded relative group">
                <div class="flex gap-4">
                    <img src="${safeImage}" class="w-24 h-24 object-cover rounded-full border-2 border-pink-500/30">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-white text-lg">${safeName}</h4>
                        <p class="text-pink-400 text-sm uppercase">${safeGenre}</p>
                        <p class="text-gray-500 text-xs mt-1 line-clamp-2">${safeBio}</p>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button ${editActionAttr} ${disableActionAttr} class="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors disabled:opacity-50">Редагувати</button>
                    <button ${deleteActionAttr} ${disableActionAttr} class="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm transition-colors disabled:opacity-50">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

async function loadEvents() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during loadEvents");
        if (currentSection !== sectionAtLoad) return;
        if (currentSection !== "events") return;
        const eventsSectionEl = document.getElementById("section-events");
        if (!eventsSectionEl || !eventsSectionEl.isConnected) return;
        alert("Не вдалося завантажити події: відсутній метод adapter.");
        return;
    }
    const nextEvents = await getCollectionMethod.call(adapter, "events");
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "events") return;
    const events = normalizeRecordArray(nextEvents);
    cache.events = events;
    const eventsSectionEl = document.getElementById("section-events");
    if (!eventsSectionEl || !eventsSectionEl.isConnected) return;
    const container = document.getElementById("events-list-admin");
    if (!container || !container.isConnected) return;
    const sorted = [...events].sort((a, b) => getComparableTimestamp(a.date) - getComparableTimestamp(b.date));

    container.innerHTML = sorted.map((event) => {
        const safeImage = sanitizeInput(event.image || "");
        const safeTitle = sanitizeInput(event.title || "-");
        const safeDate = sanitizeInput(event.date || "-");
        const safeTime = sanitizeInput(event.time || "-");
        const safeVenue = sanitizeInput(event.venue || "-");
        const idArg = serializeInlineEntityIdArg(event.id);
        const disableActionAttr = idArg === null ? "disabled" : "";
        const editActionAttr = idArg === null ? "" : `onclick="editItem('event', ${idArg})"`;
        const deleteActionAttr = idArg === null ? "" : `onclick="deleteItem('event', ${idArg})"`;

        return `
            <div class="card p-4 rounded flex flex-col md:flex-row gap-4 items-start md:items-center">
                <img src="${safeImage}" class="w-full md:w-32 h-20 object-cover rounded border border-green-500/30">
                <div class="flex-1">
                    <h4 class="font-bold text-white">${safeTitle}</h4>
                    <p class="text-green-400 text-sm">${safeDate} • ${safeTime}</p>
                    <p class="text-gray-400 text-sm">${safeVenue}</p>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button ${editActionAttr} ${disableActionAttr} class="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-50">Редагувати</button>
                    <button ${deleteActionAttr} ${disableActionAttr} class="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm transition-colors disabled:opacity-50">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

async function loadSettings() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getCollectionMethod = getAdapterMethod("getCollection");
    if (!getCollectionMethod) {
        console.warn("Adapter getCollection method is unavailable during loadSettings");
        if (currentSection !== sectionAtLoad) return;
        if (currentSection !== "settings") return;
        const settingsSectionEl = document.getElementById("section-settings");
        if (!settingsSectionEl || !settingsSectionEl.isConnected) return;
        alert("Не вдалося завантажити налаштування: відсутній метод adapter.");
        return;
    }
    const nextSettings = await getCollectionMethod.call(adapter, "settings");
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "settings") return;
    cache.settings = normalizeRecordObject(nextSettings);
    const settingsSectionEl = document.getElementById("section-settings");
    if (!settingsSectionEl || !settingsSectionEl.isConnected) return;
    const titleInputEl = document.getElementById("setting-title");
    const aboutInputEl = document.getElementById("setting-about");
    const missionInputEl = document.getElementById("setting-mission");
    const emailInputEl = document.getElementById("setting-email");
    if (titleInputEl && titleInputEl.isConnected) {
        titleInputEl.value = cache.settings.title || "";
    }
    if (aboutInputEl && aboutInputEl.isConnected) {
        aboutInputEl.value = cache.settings.about || "";
    }
    if (missionInputEl && missionInputEl.isConnected) {
        missionInputEl.value = cache.settings.mission || "";
    }
    if (emailInputEl && emailInputEl.isConnected) {
        emailInputEl.value = cache.settings.email || "";
    }
    const persisted = getNormalizedLatencyThresholds(cache.settings || {});
    const goodMaxInputEl = document.getElementById("setting-audit-latency-good-max");
    const warnMaxInputEl = document.getElementById("setting-audit-latency-warn-max");
    if (goodMaxInputEl && goodMaxInputEl.isConnected) {
        goodMaxInputEl.value = persisted.good;
    }
    if (warnMaxInputEl && warnMaxInputEl.isConnected) {
        warnMaxInputEl.value = persisted.warn;
    }
    applyAuditLatencyThresholds({
        auditLatencyGoodMaxMs: persisted.good,
        auditLatencyWarnMaxMs: persisted.warn
    });
    setAuditLatencyThresholdsDirtyState(false);
}

async function loadContacts() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const getContactRequestsMethod = getAdapterMethod("getContactRequests");
    if (!getContactRequestsMethod) {
        console.warn("Adapter getContactRequests method is unavailable");
        if (currentSection !== sectionAtLoad) return;
        if (currentSection !== "contacts") return;
        const contactsSectionEl = document.getElementById("section-contacts");
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        alert("Не вдалося завантажити звернення: відсутній метод adapter.");
        return;
    }
    const nextContactRequests = await getContactRequestsMethod.call(adapter);
    if (sectionNavigationSeq !== navigationSeqAtLoad) return;
    if (currentSection !== sectionAtLoad) return;
    if (currentSection !== "contacts") return;
    cache.contactRequests = normalizeRecordArray(nextContactRequests);
    const contactsSectionEl = document.getElementById("section-contacts");
    const contactsListEl = document.getElementById("contacts-list");
    if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
    if (!contactsListEl || !contactsListEl.isConnected) return;
    renderContacts();
}

async function loadAuditLogs() {
    const sectionAtLoad = currentSection;
    const navigationSeqAtLoad = sectionNavigationSeq;
    const startedAt = (typeof performance !== "undefined" && typeof performance.now === "function") ? performance.now() : Date.now();
    cancelAuditRequest();
    const requestSeq = ++auditRequestSeq;
    auditRequestController = new AbortController();
    const { signal } = auditRequestController;
    setAuditLoading(true);
    const auditSectionEl = document.getElementById("section-audit");
    if (currentSection !== sectionAtLoad || currentSection !== "audit" || !auditSectionEl || !auditSectionEl.isConnected) {
        auditRequestController = null;
        setAuditLoading(false);
        return;
    }
    const getAuditLogsMethod = getAdapterMethod("getAuditLogs");
    const getAuditFacetsMethod = getAdapterMethod("getAuditFacets");
    if (!getAuditLogsMethod || !getAuditFacetsMethod) {
        auditRequestController = null;
        setAuditLoading(false);
        console.warn("Audit adapter methods are unavailable", {
            hasGetAuditLogs: !!getAuditLogsMethod,
            hasGetAuditFacets: !!getAuditFacetsMethod
        });
        showAuditError("Помилка аудиту: відсутні методи adapter для завантаження журналу.");
        return;
    }
    const limitEl = document.getElementById("audit-limit");
    const limit = normalizeAuditLimitControlValue(limitEl);
    const {
        query,
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo
    } = getNormalizedAuditFilters();
    if (!hasValidAuditDateRangeOrder(dateFrom, dateTo)) {
        auditRequestController = null;
        setAuditLoading(false);
        showAuditError("Помилка аудиту: дата 'Від' не може бути пізніше за 'До'.");
        return;
    }

    let response;
    let facets;
    try {
        [response, facets] = await Promise.all([
            getAuditLogsMethod.call(adapter, {
                limit,
                page: auditPage,
                q: query,
                action: actionFilter,
                entity: entityFilter,
                from: dateFrom,
                to: dateTo
            }, { signal }),
            getAuditFacetsMethod.call(adapter, { signal })
        ]);
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtLoad) {
            if (requestSeq === auditRequestSeq) {
                auditRequestController = null;
                setAuditLoading(false);
            }
            return;
        }
        if (isAbortError(error)) {
            if (requestSeq === auditRequestSeq) {
                auditRequestController = null;
                setAuditLoading(false);
            }
            return;
        }
        if (requestSeq !== auditRequestSeq) {
            return;
        }
        setAuditLoading(false);
        throw error;
    }

    // Ignore stale responses when a newer request has already been issued.
    if (requestSeq !== auditRequestSeq) {
        return;
    }

    if (sectionNavigationSeq !== navigationSeqAtLoad) {
        auditRequestController = null;
        setAuditLoading(false);
        return;
    }

    if (currentSection !== sectionAtLoad) {
        auditRequestController = null;
        setAuditLoading(false);
        return;
    }
    if (currentSection !== "audit") {
        auditRequestController = null;
        setAuditLoading(false);
        return;
    }
    if (!auditSectionEl.isConnected) {
        auditRequestController = null;
        setAuditLoading(false);
        return;
    }

    auditRequestController = null;

    const normalizedResponse = normalizeRecordObject(response);
    cache.auditLogs = normalizeRecordArray(normalizedResponse.items);
    cache.auditFacets = normalizeAuditFacetsPayload(facets);
    auditTotal = Math.max(0, Number(normalizedResponse.total) || 0);
    auditPage = normalizeAuditPage(normalizedResponse.page, auditPage);
    hideAuditError();
    populateAuditFilterOptions();
    renderAuditLogs();

    const updatedEl = document.getElementById("audit-last-updated");
    if (updatedEl && updatedEl.isConnected) {
        updatedEl.textContent = `Оновлено: ${formatNowTimeOrFallback()}`;
    }

    const endedAt = (typeof performance !== "undefined" && typeof performance.now === "function") ? performance.now() : Date.now();
    const latencyMs = Math.max(0, Math.round(endedAt - startedAt));
    const latencyEl = document.getElementById("audit-last-latency");
    if (latencyEl && latencyEl.isConnected) {
        latencyEl.textContent = `Остання тривалість: ${latencyMs} ms`;
    }

    auditLatencyHistory.push(latencyMs);
    if (auditLatencyHistory.length > AUDIT_LATENCY_HISTORY_SIZE) {
        auditLatencyHistory = auditLatencyHistory.slice(-AUDIT_LATENCY_HISTORY_SIZE);
    }

    const avgLatencyEl = document.getElementById("audit-avg-latency");
    if (avgLatencyEl && avgLatencyEl.isConnected) {
        const sum = auditLatencyHistory.reduce((acc, value) => acc + value, 0);
        const avg = auditLatencyHistory.length ? Math.round(sum / auditLatencyHistory.length) : 0;
        const avgTextEl = avgLatencyEl.querySelector("span:last-child");
        if (avgTextEl && avgTextEl.isConnected) {
            avgTextEl.textContent = `Середня (останні ${AUDIT_LATENCY_HISTORY_SIZE}): ${avg} ms`;
        } else {
            avgLatencyEl.textContent = `Середня (останні ${AUDIT_LATENCY_HISTORY_SIZE}): ${avg} ms`;
        }
        updateAuditLatencyIndicator(avg);
    }

    if (currentSection === "audit") {
        const refreshSeconds = getAuditRefreshSeconds();
        if (refreshSeconds) {
            resetAuditRefreshCountdown(refreshSeconds);
        }
    }

    setAuditLoading(false);
}

function populateAuditFilterOptions() {
    const actionEl = document.getElementById("audit-filter-action");
    const entityEl = document.getElementById("audit-filter-entity");
    if (!actionEl || !entityEl) return;
    if (!actionEl.isConnected || !entityEl.isConnected) return;

    const selectedAction = normalizeAuditFilterControlValue(actionEl, "all");
    const selectedEntity = normalizeAuditFilterControlValue(entityEl, "all");
    const facets = normalizeAuditFacetsPayload(cache.auditFacets);
    const actions = normalizeAuditFilterOptionValues(facets.actions);
    const entities = normalizeAuditFilterOptionValues(facets.entities);

    if (selectedAction && selectedAction !== "all" && !actions.includes(selectedAction)) {
        actions.push(selectedAction);
        actions.sort();
    }

    if (selectedEntity && selectedEntity !== "all" && !entities.includes(selectedEntity)) {
        entities.push(selectedEntity);
        entities.sort();
    }

    if (!actionEl.isConnected || !entityEl.isConnected) return;

    actionEl.innerHTML = '<option value="all">Усі дії</option>' + actions
        .map((action) => `<option value="${sanitizeInput(action)}">${sanitizeInput(action)}</option>`)
        .join("");

    entityEl.innerHTML = '<option value="all">Усі сутності</option>' + entities
        .map((entity) => `<option value="${sanitizeInput(entity)}">${sanitizeInput(entity)}</option>`)
        .join("");

    if (!actionEl.isConnected || !entityEl.isConnected) return;

    actionEl.value = actions.includes(selectedAction) || selectedAction === "all" ? selectedAction : "all";
    entityEl.value = entities.includes(selectedEntity) || selectedEntity === "all" ? selectedEntity : "all";
}

function handleAuditLoadError(error, fallbackMessage) {
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const details = error && error.message ? String(error.message) : "";
    const message = details || fallbackMessage || "Не вдалося завантажити журнал аудиту.";
    console.error("Audit request failed", error);
    showAuditError(`Помилка аудиту: ${message}`);
}

function validateAuditDateRange() {
    const dateFromEl = document.getElementById("audit-date-from");
    const dateToEl = document.getElementById("audit-date-to");
    const rawFrom = dateFromEl && dateFromEl.isConnected ? String(dateFromEl.value || "") : "";
    const rawTo = dateToEl && dateToEl.isConnected ? String(dateToEl.value || "") : "";
    const from = normalizeIsoDateFilter(rawFrom);
    const to = normalizeIsoDateFilter(rawTo);

    if (rawFrom && !from) {
        showAuditError("Помилка аудиту: некоректна дата 'Від'.");
        return false;
    }

    if (rawTo && !to) {
        showAuditError("Помилка аудиту: некоректна дата 'До'.");
        return false;
    }

    if (dateFromEl && dateFromEl.isConnected && dateFromEl.value !== from) {
        dateFromEl.value = from;
    }

    if (dateToEl && dateToEl.isConnected && dateToEl.value !== to) {
        dateToEl.value = to;
    }

    if (!hasValidAuditDateRangeOrder(from, to)) {
        showAuditError("Помилка аудиту: дата 'Від' не може бути пізніше за 'До'.");
        return false;
    }

    hideAuditError();

    return true;
}

function setManualAuditRefreshButtonsDisabled(isDisabled) {
    const refreshNowBtn = document.getElementById("audit-refresh-now-btn");
    const forceRefreshBtn = document.getElementById("audit-force-refresh-btn");

    if (refreshNowBtn && refreshNowBtn.isConnected) {
        refreshNowBtn.disabled = isDisabled;
    }

    if (forceRefreshBtn && forceRefreshBtn.isConnected) {
        forceRefreshBtn.disabled = isDisabled;
    }
}

function applyManualAuditRefreshButtonsState() {
    setManualAuditRefreshButtonsDisabled(manualAuditRefreshInProgress || manualAuditRefreshCooldownActive);
}

function setManualAuditRefreshInProgress(isInProgress) {
    manualAuditRefreshInProgress = isInProgress;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    applyManualAuditRefreshButtonsState();
}

function getManualAuditRefreshCooldownRemainingMs() {
    if (!manualAuditRefreshCooldownActive || !manualAuditRefreshCooldownTimer) return 0;
    return Math.max(0, Number(manualAuditRefreshCooldownTimer.expiresAt || 0) - Date.now());
}

function startManualAuditRefreshCooldown() {
    const sectionAtCooldown = currentSection;
    const navigationSeqAtCooldown = sectionNavigationSeq;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    if (manualAuditRefreshCooldownTimer) {
        clearTimeout(manualAuditRefreshCooldownTimer.id);
    }

    manualAuditRefreshCooldownActive = true;
    if (currentSection === sectionAtCooldown) {
        applyManualAuditRefreshButtonsState();
    }

    const id = setTimeout(() => {
        if (sectionNavigationSeq !== navigationSeqAtCooldown) {
            manualAuditRefreshCooldownActive = false;
            manualAuditRefreshCooldownTimer = null;
            return;
        }
        manualAuditRefreshCooldownActive = false;
        manualAuditRefreshCooldownTimer = null;
        if (currentSection === sectionAtCooldown && currentSection === "audit") {
            const auditSectionEl = document.getElementById("section-audit");
            if (auditSectionEl && auditSectionEl.isConnected) {
                applyManualAuditRefreshButtonsState();
            }
        }
    }, MANUAL_AUDIT_REFRESH_COOLDOWN_MS);

    manualAuditRefreshCooldownTimer = {
        id,
        expiresAt: Date.now() + MANUAL_AUDIT_REFRESH_COOLDOWN_MS
    };
}

function pulseAuditRefreshSuccess() {
    const navigationSeqAtPulse = sectionNavigationSeq;
    if (currentSection !== "audit") return;
    const sectionEl = document.getElementById("section-audit");
    if (!sectionEl || !sectionEl.isConnected) return;

    sectionEl.classList.add("ring-2", "ring-emerald-400/35", "ring-offset-2", "ring-offset-[#050505]", "transition-shadow", "duration-300");

    if (auditRefreshHighlightTimer) {
        clearTimeout(auditRefreshHighlightTimer);
    }

    auditRefreshHighlightTimer = setTimeout(() => {
        if (sectionNavigationSeq !== navigationSeqAtPulse) {
            auditRefreshHighlightTimer = null;
            return;
        }
        if (!sectionEl.isConnected) {
            auditRefreshHighlightTimer = null;
            return;
        }
        sectionEl.classList.remove("ring-2", "ring-emerald-400/35", "ring-offset-2", "ring-offset-[#050505]", "transition-shadow", "duration-300");
        auditRefreshHighlightTimer = null;
    }, 450);
}

function setRefreshNowButtonLoading(isLoading) {
    const button = document.getElementById("audit-refresh-now-btn");
    const label = document.getElementById("audit-refresh-now-label");
    const spinner = document.getElementById("audit-refresh-now-spinner");

    setManualAuditRefreshInProgress(isLoading);

    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    if (label && label.isConnected) {
        label.textContent = isLoading ? "Оновлення..." : "Оновити зараз";
    }

    if (spinner && spinner.isConnected) {
        spinner.classList.toggle("hidden", !isLoading);
    }
}

async function refreshAuditNow() {
    const sectionAtRefresh = currentSection;
    const navigationSeqAtRefresh = sectionNavigationSeq;
    if (manualAuditRefreshInProgress) return false;
    const button = document.getElementById("audit-refresh-now-btn");
    if (button?.disabled) {
        const remaining = getManualAuditRefreshCooldownRemainingMs();
        if (remaining > 0) {
            showAuditShortcutToast(`Зачекайте ${(remaining / 1000).toFixed(1)}с перед повторним оновленням`);
        }
        return false;
    }
    if (!validateAuditDateRange()) return false;

    if (currentSection !== "audit") return false;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return false;
    cancelPendingAuditFiltersApply();

    setRefreshNowButtonLoading(true);

    try {
        await loadAuditLogs();
        pulseAuditRefreshSuccess();
        return true;
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtRefresh) return false;
        if (currentSection !== sectionAtRefresh) return false;
        if (currentSection !== "audit") return false;
        if (!auditSectionEl.isConnected) return false;
        if (isAbortError(error)) return false;
        handleAuditLoadError(error, "Не вдалося оновити журнал аудиту.");
        return false;
    } finally {
        if (sectionNavigationSeq !== navigationSeqAtRefresh) {
            setRefreshNowButtonLoading(false);
            return;
        }
        setRefreshNowButtonLoading(false);
        if (currentSection !== sectionAtRefresh) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        startManualAuditRefreshCooldown();
    }
}

function setForceRefreshButtonLoading(isLoading) {
    const button = document.getElementById("audit-force-refresh-btn");
    const label = document.getElementById("audit-force-refresh-label");
    const spinner = document.getElementById("audit-force-refresh-spinner");

    setManualAuditRefreshInProgress(isLoading);

    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    if (label && label.isConnected) {
        label.textContent = isLoading ? "Оновлення..." : "Форс-оновлення";
    }

    if (spinner && spinner.isConnected) {
        spinner.classList.toggle("hidden", !isLoading);
    }
}

async function forceRefreshAuditNow() {
    const sectionAtRefresh = currentSection;
    const navigationSeqAtRefresh = sectionNavigationSeq;
    if (manualAuditRefreshInProgress) return false;
    const button = document.getElementById("audit-force-refresh-btn");
    if (button?.disabled) {
        const remaining = getManualAuditRefreshCooldownRemainingMs();
        if (remaining > 0) {
            showAuditShortcutToast(`Зачекайте ${(remaining / 1000).toFixed(1)}с перед повторним оновленням`);
        }
        return false;
    }
    if (!validateAuditDateRange()) return false;

    if (currentSection !== "audit") return false;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return false;
    cancelPendingAuditFiltersApply();

    const refreshSeconds = getAuditRefreshSeconds();
    if (refreshSeconds && !isAuditEcoModeEnabled()) {
        resetAuditRefreshCountdown(refreshSeconds);
    }

    setForceRefreshButtonLoading(true);

    try {
        await loadAuditLogs();
        pulseAuditRefreshSuccess();
        return true;
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtRefresh) return false;
        if (currentSection !== sectionAtRefresh) return false;
        if (currentSection !== "audit") return false;
        if (!auditSectionEl.isConnected) return false;
        if (isAbortError(error)) return false;
        handleAuditLoadError(error, "Не вдалося виконати форс-оновлення аудиту.");
        return false;
    } finally {
        if (sectionNavigationSeq !== navigationSeqAtRefresh) {
            setForceRefreshButtonLoading(false);
            return;
        }
        setForceRefreshButtonLoading(false);
        if (currentSection !== sectionAtRefresh) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        startManualAuditRefreshCooldown();
    }
}

function changeAuditLimit() {
    const sectionAtChange = currentSection;
    const navigationSeqAtChange = sectionNavigationSeq;
    if (!validateAuditDateRange()) return;
    if (currentSection !== sectionAtChange || currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    cancelPendingAuditFiltersApply();
    const limitEl = document.getElementById("audit-limit");
    normalizeAuditLimitControlValue(limitEl);
    auditPage = 1;
    saveAuditUiState();
    loadAuditLogs().catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtChange) return;
        if (currentSection !== sectionAtChange) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        handleAuditLoadError(error, "Не вдалося змінити ліміт аудиту.");
    });
}

function changeAuditRefreshInterval() {
    const sectionAtChange = currentSection;
    const navigationSeqAtChange = sectionNavigationSeq;
    if (currentSection !== sectionAtChange || currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const refreshEl = document.getElementById("audit-refresh-interval");
    normalizeAuditRefreshControlValue(refreshEl);
    saveAuditUiState();
    setupAuditAutoRefresh();
    if (sectionNavigationSeq !== navigationSeqAtChange) return;
    if (currentSection !== sectionAtChange || currentSection !== "audit") return;
    if (!auditSectionEl.isConnected) return;
    updateAuditRefreshBadge();
}

function cancelPendingAuditFiltersApply() {
    if (!auditSearchDebounceTimer) return;
    clearTimeout(auditSearchDebounceTimer);
    auditSearchDebounceTimer = null;
}

function scheduleAuditFiltersApply(delayMs = 0) {
    const sectionAtFilterChange = currentSection;
    const navigationSeqAtFilterChange = sectionNavigationSeq;
    const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);

    cancelPendingAuditFiltersApply();

    const applyFilters = () => {
        auditSearchDebounceTimer = null;
        if (sectionNavigationSeq !== navigationSeqAtFilterChange) return;
        if (currentSection !== sectionAtFilterChange) return;
        if (currentSection !== "audit") return;
        const auditSectionEl = document.getElementById("section-audit");
        if (!auditSectionEl || !auditSectionEl.isConnected) return;

        getNormalizedAuditFilters();
        resetAuditPageAndRender();
    };

    if (!normalizedDelayMs) {
        applyFilters();
        return;
    }

    auditSearchDebounceTimer = setTimeout(applyFilters, normalizedDelayMs);
}

function handleAuditSearchInput() {
    const searchEl = document.getElementById("audit-search");
    normalizeAuditSearchControlValue(searchEl);
    scheduleAuditFiltersApply(300);
}

function toDateInputValue(date) {
    return formatDateToLocalIso(date, "");
}

function applyAuditDatePreset() {
    const sectionAtPreset = currentSection;
    const presetEl = document.getElementById("audit-date-preset");
    const fromEl = document.getElementById("audit-date-from");
    const toEl = document.getElementById("audit-date-to");
    if (!presetEl || !fromEl || !toEl) return;
    if (!presetEl.isConnected || !fromEl.isConnected || !toEl.isConnected) return;

    const preset = normalizeAuditDatePreset(presetEl.value, "all");
    if (presetEl.value !== preset) {
        presetEl.value = preset;
    }
    const now = new Date();

    if (preset === "all") {
        fromEl.value = "";
        toEl.value = "";
    } else if (preset === "today") {
        const today = toDateInputValue(now);
        fromEl.value = today;
        toEl.value = today;
    } else if (preset === "24h") {
        const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        fromEl.value = toDateInputValue(from);
        toEl.value = toDateInputValue(now);
    } else if (preset === "7d") {
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromEl.value = toDateInputValue(from);
        toEl.value = toDateInputValue(now);
    }

    fromEl.value = normalizeIsoDateFilter(fromEl.value);
    toEl.value = normalizeIsoDateFilter(toEl.value);

    if (currentSection !== sectionAtPreset) return;
    if (currentSection !== "audit") return;
    scheduleAuditFiltersApply(0);
}

function onAuditDateInputChange() {
    const sectionAtInput = currentSection;
    const fromEl = document.getElementById("audit-date-from");
    const toEl = document.getElementById("audit-date-to");
    if (fromEl && fromEl.isConnected) {
        fromEl.value = normalizeIsoDateFilter(fromEl.value);
    }
    if (toEl && toEl.isConnected) {
        toEl.value = normalizeIsoDateFilter(toEl.value);
    }
    const presetEl = document.getElementById("audit-date-preset");
    if (presetEl && presetEl.isConnected) {
        presetEl.value = normalizeAuditDatePreset("custom", "custom");
    }
    if (currentSection !== sectionAtInput) return;
    if (currentSection !== "audit") return;
    scheduleAuditFiltersApply(0);
}

function handleAuditFilterChange() {
    scheduleAuditFiltersApply(0);
}

function clearAuditFilters() {
    const sectionAtClear = currentSection;
    const navigationSeqAtClear = sectionNavigationSeq;
    const searchEl = document.getElementById("audit-search");
    const actionEl = document.getElementById("audit-filter-action");
    const entityEl = document.getElementById("audit-filter-entity");
    const dateFromEl = document.getElementById("audit-date-from");
    const dateToEl = document.getElementById("audit-date-to");
    const datePresetEl = document.getElementById("audit-date-preset");

    if (searchEl && searchEl.isConnected) searchEl.value = "";
    if (actionEl && actionEl.isConnected) actionEl.value = "all";
    if (entityEl && entityEl.isConnected) entityEl.value = "all";
    if (dateFromEl && dateFromEl.isConnected) dateFromEl.value = "";
    if (dateToEl && dateToEl.isConnected) dateToEl.value = "";
    if (datePresetEl && datePresetEl.isConnected) datePresetEl.value = "all";

    if (currentSection !== sectionAtClear) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    cancelPendingAuditFiltersApply();
    auditPage = 1;
    saveAuditUiState();
    loadAuditLogs().catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtClear) return;
        if (currentSection !== sectionAtClear) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        handleAuditLoadError(error, "Не вдалося очистити фільтри аудиту.");
    });
}

function getFilteredAuditLogs() {
    return normalizeRecordArray(cache.auditLogs);
}

function exportAuditCsv() {
    const sectionAtExport = currentSection;
    const navigationSeqAtExport = sectionNavigationSeq;
    if (currentSection !== sectionAtExport) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;

    const {
        query,
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo
    } = getNormalizedAuditFilters();
    if (!hasValidAuditDateRangeOrder(dateFrom, dateTo)) {
        alert("Помилка аудиту: дата 'Від' не може бути пізніше за 'До'.");
        return;
    }
    const getAuditLogsMethod = getAdapterMethod("getAuditLogs");
    if (!getAuditLogsMethod) {
        alert("Не вдалося експортувати аудит: відсутній метод adapter.");
        return;
    }

    getAuditLogsMethod.call(adapter, {
        limit: 500,
        page: 1,
        q: query,
        action: actionFilter,
        entity: entityFilter,
        from: dateFrom,
        to: dateTo
    }).then((response) => {
        if (sectionNavigationSeq !== navigationSeqAtExport) return;
        if (currentSection !== sectionAtExport) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl || !auditSectionEl.isConnected) return;

        const normalizedResponse = normalizeRecordObject(response);
        const filtered = normalizeRecordArray(normalizedResponse.items);
        if (!filtered.length) {
            alert("Немає записів аудиту для експорту.");
            return;
        }

        const header = ["id", "created_at", "action", "entity_type", "entity_id", "actor", "details"];
        const rows = filtered.map((entry) => normalizeCsvRowValues([
            entry.id || "",
            entry.created_at || "",
            entry.action || "",
            entry.entity_type || "",
            entry.entity_id || "",
            entry.actor || "",
            safeSerializeDetails(entry.details, "")
        ]));

        const csv = [header, ...rows]
            .map((row) => row.map(escapeCsv).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const body = document.body;
        link.href = url;
        link.download = `core64_audit_${getTodayIsoDateSafe()}.csv`;
        if (!body || !body.isConnected) {
            URL.revokeObjectURL(url);
            return;
        }
        body.appendChild(link);
        link.click();
        if (body.isConnected && link.isConnected) {
            body.removeChild(link);
        }
        URL.revokeObjectURL(url);
        addActivity(`Експортовано ${filtered.length} записів аудиту у CSV`);
    }).catch((error) => {
        if (isAbortError(error)) return;
        if (sectionNavigationSeq !== navigationSeqAtExport) return;
        if (currentSection !== sectionAtExport) return;
        if (currentSection !== "audit") return;
        const auditSectionEl = document.getElementById("section-audit");
        if (!auditSectionEl || !auditSectionEl.isConnected) return;
        console.error("Audit CSV export failed", error);
        alert("Не вдалося експортувати аудит у CSV.");
    });
}

function resetAuditPageAndRender() {
    const sectionAtReset = currentSection;
    const navigationSeqAtReset = sectionNavigationSeq;
    if (!validateAuditDateRange()) return;
    if (currentSection !== sectionAtReset) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    cancelPendingAuditFiltersApply();
    auditPage = 1;
    saveAuditUiState();
    loadAuditLogs().catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtReset) return;
        if (currentSection !== sectionAtReset) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        handleAuditLoadError(error, "Не вдалося застосувати фільтри аудиту.");
    });
}

function changeAuditPage(delta) {
    const sectionAtPageChange = currentSection;
    const navigationSeqAtPageChange = sectionNavigationSeq;
    const normalizedDelta = Number(delta);
    if (!Number.isInteger(normalizedDelta) || normalizedDelta === 0) return;
    if (!validateAuditDateRange()) return;
    if (currentSection !== sectionAtPageChange) return;
    if (currentSection !== "audit") return;
    const auditSectionEl = document.getElementById("section-audit");
    if (!auditSectionEl || !auditSectionEl.isConnected) return;
    const container = document.getElementById("audit-list");
    if (!container || !container.isConnected) return;
    cancelPendingAuditFiltersApply();
    auditPage = normalizeAuditPage(auditPage + normalizedDelta, 1);
    saveAuditUiState();
    loadAuditLogs().catch((error) => {
        if (sectionNavigationSeq !== navigationSeqAtPageChange) return;
        if (currentSection !== sectionAtPageChange) return;
        if (currentSection !== "audit") return;
        if (!auditSectionEl.isConnected) return;
        if (isAbortError(error)) return;
        handleAuditLoadError(error, "Не вдалося змінити сторінку аудиту.");
    });
}

function renderAuditLogs() {
    const container = document.getElementById("audit-list");
    const pagination = document.getElementById("audit-pagination");
    const totalEl = document.getElementById("audit-total-count");
    if (!container || !container.isConnected) return;

    const filtered = getFilteredAuditLogs();
    const limitEl = document.getElementById("audit-limit");
    const effectiveLimit = normalizeAuditLimitControlValue(limitEl);
    const normalizedTotal = Math.max(0, Number(auditTotal) || 0);
    const totalPages = Math.max(1, Math.ceil(normalizedTotal / effectiveLimit));

    if (totalEl && totalEl.isConnected) {
        totalEl.textContent = `Знайдено: ${normalizedTotal}`;
    }

    const safeAuditPage = normalizeAuditPage(auditPage, 1);
    const displayAuditPage = Math.min(safeAuditPage, totalPages);
    if (auditPage !== displayAuditPage) {
        auditPage = displayAuditPage;
    }

    const paged = filtered;

    if (!paged.length) {
        if (!container.isConnected) return;
        container.innerHTML = '<div class="card p-4 rounded text-gray-400">Поки немає аудиторських записів.</div>';
        if (pagination && pagination.isConnected) pagination.innerHTML = "";
        return;
    }

    if (!container.isConnected) return;
    container.innerHTML = paged.map((entry) => {
        const ts = formatDateTimeOrDash(entry.created_at);
        const details = safeSerializeDetails(entry.details);
        return `
            <div class="card p-4 rounded">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div class="text-white font-bold">${sanitizeInput(entry.action || "-")}</div>
                    <div class="text-xs uppercase tracking-wider text-cyan-300">${sanitizeInput(ts)}</div>
                </div>
                <div class="text-sm text-gray-300 mb-1"><span class="text-gray-500">Сутність:</span> ${sanitizeInput(entry.entity_type || "-")} #${sanitizeInput(String(entry.entity_id || "-"))}</div>
                <div class="text-sm text-gray-300 mb-2"><span class="text-gray-500">Актор:</span> ${sanitizeInput(entry.actor || "-")}</div>
                <div class="text-xs text-gray-400 break-words"><span class="text-gray-500">Details:</span> ${sanitizeInput(details)}</div>
            </div>
        `;
    }).join("");

    if (pagination && pagination.isConnected) {
        pagination.innerHTML = `
            <button class="px-4 py-2 border border-cyan-500/40 rounded text-cyan-300 disabled:opacity-40" onclick="changeAuditPage(-1)" ${displayAuditPage === 1 ? "disabled" : ""}>Назад</button>
            <div class="text-sm text-gray-300">Сторінка ${displayAuditPage} з ${totalPages} • Всього ${normalizedTotal}</div>
            <button class="px-4 py-2 border border-cyan-500/40 rounded text-cyan-300 disabled:opacity-40" onclick="changeAuditPage(1)" ${displayAuditPage >= totalPages ? "disabled" : ""}>Вперед</button>
        `;
    }

    saveAuditUiState();
}

function getStatusLabel(status) {
    const normalizedStatus = normalizeContactRequestStatus(status);
    if (normalizedStatus === "in_progress") return "В роботі";
    if (normalizedStatus === "done") return "Завершено";
    return "Нове";
}

function getFilteredContacts() {
    const { statusFilter, dateFilter, query } = getNormalizedContactsFilters();

    if (!Array.isArray(cache.contactRequests)) return [];

    return cache.contactRequests.filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const normalizedStatus = normalizeContactRequestStatus(entry.status);
        const statusMatch = statusFilter === "all" || normalizedStatus === statusFilter;
        const createdAt = entry.created_at || entry.createdAt;
        const createdDateKey = getDateFilterKey(createdAt);
        const dateMatch = !dateFilter || createdDateKey === dateFilter;

        if (!query) return statusMatch && dateMatch;

        const haystack = [entry.subject, entry.email, entry.name]
            .map((v) => normalizeSearchText(v || ""))
            .join(" ");

        return statusMatch && dateMatch && haystack.includes(query);
    });
}

function renderContacts() {
    const container = document.getElementById("contacts-list");
    const pagination = document.getElementById("contacts-pagination");
    if (!container || !container.isConnected) return;

    const filtered = getFilteredContacts();

    const totalPages = Math.max(CONTACTS_MIN_PAGE, Math.ceil(filtered.length / CONTACTS_PAGE_SIZE));
    const safeContactsPage = normalizeContactsPage(contactsPage, CONTACTS_MIN_PAGE);
    const displayContactsPage = Math.min(safeContactsPage, totalPages);
    if (contactsPage !== displayContactsPage) {
        contactsPage = displayContactsPage;
    }

    const start = (displayContactsPage - CONTACTS_MIN_PAGE) * CONTACTS_PAGE_SIZE;
    const paged = filtered.slice(start, start + CONTACTS_PAGE_SIZE);

    if (!paged.length) {
        if (!container.isConnected) return;
        container.innerHTML = '<div class="card p-4 rounded text-gray-400">Поки немає звернень.</div>';
        if (pagination && pagination.isConnected) pagination.innerHTML = "";
        return;
    }

    if (!container.isConnected) return;
    container.innerHTML = paged.map((entry) => {
        const createdAt = entry.created_at || entry.createdAt;
        const createdText = formatDateTimeOrDash(createdAt);
        const normalizedStatus = normalizeContactRequestStatus(entry.status);
        const normalizedContactId = normalizeContactRequestId(entry.id);
        const statusSelectDisabledAttr = normalizedContactId === null ? "disabled" : "";
        const statusSelectOnChangeAttr = normalizedContactId === null
            ? ""
            : `onchange="changeContactStatus(${normalizedContactId}, this.value)"`;

        return `
            <div class="card p-5 rounded">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div class="text-lg font-bold text-white">${sanitizeInput(entry.subject || "Без теми")}</div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs uppercase tracking-wider text-cyan-300">${sanitizeInput(createdText)}</span>
                        <select class="form-input p-2 rounded text-xs" ${statusSelectOnChangeAttr} ${statusSelectDisabledAttr}>
                            <option value="new" ${normalizedStatus === "new" ? "selected" : ""}>Нове</option>
                            <option value="in_progress" ${normalizedStatus === "in_progress" ? "selected" : ""}>В роботі</option>
                            <option value="done" ${normalizedStatus === "done" ? "selected" : ""}>Завершено</option>
                        </select>
                    </div>
                </div>
                <div class="text-sm text-gray-300 mb-1"><span class="text-gray-400">Ім'я:</span> ${sanitizeInput(entry.name || "-")}</div>
                <div class="text-sm text-gray-300 mb-3"><span class="text-gray-400">Email:</span> ${sanitizeInput(entry.email || "-")}</div>
                <div class="text-xs uppercase tracking-wider text-pink-300 mb-2">Статус: ${sanitizeInput(getStatusLabel(normalizedStatus))}</div>
                <div class="text-gray-200 whitespace-pre-wrap">${sanitizeInput(entry.message || "")}</div>
            </div>
        `;
    }).join("");

    if (pagination && pagination.isConnected) {
        pagination.innerHTML = `
            <button class="px-4 py-2 border border-cyan-500/40 rounded text-cyan-300 disabled:opacity-40" onclick="changeContactsPage(-1)" ${displayContactsPage === CONTACTS_MIN_PAGE ? "disabled" : ""}>Назад</button>
            <div class="text-sm text-gray-300">Сторінка ${displayContactsPage} з ${totalPages}</div>
            <button class="px-4 py-2 border border-cyan-500/40 rounded text-cyan-300 disabled:opacity-40" onclick="changeContactsPage(1)" ${displayContactsPage >= totalPages ? "disabled" : ""}>Вперед</button>
        `;
    }
}

function escapeCsv(value) {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
}

function normalizeCsvRowValues(row) {
    if (!Array.isArray(row)) return [];

    return row.map((cell) => {
        if (cell === null || cell === undefined) return "";
        if (typeof cell === "string" || typeof cell === "number") return cell;
        if (typeof cell === "boolean") return cell ? "true" : "false";
        return "";
    });
}

function exportContactsCsv() {
    const sectionAtExport = currentSection;
    if (currentSection !== sectionAtExport) return;
    if (currentSection !== "contacts") return;
    const contactsSectionEl = document.getElementById("section-contacts");
    const contactsListEl = document.getElementById("contacts-list");
    if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
    if (!contactsListEl || !contactsListEl.isConnected) return;

    const filtered = getFilteredContacts();
    if (!filtered.length) {
        alert("Немає звернень для експорту.");
        return;
    }

    const header = ["id", "created_at", "status", "name", "email", "subject", "message"];
    const rows = filtered.map((entry) => normalizeCsvRowValues([
        entry.id,
        entry.created_at || entry.createdAt || "",
        normalizeContactRequestStatus(entry.status),
        entry.name || "",
        entry.email || "",
        entry.subject || "",
        entry.message || ""
    ]));

    const csv = [header, ...rows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `core64_contacts_${getTodayIsoDateSafe()}.csv`;
    const bodyEl = document.body;
    if (!bodyEl || bodyEl.isConnected === false) {
        URL.revokeObjectURL(url);
        return;
    }
    bodyEl.appendChild(link);
    link.click();
    if (bodyEl.isConnected && link.isConnected) {
        bodyEl.removeChild(link);
    }
    URL.revokeObjectURL(url);
    addActivity(`Експортовано ${filtered.length} звернень у CSV`);
}

function changeContactsPage(delta) {
    const normalizedDelta = Number(delta);
    if (!Number.isInteger(normalizedDelta) || normalizedDelta === 0) return;
    const sectionAtPageChange = currentSection;
    if (currentSection !== sectionAtPageChange) return;
    if (currentSection !== "contacts") return;
    const contactsSectionEl = document.getElementById("section-contacts");
    if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
    const container = document.getElementById("contacts-list");
    if (!container || !container.isConnected) return;
    cancelPendingContactsFiltersApply();
    contactsPage = normalizeContactsPage(contactsPage + normalizedDelta, CONTACTS_MIN_PAGE);
    renderContacts();
}

function cancelPendingContactsFiltersApply() {
    if (!contactsFilterDebounceTimer) return;
    clearTimeout(contactsFilterDebounceTimer);
    contactsFilterDebounceTimer = null;
}

function scheduleContactsFiltersApply(delayMs = 0) {
    const sectionAtFilterChange = currentSection;
    const navigationSeqAtFilterChange = sectionNavigationSeq;
    const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);

    cancelPendingContactsFiltersApply();

    const applyFilters = () => {
        contactsFilterDebounceTimer = null;
        if (sectionNavigationSeq !== navigationSeqAtFilterChange) return;
        if (currentSection !== sectionAtFilterChange) return;
        if (currentSection !== "contacts") return;
        const contactsSectionEl = document.getElementById("section-contacts");
        const contactsListEl = document.getElementById("contacts-list");
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        if (!contactsListEl || !contactsListEl.isConnected) return;

        getNormalizedContactsFilters();
        contactsPage = CONTACTS_MIN_PAGE;
        renderContacts();
    };

    if (!normalizedDelayMs) {
        applyFilters();
        return;
    }

    contactsFilterDebounceTimer = setTimeout(applyFilters, normalizedDelayMs);
}

function handleContactsFilterChange() {
    scheduleContactsFiltersApply(0);
}

function handleContactsSearchInput() {
    scheduleContactsFiltersApply(250);
}

const CONTACT_REQUEST_ALLOWED_STATUSES = ["new", "in_progress", "done"];

function normalizeSupportedContactRequestStatus(status) {
    if (typeof status !== "string") return null;
    const normalizedStatus = status.trim().toLowerCase();
    return CONTACT_REQUEST_ALLOWED_STATUSES.includes(normalizedStatus) ? normalizedStatus : null;
}

function isSupportedContactRequestStatus(status) {
    return normalizeSupportedContactRequestStatus(status) !== null;
}

function normalizeContactRequestId(id) {
    const normalizedId = Number(id);
    return Number.isFinite(normalizedId) ? normalizedId : null;
}

function normalizeContactRequestStatus(status) {
    return normalizeSupportedContactRequestStatus(status) || "new";
}

function getCachedContactRequestStatusById(id) {
    const normalizedId = normalizeContactRequestId(id);
    if (normalizedId === null) return null;
    if (!Array.isArray(cache.contactRequests)) return null;

    const matchedEntry = cache.contactRequests.find((entry) => {
        if (!entry || typeof entry !== "object") return false;
        return normalizeContactRequestId(entry.id) === normalizedId;
    });

    if (!matchedEntry || typeof matchedEntry !== "object") return null;
    return normalizeContactRequestStatus(matchedEntry.status);
}

async function changeContactStatus(id, status) {
    const sectionAtUpdate = currentSection;
    const navigationSeqAtUpdate = sectionNavigationSeq;
    const normalizedId = normalizeContactRequestId(id);
    const normalizedStatus = normalizeSupportedContactRequestStatus(status);
    if (normalizedId === null) return;
    if (!normalizedStatus) return;
    const cachedStatus = getCachedContactRequestStatusById(normalizedId);
    if (cachedStatus && cachedStatus === normalizedStatus) return;
    if (currentSection !== sectionAtUpdate) return;
    if (currentSection !== "contacts") return;
    const contactsSectionEl = document.getElementById("section-contacts");
    const contactsListEl = document.getElementById("contacts-list");
    if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
    if (!contactsListEl || !contactsListEl.isConnected) return;
    const updateContactRequestStatusMethod = getAdapterMethod("updateContactRequestStatus");
    const getContactRequestsMethod = getAdapterMethod("getContactRequests");
    if (!updateContactRequestStatusMethod || !getContactRequestsMethod) {
        console.warn("Contact adapter methods are unavailable", {
            hasUpdateContactRequestStatus: !!updateContactRequestStatusMethod,
            hasGetContactRequests: !!getContactRequestsMethod
        });
        alert("Не вдалося оновити статус звернення: відсутній метод adapter.");
        return;
    }

    try {
        await updateContactRequestStatusMethod.call(adapter, normalizedId, normalizedStatus);
        if (sectionNavigationSeq !== navigationSeqAtUpdate) return;
        if (currentSection !== sectionAtUpdate) return;
        if (currentSection !== "contacts") return;
        const nextContactRequests = await getContactRequestsMethod.call(adapter);
        if (sectionNavigationSeq !== navigationSeqAtUpdate) return;
        if (currentSection !== sectionAtUpdate) return;
        if (currentSection !== "contacts") return;
        cache.contactRequests = normalizeRecordArray(nextContactRequests);
        if (currentSection !== "contacts") return;
        if (sectionAtUpdate !== "contacts") return;
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        if (!contactsListEl || !contactsListEl.isConnected) return;
        renderContacts();
        if (currentSection !== sectionAtUpdate) return;
        addActivity(`Оновлено статус звернення #${normalizedId} -> ${normalizedStatus}`);
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtUpdate) return;
        console.error("Contact status update failed", error);
        if (currentSection !== sectionAtUpdate) return;
        if (currentSection !== "contacts") return;
        const contactsSectionEl = document.getElementById("section-contacts");
        const contactsListEl = document.getElementById("contacts-list");
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        if (!contactsListEl || !contactsListEl.isConnected) return;
        alert("Не вдалося оновити статус звернення.");
    }
}

async function bulkUpdateContactStatus(fromStatus, toStatus) {
    const sectionAtBulkUpdate = currentSection;
    const navigationSeqAtBulkUpdate = sectionNavigationSeq;
    const normalizedFromStatus = normalizeSupportedContactRequestStatus(fromStatus);
    const normalizedToStatus = normalizeSupportedContactRequestStatus(toStatus);
    if (!normalizedFromStatus || !normalizedToStatus) {
        console.warn("Bulk status transition contains unsupported value", {
            fromStatus,
            toStatus
        });
        return;
    }
    if (!isSupportedContactRequestStatus(normalizedFromStatus) || !isSupportedContactRequestStatus(normalizedToStatus)) {
        console.warn("Bulk status transition failed supported-status validation", {
            normalizedFromStatus,
            normalizedToStatus
        });
        return;
    }
    if (normalizedFromStatus === normalizedToStatus) {
        console.warn("Bulk status transition skipped because source and target statuses are identical", {
            normalizedFromStatus
        });
        return;
    }
    if (!Array.isArray(cache.contactRequests)) return;
    if (currentSection !== sectionAtBulkUpdate) return;
    if (currentSection !== "contacts") return;
    const contactsSectionEl = document.getElementById("section-contacts");
    const contactsListEl = document.getElementById("contacts-list");
    if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
    if (!contactsListEl || !contactsListEl.isConnected) return;
    const updateContactRequestStatusMethod = getAdapterMethod("updateContactRequestStatus");
    const getContactRequestsMethod = getAdapterMethod("getContactRequests");
    if (!updateContactRequestStatusMethod || !getContactRequestsMethod) {
        console.warn("Bulk contact adapter methods are unavailable", {
            hasUpdateContactRequestStatus: !!updateContactRequestStatusMethod,
            hasGetContactRequests: !!getContactRequestsMethod
        });
        alert("Не вдалося виконати масове оновлення: відсутній метод adapter.");
        return;
    }

    const seenTargetIds = new Set();
    const targets = cache.contactRequests
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
            const normalizedEntryId = normalizeContactRequestId(entry.id);
            const normalizedEntryStatus = normalizeContactRequestStatus(entry.status);
            return normalizedEntryId === null
                ? null
                : {
                    id: normalizedEntryId,
                    status: normalizedEntryStatus
                };
        })
        .filter((entry) => {
            if (!entry) return false;
            if (entry.status !== normalizedFromStatus) return false;
            if (seenTargetIds.has(entry.id)) return false;
            seenTargetIds.add(entry.id);
            return true;
        });
    if (!targets.length) {
        alert("Немає звернень для масового оновлення.");
        return;
    }

    try {
        await Promise.all(targets.map((entry) => updateContactRequestStatusMethod.call(adapter, entry.id, normalizedToStatus)));
        if (sectionNavigationSeq !== navigationSeqAtBulkUpdate) return;
        if (currentSection !== sectionAtBulkUpdate) return;
        if (currentSection !== "contacts") return;
        const nextContactRequests = await getContactRequestsMethod.call(adapter);
        if (sectionNavigationSeq !== navigationSeqAtBulkUpdate) return;
        if (currentSection !== sectionAtBulkUpdate) return;
        if (currentSection !== "contacts") return;
        cache.contactRequests = normalizeRecordArray(nextContactRequests);
        if (currentSection !== "contacts") return;
        if (sectionAtBulkUpdate !== "contacts") return;
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        if (!contactsListEl || !contactsListEl.isConnected) return;
        contactsPage = 1;
        renderContacts();
        if (currentSection !== sectionAtBulkUpdate) return;
        addActivity(`Масово оновлено ${targets.length} звернень: ${normalizedFromStatus} -> ${normalizedToStatus}`);
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtBulkUpdate) return;
        console.error("Bulk status update failed", error);
        if (currentSection !== sectionAtBulkUpdate) return;
        if (currentSection !== "contacts") return;
        const contactsSectionEl = document.getElementById("section-contacts");
        const contactsListEl = document.getElementById("contacts-list");
        if (!contactsSectionEl || !contactsSectionEl.isConnected) return;
        if (!contactsListEl || !contactsListEl.isConnected) return;
        alert("Не вдалося виконати масове оновлення статусів.");
    }
}

function openModal(type, id) {
    if (!isSupportedEntityType(type)) return;
    const normalizedId = normalizeEntityId(id);
    if (hasDefinedEntityId(normalizedId) && !hasUsableEntityId(normalizedId)) return;
    editingId = normalizedId ?? null;
    editingType = type;

    const modal = document.getElementById("modal");
    const title = document.getElementById("modal-title");
    const fields = document.getElementById("modal-fields");
    if (!modal || !title || !fields || !modal.isConnected || !title.isConnected || !fields.isConnected) {
        return;
    }
    const collection = `${type}s`;
    const collectionItems = Array.isArray(cache[collection]) ? cache[collection] : [];

    let item = {};
    if (hasDefinedEntityId(editingId)) {
        const matchedItem = collectionItems.find((entry) => {
            if (!entry || typeof entry !== "object") return false;
            const entryId = normalizeEntityId(entry.id);
            if (!hasUsableEntityId(entryId)) return false;
            return Number(entryId) === Number(editingId);
        });
        if (!matchedItem) return;
        item = matchedItem;
        title.textContent = "Редагувати " + getTypeName(type);
    } else {
        title.textContent = "Додати " + getTypeName(type);
    }

    if (!fields.isConnected || !modal.isConnected) return;
    fields.innerHTML = generateFields(type, item);

    if (!modal.isConnected) return;
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    const modalEl = document.getElementById("modal");
    if (modalEl && modalEl.isConnected) {
        modalEl.classList.add("hidden");
    }
    editingId = null;
    editingType = null;
}

const MAX_UPLOAD_IMAGE_BYTES = 500 * 1024;
const SUPPORTED_UPLOAD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SUPPORTED_UPLOAD_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

function hasSupportedUploadImageType(file) {
    if (!file || typeof file.type !== "string") return false;
    const normalizedType = file.type.toLowerCase();
    return SUPPORTED_UPLOAD_IMAGE_TYPES.includes(normalizedType);
}

function hasSupportedUploadImageExtension(file) {
    if (!file || typeof file.name !== "string") return false;
    const normalizedName = file.name.trim().toLowerCase();
    if (!normalizedName) return false;
    const ext = normalizedName.split(".").pop();
    return !!ext && SUPPORTED_UPLOAD_IMAGE_EXTENSIONS.includes(ext);
}

function isSupportedUploadImage(file) {
    return hasSupportedUploadImageType(file) || hasSupportedUploadImageExtension(file);
}

function handleFileUpload(input) {
    const sectionAtUpload = currentSection;
    if (!input || input.isConnected === false) return;
    if (typeof input.tagName !== "string" || input.tagName.toUpperCase() !== "INPUT") return;
    const sectionEl = document.getElementById(`section-${sectionAtUpload}`);
    if (!sectionEl || !sectionEl.isConnected) return;
    const files = input.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size < 0) {
        if (currentSection === sectionAtUpload) {
            if (sectionEl && sectionEl.isConnected) {
                alert("Не вдалося визначити розмір файлу.");
            }
        }
        if (input.isConnected) {
            input.value = "";
        }
        return;
    }

    if (!isSupportedUploadImage(file)) {
        if (currentSection === sectionAtUpload) {
            if (sectionEl && sectionEl.isConnected) {
                alert("Непідтримуваний формат. Дозволено JPG, PNG, WEBP, GIF.");
            }
        }
        if (input.isConnected) {
            input.value = "";
        }
        return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        if (currentSection === sectionAtUpload) {
            if (sectionEl && sectionEl.isConnected) {
                alert("Файл занадто великий. Максимальний розмір: 500KB");
            }
        }
        if (input.isConnected) {
            input.value = "";
        }
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        if (currentSection !== sectionAtUpload) return;
        if (!sectionEl || !sectionEl.isConnected) return;
        if (!input || input.isConnected === false) return;
        const loadTarget = e && e.target;
        if (!loadTarget || typeof loadTarget.result !== "string") return;
        const base64 = loadTarget.result;
        const container = input.closest("div");
        if (!container || container.isConnected === false) return;
        const imageInput = container.querySelector('input[name="image"]');
        const preview = container.parentElement ? container.parentElement.querySelector(".image-preview") : null;

        if (imageInput && imageInput.isConnected) imageInput.value = base64;
        if (preview && preview.isConnected) {
            preview.src = base64;
            preview.classList.remove("hidden");
        }
    };

    reader.onerror = function () {
        if (currentSection !== sectionAtUpload) return;
        if (!input || input.isConnected === false) return;
        if (!sectionEl || !sectionEl.isConnected) return;
        alert("Помилка читання файлу");
    };

    reader.readAsDataURL(file);
}

function generateFields(type, item) {
    const sourceItem = item && typeof item === "object" ? item : {};
    const normalizeFieldValue = (value, fallback = "") => sanitizeInput(value ?? fallback);
    const rawGenre = typeof sourceItem.genre === "string" ? sourceItem.genre : "";
    const imageValue = normalizeFieldValue(sourceItem.image);

    const fieldValues = {
        title: normalizeFieldValue(sourceItem.title),
        artist: normalizeFieldValue(sourceItem.artist),
        genre: normalizeFieldValue(rawGenre),
        year: normalizeFieldValue(sourceItem.year, "2024"),
        link: normalizeFieldValue(sourceItem.link, "#"),
        image: imageValue,
        name: normalizeFieldValue(sourceItem.name),
        instagram: normalizeFieldValue(sourceItem.instagram),
        soundcloud: normalizeFieldValue(sourceItem.soundcloud),
        bio: normalizeFieldValue(sourceItem.bio),
        date: normalizeFieldValue(sourceItem.date),
        time: normalizeFieldValue(sourceItem.time),
        venue: normalizeFieldValue(sourceItem.venue),
        description: normalizeFieldValue(sourceItem.description),
        ticketLink: normalizeFieldValue(sourceItem.ticketLink || sourceItem.ticket_link)
    };

    const imagePreview = imageValue ? `<img src="${imageValue}" class="image-preview preview-img mt-2 rounded ${type === 'artist' ? 'w-24 h-24 object-cover' : (type === 'event' ? 'h-32 w-full object-cover' : '')}" style="max-height: 200px;">` : '<img src="" class="image-preview preview-img mt-2 rounded hidden" style="max-height: 200px;">';
    
    const fields = {
        release: `
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Назва релізу</label>
                <input type="text" name="title" value="${fieldValues.title}" class="form-input w-full p-3 rounded" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Артист</label>
                    <input type="text" name="artist" value="${fieldValues.artist}" class="form-input w-full p-3 rounded" required>
                </div>
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Жанр</label>
                    <select name="genre" class="form-input w-full p-3 rounded">
                        <option value="Neurofunk" ${rawGenre === 'Neurofunk' ? 'selected' : ''}>Neurofunk</option>
                        <option value="Techstep" ${rawGenre === 'Techstep' ? 'selected' : ''}>Techstep</option>
                        <option value="Breakbeat" ${rawGenre === 'Breakbeat' ? 'selected' : ''}>Breakbeat</option>
                        <option value="DnB" ${rawGenre === 'DnB' ? 'selected' : ''}>DnB</option>
                        <option value="Darkstep" ${rawGenre === 'Darkstep' ? 'selected' : ''}>Darkstep</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Рік</label>
                    <input type="text" name="year" value="${fieldValues.year}" class="form-input w-full p-3 rounded">
                </div>
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Посилання</label>
                    <input type="text" name="link" value="${fieldValues.link}" class="form-input w-full p-3 rounded">
                </div>
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Зображення</label>
                <div class="flex gap-2 mb-2">
                    <input type="text" name="image" value="${fieldValues.image}" class="form-input flex-1 p-3 rounded text-sm" placeholder="URL або завантажте файл">
                    <label class="btn-cyan px-4 py-2 rounded cursor-pointer flex items-center gap-2 whitespace-nowrap">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        <span>Файл</span>
                        <input type="file" accept="image/*" class="hidden" onchange="handleFileUpload(this)">
                    </label>
                </div>
                ${imagePreview}
                <p class="text-xs text-gray-500 mt-1">Макс. розмір: 500KB. Формати: JPG, PNG, GIF</p>
            </div>
        `,
        artist: `
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Ім'я артиста</label>
                <input type="text" name="name" value="${fieldValues.name}" class="form-input w-full p-3 rounded" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Жанр</label>
                    <input type="text" name="genre" value="${fieldValues.genre}" class="form-input w-full p-3 rounded">
                </div>
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Instagram</label>
                    <input type="text" name="instagram" value="${fieldValues.instagram}" class="form-input w-full p-3 rounded" placeholder="@username">
                </div>
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">SoundCloud</label>
                <input type="text" name="soundcloud" value="${fieldValues.soundcloud}" class="form-input w-full p-3 rounded" placeholder="URL">
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Біографія</label>
                <textarea name="bio" rows="3" class="form-input w-full p-3 rounded">${fieldValues.bio}</textarea>
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Фото</label>
                <div class="flex gap-2 mb-2">
                    <input type="text" name="image" value="${fieldValues.image}" class="form-input flex-1 p-3 rounded text-sm" placeholder="URL або завантажте файл">
                    <label class="btn-cyan px-4 py-2 rounded cursor-pointer flex items-center gap-2 whitespace-nowrap">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        <span>Файл</span>
                        <input type="file" accept="image/*" class="hidden" onchange="handleFileUpload(this)">
                    </label>
                </div>
                <img src="${fieldValues.image}" class="image-preview preview-img mt-2 rounded w-24 h-24 object-cover ${fieldValues.image ? '' : 'hidden'}">
                <p class="text-xs text-gray-500 mt-1">Макс. розмір: 500KB. Рекомендовано: квадратне фото</p>
            </div>
        `,
        event: `
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Назва події</label>
                <input type="text" name="title" value="${fieldValues.title}" class="form-input w-full p-3 rounded" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Дата</label>
                    <input type="date" name="date" value="${fieldValues.date}" class="form-input w-full p-3 rounded" required>
                </div>
                <div>
                    <label class="block text-gray-400 mb-2 text-sm uppercase">Час</label>
                    <input type="time" name="time" value="${fieldValues.time}" class="form-input w-full p-3 rounded">
                </div>
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Місце проведення</label>
                <input type="text" name="venue" value="${fieldValues.venue}" class="form-input w-full p-3 rounded" placeholder="Місто, Клуб">
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Опис</label>
                <textarea name="description" rows="3" class="form-input w-full p-3 rounded">${fieldValues.description}</textarea>
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Посилання на квитки</label>
                <input type="url" name="ticketLink" value="${fieldValues.ticketLink}" class="form-input w-full p-3 rounded" placeholder="https://...">
            </div>
            <div>
                <label class="block text-gray-400 mb-2 text-sm uppercase">Зображення</label>
                <div class="flex gap-2 mb-2">
                    <input type="text" name="image" value="${fieldValues.image}" class="form-input flex-1 p-3 rounded text-sm" placeholder="URL або завантажте файл">
                    <label class="btn-cyan px-4 py-2 rounded cursor-pointer flex items-center gap-2 whitespace-nowrap">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        <span>Файл</span>
                        <input type="file" accept="image/*" class="hidden" onchange="handleFileUpload(this)">
                    </label>
                </div>
                <img src="${fieldValues.image}" class="image-preview preview-img mt-2 rounded h-32 w-full object-cover ${fieldValues.image ? '' : 'hidden'}">
                <p class="text-xs text-gray-500 mt-1">Макс. розмір: 500KB. Рекомендовано: 640x360 або 16:9</p>
            </div>
        `
    };
    
    return fields[type] || '';
}

function getTypeName(type) {
    const names = { release: "реліз", artist: "артиста", event: "подію" };
    return names[type] || type;
}

const SUPPORTED_ENTITY_TYPES = ["release", "artist", "event"];

function isSupportedEntityType(type) {
    return typeof type === "string" && SUPPORTED_ENTITY_TYPES.includes(type);
}

function normalizeEntityId(id) {
    if (typeof id !== "string") return id;
    const trimmedId = id.trim();
    return trimmedId ? trimmedId : null;
}

function hasDefinedEntityId(id) {
    return id !== null && id !== undefined;
}

function hasUsableEntityId(id) {
    if (!hasDefinedEntityId(id)) return false;
    if (typeof id === "string") return !!id.trim();
    if (typeof id === "number") return Number.isFinite(id);
    return false;
}

function normalizeCrudFormFieldValue(entityType, key, value) {
    const rawValue = typeof value === "string" ? value : String(value ?? "");
    const sanitizedValue = sanitizeInput(rawValue);

    if (entityType === "release" && key === "year") {
        const trimmedYear = rawValue.trim();
        if (!trimmedYear) return "";

        const numericYear = Number(trimmedYear);
        if (Number.isFinite(numericYear)) {
            return clampBoundedInteger(numericYear, {
                fallback: 2024,
                min: 1900,
                max: 9999
            });
        }

        return sanitizedValue;
    }

    if (entityType === "event" && key === "date") {
        return normalizeIsoDateFilter(rawValue) || sanitizedValue;
    }

    return sanitizedValue;
}

function buildCrudItemFromFormData(entityType, formData, baseItem = {}) {
    const item = {
        ...(baseItem && typeof baseItem === "object" ? baseItem : {})
    };
    if (!(formData instanceof FormData)) return item;

    formData.forEach((value, key) => {
        if (typeof key !== "string" || !key.trim()) return;
        item[key] = normalizeCrudFormFieldValue(entityType, key, value);
    });

    return item;
}

function serializeInlineEntityIdArg(id) {
    const normalizedId = normalizeEntityId(id);
    if (!hasUsableEntityId(normalizedId)) return null;
    if (typeof normalizedId === "number") return String(normalizedId);

    const candidate = normalizedId.trim();
    return /^[A-Za-z0-9_-]+$/.test(candidate) ? `'${candidate}'` : null;
}

const modalFormEl = document.getElementById("modal-form");
if (modalFormEl && modalFormEl.isConnected) {
    if (!modalFormEl.dataset.submitListenerBound) {
        modalFormEl.dataset.submitListenerBound = "1";
        modalFormEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingType) return;
        const sectionAtSubmit = currentSection;
        const navigationSeqAtSubmit = sectionNavigationSeq;
        const editingTypeAtSubmit = editingType;
        if (!isSupportedEntityType(editingTypeAtSubmit)) return;
        const editingIdAtSubmit = normalizeEntityId(editingId);
        if (hasDefinedEntityId(editingIdAtSubmit) && !hasUsableEntityId(editingIdAtSubmit)) return;
        const isEditMode = hasUsableEntityId(editingIdAtSubmit);

        const formEl = e.target;
        if (!formEl || formEl.isConnected === false) return;
        if (typeof formEl.tagName !== "string" || formEl.tagName.toUpperCase() !== "FORM") return;
        const formData = new FormData(formEl);
        const item = buildCrudItemFromFormData(editingTypeAtSubmit, formData, {
            id: isEditMode ? editingIdAtSubmit : Date.now()
        });

        const updateItemMethod = getAdapterMethod("updateItem");
        const createItemMethod = getAdapterMethod("createItem");
        if ((isEditMode && !updateItemMethod) || (!isEditMode && !createItemMethod)) {
            console.warn("Adapter CRUD method is unavailable", {
                isEditMode,
                hasUpdateItem: !!updateItemMethod,
                hasCreateItem: !!createItemMethod
            });
            if (sectionNavigationSeq !== navigationSeqAtSubmit) return;
            if (currentSection !== sectionAtSubmit) return;
            const sectionEl = document.getElementById(`section-${sectionAtSubmit}`);
            if (!sectionEl || !sectionEl.isConnected) return;
            alert("Не вдалося виконати збереження: відсутній метод adapter.");
            return;
        }

        try {
            if (isEditMode) {
                await updateItemMethod.call(adapter, editingTypeAtSubmit, editingIdAtSubmit, item);
            } else {
                await createItemMethod.call(adapter, editingTypeAtSubmit, item);
            }

            if (sectionNavigationSeq !== navigationSeqAtSubmit) return;
            if (currentSection !== sectionAtSubmit) return;
            const sectionEl = document.getElementById(`section-${sectionAtSubmit}`);
            if (!sectionEl || !sectionEl.isConnected) return;

            closeModal();
            await showSection(sectionAtSubmit);
            if (sectionNavigationSeq !== navigationSeqAtSubmit) return;
            if (currentSection !== sectionAtSubmit) return;
            if (!sectionEl.isConnected) return;
            await loadDashboard();
            if (sectionNavigationSeq !== navigationSeqAtSubmit) return;
            if (currentSection !== sectionAtSubmit) return;
            if (!sectionEl.isConnected) return;
            addActivity(`${isEditMode ? "Оновлено" : "Додано"} ${getTypeName(editingTypeAtSubmit)}: ${item.title || item.name}`);
        } catch (error) {
            if (sectionNavigationSeq !== navigationSeqAtSubmit) return;
            console.error("Save failed", error);
            if (currentSection !== sectionAtSubmit) return;
            const sectionEl = document.getElementById(`section-${sectionAtSubmit}`);
            if (!sectionEl || !sectionEl.isConnected) return;
            alert("Не вдалося зберегти запис. Перевірте дані і спробуйте ще раз.");
        }
        });
    }
} else {
    if (!modalFormMissingWarned) {
        console.warn("Modal form element is unavailable; submit listener was not registered");
        modalFormMissingWarned = true;
    }
}

function editItem(type, id) {
    if (!isSupportedEntityType(type)) return;
    const normalizedId = normalizeEntityId(id);
    if (!hasUsableEntityId(normalizedId)) return;
    openModal(type, normalizedId);
}

async function deleteItem(type, id) {
    if (!isSupportedEntityType(type)) return;
    const normalizedId = normalizeEntityId(id);
    if (!hasUsableEntityId(normalizedId)) return;
    const sectionAtDelete = currentSection;
    const navigationSeqAtDelete = sectionNavigationSeq;
    const typeName = getTypeName(type);
    if (!confirm("Ви впевнені, що хочете видалити цей запис?")) return;
    const deleteItemMethod = getAdapterMethod("deleteItem");
    if (!deleteItemMethod) {
        console.warn("Adapter deleteItem method is unavailable");
        if (currentSection !== sectionAtDelete) return;
        const sectionEl = document.getElementById(`section-${sectionAtDelete}`);
        if (!sectionEl || !sectionEl.isConnected) return;
        alert("Не вдалося видалити запис: відсутній метод adapter.");
        return;
    }

    try {
        await deleteItemMethod.call(adapter, type, normalizedId);
        if (sectionNavigationSeq !== navigationSeqAtDelete) return;
        if (currentSection !== sectionAtDelete) return;
        const sectionEl = document.getElementById(`section-${sectionAtDelete}`);
        if (!sectionEl || !sectionEl.isConnected) return;
        await showSection(sectionAtDelete);
        if (sectionNavigationSeq !== navigationSeqAtDelete) return;
        if (currentSection !== sectionAtDelete) return;
        if (!sectionEl.isConnected) return;
        await loadDashboard();
        if (sectionNavigationSeq !== navigationSeqAtDelete) return;
        if (currentSection !== sectionAtDelete) return;
        if (!sectionEl.isConnected) return;
        addActivity(`Видалено ${typeName} #${normalizedId}`);
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtDelete) return;
        console.error("Delete failed", error);
        if (currentSection !== sectionAtDelete) return;
        const sectionEl = document.getElementById(`section-${sectionAtDelete}`);
        if (!sectionEl || !sectionEl.isConnected) return;
        alert("Не вдалося видалити запис.");
    }
}

async function saveSettings(options = {}) {
    const sectionAtSave = currentSection;
    const navigationSeqAtSave = sectionNavigationSeq;
    const { notifySuccess } = normalizeSaveSettingsOptions(options);
    const titleInputEl = document.getElementById("setting-title");
    const aboutInputEl = document.getElementById("setting-about");
    const missionInputEl = document.getElementById("setting-mission");
    const emailInputEl = document.getElementById("setting-email");
    if (!titleInputEl || !aboutInputEl || !missionInputEl || !emailInputEl || !titleInputEl.isConnected || !aboutInputEl.isConnected || !missionInputEl.isConnected || !emailInputEl.isConnected) {
        console.warn("Core settings inputs are unavailable during settings save");
        return false;
    }
    const goodInputEl = document.getElementById("setting-audit-latency-good-max");
    const warnInputEl = document.getElementById("setting-audit-latency-warn-max");
    if (!goodInputEl || !warnInputEl || !goodInputEl.isConnected || !warnInputEl.isConnected) {
        console.warn("Latency threshold inputs are unavailable during settings save");
        return false;
    }
    const goodInput = goodInputEl.value;
    const warnInput = warnInputEl.value;
    const goodMax = parsePositiveMsValue(goodInput, AUDIT_LATENCY_GOOD_MAX_MS);
    const warnMaxRaw = parsePositiveMsValue(warnInput, AUDIT_LATENCY_WARN_MAX_MS);
    const warnMax = Math.max(warnMaxRaw, goodMax + 1);

    if (warnMaxRaw <= goodMax) {
        if (currentSection === sectionAtSave && currentSection === "settings") {
            const settingsSectionEl = document.getElementById("section-settings");
            if (settingsSectionEl && settingsSectionEl.isConnected) {
                alert("Поріг 'Помірно до' має бути більшим за поріг 'Добре до'. Значення скориговано автоматично.");
            }
        }
    }

    const settings = {
        title: sanitizeInput(titleInputEl.value),
        about: sanitizeInput(aboutInputEl.value),
        mission: sanitizeInput(missionInputEl.value),
        email: sanitizeInput(emailInputEl.value),
        auditLatencyGoodMaxMs: goodMax,
        auditLatencyWarnMaxMs: warnMax
    };

    const saveCollectionMethod = getAdapterMethod("saveCollection");
    if (!saveCollectionMethod) {
        console.warn("Adapter saveCollection method is unavailable during settings save");
        if (currentSection !== sectionAtSave) return false;
        if (currentSection !== "settings") return false;
        const settingsSectionEl = document.getElementById("section-settings");
        if (!settingsSectionEl || !settingsSectionEl.isConnected) return false;
        alert("Не вдалося зберегти налаштування: відсутній метод adapter.");
        return false;
    }

    try {
        await saveCollectionMethod.call(adapter, "settings", settings);
        if (sectionNavigationSeq !== navigationSeqAtSave) return false;
        cache.settings = settings;
        applyAuditLatencyThresholds(settings);
        if (goodInputEl.isConnected) {
            goodInputEl.value = String(goodMax);
        }
        if (warnInputEl.isConnected) {
            warnInputEl.value = String(warnMax);
        }
        setAuditLatencyThresholdsDirtyState(false);
        if (currentSection !== sectionAtSave) return true;
        if (currentSection !== "settings") return true;
        const settingsSectionEl = document.getElementById("section-settings");
        if (!settingsSectionEl || !settingsSectionEl.isConnected) return true;
        addActivity("Оновлено налаштування сайту");
        if (notifySuccess) {
            alert("Налаштування збережено");
        }
        return true;
    } catch (error) {
        if (sectionNavigationSeq !== navigationSeqAtSave) return false;
        console.error("Settings save failed", error);
        if (currentSection !== sectionAtSave) return false;
        if (currentSection !== "settings") return false;
        const settingsSectionEl = document.getElementById("section-settings");
        if (!settingsSectionEl || !settingsSectionEl.isConnected) return false;
        alert("Не вдалося зберегти налаштування");
        return false;
    }
}

function normalizeSaveSettingsOptions(options) {
    if (!options || typeof options !== "object") {
        return { notifySuccess: true };
    }

    return {
        notifySuccess: options.notifySuccess !== false
    };
}

function resetAuditLatencyThresholdsForm() {
    const sectionAtReset = currentSection;
    const goodEl = document.getElementById("setting-audit-latency-good-max");
    const warnEl = document.getElementById("setting-audit-latency-warn-max");

    if (goodEl && goodEl.isConnected) goodEl.value = String(AUDIT_LATENCY_GOOD_MAX_MS);
    if (warnEl && warnEl.isConnected) warnEl.value = String(AUDIT_LATENCY_WARN_MAX_MS);

    applyAuditLatencyThresholds({
        auditLatencyGoodMaxMs: AUDIT_LATENCY_GOOD_MAX_MS,
        auditLatencyWarnMaxMs: AUDIT_LATENCY_WARN_MAX_MS
    });

    syncAuditLatencyThresholdsDirtyState();

    if (currentSection !== sectionAtReset) return;
    if (currentSection !== "settings") return;
    const settingsSectionEl = document.getElementById("section-settings");
    if (!settingsSectionEl || !settingsSectionEl.isConnected) return;

    addActivity("Скинуто пороги latency до дефолтних (без збереження)");
}

function resetData() {
    if (resetDataInProgress) return;
    if (!confirm("УВАГА! Це скине локальні fallback-дані. Продовжити?")) return;
    const canUseLocalStorage = typeof localStorage !== "undefined" && typeof localStorage.removeItem === "function";
    const ensureLocalDefaultsMethod = getAdapterMethod("ensureLocalDefaults");
    const canEnsureLocalDefaults = !!ensureLocalDefaultsMethod;
    const canReloadPage = typeof location !== "undefined" && typeof location.reload === "function";

    if (!canUseLocalStorage || !canEnsureLocalDefaults || !canReloadPage) {
        console.warn("Reset data preflight failed", {
            canUseLocalStorage,
            canEnsureLocalDefaults,
            canReloadPage
        });
        alert("Не вдалося виконати скидання в поточному середовищі.");
        return;
    }

    resetDataInProgress = true;
    try {
        localStorage.removeItem("core64_data");
        ensureLocalDefaultsMethod.call(adapter);
        location.reload();
    } catch (error) {
        console.error("Reset data failed", error);
        alert("Не вдалося скинути локальні дані. Спробуйте ще раз.");
    } finally {
        resetDataInProgress = false;
    }
}

function addActivity(text) {
    const log = document.getElementById("activity-log");
    if (!log || !log.isConnected) return;
    if (text === null || text === undefined) return;
    const safeText = sanitizeInput(String(text));
    if (!safeText.trim()) return;
    const time = formatNowTimeOrFallback();
    const entry = document.createElement("div");
    entry.className = "flex gap-2 text-sm";
    entry.innerHTML = `<span class="text-cyan-400">[${time}]</span> <span class="text-gray-300">${safeText}</span>`;
    if (!log.isConnected) return;
    log.insertBefore(entry, log.firstChild);
}

const modalOverlayEl = document.getElementById("modal");
if (modalOverlayEl && modalOverlayEl.isConnected) {
    if (!modalOverlayEl.dataset.overlayClickListenerBound) {
        modalOverlayEl.dataset.overlayClickListenerBound = "1";
        modalOverlayEl.addEventListener("click", (e) => {
            if (!e || e.defaultPrevented) return;
            if (e.currentTarget && e.currentTarget.isConnected === false) return;
            if (e.target && e.target.isConnected === false) return;
            if (e.currentTarget && e.currentTarget.id !== "modal") return;
            if (e.target !== e.currentTarget) return;
            if (typeof e.button === "number" && e.button !== 0) return;
            closeModal();
        });
    }
} else {
    if (!modalOverlayMissingWarned) {
        console.warn("Modal overlay element is unavailable; click listener was not registered");
        modalOverlayMissingWarned = true;
    }
}