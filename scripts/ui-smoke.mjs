#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const apiBase = String(process.env.CORE64_API_BASE || "http://localhost:3000/api").trim().replace(/\/+$/, "");
const configuredUiBase = String(process.env.CORE64_UI_BASE || "").trim().replace(/\/+$/, "");
const requestTimeoutMs = Number(process.env.CORE64_UI_SMOKE_TIMEOUT_MS || 15000);
const headless = !["0", "false", "no", "off"].includes(String(process.env.CORE64_UI_HEADLESS || "true").trim().toLowerCase());

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp"
};

const backendOrigin = apiBase.replace(/\/api$/, "");

function readAdminPasswordFromBackendEnv() {
    try {
        const envPath = path.resolve(repoRoot, "backend/.env");
        if (!fs.existsSync(envPath)) return "";

        const raw = fs.readFileSync(envPath, "utf8");
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
            if (!match || match[1] !== "ADMIN_PASSWORD") continue;

            const rawValue = match[2].trim();
            if (!rawValue) return "";

            const isDoubleQuoted = rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2;
            const isSingleQuoted = rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2;
            if (isDoubleQuoted || isSingleQuoted) {
                return rawValue.slice(1, -1);
            }

            return rawValue.split("#")[0].trim();
        }
    } catch (_error) {
        return "";
    }

    return "";
}

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

async function requestJson(url, options = {}) {
    const timeout = withTimeout(options.signal, requestTimeoutMs);
    try {
        const headers = {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(url, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
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

function ensureOk(result, label) {
    if (result.response.ok) return result;
    const details = result.json ? JSON.stringify(result.json) : result.text;
    throw new Error(`${label} failed with ${result.response.status}: ${details}`);
}

async function startStaticServer() {
    const server = http.createServer((req, res) => {
        (async () => {
            try {
            const requestUrl = new URL(req.url || "/", "http://127.0.0.2");

            if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) {
                const bodyBuffer = await new Promise((resolve, reject) => {
                    const chunks = [];
                    req.on("data", (chunk) => chunks.push(chunk));
                    req.on("end", () => resolve(Buffer.concat(chunks)));
                    req.on("error", reject);
                });

                const forwardedHeaders = Object.fromEntries(
                    Object.entries(req.headers || {}).filter(([key]) => !["host", "connection", "content-length"].includes(String(key).toLowerCase()))
                );
                const upstream = await fetch(`${backendOrigin}${requestUrl.pathname}${requestUrl.search}`, {
                    method: req.method || "GET",
                    headers: forwardedHeaders,
                    body: ["GET", "HEAD"].includes(String(req.method || "GET").toUpperCase()) ? undefined : bodyBuffer
                });

                const responseHeaders = Object.fromEntries(upstream.headers.entries());
                delete responseHeaders["content-encoding"];
                res.writeHead(upstream.status, responseHeaders);
                res.end(Buffer.from(await upstream.arrayBuffer()));
                return;
            }

            const relativePath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
            const normalizedPath = path.normalize(relativePath).replace(/^([.][.][/\\])+/, "");
            let targetPath = path.resolve(repoRoot, `.${normalizedPath}`);

            if (!targetPath.startsWith(repoRoot)) {
                res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Forbidden");
                return;
            }

            if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
                targetPath = path.join(targetPath, "index.html");
            }

            if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Not found");
                return;
            }

            const ext = path.extname(targetPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";
            res.writeHead(200, { "Content-Type": contentType });
            fs.createReadStream(targetPath).pipe(res);
        } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(`Server error: ${error.message}`);
        }
        })().catch((error) => {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(`Server error: ${error.message}`);
        });
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.2", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Failed to determine static server address");
    }

    return {
        server,
        baseUrl: `http://127.0.0.2:${address.port}`
    };
}

function attachDialogAutoAccept(page) {
    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });
}

async function waitForFunction(page, fn, arg, timeout = requestTimeoutMs, label = "anonymous wait") {
    try {
        await page.waitForFunction(fn, arg, { timeout });
    } catch (error) {
        throw new Error(`${label}: ${error.message}`);
    }
}

