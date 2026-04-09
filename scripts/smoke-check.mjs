#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = (process.env.CORE64_API_BASE || "http://localhost:3000/api").replace(/\/+$/, "");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readAdminPasswordFromBackendEnv() {
    try {
        const envPath = path.resolve(__dirname, "../backend/.env");
        if (!fs.existsSync(envPath)) return "";
        const raw = fs.readFileSync(envPath, "utf8");
        const lines = raw.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
            if (!match) continue;
            if (match[1] !== "ADMIN_PASSWORD") continue;

            const rawValue = match[2].trim();
            if (!rawValue) return "";

            const isDoubleQuoted = rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2;
            const isSingleQuoted = rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2;
            if (isDoubleQuoted || isSingleQuoted) {
                return rawValue.slice(1, -1);
            }

            return rawValue.split("#")[0].trim();
        }

        return "";
    } catch (_error) {
        return "";
    }
}

function toBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
}

function toInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

const envAdminPassword = String(process.env.CORE64_ADMIN_PASSWORD || "").trim();
const backendEnvAdminPassword = readAdminPasswordFromBackendEnv();
const adminPassword = envAdminPassword || backendEnvAdminPassword || "core64admin";
const adminPasswordSource = envAdminPassword ? "CORE64_ADMIN_PASSWORD" : (backendEnvAdminPassword ? "backend/.env:ADMIN_PASSWORD" : "default:core64admin");
const requestTimeoutMs = toInteger(process.env.CORE64_SMOKE_TIMEOUT_MS, 10000);
const smokeMode = String(process.env.CORE64_SMOKE_MODE || "full").trim().toLowerCase();
const smokeContactEnabled = toBoolean(process.env.CORE64_SMOKE_CONTACT, false);
const contactExpectedStatus = toInteger(process.env.CORE64_SMOKE_CONTACT_EXPECTED_STATUS, 201);
const smokeRateLimitCheckEnabled = toBoolean(process.env.CORE64_SMOKE_RATE_LIMIT_CHECK, false);
const smokeRateLimitAttempts = Math.max(2, toInteger(process.env.CORE64_SMOKE_RATE_LIMIT_ATTEMPTS, 25));
const smokeRateLimitExpectedStatus = toInteger(process.env.CORE64_SMOKE_RATE_LIMIT_EXPECTED_STATUS, 429);
const smokeRateLimitExpectedCode = String(
    process.env.CORE64_SMOKE_RATE_LIMIT_EXPECTED_CODE || "SETTINGS_RATE_LIMITED"
).trim() || "SETTINGS_RATE_LIMITED";
const smokeRateLimitCollectionsAttempts = Math.max(
    2,
    toInteger(process.env.CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_ATTEMPTS, 35)
);
const smokeRateLimitCollectionsExpectedStatus = toInteger(
    process.env.CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_EXPECTED_STATUS,
    429
);
const smokeRateLimitCollectionsExpectedCode = String(
    process.env.CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_EXPECTED_CODE || "COLLECTIONS_RATE_LIMITED"
).trim() || "COLLECTIONS_RATE_LIMITED";

const genericReleaseLinks = new Set([
    "https://soundcloud.com/",
    "https://www.youtube.com/",
    "https://open.spotify.com/",
    "https://music.apple.com/"
]);

function withTimeout(signal, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("request timeout")), timeoutMs);

    if (signal) {
        signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }

    return {
        signal: controller.signal,
        cancel() {
            clearTimeout(timeoutId);
        }
    };
}

async function requestJson(path, options = {}) {
    const timeout = withTimeout(options.signal, requestTimeoutMs);
    try {
        const response = await fetch(`${baseUrl}${path}`, {
            method: options.method || "GET",
            headers: options.headers || {},
            body: options.body,
            signal: timeout.signal
        });

        const text = await response.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : null;
        } catch (_error) {
            json = null;
        }

        return { response, json, text };
    } finally {
        timeout.cancel();
    }
}

function countMissing(items, field) {
    return items.filter((item) => {
        const value = String(item?.[field] ?? "").trim();
        return !value || value === "#";
    }).length;
}

function countStaticPhotos(items, field) {
    return items.filter((item) => String(item?.[field] ?? "").includes("static.photos")).length;
}

