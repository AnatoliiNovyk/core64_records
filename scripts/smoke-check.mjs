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

    if (smokeMode === "health") {
        console.log(JSON.stringify(report, null, 2));
        if (!report.passed) {
            process.exitCode = 1;
        }
        return;
    }

    const healthDb = await requestJson("/health/db");
    report.checks.healthDb = {
        status: healthDb.response.status,
        ok: healthDb.response.ok,
        code: healthDb.json?.code || null,
        error: healthDb.json?.error || null
    };
    if (!healthDb.response.ok) report.passed = false;

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
        settingsStatus: null
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
        adminChecks.meStatus = me.response.status;
        adminChecks.settingsStatus = settings.response.status;
        if (!me.response.ok || !settings.response.ok) report.passed = false;
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
