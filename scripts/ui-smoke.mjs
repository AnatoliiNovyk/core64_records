#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const configuredApiBase = String(process.env.CORE64_API_BASE || "http://localhost:3000/api").trim().replace(/\/+$/, "");
let apiBase = configuredApiBase;
const configuredUiBase = String(process.env.CORE64_UI_BASE || "").trim().replace(/\/+$/, "");
const requestTimeoutMs = Number(process.env.CORE64_UI_SMOKE_TIMEOUT_MS || 15000);
const headless = !["0", "false", "no", "off"].includes(String(process.env.CORE64_UI_HEADLESS || "true").trim().toLowerCase());
const MANAGED_SECTION_KEYS = ["releases", "artists", "events", "sponsors"];

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

function getBackendOrigin() {
    return apiBase.replace(/\/api$/, "");
}

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

async function requestAdminToken(adminPassword) {
    const login = await requestJson(`${apiBase}/auth/login`, {
        method: "POST",
        body: { password: adminPassword }
    });
    ensureOk(login, "POST /auth/login (ui smoke)");

    const token = String(login.json?.data?.token || "").trim();
    if (!token) {
        throw new Error("POST /auth/login (ui smoke) returned no token");
    }

    return token;
}

async function persistAdminSessionToken(page, token) {
    await page.evaluate((nextToken) => {
        sessionStorage.setItem("core64_admin_token", nextToken);
        sessionStorage.setItem("core64_admin_auth", "true");
    }, token);
}

function formatValueForError(value) {
    try {
        return JSON.stringify(value);
    } catch (_error) {
        return String(value);
    }
}

function listsMatch(expected, actual) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;
    return expected.every((value, index) => value === actual[index]);
}

function failWithDetails(message, details = {}) {
    throw new Error(`${message}. details=${formatValueForError(details)}`);
}

function assertListEquals(label, expected, actual, details = {}) {
    if (listsMatch(expected, actual)) return;
    failWithDetails(`${label} mismatch`, {
        expected,
        actual,
        ...details
    });
}

function buildPublicUrlWithLanguage(publicUrl, language) {
    const nextUrl = new URL(publicUrl);
    nextUrl.searchParams.set("lang", language);
    return nextUrl.toString();
}

function buildLocalhostFallbackApiBase(baseUrl) {
    try {
        const parsed = new URL(baseUrl);
        if (parsed.hostname.toLowerCase() !== "localhost") {
            return "";
        }
        parsed.hostname = "127.0.0.1";
        return parsed.toString().replace(/\/+$/, "");
    } catch (_error) {
        return "";
    }
}

function isFetchFailedError(error) {
    return /fetch failed/i.test(String(error?.message || ""));
}