function attachPageDiagnostics(page, label) {
    page.on("pageerror", (error) => {
        console.error(`[${label} pageerror] ${error.message}`);
    });
    page.on("console", (message) => {
        if (message.type() === "error") {
            const text = message.text();
            if (text === "Failed to load resource: the server responded with a status of 401 (Unauthorized)") {
                return;
            }
            console.error(`[${label} console] ${text}`);
        }
    });
}

async function ensureAdminLoggedIn(page, adminUrl, adminPassword) {
    await page.goto(adminUrl, { waitUntil: "domcontentloaded" });

    const loginInput = page.locator("#admin-password");
    if (await loginInput.isVisible().catch(() => false)) {
        await loginInput.fill(adminPassword);
        await page.locator("#login-screen button[type='submit']").click();
    }

    await waitForFunction(
        page,
        () => {
            const loginScreen = document.getElementById("login-screen");
            if (!loginScreen) return true;
            return loginScreen.classList.contains("hidden");
        },
        undefined,
        requestTimeoutMs,
        "wait for admin login screen to hide"
    );
}

async function openSettingsSection(page) {
    await page.evaluate(async () => {
        await window.showSection("settings");
    });

    await waitForFunction(
        page,
        () => {
            const section = document.getElementById("section-settings");
            const list = document.getElementById("section-settings-list");
            return Boolean(section && !section.classList.contains("hidden") && list && list.children.length >= 4);
        },
        undefined,
        requestTimeoutMs,
        "wait for settings section and section settings rows"
    );
}

async function getAuthToken(page) {
    const token = await page.evaluate(() => sessionStorage.getItem("core64_admin_token") || "");
    if (!token) {
        throw new Error("Admin auth token was not stored in sessionStorage");
    }
    return token;
}

function normalizeSettingsPayload(data) {
    return data && typeof data === "object" ? data : {};
}

function normalizeSectionsPayload(data) {
    if (data && Array.isArray(data.sections)) return data.sections;
    return Array.isArray(data) ? data : [];
}

async function fetchOriginalBundle(token) {
    const [settingsResult, sectionsResult] = await Promise.all([
        requestJson(`${apiBase}/settings`, { token }),
        requestJson(`${apiBase}/settings/sections`, { token })
    ]);

    ensureOk(settingsResult, "GET /settings");
    ensureOk(sectionsResult, "GET /settings/sections");

    return {
        settings: normalizeSettingsPayload(settingsResult.json?.data),
        sections: normalizeSectionsPayload(sectionsResult.json?.data)
    };
}

function buildMutatedSections(originalSections) {
    const cloned = Array.isArray(originalSections)
        ? originalSections.map((section) => ({ ...section }))
        : [];

    const timestamp = Date.now();
    const events = cloned.find((section) => String(section.sectionKey) === "events");
    const sponsors = cloned.find((section) => String(section.sectionKey) === "sponsors");
    if (!events || !sponsors) {
        throw new Error("Required section keys 'events' and 'sponsors' are missing from section settings");
    }

    const reordered = [
        events,
        ...cloned.filter((section) => String(section.sectionKey) !== "events")
    ].map((section, index) => {
        const next = { ...section, sortOrder: index + 1 };
        if (next.sectionKey === "events") {
            next.titleUk = `UI smoke events ${timestamp}`;
            next.titleEn = `UI smoke events ${timestamp}`;
        }
        if (next.sectionKey === "sponsors") {
            next.isEnabled = false;
        }
        return next;
    });

    return reordered;
}

