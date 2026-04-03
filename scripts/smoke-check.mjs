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

const envAdminPassword = String(process.env.CORE64_ADMIN_PASSWORD || "").trim();
const backendEnvAdminPassword = readAdminPasswordFromBackendEnv();
const adminPassword = envAdminPassword || backendEnvAdminPassword || "core64admin";
const adminPasswordSource = envAdminPassword ? "CORE64_ADMIN_PASSWORD" : (backendEnvAdminPassword ? "backend/.env:ADMIN_PASSWORD" : "default:core64admin");
const requestTimeoutMs = Number(process.env.CORE64_SMOKE_TIMEOUT_MS || 10000);
const smokeMode = String(process.env.CORE64_SMOKE_MODE || "full").trim().toLowerCase();
const smokeContactEnabled = ["1", "true", "yes", "on"].includes(String(process.env.CORE64_SMOKE_CONTACT || "").trim().toLowerCase());
const contactExpectedStatus = Number(process.env.CORE64_SMOKE_CONTACT_EXPECTED_STATUS || 201);

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

async function run() {
    const report = {
        baseUrl,
        mode: smokeMode,
        checks: {},
        passed: true
    };

    const health = await requestJson("/health");
    report.checks.health = {
        status: health.response.status,
        ok: health.response.ok
    };
    if (!health.response.ok) report.passed = false;

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
        settingsBundleRoundTripOk: null
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