function countBadReleaseLinks(releases) {
    return releases.filter((release) => {
        const value = String(release?.link ?? "").trim();
        return !value || value === "#" || genericReleaseLinks.has(value);
    }).length;
}

function hasRequiredSectionKeys(sections) {
    const keys = new Set(
        (Array.isArray(sections) ? sections : [])
            .map((entry) => String(entry?.sectionKey ?? "").trim())
            .filter(Boolean)
    );

    return ["releases", "artists", "events", "sponsors"].every((key) => keys.has(key));
}

function hasValidAuditLatencyThresholds(settings) {
    if (!settings || typeof settings !== "object") return false;
    const good = Number(settings.auditLatencyGoodMaxMs);
    const warn = Number(settings.auditLatencyWarnMaxMs);
    return Number.isFinite(good) && Number.isFinite(warn) && good >= 50 && warn > good;
}

function deriveHealthDbHint(kind, dbCode, durationMs, connectionTimeoutMs, probe) {
    const normalizedKind = String(kind || "").trim().toLowerCase();
    const normalizedCode = String(dbCode || "").trim().toUpperCase();
    const maybeDuration = Number(durationMs);
    const hasDuration = Number.isFinite(maybeDuration) && maybeDuration > 0;
    const configuredTimeout = Number(connectionTimeoutMs);
    const hasConfiguredTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0;
    const nearConfiguredTimeout = hasDuration && hasConfiguredTimeout && maybeDuration >= Math.max(1000, configuredTimeout - 1000);

    if (normalizedKind === "timeout") {
        if (hasDuration) {
            if (nearConfiguredTimeout) {
                if (probe?.attempted && probe?.dns?.resolved === false) {
                    return `DB connection timed out after ~${Math.round(maybeDuration)}ms (near configured DB_CONNECTION_TIMEOUT_MS=${Math.round(configuredTimeout)}). DNS probe failed for DB host from runtime. Investigate Cloud Run DNS resolver and outbound egress path.`;
                }
                if (probe?.attempted && probe?.dns?.resolved === true && probe?.tcp?.reachable === false) {
                    return `DB connection timed out after ~${Math.round(maybeDuration)}ms (near configured DB_CONNECTION_TIMEOUT_MS=${Math.round(configuredTimeout)}). DNS resolves but TCP probe to DB host/port failed. Investigate egress/NAT/firewall/allowlist path.`;
                }
                return `DB connection timed out after ~${Math.round(maybeDuration)}ms (near configured DB_CONNECTION_TIMEOUT_MS=${Math.round(configuredTimeout)}). This usually indicates network reachability issues from Cloud Run to DB host/port. If this persists after trying db_connection_timeout_ms=20000, investigate egress/NAT/allowlist/DNS path.`;
            }
            return `DB connection timed out after ~${Math.round(maybeDuration)}ms. Check Cloud Run egress path and DATABASE_URL host/port reachability. If this persists, re-run deploy with db_connection_timeout_ms=15000 (or 20000).`;
        }
        return "DB connection timed out. Check Cloud Run egress path and DATABASE_URL host/port reachability. If this persists, re-run deploy with db_connection_timeout_ms=15000 (or 20000).";
    }

    if (normalizedKind === "dns") {
        return "DB host lookup failed. Verify DATABASE_URL host name and DNS reachability from Cloud Run.";
    }

    if (normalizedKind === "tls") {
        return "TLS/certificate issue while connecting to DB. Verify DB_SSL/DB_SSL_REJECT_UNAUTHORIZED and provider certificate requirements.";
    }

    if (normalizedKind === "auth" || normalizedCode === "28P01") {
        return "DB authentication failed. Verify DATABASE_URL credentials and database role permissions.";
    }

    if (normalizedKind === "config") {
        return "Invalid DB connection string format. Verify DATABASE_URL syntax and URL encoding.";
    }

    if (normalizedKind === "connection" || normalizedCode.startsWith("08")) {
        return "DB connection could not be established. Check DB endpoint, network path, and server availability.";
    }

    return null;
}