async function applyMutationViaUi(page, mutatedSections) {
    const eventsSection = mutatedSections.find((section) => section.sectionKey === "events");
    const sponsorsSection = mutatedSections.find((section) => section.sectionKey === "sponsors");
    if (!eventsSection || !sponsorsSection) {
        throw new Error("Mutation requires events and sponsors sections");
    }

    await page.evaluate(() => {
        window.moveSectionSetting("events", -1);
        window.moveSectionSetting("events", -1);
    });

    await waitForFunction(
        page,
        () => document.querySelector("#section-settings-list [data-section-row]")?.getAttribute("data-section-row") === "events",
        undefined,
        requestTimeoutMs,
        "wait for events row to move to top"
    );

    await page.locator("#section-title-uk-events").fill(eventsSection.titleUk);
    await page.locator("#section-title-en-events").fill(eventsSection.titleEn);

    const sponsorsCheckbox = page.locator("#section-enabled-sponsors");
    if (await sponsorsCheckbox.isChecked()) {
        await sponsorsCheckbox.uncheck();
    }

    const saved = await page.evaluate(async () => {
        if (typeof window.saveSettings !== "function") {
            throw new Error("window.saveSettings is unavailable");
        }
        return await window.saveSettings({ notifySuccess: false });
    });
    if (!saved) {
        throw new Error("saveSettings returned false");
    }

    await waitForFunction(
        page,
        (expectedTitle) => {
            const input = document.getElementById("section-title-uk-events");
            const sponsors = document.getElementById("section-enabled-sponsors");
            return Boolean(input && input.value === expectedTitle && sponsors && sponsors.checked === false);
        },
        eventsSection.titleUk,
        requestTimeoutMs,
        "wait for mutated settings form state after save"
    );
}

async function verifyPublicUi(page, publicUrl, mutatedSections) {
    const eventsSection = mutatedSections.find((section) => section.sectionKey === "events");
    if (!eventsSection) {
        throw new Error("Mutated events section is missing");
    }

    const managedKeys = new Set(["releases", "artists", "events", "sponsors"]);
    const expectedVisibleManagedSections = mutatedSections
        .filter((section) => managedKeys.has(String(section.sectionKey || "")))
        .filter((section) => section.isEnabled !== false)
        .map((section) => String(section.sectionKey));

    await page.goto(publicUrl, { waitUntil: "domcontentloaded" });

    await waitForFunction(
        page,
        (expectedTitle) => document.getElementById("public-section-title-events")?.textContent?.trim() === expectedTitle,
        eventsSection.titleUk,
        requestTimeoutMs,
        "wait for public events title"
    );

    const verification = await page.evaluate(() => {
        const managedKeys = new Set(["releases", "artists", "events", "sponsors"]);
        const releasesSection = document.getElementById("releases");
        const sectionsParent = releasesSection?.parentElement || null;
        const visibleManagedSections = sectionsParent
            ? Array.from(sectionsParent.children)
                .filter((section) => managedKeys.has(section.id) && !section.hidden)
                .map((section) => section.id)
            : [];
        const sponsorsSection = document.getElementById("sponsors");
        const desktopNav = Array.from(document.querySelectorAll("#public-desktop-nav-links a"));
        const mobileNav = Array.from(document.querySelectorAll("#public-mobile-nav-links a"));
        const desktopVisible = desktopNav
            .filter((anchor) => !anchor.hidden)
            .map((anchor) => anchor.getAttribute("href"));
        const mobileVisible = mobileNav
            .filter((anchor) => !anchor.hidden)
            .map((anchor) => anchor.getAttribute("href"));
        const desktopSponsors = desktopNav.find((anchor) => anchor.getAttribute("href") === "#sponsors");
        const mobileSponsors = mobileNav.find((anchor) => anchor.getAttribute("href") === "#sponsors");

        return {
            visibleManagedSections,
            sponsorsHidden: Boolean(sponsorsSection?.hidden),
            sponsorsAriaHidden: sponsorsSection?.getAttribute("aria-hidden") || null,
            desktopVisible,
            mobileVisible,
            desktopSponsorsHidden: Boolean(desktopSponsors?.hidden),
            mobileSponsorsHidden: Boolean(mobileSponsors?.hidden),
            desktopSponsorsTabIndex: desktopSponsors?.getAttribute("tabindex") || null,
            mobileSponsorsTabIndex: mobileSponsors?.getAttribute("tabindex") || null
        };
    });

    const expectedNavPrefix = expectedVisibleManagedSections.map((sectionKey) => `#${sectionKey}`);
    if (verification.visibleManagedSections.join(",") !== expectedVisibleManagedSections.join(",")) {
        throw new Error(`Unexpected visible section order: ${verification.visibleManagedSections.join(",")}`);
    }
    if (!verification.sponsorsHidden || verification.sponsorsAriaHidden !== "true") {
        throw new Error("Sponsors section was not hidden on public page");
    }
    if (verification.desktopVisible.slice(0, expectedNavPrefix.length).join(",") !== expectedNavPrefix.join(",")) {
        throw new Error(`Unexpected desktop nav order: ${verification.desktopVisible.join(",")}`);
    }
    if (verification.mobileVisible.slice(0, expectedNavPrefix.length).join(",") !== expectedNavPrefix.join(",")) {
        throw new Error(`Unexpected mobile nav order: ${verification.mobileVisible.join(",")}`);
    }
    if (!verification.desktopSponsorsHidden || verification.desktopSponsorsTabIndex !== "-1") {
        throw new Error("Desktop sponsors nav item was not hidden correctly");
    }
    if (!verification.mobileSponsorsHidden || verification.mobileSponsorsTabIndex !== "-1") {
        throw new Error("Mobile sponsors nav item was not hidden correctly");
    }

    return verification;
}