async function resolveReachableApiBase(preferredApiBase) {
    const fallbackApiBase = buildLocalhostFallbackApiBase(preferredApiBase);
    const candidates = [preferredApiBase];
    if (fallbackApiBase && fallbackApiBase !== preferredApiBase) {
        candidates.push(fallbackApiBase);
    }

    let lastError = null;
    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        try {
            const health = await requestJson(`${candidate}/health`);
            ensureOk(health, `GET /health (${candidate})`);
            if (index > 0) {
                console.warn(`UI smoke preflight switched API base to ${candidate} after localhost fetch failure.`);
            }
            return candidate;
        } catch (error) {
            lastError = error;
            const hasNextCandidate = index + 1 < candidates.length;
            if (hasNextCandidate && isFetchFailedError(error)) {
                console.warn(`UI smoke preflight failed for ${candidate} (${error.message}). Retrying with ${candidates[index + 1]} ...`);
                continue;
            }
            throw new Error(`API preflight failed for ${candidate}: ${error.message}`);
        }
    }

    throw new Error(`API preflight failed: ${lastError?.message || "unknown error"}`);
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
                const upstream = await fetch(`${getBackendOrigin()}${requestUrl.pathname}${requestUrl.search}`, {
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

    let token = await page.evaluate(() => sessionStorage.getItem("core64_admin_token") || "");
    if (!token) {
        token = await requestAdminToken(adminPassword);
        await persistAdminSessionToken(page, token);
    }

    let authMeResult = await requestJson(`${apiBase}/auth/me`, { token });
    if (!authMeResult.response.ok) {
        token = await requestAdminToken(adminPassword);
        await persistAdminSessionToken(page, token);
        authMeResult = await requestJson(`${apiBase}/auth/me`, { token });
        ensureOk(authMeResult, "GET /auth/me after session refresh");

        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForFunction(
            page,
            () => {
                const loginScreen = document.getElementById("login-screen");
                if (!loginScreen) return true;
                return loginScreen.classList.contains("hidden");
            },
            undefined,
            requestTimeoutMs,
            "wait for admin login screen to hide after token refresh"
        );
    }
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
            if (!section || section.classList.contains("hidden") || !list) return false;

            const rowKeys = Array.from(list.querySelectorAll("[data-section-row]"))
                .map((row) => String(row.getAttribute("data-section-row") || ""));
            return rowKeys.includes("events") && rowKeys.includes("sponsors");
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

    const moveSummary = await page.evaluate(() => {
        if (typeof window.moveSectionSetting !== "function") {
            throw new Error("window.moveSectionSetting is unavailable");
        }

        const list = document.getElementById("section-settings-list");
        if (!list) {
            throw new Error("#section-settings-list is unavailable");
        }

        const rowKeys = Array.from(list.querySelectorAll("[data-section-row]"))
            .map((row) => String(row.getAttribute("data-section-row") || ""));
        const eventsIndex = rowKeys.indexOf("events");
        if (eventsIndex < 0) {
            throw new Error("events row was not found in section settings list");
        }

        for (let step = eventsIndex; step > 0; step -= 1) {
            window.moveSectionSetting("events", -1);
        }

        return {
            initialEventsIndex: eventsIndex,
            movesApplied: eventsIndex
        };
    });

    await waitForFunction(
        page,
        () => document.querySelector("#section-settings-list [data-section-row]")?.getAttribute("data-section-row") === "events",
        undefined,
        requestTimeoutMs,
        `wait for events row to move to top (initialIndex=${moveSummary.initialEventsIndex}, moves=${moveSummary.movesApplied})`
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

    const managedKeys = new Set(MANAGED_SECTION_KEYS);
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

    const verification = await page.evaluate((managedSectionKeys) => {
        const managedKeys = new Set(managedSectionKeys);
        const sectionNodes = Array.from(document.querySelectorAll("section[id]"))
            .filter((sectionEl) => managedKeys.has(sectionEl.id));
        const sectionStateByKey = Object.fromEntries(managedSectionKeys.map((sectionKey) => {
            const sectionEl = document.getElementById(sectionKey);
            return [sectionKey, {
                exists: Boolean(sectionEl),
                hidden: sectionEl ? Boolean(sectionEl.hidden) : null,
                ariaHidden: sectionEl ? sectionEl.getAttribute("aria-hidden") || null : null
            }];
        }));

        const readNavState = (containerId) => {
            const containerEl = document.getElementById(containerId);
            const links = containerEl ? Array.from(containerEl.querySelectorAll("a[href^='#']")) : [];
            const normalizedLinks = links.map((linkEl) => {
                const href = String(linkEl.getAttribute("href") || "");
                return {
                    href,
                    sectionKey: href.startsWith("#") ? href.slice(1) : href,
                    hidden: Boolean(linkEl.hidden),
                    ariaHidden: linkEl.getAttribute("aria-hidden") || null,
                    tabIndex: linkEl.getAttribute("tabindex") || null
                };
            });

            return {
                exists: Boolean(containerEl),
                links: normalizedLinks,
                managedVisibleOrder: normalizedLinks
                    .filter((link) => managedKeys.has(link.sectionKey) && !link.hidden)
                    .map((link) => link.sectionKey),
                sponsorsLink: normalizedLinks.find((link) => link.sectionKey === "sponsors") || null
            };
        };

        return {
            allManagedSectionOrder: sectionNodes.map((sectionEl) => sectionEl.id),
            visibleManagedSections: sectionNodes
                .filter((sectionEl) => !sectionEl.hidden)
                .map((sectionEl) => sectionEl.id),
            sectionStateByKey,
            desktopNav: readNavState("public-desktop-nav-links"),
            mobileNav: readNavState("public-mobile-nav-links")
        };
    }, Array.from(managedKeys));

    const missingManagedSections = MANAGED_SECTION_KEYS.filter((sectionKey) => verification.sectionStateByKey?.[sectionKey]?.exists !== true);
    if (missingManagedSections.length > 0) {
        failWithDetails("Public page is missing managed section nodes", {
            missingManagedSections,
            sectionStateByKey: verification.sectionStateByKey
        });
    }

    assertListEquals("Visible managed section order", expectedVisibleManagedSections, verification.visibleManagedSections, {
        allManagedSectionOrder: verification.allManagedSectionOrder
    });

    const sponsorsSectionState = verification.sectionStateByKey?.sponsors;
    if (!sponsorsSectionState || sponsorsSectionState.hidden !== true || sponsorsSectionState.ariaHidden !== "true") {
        failWithDetails("Sponsors section was not hidden correctly on public page", {
            expected: { hidden: true, ariaHidden: "true" },
            actual: sponsorsSectionState
        });
    }

    if (!verification.desktopNav?.exists) {
        failWithDetails("Desktop nav container was not found", {
            containerId: "public-desktop-nav-links"
        });
    }
    if (!verification.mobileNav?.exists) {
        failWithDetails("Mobile nav container was not found", {
            containerId: "public-mobile-nav-links"
        });
    }

    assertListEquals("Desktop nav managed section order", expectedVisibleManagedSections, verification.desktopNav.managedVisibleOrder, {
        links: verification.desktopNav.links
    });
    assertListEquals("Mobile nav managed section order", expectedVisibleManagedSections, verification.mobileNav.managedVisibleOrder, {
        links: verification.mobileNav.links
    });

    const desktopSponsors = verification.desktopNav.sponsorsLink;
    const mobileSponsors = verification.mobileNav.sponsorsLink;
    if (!desktopSponsors || desktopSponsors.hidden !== true || desktopSponsors.tabIndex !== "-1" || desktopSponsors.ariaHidden !== "true") {
        failWithDetails("Desktop sponsors nav link was not hidden correctly", {
            expected: { hidden: true, tabIndex: "-1", ariaHidden: "true" },
            actual: desktopSponsors
        });
    }
    if (!mobileSponsors || mobileSponsors.hidden !== true || mobileSponsors.tabIndex !== "-1" || mobileSponsors.ariaHidden !== "true") {
        failWithDetails("Mobile sponsors nav link was not hidden correctly", {
            expected: { hidden: true, tabIndex: "-1", ariaHidden: "true" },
            actual: mobileSponsors
        });
    }

    const localizationExpectations = {
        uk: {
            fileButtonText: "Вибрати файл",
            fileNoFileText: "Файл не вибрано"
        },
        en: {
            fileButtonText: "Choose file",
            fileNoFileText: "No file chosen"
        }
    };

    const localizationVerification = {};
    for (const language of ["uk", "en"]) {
        const expected = localizationExpectations[language];
        await page.goto(buildPublicUrlWithLanguage(publicUrl, language), { waitUntil: "domcontentloaded" });

        await waitForFunction(
            page,
            (payload) => {
                const ukDesktop = document.getElementById("public-lang-uk")?.textContent?.trim() || "";
                const enDesktop = document.getElementById("public-lang-en")?.textContent?.trim() || "";
                const ukMobile = document.getElementById("public-lang-uk-mobile")?.textContent?.trim() || "";
                const enMobile = document.getElementById("public-lang-en-mobile")?.textContent?.trim() || "";
                const fileButton = document.getElementById("contact-demo-file-button")?.textContent?.trim() || "";
                const fileName = document.getElementById("contact-demo-file-name")?.textContent?.trim() || "";

                return ukDesktop === "UK"
                    && enDesktop === "EN"
                    && ukMobile === "UK"
                    && enMobile === "EN"
                    && fileButton === payload.fileButtonText
                    && fileName === payload.fileNoFileText;
            },
            expected,
            requestTimeoutMs,
            `wait for localized language/file controls (${language})`
        );

        localizationVerification[language] = await page.evaluate(() => ({
            languageSwitcher: {
                desktopUk: document.getElementById("public-lang-uk")?.textContent?.trim() || "",
                desktopEn: document.getElementById("public-lang-en")?.textContent?.trim() || "",
                mobileUk: document.getElementById("public-lang-uk-mobile")?.textContent?.trim() || "",
                mobileEn: document.getElementById("public-lang-en-mobile")?.textContent?.trim() || ""
            },
            filePicker: {
                buttonText: document.getElementById("contact-demo-file-button")?.textContent?.trim() || "",
                fileNameText: document.getElementById("contact-demo-file-name")?.textContent?.trim() || ""
            }
        }));
    }

    await page.goto(buildPublicUrlWithLanguage(publicUrl, "en"), { waitUntil: "domcontentloaded" });
    await page.locator("#contact-demo-file-input").setInputFiles({
        name: "demo-test.wav",
        mimeType: "audio/wav",
        buffer: Buffer.from("core64-demo")
    });

    await waitForFunction(
        page,
        (expectedFileName) => document.getElementById("contact-demo-file-name")?.textContent?.trim() === expectedFileName,
        "demo-test.wav",
        requestTimeoutMs,
        "wait for selected file name in custom file picker"
    );

    const selectedFileState = await page.evaluate(() => ({
        buttonText: document.getElementById("contact-demo-file-button")?.textContent?.trim() || "",
        fileNameText: document.getElementById("contact-demo-file-name")?.textContent?.trim() || "",
        languageSwitcher: {
            desktopUk: document.getElementById("public-lang-uk")?.textContent?.trim() || "",
            desktopEn: document.getElementById("public-lang-en")?.textContent?.trim() || ""
        }
    }));

    if (selectedFileState.buttonText !== "Choose file" || selectedFileState.fileNameText !== "demo-test.wav") {
        failWithDetails("Custom file picker did not render expected selected-file state", {
            expected: {
                buttonText: "Choose file",
                fileNameText: "demo-test.wav"
            },
            actual: selectedFileState
        });
    }

    return {
        ...verification,
        localizationVerification,
        selectedFileState
    };
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

async function verifyAdminPersistence(page, adminUrl, adminPassword, mutatedSections) {
    const eventsSection = mutatedSections.find((section) => section.sectionKey === "events");
    await ensureAdminLoggedIn(page, adminUrl, adminPassword);
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
    apiBase = await resolveReachableApiBase(apiBase);

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
        const adminVerification = await verifyAdminPersistence(adminPage, adminUrl, adminPassword, mutatedSections);

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