async function runSettingsSectionsRateLimitCheck({ token, sectionsPayload, attempts, expectedStatus, expectedCode }) {
    const headers = {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
    };
    const body = JSON.stringify({ data: { sections: sectionsPayload } });

    let observedAtAttempt = null;
    let status = null;
    let code = null;
    let error = null;
    let retryAfterSeconds = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const response = await requestJson("/settings/sections", {
            method: "PUT",
            headers,
            body
        });

        status = response.response.status;
        code = response.json?.code || null;
        error = response.json?.error || null;

        const retryAfter = Number(response.response.headers.get("retry-after"));
        retryAfterSeconds = Number.isFinite(retryAfter) ? retryAfter : null;

        if (status === expectedStatus) {
            observedAtAttempt = attempt;
            break;
        }

        if (!response.response.ok) {
            break;
        }
    }

    const codeMatches = !expectedCode || code === expectedCode;
    const retryAfterOk = expectedStatus !== 429 || (retryAfterSeconds !== null && retryAfterSeconds >= 1);

    return {
        enabled: true,
        target: "settings_sections",
        endpoint: "/settings/sections",
        attempts,
        expectedStatus,
        expectedCode,
        status,
        code,
        error,
        retryAfterSeconds,
        observedAtAttempt,
        ok: observedAtAttempt !== null && status === expectedStatus && codeMatches && retryAfterOk
    };
}