async function verifyApiState(token, mutatedSections) {
    const eventsSection = mutatedSections.find((section) => section.sectionKey === "events");
    const sponsorsSection = mutatedSections.find((section) => section.sectionKey === "sponsors");
    if (!eventsSection || !sponsorsSection) {
        throw new Error("Mutated API verification requires events and sponsors sections");
    }

    const [adminSectionsResult, publicResult] = await Promise.all([
        requestJson(`${apiBase}/settings/sections`, { token }),
        requestJson(`${apiBase}/public?lang=uk`)
    ]);

    ensureOk(adminSectionsResult, "GET /settings/sections after UI save");
    ensureOk(publicResult, "GET /public after UI save");

    const adminSections = normalizeSectionsPayload(adminSectionsResult.json?.data);
    const publicSections = Array.isArray(publicResult.json?.data?.sectionSettings) ? publicResult.json.data.sectionSettings : [];
    const adminEvents = adminSections.find((section) => section.sectionKey === "events");
    const adminSponsors = adminSections.find((section) => section.sectionKey === "sponsors");
    const publicEvents = publicSections.find((section) => section.sectionKey === "events");
    const publicSponsors = publicSections.find((section) => section.sectionKey === "sponsors");

    if (!adminEvents || !adminSponsors || !publicEvents || !publicSponsors) {
        throw new Error("Saved API payload is missing events/sponsors section settings");
    }
    if (String(adminEvents.titleUk || "") !== eventsSection.titleUk) {
        throw new Error(`Admin API did not persist events title. Expected '${eventsSection.titleUk}', got '${adminEvents.titleUk || ""}'`);
    }
    if (adminSponsors.isEnabled !== false) {
        throw new Error("Admin API did not persist sponsors hidden state");
    }
    if (String(publicEvents.title || "") !== eventsSection.titleUk) {
        throw new Error(`Public API did not expose updated events title. Expected '${eventsSection.titleUk}', got '${publicEvents.title || ""}'`);
    }
    if (publicSponsors.isEnabled !== false) {
        throw new Error("Public API did not expose sponsors hidden state");
    }

    return {
        adminEvents,
        adminSponsors,
        publicEvents,
        publicSponsors
    };
}

async function verifyAdminPersistence(page, adminUrl, mutatedSections) {
    const eventsSection = mutatedSections.find((section) => section.sectionKey === "events");
    await page.goto(adminUrl, { waitUntil: "domcontentloaded" });
    await ensureAdminLoggedIn(page, adminUrl, readAdminPasswordFromBackendEnv() || "core64admin");
    await openSettingsSection(page);

    await waitForFunction(
        page,
        (expectedTitle) => document.getElementById("section-title-uk-events")?.value === expectedTitle,
        eventsSection?.titleUk || "",
        requestTimeoutMs,
        "wait for persisted admin settings after reload"
    );

    const state = await page.evaluate(() => ({
        firstRow: document.querySelector("#section-settings-list [data-section-row]")?.getAttribute("data-section-row") || null,
        eventsTitleUk: document.getElementById("section-title-uk-events")?.value || "",
        sponsorsEnabled: document.getElementById("section-enabled-sponsors")?.checked ?? null
    }));

    if (state.firstRow !== "events") {
        throw new Error(`Unexpected first row after reload: ${state.firstRow}`);
    }
    if (state.eventsTitleUk !== eventsSection?.titleUk) {
        throw new Error("Events UK title did not persist after admin reload");
    }
    if (state.sponsorsEnabled !== false) {
        throw new Error("Sponsors enabled flag did not persist after admin reload");
    }

    return state;
}

