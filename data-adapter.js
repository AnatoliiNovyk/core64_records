// CORE64 data adapter: API-first with localStorage fallback
(function () {
    const DEFAULT_DATA = {
        releases: [
            {
                id: 1,
                title: "Neural Network",
                artist: "Cybernetic",
                genre: "Neurofunk",
                releaseType: "single",
                releaseDate: "2024-01-10",
                year: "2024",
                image: "./images/Screenshot_1.png",
                link: "https://soundcloud.com/",
                ticketLink: ""
            },
            {
                id: 2,
                title: "Dark Matter",
                artist: "Synapse",
                genre: "Techstep",
                releaseType: "ep",
                releaseDate: "2024-03-15",
                year: "2024",
                image: "./images/Screenshot_9.png",
                link: "https://www.youtube.com/",
                ticketLink: ""
            },
            {
                id: 3,
                title: "System Shock",
                artist: "Binary Soul",
                genre: "Breakbeat",
                releaseType: "album",
                releaseDate: "2023-09-22",
                year: "2023",
                image: "./images/Screenshot_1.png",
                link: "https://music.apple.com/",
                ticketLink: ""
            },
            {
                id: 4,
                title: "Core Dump",
                artist: "Null Pointer",
                genre: "DnB",
                releaseType: "single",
                releaseDate: "2024-06-01",
                year: "2024",
                image: "./images/Screenshot_9.png",
                link: "https://open.spotify.com/",
                ticketLink: ""
            }
        ],
        artists: [
            {
                id: 1,
                name: "Cybernetic",
                genre: "Neurofunk",
                bio: "Піонер української нейрофанк сцени. Виробляє потужні басові лінії з 2019 року.",
                image: "http://static.photos/people/640x360/10",
                soundcloud: "#",
                instagram: "#"
            },
            {
                id: 2,
                name: "Synapse",
                genre: "Techstep",
                bio: "Майстер темних атмосфер та агресивних ритмів.",
                image: "http://static.photos/people/640x360/11",
                soundcloud: "#",
                instagram: "#"
            },
            {
                id: 3,
                name: "Binary Soul",
                genre: "Breakbeat",
                bio: "Експериментатор, що поєднує класичний брейкбіт з сучасним звучанням.",
                image: "http://static.photos/people/640x360/12",
                soundcloud: "#",
                instagram: "#"
            }
        ],
        events: [
            {
                id: 1,
                title: "CORE64 Label Night",
                date: "2024-02-15",
                time: "22:00",
                venue: "Київ, Atlas",
                description: "Великий лейбл-ніч з усіма артистами CORE64.",
                image: "http://static.photos/nightlife/640x360/20",
                ticketLink: ""
            },
            {
                id: 2,
                title: "Neurofunk Madness",
                date: "2024-03-01",
                time: "23:00",
                venue: "Львів, !FESTrepublic",
                description: "Вечірка присвячена найважчому нейрофанку.",
                image: "http://static.photos/nightlife/640x360/21",
                ticketLink: ""
            }
        ],
        sponsors: [
            {
                id: 1,
                name: "BassLab Audio",
                shortDescription: "Студія мастерингу лейблу",
                logo: "http://static.photos/technology/640x360/31",
                link: "#",
                sortOrder: 1
            },
            {
                id: 2,
                name: "NightPulse Agency",
                shortDescription: "Подієвий партнер сцени",
                logo: "http://static.photos/nightlife/640x360/32",
                link: "#",
                sortOrder: 2
            },
            {
                id: 3,
                name: "DnB Family UA",
                shortDescription: "Друзі з комʼюніті",
                logo: "http://static.photos/people/640x360/33",
                link: "#",
                sortOrder: 3
            }
        ],
        settings: {
            title: "CORE64 Records",
            about: "CORE64 Records — незалежний музичний лейбл, заснований у 2024 році. Ми спеціалізуємося на найважчих жанрах електронної музики: Neurofunk, Techstep, Darkstep та Breakbeat.",
            mission: "Наша місія — підтримувати андерграунд сцену та виводити Drum & Bass на новий рівень. Кожен реліз — це унікальна історія, закодована в звуках синтезаторів та ритмах барабанів.",
            heroSubtitleUk: "Neurofunk • Drum & Bass • Breakbeat • Techstep",
            heroSubtitleEn: "Neurofunk • Drum & Bass • Breakbeat • Techstep",
            email: "demo@core64.records",
            headerLogoUrl: "",
            footerLogoUrl: "",
            instagramUrl: "#",
            youtubeUrl: "#",
            soundcloudUrl: "#",
            radioUrl: "#",
            contactCaptchaEnabled: false,
            contactCaptchaActiveProvider: "none",
            contactCaptchaHcaptchaSiteKey: "",
            contactCaptchaHcaptchaSecretKey: "",
            contactCaptchaRecaptchaSiteKey: "",
            contactCaptchaRecaptchaSecretKey: "",
            contactCaptchaErrorMessage: "Не вдалося пройти перевірку captcha.",
            contactCaptchaMissingTokenMessage: "Підтвердіть, що ви не робот.",
            contactCaptchaInvalidDomainMessage: "Відправка з цього домену заборонена.",
            contactCaptchaAllowedDomain: "",
            auditLatencyGoodMaxMs: 300,
            auditLatencyWarnMaxMs: 800
        },
        sectionSettings: [
            {
                sectionKey: "releases",
                sortOrder: 1,
                isEnabled: true,
                titleUk: "ОСТАННІ РЕЛІЗИ",
                titleEn: "LATEST RELEASES",
                menuTitleUk: "РЕЛІЗИ",
                menuTitleEn: "RELEASES"
            },
            {
                sectionKey: "artists",
                sortOrder: 2,
                isEnabled: true,
                titleUk: "АРТИСТИ ЛЕЙБЛУ",
                titleEn: "LABEL ARTISTS",
                menuTitleUk: "АРТИСТИ",
                menuTitleEn: "ARTISTS"
            },
            {
                sectionKey: "events",
                sortOrder: 3,
                isEnabled: true,
                titleUk: "АФІША ПОДІЙ",
                titleEn: "EVENT SCHEDULE",
                menuTitleUk: "ПОДІЇ",
                menuTitleEn: "EVENTS"
            },
            {
                sectionKey: "sponsors",
                sortOrder: 4,
                isEnabled: true,
                titleUk: "СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ",
                titleEn: "SPONSORS, PARTNERS AND FRIENDS",
                menuTitleUk: "СПОНСОРИ",
                menuTitleEn: "SPONSORS"
            },
            {
                sectionKey: "contact",
                sortOrder: 5,
                isEnabled: true,
                titleUk: "ЗВ'ЯЗАТИСЯ З НАМИ",
                titleEn: "CONTACT US",
                menuTitleUk: "КОНТАКТИ",
                menuTitleEn: "CONTACT"
            }
        ],
        contactRequests: []
    };

    const STORAGE_KEY = "core64_data";
    const STORAGE_AUTH_KEY = "core64_admin_auth";
    const STORAGE_TOKEN_KEY = "core64_admin_token";
    const STORAGE_MODE_KEY = "core64_data_mode";
    const STORAGE_LANG_KEY = "core64_language";
    const STORAGE_API_BASE_KEY = "core64_api_base_url";
    const DEFAULT_API_TIMEOUT_MS = 15000;
    let runtimeApiBaseUrl = "";

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getDataMode() {
        const configuredMode = (window.CORE64_CONFIG && window.CORE64_CONFIG.dataMode) || localStorage.getItem(STORAGE_MODE_KEY) || "auto";
        return configuredMode;
    }

    function normalizeApiBaseUrl(value) {
        const normalized = String(value || "").trim();
        if (!normalized) return "";
        return normalized.replace(/\/+$/, "");
    }

    function getQueryApiBaseUrlOverride() {
        if (typeof window === "undefined" || !window.location || !window.location.search) return "";
        const params = new URLSearchParams(window.location.search);
        const fromApiBaseUrl = normalizeApiBaseUrl(params.get("apiBaseUrl"));
        if (fromApiBaseUrl) return fromApiBaseUrl;
        const fromApi = normalizeApiBaseUrl(params.get("api"));
        return fromApi;
    }

    function setRuntimeApiBaseUrl(value) {
        const normalized = normalizeApiBaseUrl(value);
        if (!normalized) return;
        runtimeApiBaseUrl = normalized;
        try {
            localStorage.setItem(STORAGE_API_BASE_KEY, normalized);
        } catch (_error) {
            // Ignore storage write failures.
        }
    }

    function getApiBaseUrl() {
        const queryOverride = getQueryApiBaseUrlOverride();
        if (queryOverride) {
            setRuntimeApiBaseUrl(queryOverride);
            return queryOverride;
        }

        if (runtimeApiBaseUrl) return runtimeApiBaseUrl;

        // Persisted manual override should win over static page config.
        const storedBase = normalizeApiBaseUrl(localStorage.getItem(STORAGE_API_BASE_KEY));
        if (storedBase) {
            runtimeApiBaseUrl = storedBase;
            return runtimeApiBaseUrl;
        }

        const configBase = normalizeApiBaseUrl(window.CORE64_CONFIG && window.CORE64_CONFIG.apiBaseUrl);
        if (configBase) {
            runtimeApiBaseUrl = configBase;
            return runtimeApiBaseUrl;
        }

        runtimeApiBaseUrl = "/api";
        return runtimeApiBaseUrl;
    }

    function getApiTimeoutMs() {
        const configTimeout = Number(window.CORE64_CONFIG && window.CORE64_CONFIG.apiTimeoutMs);
        if (Number.isFinite(configTimeout) && configTimeout >= 1000) {
            return Math.round(configTimeout);
        }
        return DEFAULT_API_TIMEOUT_MS;
    }

    function withRequestTimeout(signal, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

    function normalizeLanguageCode(input) {
        const normalized = String(input || "").trim().toLowerCase().replace(/_/g, "-");
        if (!normalized) return "";
        const primary = normalized.split("-")[0];
        return primary;
    }

    function getConfiguredSupportedLanguages() {
        const config = window.CORE64_CONFIG && typeof window.CORE64_CONFIG === "object" ? window.CORE64_CONFIG : {};
        const fromArray = Array.isArray(config.supportedLanguages) ? config.supportedLanguages : [];
        const fromString = typeof config.supportedLanguages === "string"
            ? config.supportedLanguages.split(",")
            : [];
        const candidates = [...fromArray, ...fromString];
        const normalized = candidates
            .map((entry) => normalizeLanguageCode(entry))
            .filter(Boolean);

        if (normalized.length === 0) {
            return ["uk", "en"];
        }

        return Array.from(new Set(normalized));
    }

    function getConfiguredDefaultLanguage() {
        const config = window.CORE64_CONFIG && typeof window.CORE64_CONFIG === "object" ? window.CORE64_CONFIG : {};
        const supported = getConfiguredSupportedLanguages();
        const normalizedDefault = normalizeLanguageCode(config.defaultLanguage || "uk");
        if (supported.includes(normalizedDefault)) return normalizedDefault;
        return supported[0] || "uk";
    }

    function resolvePreferredLanguage(input) {
        const supported = getConfiguredSupportedLanguages();
        const normalized = normalizeLanguageCode(input);
        if (normalized && supported.includes(normalized)) {
            return normalized;
        }
        return getConfiguredDefaultLanguage();
    }

    function getStoredLanguage() {
        return localStorage.getItem(STORAGE_LANG_KEY);
    }

    function setStoredLanguage(language) {
        localStorage.setItem(STORAGE_LANG_KEY, language);
    }

    function getCurrentLanguage() {
        const fromStorage = getStoredLanguage();
        return resolvePreferredLanguage(fromStorage);
    }

    function buildPathWithLang(path, lang) {
        if (!lang) return path;
        const joiner = path.includes("?") ? "&" : "?";
        return `${path}${joiner}lang=${encodeURIComponent(lang)}`;
    }

    function getLocaleTagForLanguage(language) {
        const normalized = resolvePreferredLanguage(language);
        if (normalized === "uk") return "uk-UA";
        if (normalized === "en") return "en-US";
        return `${normalized}-${normalized.toUpperCase()}`;
    }

    function localizeSectionSettings(sectionSettings, language) {
        const normalizedLanguage = resolvePreferredLanguage(language);
        const source = Array.isArray(sectionSettings) ? sectionSettings : [];
        const byKey = source.reduce((acc, entry) => {
            const sectionKey = String(entry && entry.sectionKey ? entry.sectionKey : "").trim();
            if (!sectionKey) return acc;
            acc[sectionKey] = entry;
            return acc;
        }, {});

        return DEFAULT_DATA.sectionSettings
            .map((defaults, index) => {
                const candidate = byKey[defaults.sectionKey] || {};
                const sortOrder = Number.isFinite(Number(candidate.sortOrder))
                    ? Number(candidate.sortOrder)
                    : defaults.sortOrder || (index + 1);
                const titleUk = String(candidate.titleUk || defaults.titleUk || "").trim();
                const titleEn = String(candidate.titleEn || defaults.titleEn || "").trim();
                const menuTitleUk = String(candidate.menuTitleUk || defaults.menuTitleUk || "").trim();
                const menuTitleEn = String(candidate.menuTitleEn || defaults.menuTitleEn || "").trim();
                return {
                    sectionKey: defaults.sectionKey,
                    sortOrder,
                    isEnabled: candidate.isEnabled !== false,
                    title: normalizedLanguage === "en" ? (titleEn || titleUk || defaults.sectionKey) : (titleUk || titleEn || defaults.sectionKey),
                    menuTitle: normalizedLanguage === "en"
                        ? (menuTitleEn || menuTitleUk || titleEn || titleUk || defaults.sectionKey)
                        : (menuTitleUk || menuTitleEn || titleUk || titleEn || defaults.sectionKey)
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.sortOrder - right.sortOrder);
    }

    function getLocalData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const defaults = deepClone(DEFAULT_DATA);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
                return defaults;
            }

            const parsed = JSON.parse(raw);
            return {
                releases: parsed.releases || [],
                artists: parsed.artists || [],
                events: parsed.events || [],
                sponsors: parsed.sponsors || [],
                settings: {
                    ...deepClone(DEFAULT_DATA.settings),
                    ...(parsed.settings || {})
                },
                sectionSettings: Array.isArray(parsed.sectionSettings)
                    ? parsed.sectionSettings
                    : deepClone(DEFAULT_DATA.sectionSettings),
                contactRequests: parsed.contactRequests || []
            };
        } catch (error) {
            console.warn("localStorage read failed, fallback to defaults", error);
            return deepClone(DEFAULT_DATA);
        }
    }

    function saveLocalData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function extractValidationErrorMessage(payload) {
        if (!payload || typeof payload !== "object") return "";
        const details = payload.details;
        if (!details || typeof details !== "object") return "";
        const fieldErrors = details.fieldErrors;
        if (!fieldErrors || typeof fieldErrors !== "object") return "";

        for (const key of Object.keys(fieldErrors)) {
            const messages = fieldErrors[key];
            if (!Array.isArray(messages)) continue;
            const firstMessage = messages.find((entry) => typeof entry === "string" && entry.trim());
            if (firstMessage) return firstMessage.trim();
        }

        return "";
    }

    function normalizeApiErrorDetails(value, fallback = "Request failed", maxLength = 180) {
        const collapsed = String(value || "").replace(/\s+/g, " ").trim();
        const base = collapsed || String(fallback || "Request failed");
        if (base.length <= maxLength) return base;
        return `${base.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
    }

    async function apiRequest(path, options) {
        const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
        const headers = Object.assign({ "Content-Type": "application/json" }, options && options.headers ? options.headers : {});
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const timeout = withRequestTimeout(options && options.signal ? options.signal : undefined, getApiTimeoutMs());

        let response;
        try {
            response = await fetch(`${getApiBaseUrl()}${path}`, {
                method: (options && options.method) || "GET",
                headers,
                body: options && options.body ? JSON.stringify(options.body) : undefined,
                signal: timeout.signal
            });
        } catch (error) {
            const isTimeout = error && error.name === "AbortError";
            const networkMessage = isTimeout ? "Request timeout" : (error && error.message ? error.message : "Network request failed");
            const networkError = new Error(normalizeApiErrorDetails(networkMessage, "Network request failed"));
            networkError.code = isTimeout ? "API_NETWORK_TIMEOUT" : "API_NETWORK_ERROR";
            networkError.status = 0;
            throw networkError;
        } finally {
            timeout.cancel();
        }

        if (!response.ok) {
            let details = `HTTP ${response.status}`;
            let code = "";
            let payload = null;
            try {
                payload = await response.json();
                const validationMessage = extractValidationErrorMessage(payload);
                details = normalizeApiErrorDetails(validationMessage || payload.error || payload.message, details);
                code = String(payload.code || "").trim();
            } catch (_err) {
                // No-op: use fallback message.
            }

            const apiError = new Error(normalizeApiErrorDetails(details, `HTTP ${response.status}`));
            apiError.status = response.status;
            apiError.code = code;
            apiError.payload = payload;
            throw apiError;
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async function shouldUseApi() {
        const mode = getDataMode();
        if (mode === "api") return true;
        if (mode === "local") return false;

        try {
            await apiRequest("/health");
            return true;
        } catch (_error) {
            return false;
        }
    }

    function normalizeCollectionName(type) {
        if (type === "settings") return "settings";
        if (type.endsWith("s")) return type;
        return `${type}s`;
    }

    function sanitizeText(input) {
        return String(input || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .trim();
    }

    function decodeHtmlEntities(text) {
        let decodedText = text === null || text === undefined ? "" : String(text);
        for (let i = 0; i < 5; i += 1) {
            const nextDecodedText = decodedText
                .replace(/&amp;/gi, "&")
                .replace(/&lt;/gi, "<")
                .replace(/&gt;/gi, ">")
                .replace(/&quot;/gi, '"')
                .replace(/&#039;/gi, "'");
            if (nextDecodedText === decodedText) break;
            decodedText = nextDecodedText;
        }
        return decodedText;
    }

    function normalizeSettingsPlainText(value, fallback = "") {
        const decoded = decodeHtmlEntities(value);
        const normalized = String(decoded || "").trim();
        const normalizedFallback = String(fallback || "").trim();
        return normalized || normalizedFallback;
    }

    function normalizeSettingsUrl(value, options = {}) {
        const { platform = "" } = options || {};
        const decodedValue = decodeHtmlEntities(value).trim();
        if (!decodedValue || decodedValue === "#") return "#";

        const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(decodedValue)
            ? decodedValue
            : (decodedValue.startsWith("www.") ? `https://${decodedValue}` : decodedValue);

        let parsedUrl;
        try {
            parsedUrl = new URL(withProtocol);
        } catch (_error) {
            return "#";
        }

        if (!/^https?:$/i.test(parsedUrl.protocol)) {
            return "#";
        }

        if (platform === "youtube" && parsedUrl.hostname.toLowerCase() === "music.youtube.com" && parsedUrl.pathname.startsWith("/@")) {
            parsedUrl.hostname = "www.youtube.com";
        }

        return parsedUrl.toString();
    }

    function normalizeSettingsHostname(value) {
        const normalized = normalizeSettingsPlainText(value, "").toLowerCase().replace(/^https?:\/\//i, "").split("/")[0];
        return /^[a-z0-9.-]+$/i.test(normalized) ? normalized : "";
    }

    const adapter = {
        defaults: deepClone(DEFAULT_DATA),

        sanitizeText,
        decodeHtmlEntities,
        normalizeSettingsPlainText,
        normalizeSettingsUrl,
        normalizeSettingsHostname,

        async isApiAvailable() {
            try {
                await apiRequest("/health");
                return true;
            } catch (_error) {
                return false;
            }
        },

        async getSiteData() {
            const language = getCurrentLanguage();
            if (await shouldUseApi()) {
                const response = await apiRequest(buildPathWithLang("/public", language));
                return response.data;
            }
            const localData = getLocalData();
            return {
                ...localData,
                sectionSettings: localizeSectionSettings(localData.sectionSettings, language)
            };
        },

        async getCollection(type) {
            const collection = normalizeCollectionName(type);
            const language = getCurrentLanguage();
            if (await shouldUseApi()) {
                if (collection === "settings") {
                    const response = await apiRequest(buildPathWithLang("/settings", language));
                    return response.data;
                }
                const response = await apiRequest(buildPathWithLang(`/${collection}`, language));
                return response.data;
            }

            const data = getLocalData();
            return data[collection];
        },

        async getSectionSettings() {
            if (await shouldUseApi()) {
                const response = await apiRequest("/settings/sections");
                return response.data && response.data.sections ? response.data.sections : [];
            }

            const data = getLocalData();
            return Array.isArray(data.sectionSettings) ? data.sectionSettings : [];
        },

        async saveSectionSettings(payload) {
            const sections = payload && Array.isArray(payload.sections) ? payload.sections : [];

            if (await shouldUseApi()) {
                const response = await apiRequest("/settings/sections", {
                    method: "PUT",
                    body: { data: { sections } }
                });
                return response.data && response.data.sections ? response.data.sections : [];
            }

            const data = getLocalData();
            data.sectionSettings = sections;
            saveLocalData(data);
            return sections;
        },

        async saveSettingsBundle(payload) {
            const settings = payload && payload.settings && typeof payload.settings === "object" ? payload.settings : {};
            const sections = payload && Array.isArray(payload.sections) ? payload.sections : [];

            if (await shouldUseApi()) {
                try {
                    const response = await apiRequest("/settings/bundle", {
                        method: "PUT",
                        body: { data: { settings, sections } }
                    });
                    return response.data || { settings, sections };
                } catch (error) {
                    const status = Number(error && error.status);
                    if (status !== 404 && status !== 405) throw error;

                    const settingsResponse = await apiRequest("/settings", {
                        method: "PUT",
                        body: { data: settings }
                    });
                    const sectionsResponse = await apiRequest("/settings/sections", {
                        method: "PUT",
                        body: { data: { sections } }
                    });

                    return {
                        settings: settingsResponse && settingsResponse.data ? settingsResponse.data : settings,
                        sections: sectionsResponse && sectionsResponse.data && Array.isArray(sectionsResponse.data.sections)
                            ? sectionsResponse.data.sections
                            : sections
                    };
                }
            }

            const data = getLocalData();
            data.settings = settings;
            data.sectionSettings = sections;
            saveLocalData(data);
            return { settings, sections };
        },

        async saveCollection(type, payload) {
            const collection = normalizeCollectionName(type);
            if (await shouldUseApi()) {
                const endpoint = collection === "settings" ? "/settings" : `/${collection}`;
                const response = await apiRequest(endpoint, { method: "PUT", body: { data: payload } });
                return response.data;
            }

            const data = getLocalData();
            data[collection] = payload;
            saveLocalData(data);
            return payload;
        },

        async createItem(type, item) {
            const collection = normalizeCollectionName(type);
            if (await shouldUseApi()) {
                const response = await apiRequest(`/${collection}`, { method: "POST", body: item });
                return response.data;
            }

            const data = getLocalData();
            if (!data[collection]) data[collection] = [];
            data[collection].push(item);
            saveLocalData(data);
            return item;
        },

        async updateItem(type, id, item) {
            const collection = normalizeCollectionName(type);
            if (await shouldUseApi()) {
                const response = await apiRequest(`/${collection}/${id}`, { method: "PUT", body: item });
                return response.data;
            }

            const data = getLocalData();
            const index = (data[collection] || []).findIndex((entry) => Number(entry.id) === Number(id));
            if (index === -1) throw new Error("Item not found");
            data[collection][index] = item;
            saveLocalData(data);
            return item;
        },

        async deleteItem(type, id) {
            const collection = normalizeCollectionName(type);
            if (await shouldUseApi()) {
                await apiRequest(`/${collection}/${id}`, { method: "DELETE" });
                return;
            }

            const data = getLocalData();
            data[collection] = (data[collection] || []).filter((entry) => Number(entry.id) !== Number(id));
            saveLocalData(data);
        },

        async submitContactRequest(payload) {
            const cleanPayload = {
                name: sanitizeText(payload.name),
                email: sanitizeText(payload.email),
                subject: sanitizeText(payload.subject),
                message: sanitizeText(payload.message),
                attachmentName: String(payload.attachmentName || "").trim(),
                attachmentType: String(payload.attachmentType || "").trim(),
                attachmentDataUrl: String(payload.attachmentDataUrl || "").trim(),
                captchaToken: String(payload.captchaToken || "").trim()
            };

            if (await shouldUseApi()) {
                const response = await apiRequest("/contact-requests", { method: "POST", body: cleanPayload });
                return response.data;
            }

            const data = getLocalData();
            const request = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                status: "new",
                ...cleanPayload
            };
            data.contactRequests = data.contactRequests || [];
            data.contactRequests.unshift(request);
            saveLocalData(data);
            return request;
        },

        async getContactRequests() {
            if (await shouldUseApi()) {
                const response = await apiRequest("/contact-requests");
                return response.data;
            }

            const data = getLocalData();
            return data.contactRequests || [];
        },

        async updateContactRequestStatus(id, status) {
            if (await shouldUseApi()) {
                const response = await apiRequest(`/contact-requests/${id}`, {
                    method: "PATCH",
                    body: { status }
                });
                return response.data;
            }

            const data = getLocalData();
            data.contactRequests = (data.contactRequests || []).map((entry) => {
                if (Number(entry.id) === Number(id)) {
                    return { ...entry, status };
                }
                return entry;
            });
            saveLocalData(data);
            return (data.contactRequests || []).find((entry) => Number(entry.id) === Number(id)) || null;
        },

        async getAuditLogs(params = {}, requestOptions = {}) {
            if (await shouldUseApi()) {
                const query = new URLSearchParams();
                query.set("limit", String(Number(params.limit) || 50));
                query.set("page", String(Number(params.page) || 1));

                if (params.q) query.set("q", String(params.q));
                if (params.action && params.action !== "all") query.set("action", String(params.action));
                if (params.entity && params.entity !== "all") query.set("entity", String(params.entity));
                if (params.from) query.set("from", String(params.from));
                if (params.to) query.set("to", String(params.to));

                const response = await apiRequest(`/audit-logs?${query.toString()}`, {
                    signal: requestOptions.signal
                });
                if (response.data && Array.isArray(response.data.items)) return response.data;
                if (Array.isArray(response.data)) {
                    return {
                        items: response.data,
                        page: Number(params.page) || 1,
                        limit: Number(params.limit) || 50,
                        total: response.data.length
                    };
                }
                return { items: [], page: 1, limit: Number(params.limit) || 50, total: 0 };
            }

            return { items: [], page: 1, limit: Number(params.limit) || 50, total: 0 };
        },

        async getAuditFacets(requestOptions = {}) {
            if (await shouldUseApi()) {
                const response = await apiRequest("/audit-logs/facets", {
                    signal: requestOptions.signal
                });
                return {
                    actions: Array.isArray(response.data?.actions) ? response.data.actions : [],
                    entities: Array.isArray(response.data?.entities) ? response.data.entities : []
                };
            }

            return { actions: [], entities: [] };
        },

        async login(password) {
            if (await shouldUseApi()) {
                try {
                    const response = await apiRequest("/auth/login", {
                        method: "POST",
                        body: { password }
                    });
                    sessionStorage.setItem(STORAGE_TOKEN_KEY, response.data.token);
                    sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
                    return true;
                } catch (error) {
                    const errorCode = String(error && error.code ? error.code : "").trim();
                    if (errorCode === "AUTH_INVALID_CREDENTIALS") {
                        return false;
                    }
                    if (Number(error && error.status) === 401 && /invalid credentials/i.test(String(error && error.message ? error.message : ""))) {
                        return false;
                    }
                    throw error;
                }
            }

            const localPassword = localStorage.getItem("core64_admin_password") || "core64admin";
            const isValid = password === localPassword;
            if (isValid) {
                sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
            }
            return isValid;
        },

        async logout() {
            sessionStorage.removeItem(STORAGE_TOKEN_KEY);
            sessionStorage.removeItem(STORAGE_AUTH_KEY);
        },

        async isAuthenticated() {
            if (await shouldUseApi()) {
                try {
                    await apiRequest("/auth/me");
                    sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
                    return true;
                } catch (_error) {
                    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
                    sessionStorage.removeItem(STORAGE_AUTH_KEY);
                    return false;
                }
            }

            return sessionStorage.getItem(STORAGE_AUTH_KEY) === "true";
        },

        ensureLocalDefaults() {
            getLocalData();
        },

        getDefaultLanguage() {
            return getConfiguredDefaultLanguage();
        },

        getSupportedLanguages() {
            return getConfiguredSupportedLanguages();
        },

        getLanguage() {
            return getCurrentLanguage();
        },

        setLanguage(language) {
            const resolved = resolvePreferredLanguage(language);
            setStoredLanguage(resolved);
            return resolved;
        },

        getLocaleTag() {
            return getLocaleTagForLanguage(getCurrentLanguage());
        }
    };

    window.Core64DataAdapter = adapter;
})();