async function runCollectionsDynamicRateLimitCheck({ token, attempts, expectedStatus, expectedCode }) {
    const authHeaders = {
        authorization: `Bearer ${token}`
    };
    const releasesResponse = await requestJson("/releases", {
        headers: authHeaders
    });

    const releases = Array.isArray(releasesResponse.json?.data) ? releasesResponse.json.data : [];
    const normalizedReleases = releases
        .map((release) => {
            const id = Number(release?.id);
            if (!Number.isInteger(id) || id <= 0) return null;
            return {
                id,
                title: String(release?.title || "").trim()
            };
        })
        .filter(Boolean);

    const idsTested = normalizedReleases.slice(0, 2).map((release) => release.id);

    if (!releasesResponse.response.ok || idsTested.length < 2) {
        return {
            enabled: true,
            target: "collections_release_update_dynamic_ids",
            endpointTemplate: "/releases/:id",
            idsTested,
            attempts,
            expectedStatus,
            expectedCode,
            status: releasesResponse.response.status,
            code: releasesResponse.json?.code || null,
            error: "Collections rate-limit check requires at least two releases with numeric ids.",
            retryAfterSeconds: null,
            observedAtAttempt: null,
            ok: false
        };
    }

    const headers = {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
    };

    let observedAtAttempt = null;
    let status = null;
    let code = null;
    let error = null;
    let retryAfterSeconds = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const releaseId = idsTested[(attempt - 1) % idsTested.length];
        const release = normalizedReleases.find((entry) => entry.id === releaseId);
        const title = String(release?.title || `Rate limit smoke release ${releaseId}`).trim() || `Rate limit smoke release ${releaseId}`;

        const response = await requestJson(`/releases/${releaseId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title })
        });

        status = response.response.status;
        code = response.json?.code || null;
        error = response.json?.error || null;

        const retryAfter = Number(response.response.headers.get("retry-after"));
        retryAfterSeconds = Number.isFinite(retryAfter) ? retryAfter : null;

        if (status === expectedStatus) {
            observedAtAttempt = attempt;
            break;
        }

        if (!response.response.ok && status !== 404) {
            break;
        }
    }

    const codeMatches = !expectedCode || code === expectedCode;
    const retryAfterOk = expectedStatus !== 429 || (retryAfterSeconds !== null && retryAfterSeconds >= 1);

    return {
        enabled: true,
        target: "collections_release_update_dynamic_ids",
        endpointTemplate: "/releases/:id",
        idsTested,
        attempts,
        expectedStatus,
        expectedCode,
        status,
        code,
        error,
        retryAfterSeconds,
        observedAtAttempt,
        ok: observedAtAttempt !== null && status === expectedStatus && codeMatches && retryAfterOk
    };
}

async function run() {
    const report = {
        baseUrl,
        mode: smokeMode,
        checks: {},
        passed: true
    };

    const health = await requestJson("/health");
    const cspHeader = String(health.response.headers.get("content-security-policy") || "").trim();
    const cspReportOnlyHeader = String(health.response.headers.get("content-security-policy-report-only") || "").trim();
    const reportUriRegex = /\breport-uri\s+\S+/i;

    report.checks.health = {
        status: health.response.status,
        ok: health.response.ok,
        securityHeaders: {
            xContentTypeOptions: String(health.response.headers.get("x-content-type-options") || "").trim().toLowerCase(),
            xFrameOptions: String(health.response.headers.get("x-frame-options") || "").trim().toUpperCase(),
            referrerPolicy: String(health.response.headers.get("referrer-policy") || "").trim().toLowerCase(),
            csp: cspHeader || null,
            cspReportOnly: cspReportOnlyHeader || null,
            cspModeDetected: cspHeader && cspReportOnlyHeader ? "both" : (cspHeader ? "enforce" : (cspReportOnlyHeader ? "report-only" : "none")),
            cspReportUriPresent: reportUriRegex.test(cspHeader || cspReportOnlyHeader),
            cspReportEndpointStatus: null,
            cspReportEndpointOk: null
        }
    };
    if (!health.response.ok) report.passed = false;

    const securityHeaders = report.checks.health.securityHeaders;
    const hasAnyCspHeader = Boolean(securityHeaders.csp || securityHeaders.cspReportOnly);
    if (!hasAnyCspHeader || !securityHeaders.cspReportUriPresent) {
        report.passed = false;
    }
    if (securityHeaders.xContentTypeOptions !== "nosniff") {
        report.passed = false;
    }
    if (securityHeaders.xFrameOptions !== "DENY") {
        report.passed = false;
    }
    if (securityHeaders.referrerPolicy !== "no-referrer") {
        report.passed = false;
    }

    const cspReportProbePayload = {
        "csp-report": {
            "document-uri": "https://core64.local/smoke",
            "blocked-uri": "https://blocked.core64.local/script.js",
            "violated-directive": "script-src"
        }
    };
    const cspReportProbe = await requestJson("/security/csp-report", {
        method: "POST",
        headers: { "content-type": "application/csp-report" },
        body: JSON.stringify(cspReportProbePayload)
    });
    securityHeaders.cspReportEndpointStatus = cspReportProbe.response.status;
    securityHeaders.cspReportEndpointOk = cspReportProbe.response.status === 204;
    if (!securityHeaders.cspReportEndpointOk) {
        report.passed = false;
    }

    const healthDb = await requestJson("/health/db");
    report.checks.healthDb = {
        status: healthDb.response.status,
        ok: healthDb.response.ok,
        code: healthDb.json?.code || null,
        error: healthDb.json?.error || null,
        kind: healthDb.json?.details?.kind || null,
        dbCode: healthDb.json?.details?.dbCode || null,
        durationMs: healthDb.json?.details?.durationMs ?? healthDb.json?.durationMs ?? null,
        connectionTimeoutMs: healthDb.json?.details?.connectionTimeoutMs ?? healthDb.json?.connectionTimeoutMs ?? null,
        target: healthDb.json?.details?.target ?? healthDb.json?.target ?? null,
        probe: healthDb.json?.details?.probe ?? null,
        hint: null
    };
    report.checks.healthDb.hint = deriveHealthDbHint(
        report.checks.healthDb.kind,
        report.checks.healthDb.dbCode,
        report.checks.healthDb.durationMs,
        report.checks.healthDb.connectionTimeoutMs,
        report.checks.healthDb.probe
    );
    if (!healthDb.response.ok) report.passed = false;

    if (smokeMode === "health") {
        console.log(JSON.stringify(report, null, 2));
        if (!report.passed) {
            process.exitCode = 1;
        }
        return;
    }

    const publicPayload = await requestJson("/public");
    const data = publicPayload.json?.data || {};
    const releases = Array.isArray(data.releases) ? data.releases : [];
    const artists = Array.isArray(data.artists) ? data.artists : [];
    const events = Array.isArray(data.events) ? data.events : [];
    const sponsors = Array.isArray(data.sponsors) ? data.sponsors : [];

    const publicChecks = {
        status: publicPayload.response.status,
        counts: {
            releases: releases.length,
            artists: artists.length,
            events: events.length,
            sponsors: sponsors.length
        },
        missingMedia: {
            releaseImage: countMissing(releases, "image"),
            artistImage: countMissing(artists, "image"),
            eventImage: countMissing(events, "image"),
            sponsorLogo: countMissing(sponsors, "logo")
        },
        staticPhotos: {
            releaseImage: countStaticPhotos(releases, "image"),
            artistImage: countStaticPhotos(artists, "image"),
            eventImage: countStaticPhotos(events, "image"),
            sponsorLogo: countStaticPhotos(sponsors, "logo")
        },
        badReleaseLinks: countBadReleaseLinks(releases)
    };

    report.checks.public = publicChecks;

    if (!publicPayload.response.ok) report.passed = false;
    if (Object.values(publicChecks.missingMedia).some((value) => value > 0)) report.passed = false;
    if (Object.values(publicChecks.staticPhotos).some((value) => value > 0)) report.passed = false;
    if (publicChecks.badReleaseLinks > 0) report.passed = false;

    const login = await requestJson("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: adminPassword })
    });

    const token = login.json?.data?.token || "";

    const adminChecks = {
        loginStatus: login.response.status,
        loginCode: login.json?.code || null,
        loginError: login.json?.error || null,
        tokenIssued: Boolean(token),
        passwordSource: adminPasswordSource,
        hint: null,
        meStatus: null,
        settingsStatus: null,
        settingsPayloadOk: null,
        settingsHasAuditLatencyThresholds: null,
        settingsSectionsStatus: null,
        settingsSectionsCount: null,
        settingsSectionsRequiredKeysPresent: null,
        settingsSectionsUniqueKeys: null,
        settingsBundleStatus: null,
        settingsBundleSettingsReturned: null,
        settingsBundleSectionsReturned: null,
        settingsBundleRoundTripOk: null,
        rateLimitCheck: {
            enabled: smokeRateLimitCheckEnabled,
            target: "settings_sections",
            endpoint: "/settings/sections",
            attempts: smokeRateLimitAttempts,
            expectedStatus: smokeRateLimitExpectedStatus,
            expectedCode: smokeRateLimitExpectedCode,
            status: null,
            code: null,
            error: null,
            retryAfterSeconds: null,
            observedAtAttempt: null,
            ok: null
        },
        rateLimitCollectionsCheck: {
            enabled: smokeRateLimitCheckEnabled,
            target: "collections_release_update_dynamic_ids",
            endpointTemplate: "/releases/:id",
            idsTested: [],
            attempts: smokeRateLimitCollectionsAttempts,
            expectedStatus: smokeRateLimitCollectionsExpectedStatus,
            expectedCode: smokeRateLimitCollectionsExpectedCode,
            status: null,
            code: null,
            error: null,
            retryAfterSeconds: null,
            observedAtAttempt: null,
            ok: null
        }
    };

    if (!login.response.ok || !token) {
        if (login.response.status === 401) {
            adminChecks.hint = "Set CORE64_ADMIN_PASSWORD to match backend ADMIN_PASSWORD, or update backend/.env and rerun seed.";
        } else if (login.response.status === 503) {
            adminChecks.hint = "Auth service unavailable. Check /health/db and backend DB SSL settings (DB_SSL / DB_SSL_REJECT_UNAUTHORIZED).";
        }
        report.passed = false;
    } else {
        const authHeaders = { authorization: `Bearer ${token}` };
        const me = await requestJson("/auth/me", { headers: authHeaders });
        const settings = await requestJson("/settings", { headers: authHeaders });
        const settingsSections = await requestJson("/settings/sections", { headers: authHeaders });
        adminChecks.meStatus = me.response.status;
        adminChecks.settingsStatus = settings.response.status;

        const settingsPayload = settings.json?.data && typeof settings.json.data === "object"
            ? settings.json.data
            : null;
        const sectionsPayload = Array.isArray(settingsSections.json?.data?.sections)
            ? settingsSections.json.data.sections
            : [];
        const uniqueSectionKeys = new Set(
            sectionsPayload.map((entry) => String(entry?.sectionKey ?? "").trim()).filter(Boolean)
        );

        adminChecks.settingsPayloadOk = Boolean(settingsPayload);
        adminChecks.settingsHasAuditLatencyThresholds = hasValidAuditLatencyThresholds(settingsPayload);
        adminChecks.settingsSectionsStatus = settingsSections.response.status;
        adminChecks.settingsSectionsCount = sectionsPayload.length;
        adminChecks.settingsSectionsRequiredKeysPresent = hasRequiredSectionKeys(sectionsPayload);
        adminChecks.settingsSectionsUniqueKeys = uniqueSectionKeys.size === sectionsPayload.length;

        if (!me.response.ok || !settings.response.ok || !settingsSections.response.ok) report.passed = false;
        if (!adminChecks.settingsPayloadOk || !adminChecks.settingsHasAuditLatencyThresholds) report.passed = false;
        if (!adminChecks.settingsSectionsRequiredKeysPresent || !adminChecks.settingsSectionsUniqueKeys) report.passed = false;

        if (settings.response.ok && settingsSections.response.ok && settingsPayload) {
            const bundle = await requestJson("/settings/bundle", {
                method: "PUT",
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    data: {
                        settings: settingsPayload,
                        sections: sectionsPayload
                    }
                })
            });

            const bundleSettings = bundle.json?.data?.settings && typeof bundle.json.data.settings === "object"
                ? bundle.json.data.settings
                : null;
            const bundleSections = Array.isArray(bundle.json?.data?.sections)
                ? bundle.json.data.sections
                : [];

            adminChecks.settingsBundleStatus = bundle.response.status;
            adminChecks.settingsBundleSettingsReturned = Boolean(bundleSettings);
            adminChecks.settingsBundleSectionsReturned = bundleSections.length;
            adminChecks.settingsBundleRoundTripOk = Boolean(bundleSettings)
                && hasValidAuditLatencyThresholds(bundleSettings)
                && bundleSections.length === sectionsPayload.length
                && hasRequiredSectionKeys(bundleSections);

            if (!bundle.response.ok || !adminChecks.settingsBundleRoundTripOk) {
                report.passed = false;
            }
        }

        if (smokeRateLimitCheckEnabled) {
            if (!settingsSections.response.ok || sectionsPayload.length === 0) {
                adminChecks.rateLimitCheck.ok = false;
                adminChecks.rateLimitCheck.error = "Rate-limit check failed: settings sections payload unavailable.";
                report.passed = false;
            } else {
                const rateLimitCheck = await runSettingsSectionsRateLimitCheck({
                    token,
                    sectionsPayload,
                    attempts: smokeRateLimitAttempts,
                    expectedStatus: smokeRateLimitExpectedStatus,
                    expectedCode: smokeRateLimitExpectedCode
                });

                adminChecks.rateLimitCheck = rateLimitCheck;
                if (!rateLimitCheck.ok) {
                    report.passed = false;
                }

                const collectionsRateLimitCheck = await runCollectionsDynamicRateLimitCheck({
                    token,
                    attempts: smokeRateLimitCollectionsAttempts,
                    expectedStatus: smokeRateLimitCollectionsExpectedStatus,
                    expectedCode: smokeRateLimitCollectionsExpectedCode
                });

                adminChecks.rateLimitCollectionsCheck = collectionsRateLimitCheck;
                if (!collectionsRateLimitCheck.ok) {
                    report.passed = false;
                }
            }
        }
    }

    report.checks.admin = adminChecks;

    const contactChecks = {
        enabled: smokeContactEnabled,
        expectedStatus: contactExpectedStatus,
        status: null,
        ok: null
    };

    if (smokeContactEnabled) {
        const contactPayload = {
            name: "Smoke Check",
            email: "smoke-check@core64.local",
            subject: "Smoke Check",
            message: `Automated smoke contact check at ${new Date().toISOString()}`,
            captchaToken: process.env.CORE64_SMOKE_CONTACT_CAPTCHA_TOKEN || ""
        };

        const contact = await requestJson("/contact-requests", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(contactPayload)
        });

        contactChecks.status = contact.response.status;
        contactChecks.ok = contact.response.status === contactExpectedStatus;

        if (!contactChecks.ok) {
            report.passed = false;
        }
    }

    report.checks.contact = contactChecks;

    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error("Smoke check failed:", error?.message || error);
    process.exit(1);
});