async function restoreOriginalBundle(token, bundle) {
    const bundleResult = await requestJson(`${apiBase}/settings/bundle`, {
        method: "PUT",
        token,
        body: { data: bundle }
    });

    if (bundleResult.response.ok) {
        return { method: "/settings/bundle", status: bundleResult.response.status };
    }

    if (![404, 405].includes(bundleResult.response.status)) {
        const details = bundleResult.json ? JSON.stringify(bundleResult.json) : bundleResult.text;
        throw new Error(`Bundle restore failed with ${bundleResult.response.status}: ${details}`);
    }

    const settingsResult = await requestJson(`${apiBase}/settings`, {
        method: "PUT",
        token,
        body: { data: bundle.settings }
    });
    ensureOk(settingsResult, "Restore /settings");

    const sectionsResult = await requestJson(`${apiBase}/settings/sections`, {
        method: "PUT",
        token,
        body: { data: { sections: bundle.sections } }
    });
    ensureOk(sectionsResult, "Restore /settings/sections");

    return { method: "legacy", status: sectionsResult.response.status };
}

async function run() {
    const adminPassword = String(process.env.CORE64_ADMIN_PASSWORD || readAdminPasswordFromBackendEnv() || "core64admin").trim();
    const health = await requestJson(`${apiBase}/health`);
    ensureOk(health, "GET /health");

    const staticServer = configuredUiBase ? null : await startStaticServer();
    const uiBase = configuredUiBase || staticServer.baseUrl;
    const adminUrl = configuredUiBase
        ? `${uiBase}/admin.html?apiBaseUrl=${encodeURIComponent(apiBase)}`
        : `${uiBase}/admin.html`;
    const publicUrl = configuredUiBase
        ? `${uiBase}/index.html?apiBaseUrl=${encodeURIComponent(apiBase)}`
        : `${uiBase}/index.html`;

    const browser = await chromium.launch({ headless });
    const adminPage = await browser.newPage();
    const publicPage = await browser.newPage();
    attachDialogAutoAccept(adminPage);
    attachDialogAutoAccept(publicPage);
    attachPageDiagnostics(adminPage, "admin");
    attachPageDiagnostics(publicPage, "public");

    let token = "";
    let originalBundle = null;
    let restoreResult = null;

    try {
        await ensureAdminLoggedIn(adminPage, adminUrl, adminPassword);
        token = await getAuthToken(adminPage);
        originalBundle = await fetchOriginalBundle(token);

        const mutatedSections = buildMutatedSections(originalBundle.sections);

        await openSettingsSection(adminPage);
        await applyMutationViaUi(adminPage, mutatedSections);

        const apiVerification = await verifyApiState(token, mutatedSections);
        const publicVerification = await verifyPublicUi(publicPage, publicUrl, mutatedSections);
        const adminVerification = await verifyAdminPersistence(adminPage, adminUrl, mutatedSections);

        restoreResult = await restoreOriginalBundle(token, originalBundle);

        console.log(JSON.stringify({
            apiBase,
            uiBase,
            headless,
            restoreResult,
            apiVerification,
            publicVerification,
            adminVerification,
            passed: true
        }, null, 2));
    } finally {
        if (token && originalBundle && !restoreResult) {
            try {
                restoreResult = await restoreOriginalBundle(token, originalBundle);
            } catch (restoreError) {
                console.error(`Failed to restore original section settings: ${restoreError.message}`);
            }
        }

        await publicPage.close().catch(() => {});
        await adminPage.close().catch(() => {});
        await browser.close().catch(() => {});

        if (staticServer) {
            await new Promise((resolve) => staticServer.server.close(resolve));
        }
    }
}

run().catch((error) => {
    console.error(`UI smoke failed: ${error.stack || error.message}`);
    process.exitCode = 1;
});