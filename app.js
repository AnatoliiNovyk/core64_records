// CORE64 Records - Public site logic with API-first data access.

const adapter = window.Core64DataAdapter;
let sponsorCarouselAutoplayTimer = null;
let sponsorCarouselVisibilityListenerBound = false;
let contactRuntimeSettings = {};
let releaseInteractionsBound = false;
let floatingScrollTopResizeListenerBound = false;
let compactReleasePlayerControlsBound = false;
let compactReleasePlayerOffsetSyncBound = false;
let compactReleasePlayerOffsetSyncFrame = 0;
let compactReleasePlayerOffsetResizeObserver = null;
let compactReleasePlayerVisualizerFrame = 0;
let compactReleasePlayerAudioContext = null;
let compactReleasePlayerAnalyser = null;
let compactReleasePlayerAudioSourceNode = null;
let compactReleasePlayerFrequencyData = null;
let compactReleasePlayerState = {
    releaseId: null,
    tracks: [],
    activeTrackIndex: -1,
    loading: false
};
const releaseIndexById = new Map();
const RELEASE_IMAGE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23040b12'/%3E%3Cstop offset='100%25' stop-color='%23111f2f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%2300f0ff' stroke-opacity='0.3'%3E%3Crect x='96' y='96' width='608' height='608' rx='36'/%3E%3Cpath d='M240 560 355 430l88 88 53-64 64 76'/%3E%3Ccircle cx='322' cy='310' r='46'/%3E%3C/g%3E%3Ctext x='50%25' y='88%25' text-anchor='middle' fill='%23bfefff' font-family='Arial,sans-serif' font-size='34'%3ECORE64 RELEASE%3C/text%3E%3C/svg%3E";
const RELEASE_TRACK_AUDIO_DATA_URL_PATTERN = /^data:audio\/(mpeg|mp3|wav|x-wav|wave);base64,[a-z0-9+/=\s]+$/i;
const CONTACT_REQUEST_DEFAULT_MAX_FILE_BYTES = 15 * 1024 * 1024;
const CONTACT_REQUEST_BACKEND_MAX_DATA_URL_CHARS = Math.ceil((CONTACT_REQUEST_DEFAULT_MAX_FILE_BYTES * 4) / 3) + 128;
const CONTACT_REQUEST_BACKEND_COMPAT_MAX_FILE_BYTES = Math.floor(((CONTACT_REQUEST_BACKEND_MAX_DATA_URL_CHARS - 128) * 3) / 4);
const CONTACT_SUBJECT_DEMO_VALUES = new Set(["demo", "demo_recording", "demo-recording"]);
const PUBLIC_SECTION_DEFAULTS = [
    { sectionKey: "releases", sortOrder: 1, i18nKey: "sectionLatestReleases", navI18nKey: "navReleases" },
    { sectionKey: "artists", sortOrder: 2, i18nKey: "sectionLabelArtists", navI18nKey: "navArtists" },
    { sectionKey: "events", sortOrder: 3, i18nKey: "sectionEvents", navI18nKey: "navEvents" },
    { sectionKey: "videos", sortOrder: 4, i18nKey: "sectionVideos", navI18nKey: "navVideos" },
    { sectionKey: "sponsors", sortOrder: 5, i18nKey: "sectionSponsors", navI18nKey: "navSponsors" },
    { sectionKey: "contact", sortOrder: 6, i18nKey: "sectionContact", navI18nKey: "navContact" }
];
const PUBLIC_I18N = {
    uk: {
        navReleases: "Релізи",
        navArtists: "Артисти",
        navEvents: "Події",
        navVideos: "Відео",
        navSponsors: "Спонсори",
        navAbout: "Про нас",
        navContact: "Контакти",
        mobileMenuOpenTitle: "Відкрити меню навігації",
        heroListenReleases: "Слухати Релізи",
        heroOurArtists: "Наші Артисти",
        sectionLatestReleases: "ОСТАННІ РЕЛІЗИ",
        releasePlayerTitle: "Плеєр релізу",
        releasePlayerTrackList: "Список треків",
        releasePlayerLoading: "Завантаження треків...",
        releasePlayerNoTracks: "Для цього релізу ще не додано треків.",
        releasePlayerTrackUnavailable: "Аудіофайл треку тимчасово недоступний.",
        releasePlayerClose: "Закрити плеєр",
        releasePlayerAutoplayBlocked: "Автовідтворення заблоковано браузером. Натисніть Play у плеєрі.",
        releasePlayerControlPlay: "Відтворити",
        releasePlayerControlPause: "Пауза",
        releasePlayerControlSeek: "Позиція відтворення",
        releasePlayerControlVolume: "Гучність",
        releaseTypeSingleLabel: "Сингл",
        releaseTypeEpLabel: "EP",
        releaseTypeAlbumLabel: "Альбом",
        releaseTypeRemixLabel: "Ремікс",
        releasePlayAria: "Відкрити плеєр релізу",
        sectionLabelArtists: "АРТИСТИ ЛЕЙБЛУ",
        sectionEvents: "АФІША ПОДІЙ",
        sectionVideos: "ВІДЕО",
        videosUpdating: "Відеосекція оновлюється",
        videosWatchOnYoutube: "Дивитися на YouTube",
        sectionSponsors: "СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ",
        sponsorPrev: "Попередній спонсор",
        sponsorNext: "Наступний спонсор",
        sponsorCarousel: "Карусель спонсорів",
        sponsorsUpdating: "Партнерська секція оновлюється",
        sectionAbout: "ПРО CORE64 RECORDS",
        statReleases: "Релізів",
        statArtists: "Артистів",
        statSupport: "Підтримка",
        statBass: "Басу",
        sectionContact: "ЗВ'ЯЗАТИСЯ З НАМИ",
        contactName: "Ім'я",
        contactNameTitle: "Ваше ім'я",
        contactNamePlaceholder: "Введіть ім'я",
        contactEmail: "Email",
        contactEmailTitle: "Ваш email",
        contactEmailPlaceholder: "name@example.com",
        contactSubject: "Тема",
        contactSubjectTitle: "Тема звернення",
        contactSubjectDemo: "Демо запис",
        contactSubjectCooperation: "Співпраця",
        contactSubjectEvent: "Подія",
        contactSubjectOther: "Інше",
        contactMessage: "Повідомлення",
        contactMessageTitle: "Текст повідомлення",
        contactMessagePlaceholder: "Опишіть ваше звернення...",
        contactFile: "Файл (для демо-запису)",
        contactFileTitle: "Демо файл",
        contactFileSelectButton: "Вибрати файл",
        contactFileNoFile: "Файл не вибрано",
        contactFileHint: "Додавайте аудіо або архів матеріалів. Для теми \"Демо запис\" файл є обов'язковим.",
        contactCaptchaLabel: "Перевірка",
        contactSubmit: "Відправити",
        contactStatusDefault: "Ми відповідаємо протягом 24 годин.",
        ticketsLabel: "Квитки",
        ticketsSoonMessage: "Квитки скоро будуть доступні. Напишіть нам через форму внизу сторінки.",
        heroSubtitleFallback: "Neurofunk • Drum & Bass • Breakbeat • Techstep",
        footerBackToTop: "Наверх",
        footerBackToTopAria: "Прокрутити до початку сторінки",
        footerRights: "© 2024 CORE64 Records. Усі права захищені.",
        goToAdminPanel: "Перейти в адмін-панель",
        apiTemporarilyUnavailable: "Сервіс тимчасово недоступний. Не вдалося отримати дані з API.",
        apiTemporarilyUnavailableNetwork: "Немає з'єднання з API. Перевірте мережу або спробуйте пізніше.",
        apiTemporarilyUnavailableTimeout: "API відповідає надто довго. Спробуйте оновити сторінку пізніше.",
        apiTemporarilyUnavailableDatabase: "API тимчасово недоступний через проблему з базою даних. Спробуйте пізніше.",
        sendingMessage: "Відправка повідомлення...",
        fileTooLargePrefix: "Файл завеликий. Максимум:",
        fileReadFailed: "Не вдалося прочитати файл. Спробуйте інший файл.",
        demoFileRequired: "Для теми 'Демо запис' потрібно додати файл.",
        captchaMissingToken: "Підтвердіть, що ви не робот.",
        contactSaved: "Дякуємо за повідомлення. Запит успішно збережено.",
        contactSaveFailedPrefix: "Не вдалося зберегти запит:",
        contactSaveFailedGeneric: "Не вдалося зберегти запит. Спробуйте пізніше.",
        contactSaveFailedDatabaseUnavailable: "База даних тимчасово недоступна. Спробуйте надіслати запит пізніше.",
        contactSaveFailedStorageLimit: "Файл завеликий для відправки. Зменшіть розмір демо-файлу та спробуйте ще раз.",
        captchaUnsupportedProvider: "Поточний провайдер капчі не підтримується на фронтенді.",
        captchaMissingSiteKey: "Captcha увімкнена, але не вказано site key.",
        captchaLoadFailed: "Не вдалося завантажити captcha. Оновіть сторінку або спробуйте пізніше.",
        languageLabelUk: "UK",
        languageLabelEn: "EN"
    },
    en: {
        navReleases: "Releases",
        navArtists: "Artists",
        navEvents: "Events",
        navVideos: "Videos",
        navSponsors: "Sponsors",
        navAbout: "About",
        navContact: "Contact",
        mobileMenuOpenTitle: "Open navigation menu",
        heroListenReleases: "Listen to Releases",
        heroOurArtists: "Our Artists",
        sectionLatestReleases: "LATEST RELEASES",
        releasePlayerTitle: "Release player",
        releasePlayerTrackList: "Track list",
        releasePlayerLoading: "Loading tracks...",
        releasePlayerNoTracks: "No tracks have been added for this release yet.",
        releasePlayerTrackUnavailable: "Track audio is temporarily unavailable.",
        releasePlayerClose: "Close player",
        releasePlayerAutoplayBlocked: "Autoplay was blocked by the browser. Press Play in the player.",
        releasePlayerControlPlay: "Play",
        releasePlayerControlPause: "Pause",
        releasePlayerControlSeek: "Playback position",
        releasePlayerControlVolume: "Volume",
        releaseTypeSingleLabel: "Single",
        releaseTypeEpLabel: "EP",
        releaseTypeAlbumLabel: "Album",
        releaseTypeRemixLabel: "Remix",
        releasePlayAria: "Open release player",
        sectionLabelArtists: "LABEL ARTISTS",
        sectionEvents: "EVENT SCHEDULE",
        sectionVideos: "VIDEOS",
        videosUpdating: "Video section is being updated",
        videosWatchOnYoutube: "Watch on YouTube",
        sectionSponsors: "SPONSORS, PARTNERS AND FRIENDS",
        sponsorPrev: "Previous sponsor",
        sponsorNext: "Next sponsor",
        sponsorCarousel: "Sponsors carousel",
        sponsorsUpdating: "Partners section is being updated",
        sectionAbout: "ABOUT CORE64 RECORDS",
        statReleases: "Releases",
        statArtists: "Artists",
        statSupport: "Support",
        statBass: "Bass",
        sectionContact: "CONTACT US",
        contactName: "Name",
        contactNameTitle: "Your name",
        contactNamePlaceholder: "Enter your name",
        contactEmail: "Email",
        contactEmailTitle: "Your email",
        contactEmailPlaceholder: "name@example.com",
        contactSubject: "Subject",
        contactSubjectTitle: "Message subject",
        contactSubjectDemo: "Demo recording",
        contactSubjectCooperation: "Cooperation",
        contactSubjectEvent: "Event",
        contactSubjectOther: "Other",
        contactMessage: "Message",
        contactMessageTitle: "Message text",
        contactMessagePlaceholder: "Describe your request...",
        contactFile: "File (for demo submission)",
        contactFileTitle: "Demo file",
        contactFileSelectButton: "Choose file",
        contactFileNoFile: "No file chosen",
        contactFileHint: "Attach audio or archive materials. For the \"Demo recording\" subject, file is required.",
        contactCaptchaLabel: "Verification",
        contactSubmit: "Send",
        contactStatusDefault: "We reply within 24 hours.",
        ticketsLabel: "Tickets",
        ticketsSoonMessage: "Tickets will be available soon. Contact us through the form below.",
        heroSubtitleFallback: "Neurofunk • Drum & Bass • Breakbeat • Techstep",
        footerBackToTop: "Back to top",
        footerBackToTopAria: "Scroll to the top of the page",
        footerRights: "© 2024 CORE64 Records. All rights reserved.",
        goToAdminPanel: "Open admin panel",
        apiTemporarilyUnavailable: "Service is temporarily unavailable. Failed to fetch data from API.",
        apiTemporarilyUnavailableNetwork: "Unable to reach API. Check your network or try again later.",
        apiTemporarilyUnavailableTimeout: "API response timed out. Please refresh later.",
        apiTemporarilyUnavailableDatabase: "API is temporarily unavailable due to a database issue. Please try again later.",
        sendingMessage: "Sending message...",
        fileTooLargePrefix: "File is too large. Maximum:",
        fileReadFailed: "Failed to read the file. Please try another file.",
        demoFileRequired: "A file is required for the 'Demo recording' subject.",
        captchaMissingToken: "Please confirm that you are not a robot.",
        contactSaved: "Thank you for your message. Request saved successfully.",
        contactSaveFailedPrefix: "Failed to save request:",
        contactSaveFailedGeneric: "Failed to save request. Please try again later.",
        contactSaveFailedDatabaseUnavailable: "Database is temporarily unavailable. Please try again later.",
        contactSaveFailedStorageLimit: "The file is too large to submit. Please reduce the demo file size and try again.",
        captchaUnsupportedProvider: "The current captcha provider is not supported in the frontend.",
        captchaMissingSiteKey: "Captcha is enabled, but site key is missing.",
        captchaLoadFailed: "Failed to load captcha. Refresh the page or try again later.",
        languageLabelUk: "UK",
        languageLabelEn: "EN"
    }
};

function getAdapterMethod(methodName) {
    if (!adapter || typeof adapter !== "object") return null;
    if (typeof methodName !== "string" || !methodName.trim()) return null;
    const method = adapter[methodName];
    return typeof method === "function" ? method : null;
}

function tPublic(key) {
    const language = getActiveLanguage();
    const dictionary = PUBLIC_I18N[language] || PUBLIC_I18N.uk;
    return dictionary[key] || PUBLIC_I18N.uk[key] || key;
}

function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        el.textContent = tPublic(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (!key) return;
        el.setAttribute("placeholder", tPublic(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        if (!key) return;
        el.setAttribute("title", tPublic(key));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria-label");
        if (!key) return;
        el.setAttribute("aria-label", tPublic(key));
    });
}

function applyLanguageFromQuery() {
    if (!adapter || typeof adapter.setLanguage !== "function") return;
    const params = new URLSearchParams(window.location.search);
    const requestedLanguage = params.get("lang");
    if (!requestedLanguage) return;
    adapter.setLanguage(requestedLanguage);
}

function getActiveLanguage() {
    if (!adapter || typeof adapter.getLanguage !== "function") return "uk";
    return adapter.getLanguage();
}

function getActiveLocaleTag() {
    if (!adapter || typeof adapter.getLocaleTag !== "function") return "uk-UA";
    return adapter.getLocaleTag();
}

function setLanguageAndReload(language) {
    if (!adapter || typeof adapter.setLanguage !== "function") return;
    const nextLanguage = adapter.setLanguage(language);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLanguage);
    window.location.assign(url.toString());
}

function updateLanguageSwitcherUi() {
    const language = getActiveLanguage();
    const mapping = [
        { id: "public-lang-uk", code: "uk" },
        { id: "public-lang-en", code: "en" },
        { id: "public-lang-uk-mobile", code: "uk" },
        { id: "public-lang-en-mobile", code: "en" }
    ];

    mapping.forEach(({ id, code }) => {
        const button = document.getElementById(id);
        if (!button) return;
        const isActive = language === code;
        button.classList.toggle("bg-cyan-400", isActive);
        button.classList.toggle("text-black", isActive);
        button.classList.toggle("text-cyan-300", !isActive);
        button.classList.toggle("font-bold", isActive);
    });

    const ukButton = document.getElementById("public-lang-uk");
    const enButton = document.getElementById("public-lang-en");
    const ukMobileButton = document.getElementById("public-lang-uk-mobile");
    const enMobileButton = document.getElementById("public-lang-en-mobile");
    if (ukButton) ukButton.textContent = tPublic("languageLabelUk");
    if (enButton) enButton.textContent = tPublic("languageLabelEn");
    if (ukMobileButton) ukMobileButton.textContent = tPublic("languageLabelUk");
    if (enMobileButton) enMobileButton.textContent = tPublic("languageLabelEn");
}

function bindLanguageSwitcher() {
    const buttonPairs = [
        { id: "public-lang-uk", code: "uk" },
        { id: "public-lang-en", code: "en" },
        { id: "public-lang-uk-mobile", code: "uk" },
        { id: "public-lang-en-mobile", code: "en" }
    ];

    buttonPairs.forEach(({ id, code }) => {
        const button = document.getElementById(id);
        if (!button) return;
        button.addEventListener("click", () => setLanguageAndReload(code));
    });

    updateLanguageSwitcherUi();
}

function showPublicApiStatus(message) {
    const statusEl = document.getElementById("public-api-status");
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("hidden");
}

function hidePublicApiStatus() {
    const statusEl = document.getElementById("public-api-status");
    if (!statusEl) return;
    statusEl.classList.add("hidden");
}

function resolvePublicApiStatusMessage(errorLike) {
    const source = errorLike && typeof errorLike === "object" ? errorLike : {};
    const code = String(source.code || "").trim();
    const status = Number(source.status || 0);
    const reason = String(source.reason || "").trim().toLowerCase();

    if (
        reason === "db_unavailable"
        || reason === "db_storage_limit"
        || code === "DB_UNAVAILABLE"
        || code === "DB_STORAGE_LIMIT_REACHED"
        || status === 503
        || status === 507
    ) {
        return tPublic("apiTemporarilyUnavailableDatabase");
    }

    if (code === "API_NETWORK_TIMEOUT") {
        return tPublic("apiTemporarilyUnavailableTimeout");
    }

    if (code === "API_NETWORK_ERROR" || status === 0 || reason === "health_probe_failed") {
        return tPublic("apiTemporarilyUnavailableNetwork");
    }

    return tPublic("apiTemporarilyUnavailable");
}

function updateContactStatus(message, isError) {
    const statusEl = document.getElementById("contact-status");
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = isError
        ? "mt-3 text-sm text-red-400"
        : "mt-3 text-sm text-green-400";
}

function normalizeUiErrorDetails(value, maxLength = 180) {
    const collapsed = String(value || "").replace(/\s+/g, " ").trim();
    if (!collapsed) return "";
    if (collapsed.length <= maxLength) return collapsed;
    return `${collapsed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function isDatabaseUnavailableError(error) {
    const code = String(error && error.code ? error.code : "").trim();
    const status = Number(error && error.status);
    return code === "DB_UNAVAILABLE" || status === 503;
}

function isDatabaseStorageLimitError(error) {
    const code = String(error && error.code ? error.code : "").trim();
    const status = Number(error && error.status);
    return code === "DB_STORAGE_LIMIT_REACHED" || status === 507;
}

function resolveContactSubmitErrorMessage(error) {
    if (isDatabaseStorageLimitError(error)) {
        return tPublic("contactSaveFailedStorageLimit");
    }

    if (isDatabaseUnavailableError(error)) {
        return tPublic("contactSaveFailedDatabaseUnavailable");
    }

    const status = Number(error && error.status);
    if (Number.isFinite(status) && status >= 500) {
        return tPublic("contactSaveFailedGeneric");
    }

    const details = normalizeUiErrorDetails(error && error.message ? error.message : "");
    return details
        ? `${tPublic("contactSaveFailedPrefix")} ${details}`
        : tPublic("contactSaveFailedGeneric");
}

function getContactConfig() {
    const source = window.CORE64_CONFIG && typeof window.CORE64_CONFIG === "object" ? window.CORE64_CONFIG : {};
    const settingsSource = contactRuntimeSettings && typeof contactRuntimeSettings === "object" ? contactRuntimeSettings : {};
    const fallbackCaptchaSource = source.contactCaptcha && typeof source.contactCaptcha === "object" ? source.contactCaptcha : {};
    const enabled = typeof settingsSource.contactCaptchaEnabled === "boolean"
        ? settingsSource.contactCaptchaEnabled
        : false;
    const provider = String(settingsSource.contactCaptchaActiveProvider || fallbackCaptchaSource.provider || "none").trim().toLowerCase();
    const hcaptchaSiteKey = String(settingsSource.contactCaptchaHcaptchaSiteKey || "").trim();
    const recaptchaSiteKey = String(settingsSource.contactCaptchaRecaptchaSiteKey || "").trim();

    const configuredMaxFileBytes = Number(source.contactMaxFileBytes) > 0
        ? Number(source.contactMaxFileBytes)
        : CONTACT_REQUEST_DEFAULT_MAX_FILE_BYTES;
    const maxFileBytes = Math.min(configuredMaxFileBytes, CONTACT_REQUEST_BACKEND_COMPAT_MAX_FILE_BYTES);

    return {
        maxFileBytes: maxFileBytes > 0 ? maxFileBytes : CONTACT_REQUEST_BACKEND_COMPAT_MAX_FILE_BYTES,
        captchaEnabled: enabled,
        captchaProvider: provider,
        captchaSiteKey: provider === "hcaptcha"
            ? hcaptchaSiteKey
            : (provider === "recaptcha_v2" ? recaptchaSiteKey : String(fallbackCaptchaSource.siteKey || "").trim()),
        captchaErrorMessage: String(settingsSource.contactCaptchaErrorMessage || tPublic("captchaLoadFailed")).trim(),
        captchaMissingTokenMessage: String(settingsSource.contactCaptchaMissingTokenMessage || tPublic("captchaMissingToken")).trim()
    };
}

function formatBytesSize(bytes) {
    const numeric = Number(bytes);
    if (!Number.isFinite(numeric) || numeric <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const power = Math.min(Math.floor(Math.log(numeric) / Math.log(1024)), units.length - 1);
    const value = numeric / (1024 ** power);
    return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function isDemoSubject(subject) {
    const normalized = String(subject || "").trim().toLowerCase();
    if (!normalized) return false;
    if (CONTACT_SUBJECT_DEMO_VALUES.has(normalized)) return true;
    return normalized === "демо запис" || normalized === "demo" || normalized === "demo recording" || normalized.includes("демо");
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
            }
            reject(new Error("Failed to encode file"));
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

const contactCaptchaState = {
    ready: false,
    enabled: false,
    provider: "none",
    token: "",
    widgetId: null
};

function resetContactCaptcha() {
    if (!contactCaptchaState.enabled) return;
    contactCaptchaState.token = "";
    const widgetId = contactCaptchaState.widgetId;
    if (widgetId === null || widgetId === undefined) return;

    try {
        if (contactCaptchaState.provider === "hcaptcha" && window.hcaptcha && typeof window.hcaptcha.reset === "function") {
            window.hcaptcha.reset(widgetId);
        }
        if (contactCaptchaState.provider === "recaptcha_v2" && window.grecaptcha && typeof window.grecaptcha.reset === "function") {
            window.grecaptcha.reset(widgetId);
        }
    } catch (_error) {
        // Ignore widget reset errors.
    }
}

function loadScriptOnce({ selector, src, marker }) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(selector);
        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Captcha script failed")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;
        script.dataset[marker] = "1";
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => reject(new Error("Captcha script failed")), { once: true });
        document.head.appendChild(script);
    });
}

function loadHcaptchaScript() {
    if (window.hcaptcha && typeof window.hcaptcha.render === "function") {
        return Promise.resolve();
    }
    return loadScriptOnce({
        selector: 'script[data-core64-hcaptcha="1"]',
        src: "https://js.hcaptcha.com/1/api.js?render=explicit",
        marker: "core64Hcaptcha"
    });
}

function loadRecaptchaScript() {
    if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
        return Promise.resolve();
    }
    return loadScriptOnce({
        selector: 'script[data-core64-recaptcha="1"]',
        src: "https://www.google.com/recaptcha/api.js?render=explicit",
        marker: "core64Recaptcha"
    });
}

function renderHcaptchaWidget(widgetEl, siteKey) {
    return window.hcaptcha.render(widgetEl, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => {
            contactCaptchaState.token = String(token || "").trim();
        },
        "expired-callback": () => {
            contactCaptchaState.token = "";
        },
        "error-callback": () => {
            contactCaptchaState.token = "";
        }
    });
}

function renderRecaptchaWidget(widgetEl, siteKey) {
    return window.grecaptcha.render(widgetEl, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => {
            contactCaptchaState.token = String(token || "").trim();
        },
        "expired-callback": () => {
            contactCaptchaState.token = "";
        },
        "error-callback": () => {
            contactCaptchaState.token = "";
        }
    });
}

async function initContactCaptcha() {
    const config = getContactConfig();
    const wrap = document.getElementById("contact-captcha-wrap");
    const widget = document.getElementById("contact-captcha-widget");
    const hint = document.getElementById("contact-captcha-hint");
    if (!wrap || !widget || !hint) return;

    contactCaptchaState.enabled = false;
    contactCaptchaState.provider = "none";
    contactCaptchaState.token = "";
    contactCaptchaState.ready = false;
    contactCaptchaState.widgetId = null;

    if (!config.captchaEnabled || config.captchaProvider === "none") {
        wrap.classList.add("hidden");
        hint.classList.add("hidden");
        return;
    }

    const provider = config.captchaProvider;
    wrap.classList.remove("hidden");

    if (provider !== "hcaptcha" && provider !== "recaptcha_v2") {
        hint.textContent = tPublic("captchaUnsupportedProvider");
        hint.classList.remove("hidden");
        return;
    }

    if (!config.captchaSiteKey) {
        hint.textContent = tPublic("captchaMissingSiteKey");
        hint.classList.remove("hidden");
        return;
    }

    try {
        if (provider === "hcaptcha") {
            await loadHcaptchaScript();
        }
        if (provider === "recaptcha_v2") {
            await loadRecaptchaScript();
        }
        widget.innerHTML = "";
        const widgetId = provider === "hcaptcha"
            ? renderHcaptchaWidget(widget, config.captchaSiteKey)
            : renderRecaptchaWidget(widget, config.captchaSiteKey);

        contactCaptchaState.enabled = true;
        contactCaptchaState.provider = provider;
        contactCaptchaState.ready = true;
        contactCaptchaState.widgetId = widgetId;
        hint.classList.add("hidden");
    } catch (_error) {
        hint.textContent = tPublic("captchaLoadFailed");
        hint.classList.remove("hidden");
    }
}

function getSocialBrandIconSvg(platform, sizeClass) {
    const iconClass = typeof sizeClass === "string" && sizeClass.trim() ? sizeClass.trim() : "w-4 h-4";

    if (platform === "instagram") {
        return `
            <svg viewBox="0 0 24 24" class="${iconClass}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.25" cy="6.75" r="1.25" fill="currentColor" stroke="none"></circle>
            </svg>
        `;
    }

    if (platform === "soundcloud") {
        return `
            <svg viewBox="0 0 24 24" class="${iconClass}" fill="currentColor" aria-hidden="true" focusable="false">
                <rect x="1.5" y="13" width="1.6" height="6" rx="0.8"></rect>
                <rect x="4.1" y="12" width="1.6" height="7" rx="0.8"></rect>
                <rect x="6.7" y="11" width="1.6" height="8" rx="0.8"></rect>
                <rect x="9.3" y="10" width="1.6" height="9" rx="0.8"></rect>
                <circle cx="13.9" cy="14.9" r="3.9"></circle>
                <circle cx="18" cy="15.3" r="3.1"></circle>
                <circle cx="10.6" cy="16.1" r="2.4"></circle>
                <rect x="8.4" y="14.9" width="12.6" height="4.3" rx="2.1"></rect>
            </svg>
        `;
    }

    return "";
}

function normalizeReleaseTypeValue(value) {
    const rawValue = String(value ?? "").trim().toLowerCase();
    if (rawValue === "single" || rawValue === "сингл") return "single";
    if (rawValue === "ep" || rawValue === "e.p." || rawValue === "ер") return "ep";
    if (rawValue === "album" || rawValue === "альбом") return "album";
    if (rawValue === "remix" || rawValue === "ремікс" || rawValue === "ремикс") return "remix";
    return "single";
}

function getReleaseTypeLabel(value) {
    const normalizedValue = normalizeReleaseTypeValue(value);
    if (normalizedValue === "ep") return tPublic("releaseTypeEpLabel");
    if (normalizedValue === "album") return tPublic("releaseTypeAlbumLabel");
    if (normalizedValue === "remix") return tPublic("releaseTypeRemixLabel");
    return tPublic("releaseTypeSingleLabel");
}

function formatDateToLocalIso(value, fallback = "") {
    const date = value instanceof Date ? value : new Date(value);
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp)) return fallback;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function normalizeReleaseDateValue(value) {
    const rawValue = String(value ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) return rawValue;
    const localIso = formatDateToLocalIso(rawValue, "");
    if (localIso) return localIso;
    const isoMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
    return isoMatch ? isoMatch[1] : "";
}

function formatReleaseDateLabel(release) {
    const isoDate = normalizeReleaseDateValue(release.releaseDate || release.release_date || "");
    if (isoDate) {
        const [year, month, day] = isoDate.split("-");
        return `${day}.${month}.${year}`;
    }

    const yearText = String(release.year ?? "").trim();
    return yearText || "-";
}

function escapeHtmlAttribute(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function normalizeReleaseOutboundUrl(value) {
    const rawValue = String(value ?? "").trim();
    if (!rawValue || rawValue === "#") return "";

    let parsed;
    try {
        parsed = new URL(rawValue, window.location.origin);
    } catch (_error) {
        return "";
    }

    if (!/^https?:$/i.test(parsed.protocol)) return "";
    return parsed.toString();
}

function extractYouTubeVideoId(value) {
    const normalizedUrl = normalizeReleaseOutboundUrl(value);
    if (!normalizedUrl) return "";

    let parsed;
    try {
        parsed = new URL(normalizedUrl);
    } catch (_error) {
        return "";
    }

    const host = String(parsed.hostname || "").toLowerCase();
    let candidate = "";

    if (host === "youtu.be") {
        candidate = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        candidate = parsed.searchParams.get("v") || "";
        if (!candidate) {
            const parts = parsed.pathname.split("/").filter(Boolean);
            if (parts[0] === "embed" || parts[0] === "shorts") {
                candidate = parts[1] || "";
            }
        }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : "";
}

function buildYouTubeEmbedUrl(value) {
    const videoId = extractYouTubeVideoId(value);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
}

function buildReleaseFallbackUrl(releaseTitle, releaseArtist) {
    const title = String(releaseTitle || "").trim();
    const artist = String(releaseArtist || "").trim();
    const query = [title, artist].filter(Boolean).join(" ").trim() || "CORE64 release";
    return `https://soundcloud.com/search?q=${encodeURIComponent(query)}`;
}

function normalizeReleaseId(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return Math.round(numeric);
}

function normalizeReleaseTrack(track, releaseId, index = 0) {
    const source = track && typeof track === "object" ? track : {};
    const normalizedTrackId = normalizeReleaseId(source.id);
    const title = String(source.title || "").trim();
    const audioDataUrl = String(source.audioDataUrl || source.audio_data_url || "").trim();
    const hasInlineAudio = !!audioDataUrl && RELEASE_TRACK_AUDIO_DATA_URL_PATTERN.test(audioDataUrl);
    const hasStreamFallback = normalizedTrackId !== null;
    if (!title || (!hasInlineAudio && !hasStreamFallback)) return null;

    const durationSecondsRaw = Number(source.durationSeconds ?? source.duration_seconds);
    const sortOrderRaw = Number(source.sortOrder ?? source.sort_order);
    return {
        id: normalizedTrackId,
        releaseId,
        title,
        audioDataUrl: hasInlineAudio ? audioDataUrl : "",
        audioPreserved: source.audioPreserved === true || (hasStreamFallback && !hasInlineAudio),
        durationSeconds: Number.isFinite(durationSecondsRaw) ? Math.max(0, Math.round(durationSecondsRaw)) : 0,
        sortOrder: Number.isFinite(sortOrderRaw) ? Math.max(0, Math.round(sortOrderRaw)) : (index + 1)
    };
}

function resolveReleaseTrackAudioSource(track, fallbackReleaseId = null) {
    const sourceTrack = track && typeof track === "object" ? track : {};
    const inlineAudioDataUrl = String(sourceTrack.audioDataUrl || sourceTrack.audio_data_url || "").trim();
    if (inlineAudioDataUrl && RELEASE_TRACK_AUDIO_DATA_URL_PATTERN.test(inlineAudioDataUrl)) {
        return inlineAudioDataUrl;
    }

    const releaseId = normalizeReleaseId(sourceTrack.releaseId ?? fallbackReleaseId);
    const trackId = normalizeReleaseId(sourceTrack.id);
    if (!releaseId || !trackId) return "";

    const getAudioStreamUrlMethod = getAdapterMethod("getReleaseTrackAudioStreamUrl");
    if (!getAudioStreamUrlMethod) return "";
    return String(getAudioStreamUrlMethod.call(adapter, releaseId, trackId) || "").trim();
}

function findPlayableCompactTrackIndex(startIndex = 0) {
        const tracks = Array.isArray(compactReleasePlayerState.tracks) ? compactReleasePlayerState.tracks : [];
        if (!tracks.length) return -1;

        const normalizedStartIndex = Number.isFinite(Number(startIndex)) ? Math.max(0, Math.round(Number(startIndex))) : 0;
        for (let index = normalizedStartIndex; index < tracks.length; index += 1) {
                const source = resolveReleaseTrackAudioSource(tracks[index], compactReleasePlayerState.releaseId);
                if (source) return index;
        }

        return -1;
}

function formatDurationLabel(seconds) {
    const numeric = Number(seconds);
    if (!Number.isFinite(numeric) || numeric <= 0) return "--:--";
    const safe = Math.max(0, Math.round(numeric));
    const minutes = Math.floor(safe / 60);
    const restSeconds = safe % 60;
    return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

function formatPlaybackClock(seconds) {
    const numeric = Number(seconds);
    if (!Number.isFinite(numeric) || numeric < 0) return "0:00";

    const safe = Math.max(0, Math.floor(numeric));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const restSeconds = safe % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

function getCompactReleasePlayerElements() {
    return {
        root: document.getElementById("release-compact-player"),
        title: document.getElementById("release-compact-player-title"),
        artist: document.getElementById("release-compact-player-artist"),
        cover: document.getElementById("release-compact-player-cover"),
        audio: document.getElementById("release-compact-player-audio"),
        playToggle: document.getElementById("release-compact-player-play-toggle"),
        seek: document.getElementById("release-compact-player-seek"),
        timeLabel: document.getElementById("release-compact-player-time"),
        volume: document.getElementById("release-compact-player-volume"),
        visualizer: document.getElementById("release-compact-player-visualizer"),
        list: document.getElementById("release-compact-player-track-list"),
        status: document.getElementById("release-compact-player-status")
    };
}

function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.max(min, Math.min(max, numeric));
}

function setCompactReleasePlayerPlayToggleUi(isPlaying) {
    const { playToggle } = getCompactReleasePlayerElements();
    if (!playToggle || !playToggle.isConnected) return;

    const playing = isPlaying === true;
    playToggle.textContent = playing ? "||" : ">";

    const i18nKey = playing ? "releasePlayerControlPause" : "releasePlayerControlPlay";
    const label = tPublic(i18nKey);
    playToggle.setAttribute("aria-label", label);
    playToggle.setAttribute("title", label);
    playToggle.classList.toggle("text-cyan-100", playing);
    playToggle.classList.toggle("text-cyan-300", !playing);
}

function syncCompactReleasePlayerPlaybackUi() {
    const { audio, seek, timeLabel, volume } = getCompactReleasePlayerElements();
    if (!audio) return;

    const duration = Number(audio.duration);
    const hasDuration = Number.isFinite(duration) && duration > 0;
    const currentTime = hasDuration
        ? clampNumber(audio.currentTime, 0, duration)
        : Math.max(0, Number.isFinite(Number(audio.currentTime)) ? Number(audio.currentTime) : 0);

    if (seek && seek.isConnected && document.activeElement !== seek) {
        const nextValue = hasDuration ? Math.round((currentTime / duration) * 1000) : 0;
        seek.value = String(clampNumber(nextValue, 0, 1000));
    }

    if (timeLabel && timeLabel.isConnected) {
        timeLabel.textContent = `${formatPlaybackClock(currentTime)} / ${hasDuration ? formatPlaybackClock(duration) : "--:--"}`;
    }

    if (volume && volume.isConnected && document.activeElement !== volume) {
        const currentVolume = audio.muted ? 0 : clampNumber(audio.volume, 0, 1);
        volume.value = String(Math.round(currentVolume * 100));
    }

    setCompactReleasePlayerPlayToggleUi(!audio.paused && !audio.ended);
}

function ensureCompactReleasePlayerAudioGraph(audio) {
    if (!audio) return null;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioContextCtor !== "function") return null;

    if (!compactReleasePlayerAudioContext) {
        compactReleasePlayerAudioContext = new AudioContextCtor();
    }

    if (!compactReleasePlayerAnalyser) {
        compactReleasePlayerAnalyser = compactReleasePlayerAudioContext.createAnalyser();
        compactReleasePlayerAnalyser.fftSize = 128;
        compactReleasePlayerAnalyser.smoothingTimeConstant = 0.82;
    }

    if (!compactReleasePlayerAudioSourceNode) {
        try {
            compactReleasePlayerAudioSourceNode = compactReleasePlayerAudioContext.createMediaElementSource(audio);
            compactReleasePlayerAudioSourceNode.connect(compactReleasePlayerAnalyser);
            compactReleasePlayerAnalyser.connect(compactReleasePlayerAudioContext.destination);
        } catch (_error) {
            return null;
        }
    }

    if (!compactReleasePlayerFrequencyData || compactReleasePlayerFrequencyData.length !== compactReleasePlayerAnalyser.frequencyBinCount) {
        compactReleasePlayerFrequencyData = new Uint8Array(compactReleasePlayerAnalyser.frequencyBinCount);
    }

    return compactReleasePlayerAnalyser;
}

function resumeCompactReleasePlayerAudioContext() {
    if (!compactReleasePlayerAudioContext || compactReleasePlayerAudioContext.state !== "suspended") return;
    compactReleasePlayerAudioContext.resume().catch(() => {
        // Browser may block resume until explicit user gesture.
    });
}

function drawCompactReleasePlayerVisualizer() {
    const { root, visualizer, audio } = getCompactReleasePlayerElements();
    if (!root || root.classList.contains("hidden") || !visualizer || !visualizer.isConnected) {
        return;
    }

    const context2d = visualizer.getContext("2d");
    if (!context2d) return;

    const rect = visualizer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const targetWidth = Math.round(rect.width * devicePixelRatio);
    const targetHeight = Math.round(rect.height * devicePixelRatio);

    if (visualizer.width !== targetWidth || visualizer.height !== targetHeight) {
        visualizer.width = targetWidth;
        visualizer.height = targetHeight;
    }

    context2d.setTransform(1, 0, 0, 1, 0, 0);
    context2d.clearRect(0, 0, targetWidth, targetHeight);

    const gradient = context2d.createLinearGradient(0, 0, 0, targetHeight);
    gradient.addColorStop(0, "rgba(8, 36, 44, 0.82)");
    gradient.addColorStop(1, "rgba(1, 8, 14, 0.96)");
    context2d.fillStyle = gradient;
    context2d.fillRect(0, 0, targetWidth, targetHeight);

    const barsCount = 40;
    const barGap = Math.max(2, Math.round(targetWidth / 340));
    const barWidth = Math.max(2, Math.floor((targetWidth - (barsCount - 1) * barGap) / barsCount));
    const totalBarsWidth = barsCount * barWidth + (barsCount - 1) * barGap;
    const startX = Math.max(0, Math.round((targetWidth - totalBarsWidth) / 2));

    let isLiveAudio = false;
    if (audio && compactReleasePlayerAnalyser && compactReleasePlayerFrequencyData && !audio.paused) {
        compactReleasePlayerAnalyser.getByteFrequencyData(compactReleasePlayerFrequencyData);
        isLiveAudio = true;
    }

    const now = Date.now();
    for (let index = 0; index < barsCount; index += 1) {
        const x = startX + index * (barWidth + barGap);
        let normalized = 0;

        if (isLiveAudio) {
            const sampleIndex = Math.floor((index / Math.max(1, barsCount - 1)) * (compactReleasePlayerFrequencyData.length - 1));
            normalized = clampNumber(compactReleasePlayerFrequencyData[sampleIndex] / 255, 0.05, 1);
        } else {
            const wave = Math.sin((now * 0.004) + index * 0.45);
            normalized = 0.18 + ((wave + 1) * 0.22);
        }

        const amplitude = Math.max(0.08, normalized);
        const barHeight = Math.max(4, Math.round((targetHeight - 8) * amplitude));
        const y = targetHeight - barHeight - 4;

        const barGradient = context2d.createLinearGradient(0, y, 0, y + barHeight);
        barGradient.addColorStop(0, "rgba(255, 0, 160, 0.92)");
        barGradient.addColorStop(0.45, "rgba(24, 215, 255, 0.95)");
        barGradient.addColorStop(1, "rgba(2, 95, 120, 0.95)");
        context2d.fillStyle = barGradient;
        context2d.fillRect(x, y, barWidth, barHeight);
    }
}

function stopCompactReleasePlayerVisualizer() {
    if (compactReleasePlayerVisualizerFrame) {
        cancelAnimationFrame(compactReleasePlayerVisualizerFrame);
        compactReleasePlayerVisualizerFrame = 0;
    }
}

function startCompactReleasePlayerVisualizer() {
    stopCompactReleasePlayerVisualizer();

    const renderFrame = () => {
        const { root } = getCompactReleasePlayerElements();
        if (!root || root.classList.contains("hidden")) {
            stopCompactReleasePlayerVisualizer();
            return;
        }

        drawCompactReleasePlayerVisualizer();
        compactReleasePlayerVisualizerFrame = requestAnimationFrame(renderFrame);
    };

    drawCompactReleasePlayerVisualizer();
    compactReleasePlayerVisualizerFrame = requestAnimationFrame(renderFrame);
}

function resetCompactReleasePlayerAudio() {
    const { audio } = getCompactReleasePlayerElements();
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    syncCompactReleasePlayerPlaybackUi();
}

function syncCompactReleasePlayerOffset() {
    const { root } = getCompactReleasePlayerElements();
    let offset = 0;
    let bodyPadding = 0;

    if (root && !root.classList.contains("hidden") && root.classList.contains("release-player-floating")) {
        const playerHeight = Math.max(0, Math.ceil(root.getBoundingClientRect().height));
        offset = playerHeight + 16;
        bodyPadding = Math.min(168, Math.max(40, Math.round(playerHeight * 0.42)));
    }

    document.documentElement.style.setProperty("--release-player-offset", `${offset}px`);
    document.documentElement.style.setProperty("--release-player-body-padding", `${bodyPadding}px`);
}

function scheduleCompactReleasePlayerOffsetSync() {
    if (compactReleasePlayerOffsetSyncFrame) {
        cancelAnimationFrame(compactReleasePlayerOffsetSyncFrame);
    }

    compactReleasePlayerOffsetSyncFrame = requestAnimationFrame(() => {
        compactReleasePlayerOffsetSyncFrame = 0;
        syncCompactReleasePlayerOffset();
    });
}

function bindCompactReleasePlayerOffsetSync() {
    if (compactReleasePlayerOffsetSyncBound) return;

    const { root } = getCompactReleasePlayerElements();

    window.addEventListener("resize", () => {
        scheduleCompactReleasePlayerOffsetSync();
    });

    if (root && typeof ResizeObserver === "function") {
        compactReleasePlayerOffsetResizeObserver = new ResizeObserver(() => {
            scheduleCompactReleasePlayerOffsetSync();
        });
        compactReleasePlayerOffsetResizeObserver.observe(root);
    }

    compactReleasePlayerOffsetSyncBound = true;
}

function setFloatingCompactReleasePlayerEnabled(enabled) {
    const { root } = getCompactReleasePlayerElements();
    if (!root) return;

    const isEnabled = enabled === true;
    root.classList.toggle("release-player-floating", isEnabled);
    document.body.classList.toggle("has-floating-release-player", isEnabled);
    scheduleCompactReleasePlayerOffsetSync();
}

function hideCompactReleasePlayer() {
    const { root, status, list } = getCompactReleasePlayerElements();
    if (!root) return;
    root.classList.add("hidden");
    compactReleasePlayerState = {
        releaseId: null,
        tracks: [],
        activeTrackIndex: -1,
        loading: false
    };
    resetCompactReleasePlayerAudio();
    stopCompactReleasePlayerVisualizer();
    if (status) status.textContent = "";
    if (list) list.innerHTML = "";
    setFloatingCompactReleasePlayerEnabled(false);
}

function renderCompactReleaseTrackList() {
    const { list } = getCompactReleasePlayerElements();
    if (!list) return;

    const tracks = Array.isArray(compactReleasePlayerState.tracks) ? compactReleasePlayerState.tracks : [];
    list.innerHTML = tracks.map((track, index) => {
        const isActive = index === compactReleasePlayerState.activeTrackIndex;
        const safeTitle = escapeHtmlAttribute(track.title || `Track ${index + 1}`);
        return `
            <button
                type="button"
                class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded border ${isActive ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-cyan-500/20 bg-black/20 text-gray-200 hover:border-cyan-500/50"} transition-colors"
                data-release-track-index="${index}"
            >
                <span class="truncate text-left">${safeTitle}</span>
                <span class="text-xs text-gray-400">${formatDurationLabel(track.durationSeconds)}</span>
            </button>
        `;
    }).join("");

    scheduleCompactReleasePlayerOffsetSync();
}

async function playCompactReleaseTrack(trackIndex, shouldAutoplay = true) {
    const { audio, status } = getCompactReleasePlayerElements();
    if (!audio) return;
    const tracks = Array.isArray(compactReleasePlayerState.tracks) ? compactReleasePlayerState.tracks : [];
    const index = Number(trackIndex);
    if (!Number.isFinite(index) || index < 0 || index >= tracks.length) return;

    const track = tracks[index];
    const audioSource = resolveReleaseTrackAudioSource(track, compactReleasePlayerState.releaseId);
    compactReleasePlayerState.activeTrackIndex = index;
    renderCompactReleaseTrackList();

    if (!audioSource) {
        resetCompactReleasePlayerAudio();
        if (status) status.textContent = tPublic("releasePlayerTrackUnavailable");
        return;
    }

    ensureCompactReleasePlayerAudioGraph(audio);
    audio.src = audioSource;
    audio.load();
    syncCompactReleasePlayerPlaybackUi();
    startCompactReleasePlayerVisualizer();

    if (!shouldAutoplay) return;

    try {
        resumeCompactReleasePlayerAudioContext();
        await audio.play();
        if (status) status.textContent = "";
    } catch (_error) {
        if (status) status.textContent = tPublic("releasePlayerAutoplayBlocked");
    }
}

async function openCompactReleasePlayer(releaseId) {
    const normalizedReleaseId = normalizeReleaseId(releaseId);
    if (!normalizedReleaseId) return;

    const release = releaseIndexById.get(normalizedReleaseId);
    if (!release) return;

    const { root, title, artist, cover, list, status } = getCompactReleasePlayerElements();
    if (!root || !title || !artist || !cover || !list || !status) return;

    root.classList.remove("hidden");
    setFloatingCompactReleasePlayerEnabled(true);
    bindCompactReleasePlayerOffsetSync();
    startCompactReleasePlayerVisualizer();
    title.textContent = String(release.title || "Release");
    artist.textContent = String(release.artist || "");
    cover.src = String(release.image || "").trim() || RELEASE_IMAGE_FALLBACK;

    compactReleasePlayerState.loading = true;
    compactReleasePlayerState.releaseId = normalizedReleaseId;
    compactReleasePlayerState.activeTrackIndex = -1;
    compactReleasePlayerState.tracks = [];
    list.innerHTML = "";
    status.textContent = tPublic("releasePlayerLoading");

    const getReleaseTracksMethod = getAdapterMethod("getReleaseTracks");
    if (!getReleaseTracksMethod) {
        compactReleasePlayerState.loading = false;
        status.textContent = tPublic("releasePlayerNoTracks");
        return;
    }

    try {
        const tracksResponse = await getReleaseTracksMethod.call(adapter, normalizedReleaseId);
        const normalizedTracks = (Array.isArray(tracksResponse) ? tracksResponse : [])
            .map((track, index) => normalizeReleaseTrack(track, normalizedReleaseId, index))
            .filter(Boolean)
            .sort((left, right) => {
                if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
                return Number(left.id || 0) - Number(right.id || 0);
            });

        compactReleasePlayerState.loading = false;
        compactReleasePlayerState.tracks = normalizedTracks;

        if (!normalizedTracks.length) {
            status.textContent = tPublic("releasePlayerNoTracks");
            renderCompactReleaseTrackList();
            resetCompactReleasePlayerAudio();
            return;
        }

        status.textContent = "";
        renderCompactReleaseTrackList();
        const firstPlayableIndex = findPlayableCompactTrackIndex(0);
        if (firstPlayableIndex < 0) {
            status.textContent = tPublic("releasePlayerTrackUnavailable");
            resetCompactReleasePlayerAudio();
            scheduleCompactReleasePlayerOffsetSync();
            return;
        }

        await playCompactReleaseTrack(firstPlayableIndex, true);
    } catch (error) {
        console.error("Failed to load release tracks", error);
        compactReleasePlayerState.loading = false;
        compactReleasePlayerState.tracks = [];
        compactReleasePlayerState.activeTrackIndex = -1;
        status.textContent = tPublic("releasePlayerNoTracks");
        resetCompactReleasePlayerAudio();
    }
}

function bindCompactReleasePlayerControls() {
    if (compactReleasePlayerControlsBound) return;

    const { root, list, audio, playToggle, seek, volume, status } = getCompactReleasePlayerElements();
    const closeBtn = document.getElementById("release-compact-player-close");
    if (!root || !list || !audio || !closeBtn || !playToggle || !seek || !volume) return;

    audio.controls = false;
    audio.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback nofullscreen");
    audio.setAttribute("disablePictureInPicture", "true");
    audio.setAttribute("disableremoteplayback", "true");
    audio.addEventListener("contextmenu", (event) => event.preventDefault());

    const protectedArea = root.querySelector(".release-player-content");
    if (protectedArea) {
        protectedArea.addEventListener("contextmenu", (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const restrictedNode = target
                ? target.closest("#release-compact-player-visualizer, .compact-player-controls")
                : null;
            if (restrictedNode) {
                event.preventDefault();
            }
        });
    }

    audio.volume = clampNumber(Number(volume.value) / 100, 0, 1);
    setCompactReleasePlayerPlayToggleUi(false);
    syncCompactReleasePlayerPlaybackUi();

    closeBtn.addEventListener("click", () => hideCompactReleasePlayer());

    playToggle.addEventListener("click", async () => {
        if (!audio.getAttribute("src")) {
            if (status) status.textContent = tPublic("releasePlayerTrackUnavailable");
            return;
        }

        try {
            if (audio.paused) {
                resumeCompactReleasePlayerAudioContext();
                await audio.play();
                if (status) status.textContent = "";
            } else {
                audio.pause();
            }
        } catch (_error) {
            if (status) status.textContent = tPublic("releasePlayerAutoplayBlocked");
        }
    });

    seek.addEventListener("input", () => {
        const duration = Number(audio.duration);
        if (!Number.isFinite(duration) || duration <= 0) return;
        const ratio = clampNumber(Number(seek.value) / 1000, 0, 1);
        audio.currentTime = ratio * duration;
        syncCompactReleasePlayerPlaybackUi();
    });

    volume.addEventListener("input", () => {
        const nextVolume = clampNumber(Number(volume.value) / 100, 0, 1);
        audio.muted = nextVolume <= 0;
        audio.volume = nextVolume;
        syncCompactReleasePlayerPlaybackUi();
    });

    list.addEventListener("click", async (event) => {
        const target = event.target instanceof Element
            ? event.target.closest("[data-release-track-index]")
            : null;
        if (!target) return;

        const trackIndex = Number(target.getAttribute("data-release-track-index"));
        if (!Number.isFinite(trackIndex)) return;
        await playCompactReleaseTrack(trackIndex, true);
    });

    ["loadedmetadata", "durationchange", "timeupdate", "seeking", "seeked", "emptied", "volumechange"].forEach((eventName) => {
        audio.addEventListener(eventName, () => {
            syncCompactReleasePlayerPlaybackUi();
            if (eventName === "loadedmetadata" || eventName === "durationchange") {
                scheduleCompactReleasePlayerOffsetSync();
            }
        });
    });

    audio.addEventListener("play", () => {
        resumeCompactReleasePlayerAudioContext();
        setCompactReleasePlayerPlayToggleUi(true);
        startCompactReleasePlayerVisualizer();
    });

    audio.addEventListener("pause", () => {
        setCompactReleasePlayerPlayToggleUi(false);
    });

    audio.addEventListener("ended", async () => {
        setCompactReleasePlayerPlayToggleUi(false);
        const tracks = Array.isArray(compactReleasePlayerState.tracks) ? compactReleasePlayerState.tracks : [];
        if (!tracks.length) return;
        const nextIndex = compactReleasePlayerState.activeTrackIndex + 1;
        if (nextIndex >= tracks.length) return;

        const nextPlayableIndex = findPlayableCompactTrackIndex(nextIndex);
        if (nextPlayableIndex < 0) return;
        await playCompactReleaseTrack(nextPlayableIndex, true);
    });

    compactReleasePlayerControlsBound = true;
}

function attachImageFallback(container, selector, fallbackSrc) {
    if (!container || !selector || !fallbackSrc) return;
    const imageNodes = container.querySelectorAll(selector);
    imageNodes.forEach((imgEl) => {
        imgEl.addEventListener("error", () => {
            if (imgEl.getAttribute("src") === fallbackSrc) return;
            imgEl.src = fallbackSrc;
        }, { once: true });
    });
}

function bindReleaseInteractions() {
    if (releaseInteractionsBound) return;
    const grid = document.getElementById("releases-grid");
    if (!grid) return;

    grid.addEventListener("click", async (event) => {
        const playButton = event.target instanceof Element
            ? event.target.closest('[data-release-action="play"]')
            : null;

        if (playButton) {
            const releaseId = playButton.getAttribute("data-release-id") || "";
            await openCompactReleasePlayer(releaseId);
            return;
        }

        const card = event.target instanceof Element ? event.target.closest(".release-card") : null;
        if (!card) return;
        const releaseId = card.getAttribute("data-release-id") || "";
        await openCompactReleasePlayer(releaseId);
    });

    grid.addEventListener("keydown", async (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.defaultPrevented) return;
        if (event.isComposing) return;

        const key = String(event.key || "");
        const isActivationKey = key === "Enter" || key === " ";
        if (!isActivationKey) return;

        const targetEl = event.target instanceof Element ? event.target : null;
        if (!targetEl) return;
        if (targetEl.closest('[data-release-action="play"]')) return;

        const card = targetEl.closest(".release-card");
        if (!card) return;

        event.preventDefault();
        const releaseId = card.getAttribute("data-release-id") || "";
        await openCompactReleasePlayer(releaseId);
    });

    releaseInteractionsBound = true;
}

function normalizePublicSectionSettings(sectionSettings) {
    const source = Array.isArray(sectionSettings) ? sectionSettings : [];
    const byKey = source.reduce((acc, entry) => {
        const sectionKey = String(entry && entry.sectionKey ? entry.sectionKey : "").trim();
        if (!sectionKey) return acc;
        acc[sectionKey] = entry;
        return acc;
    }, {});

    return PUBLIC_SECTION_DEFAULTS
        .map((defaults) => {
            const candidate = byKey[defaults.sectionKey] || {};
            const sortOrder = Number.isFinite(Number(candidate.sortOrder))
                ? Number(candidate.sortOrder)
                : defaults.sortOrder;
            const title = String(candidate.title || "").trim() || tPublic(defaults.i18nKey);
            const menuTitle = String(candidate.menuTitle || "").trim() || tPublic(defaults.navI18nKey);
            const isEnabled = candidate.isEnabled !== false;
            return {
                sectionKey: defaults.sectionKey,
                sortOrder,
                isEnabled,
                title,
                menuTitle
            };
        })
        .sort((left, right) => {
            if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
            return left.sectionKey.localeCompare(right.sectionKey);
        });
}

function applyPublicSectionSettings(sectionSettings) {
    const normalized = normalizePublicSectionSettings(sectionSettings);
    const bySectionKey = normalized.reduce((acc, section) => {
        acc[section.sectionKey] = section;
        return acc;
    }, {});

    normalized.forEach((section) => {
        const titleEl = document.getElementById(`public-section-title-${section.sectionKey}`);
        if (!titleEl) return;
        titleEl.textContent = section.title;
    });

    ["public-desktop-nav-links", "public-mobile-nav-links"].forEach((containerId) => {
        const containerEl = document.getElementById(containerId);
        if (!containerEl) return;

        const aboutLinkEl = containerEl.querySelector('a[href="#about"]');
        const aboutParentEl = aboutLinkEl && aboutLinkEl.parentElement === containerEl ? aboutLinkEl : null;
        const linkAnchorEl = containerEl.querySelector("div");

        normalized
            .filter((section) => section.sectionKey !== "contact")
            .forEach((section) => {
            const linkEl = containerEl.querySelector(`a[href="#${section.sectionKey}"]`);
            if (!linkEl) return;
            linkEl.textContent = section.menuTitle;
            if (aboutParentEl) {
                containerEl.insertBefore(linkEl, aboutParentEl);
            } else {
                if (linkAnchorEl && linkAnchorEl.parentElement === containerEl) {
                    containerEl.insertBefore(linkEl, linkAnchorEl);
                } else {
                    containerEl.appendChild(linkEl);
                }
            }
            });

        const contactSection = normalized.find((section) => section.sectionKey === "contact");
        if (!contactSection) return;

        const contactLinkEl = containerEl.querySelector('a[href="#contact"]');
        if (!contactLinkEl) return;

        contactLinkEl.textContent = contactSection.menuTitle;
        if (aboutParentEl) {
            containerEl.insertBefore(contactLinkEl, aboutParentEl.nextSibling);
            return;
        }

        if (linkAnchorEl && linkAnchorEl.parentElement === containerEl) {
            containerEl.insertBefore(contactLinkEl, linkAnchorEl);
            return;
        }

        containerEl.appendChild(contactLinkEl);
    });

    const releasesSectionEl = document.getElementById("releases");
    const sectionsParentEl = releasesSectionEl ? releasesSectionEl.parentElement : null;
    if (!sectionsParentEl) return;

    const aboutSectionEl = document.getElementById("about");
    if (aboutSectionEl && aboutSectionEl.parentElement === sectionsParentEl) {
        const nonContactSections = normalized
            .filter((section) => section.sectionKey !== "contact")
            .map((section) => document.getElementById(section.sectionKey))
            .filter((sectionEl) => sectionEl && sectionEl.parentElement === sectionsParentEl);

        for (let index = 0; index < nonContactSections.length; index += 1) {
            const sectionEl = nonContactSections[index];
            sectionsParentEl.insertBefore(sectionEl, aboutSectionEl);
        }

        const contactSectionEl = document.getElementById("contact");
        if (contactSectionEl && contactSectionEl.parentElement === sectionsParentEl) {
            sectionsParentEl.insertBefore(contactSectionEl, aboutSectionEl.nextSibling);
        }
    }

    normalized.forEach((section) => {
        const sectionEl = document.getElementById(section.sectionKey);
        if (!sectionEl || sectionEl.parentElement !== sectionsParentEl) return;
        sectionEl.hidden = section.isEnabled === false;
        sectionEl.setAttribute("aria-hidden", section.isEnabled === false ? "true" : "false");
    });

    ["releases", "artists", "events", "videos", "sponsors", "contact"].forEach((sectionKey) => {
        const section = bySectionKey[sectionKey];
        const isHidden = !section || section.isEnabled === false;
        document.querySelectorAll(`a[href="#${sectionKey}"]`).forEach((linkEl) => {
            linkEl.hidden = isHidden;
            linkEl.setAttribute("aria-hidden", isHidden ? "true" : "false");
            if (isHidden) {
                linkEl.setAttribute("tabindex", "-1");
            } else {
                linkEl.removeAttribute("tabindex");
            }
        });
    });
}

function renderReleases(data) {
    const grid = document.getElementById("releases-grid");
    if (!grid) return;

    releaseIndexById.clear();

    grid.innerHTML = (data.releases || []).map((release) => {
        const releaseTypeLabel = getReleaseTypeLabel(release.releaseType || release.release_type);
        const releaseDateLabel = formatReleaseDateLabel(release);
        const releaseTitle = String(release.title || "Реліз");
        const releaseImage = String(release.image || "").trim() || RELEASE_IMAGE_FALLBACK;
        const releaseArtist = String(release.artist || "");
        const releaseId = normalizeReleaseId(release.id);
        if (releaseId) {
            releaseIndexById.set(releaseId, release);
        }

        const releaseIdAttr = escapeHtmlAttribute(releaseId || "");
        const safeReleaseTitle = escapeHtmlAttribute(releaseTitle);
        const safeImage = escapeHtmlAttribute(releaseImage);
        const safeReleaseArtist = escapeHtmlAttribute(releaseArtist);
        const safeCardAria = escapeHtmlAttribute(`${tPublic("releasePlayAria")}: ${releaseTitle}`);

        return `
        <article class="release-card border border-cyan-500/20 rounded-lg overflow-hidden group cursor-pointer" data-release-id="${releaseIdAttr}" data-release-title="${safeReleaseTitle}" data-release-artist="${safeReleaseArtist}" aria-label="${safeCardAria}" role="button" tabindex="0">
            <div class="relative aspect-square overflow-hidden bg-gray-900">
                <img src="${safeImage}" alt="${safeReleaseTitle}" class="w-full h-full object-cover vinyl-spin" data-release-image="1" loading="lazy">
                <div class="absolute inset-0 bg-black/35 md:bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button class="p-3 bg-cyan-400 rounded-full text-black hover:scale-110 transition-transform" aria-label="${escapeHtmlAttribute(tPublic("releasePlayAria"))}" data-release-action="play" data-release-id="${releaseIdAttr}" data-release-title="${safeReleaseTitle}" data-release-artist="${safeReleaseArtist}">
                        <i data-lucide="play" class="w-6 h-6 fill-current"></i>
                    </button>
                </div>
                <div class="absolute top-2 right-2 genre-tag px-3 py-1 text-xs rounded uppercase tracking-wider">
                    ${releaseTypeLabel}
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">${releaseTitle}</h3>
                <p class="text-gray-400 text-sm mb-2">${release.artist}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
                    <span>${releaseDateLabel}</span>
                    <span class="text-cyan-400">${release.genre}</span>
                </div>
            </div>
        </article>
    `;
    }).join("");

    attachImageFallback(grid, 'img[data-release-image="1"]', RELEASE_IMAGE_FALLBACK);

    const statEl = document.getElementById("stat-releases");
    if (statEl) statEl.textContent = String((data.releases || []).length);
}

function renderArtists(data) {
    const grid = document.getElementById("artists-grid");
    if (!grid) return;

    grid.innerHTML = (data.artists || []).map((artist) => {
        const safeSoundcloudUrl = normalizeReleaseOutboundUrl(artist.soundcloud || "");
        const safeInstagramUrl = normalizeReleaseOutboundUrl(artist.instagram || "");

        const soundcloudHref = safeSoundcloudUrl ? escapeHtmlAttribute(safeSoundcloudUrl) : "#";
        const instagramHref = safeInstagramUrl ? escapeHtmlAttribute(safeInstagramUrl) : "#";
        const soundcloudTargetAttrs = safeSoundcloudUrl ? 'target="_blank" rel="noopener noreferrer"' : "";
        const instagramTargetAttrs = safeInstagramUrl ? 'target="_blank" rel="noopener noreferrer"' : "";

        return `
        <div class="card rounded-lg overflow-hidden group">
            <div class="relative aspect-[4/3] overflow-hidden">
                <img src="${artist.image}" alt="${artist.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-artist-image="1" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-6">
                    <span class="inline-block px-3 py-1 bg-pink-500/20 border border-pink-500/50 text-pink-400 text-xs rounded uppercase tracking-wider mb-2">
                        ${artist.genre}
                    </span>
                    <h3 class="text-2xl font-bold text-white">${artist.name}</h3>
                </div>
            </div>
            <div class="p-6">
                <p class="text-gray-400 text-sm mb-4 line-clamp-2">${artist.bio || ""}</p>
                <div class="flex gap-3">
                    <a href="${soundcloudHref}" class="p-2 bg-gray-800 rounded hover:bg-cyan-400 hover:text-black transition-colors" aria-label="SoundCloud" title="SoundCloud" ${soundcloudTargetAttrs}>
                        ${getSocialBrandIconSvg("soundcloud", "w-4 h-4")}
                    </a>
                    <a href="${instagramHref}" class="p-2 bg-gray-800 rounded hover:bg-pink-400 hover:text-black transition-colors" aria-label="Instagram" title="Instagram" ${instagramTargetAttrs}>
                        ${getSocialBrandIconSvg("instagram", "w-4 h-4")}
                    </a>
                </div>
            </div>
        </div>
    `;
    }).join("");

    attachImageFallback(grid, 'img[data-artist-image="1"]', RELEASE_IMAGE_FALLBACK);

    const statEl = document.getElementById("stat-artists");
    if (statEl) statEl.textContent = String((data.artists || []).length);
}

function renderEvents(data) {
    const list = document.getElementById("events-list");
    if (!list) return;

    const sortedEvents = [...(data.events || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    list.innerHTML = sortedEvents.map((event) => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = eventDate.toLocaleDateString(getActiveLocaleTag(), { month: "short" });
        const resolvedTicketLink = event.ticketLink || event.ticket_link || "";
        const safeTicketLink = normalizeReleaseOutboundUrl(resolvedTicketLink);
        const hasTicketLink = !!safeTicketLink;
        const safeTicketLinkAttr = hasTicketLink ? escapeHtmlAttribute(safeTicketLink) : "";

        return `
            <div class="flex flex-col md:flex-row gap-6 p-6 border border-green-500/20 rounded-lg hover:border-green-500/50 transition-colors bg-black/30">
                <div class="flex-shrink-0 w-full md:w-48 h-32 overflow-hidden rounded border border-green-500/30">
                    <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover" data-event-image="1" loading="lazy">
                </div>
                <div class="flex-1">
                    <div class="flex flex-col md:flex-row md:items-center justify-between mb-2">
                        <h3 class="text-2xl font-bold text-white">${event.title}</h3>
                        <div class="flex items-center gap-2 text-green-400 mt-2 md:mt-0">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            <span class="uppercase tracking-wider text-sm">${day} ${month} • ${event.time}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-gray-400 mb-3">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                        <span>${event.venue}</span>
                    </div>
                    <p class="text-gray-300">${event.description}</p>
                </div>
                <div class="flex-shrink-0 flex items-center">
                    ${hasTicketLink
                        ? `<a href="${safeTicketLinkAttr}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">${escapeHtmlAttribute(tPublic("ticketsLabel"))}</a>`
                        : `<button onclick="showTicketInfo()" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">${escapeHtmlAttribute(tPublic("ticketsLabel"))}</button>`}
                </div>
            </div>
        `;
    }).join("");

    attachImageFallback(list, 'img[data-event-image="1"]', RELEASE_IMAGE_FALLBACK);
}

function renderVideos(data) {
    const grid = document.getElementById("videos-grid");
    if (!grid) return;

    const videos = [...(data.videos || [])].sort((a, b) => {
        const left = Number(a.sortOrder ?? a.sort_order ?? 0);
        const right = Number(b.sortOrder ?? b.sort_order ?? 0);
        return left - right;
    });

    if (!videos.length) {
        grid.innerHTML = `
            <div class="col-span-full min-h-[180px] border border-cyan-500/25 rounded-xl bg-black/30 grid place-items-center text-center text-gray-400 p-6">
                ${escapeHtmlAttribute(tPublic("videosUpdating"))}
            </div>
        `;
        return;
    }

    grid.innerHTML = videos.map((video) => {
        const title = String(video.title || "Video").trim() || "Video";
        const description = String(video.description || "").trim();
        const youtubeUrl = normalizeReleaseOutboundUrl(video.youtubeUrl || video.youtube_url || "");
        const embedUrl = buildYouTubeEmbedUrl(youtubeUrl);

        const safeTitle = escapeHtmlAttribute(title);
        const safeDescription = escapeHtmlAttribute(description);
        const safeYoutubeUrl = escapeHtmlAttribute(youtubeUrl);
        const safeEmbedUrl = escapeHtmlAttribute(embedUrl);

        return `
            <article class="border border-cyan-500/25 rounded-xl overflow-hidden bg-black/35">
                <div class="aspect-video bg-black/60">
                    ${embedUrl
                        ? `<iframe src="${safeEmbedUrl}" title="${safeTitle}" class="w-full h-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
                        : `<div class="w-full h-full grid place-items-center text-sm text-gray-500">${escapeHtmlAttribute(tPublic("videosUpdating"))}</div>`}
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-bold text-white">${safeTitle}</h3>
                    <p class="text-sm text-gray-400 mt-2 line-clamp-2">${safeDescription}</p>
                    ${youtubeUrl
                        ? `<a href="${safeYoutubeUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex mt-4 px-4 py-2 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors uppercase tracking-wider text-xs font-bold">${escapeHtmlAttribute(tPublic("videosWatchOnYoutube"))}</a>`
                        : ""}
                </div>
            </article>
        `;
    }).join("");
}

function getSponsorsCarouselStep(trackEl) {
    if (!trackEl) return 320;
    const firstCard = trackEl.firstElementChild;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 280;
    const styles = window.getComputedStyle(trackEl);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return Math.max(240, Math.round(cardWidth + gap));
}

function sponsorCarouselStep(direction = 1) {
    const trackEl = document.getElementById("sponsors-track");
    if (!trackEl) return;
    const step = getSponsorsCarouselStep(trackEl);
    const maxScroll = Math.max(0, trackEl.scrollWidth - trackEl.clientWidth);
    const movingForward = direction >= 0;

    if (movingForward && trackEl.scrollLeft >= maxScroll - 4) {
        trackEl.scrollTo({ left: 0, behavior: "smooth" });
        return;
    }

    if (!movingForward && trackEl.scrollLeft <= 4) {
        trackEl.scrollTo({ left: maxScroll, behavior: "smooth" });
        return;
    }

    trackEl.scrollBy({ left: step * direction, behavior: "smooth" });
}

function stopSponsorsAutoplay() {
    if (sponsorCarouselAutoplayTimer) {
        clearInterval(sponsorCarouselAutoplayTimer);
        sponsorCarouselAutoplayTimer = null;
    }
}

function startSponsorsAutoplay() {
    stopSponsorsAutoplay();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const trackEl = document.getElementById("sponsors-track");
    if (!trackEl || trackEl.children.length < 2) return;

    sponsorCarouselAutoplayTimer = setInterval(() => {
        sponsorCarouselStep(1);
    }, 3200);
}

function setupSponsorsCarousel() {
    const trackEl = document.getElementById("sponsors-track");
    if (!trackEl) return;

    trackEl.onmouseenter = stopSponsorsAutoplay;
    trackEl.onmouseleave = startSponsorsAutoplay;
    trackEl.onfocusin = stopSponsorsAutoplay;
    trackEl.onfocusout = startSponsorsAutoplay;
    if (!sponsorCarouselVisibilityListenerBound) {
        sponsorCarouselVisibilityListenerBound = true;
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopSponsorsAutoplay();
                return;
            }
            startSponsorsAutoplay();
        });
    }
    startSponsorsAutoplay();
}

function renderSponsors(data) {
    const track = document.getElementById("sponsors-track");
    if (!track) return;

    const sponsors = [...(data.sponsors || [])].sort((a, b) => {
        const left = Number(a.sortOrder ?? a.sort_order ?? 0);
        const right = Number(b.sortOrder ?? b.sort_order ?? 0);
        return left - right;
    });

    if (!sponsors.length) {
        track.innerHTML = `
            <div class="w-full min-h-[180px] border border-yellow-500/25 rounded-xl bg-black/30 grid place-items-center text-center text-gray-400 p-6">
                ${escapeHtmlAttribute(tPublic("sponsorsUpdating"))}
            </div>
        `;
        stopSponsorsAutoplay();
        return;
    }

    track.innerHTML = sponsors.map((sponsor) => {
        const sponsorName = sponsor.name || "Партнер";
        const sponsorDescription = sponsor.shortDescription || sponsor.short_description || "Надійна підтримка лейблу";
        const sponsorLogo = sponsor.logo || "";
        const sponsorLink = sponsor.link || "#";
        const safeSponsorLink = normalizeReleaseOutboundUrl(sponsorLink);
        const safeSponsorLinkAttr = safeSponsorLink ? escapeHtmlAttribute(safeSponsorLink) : "";
        const cardContent = `
            <div class="h-[75%] rounded-lg border border-yellow-500/20 bg-black/40 flex items-center justify-center p-3 overflow-hidden">
                <img src="${sponsorLogo}" alt="${sponsorName}" class="h-full w-full object-contain" data-sponsor-image="1" loading="lazy">
            </div>
            <div class="h-[25%] pt-3 flex flex-col justify-start overflow-hidden">
                <h3 class="text-lg font-bold text-white truncate">${sponsorName}</h3>
                <p class="text-sm text-gray-300 truncate">${sponsorDescription}</p>
            </div>
        `;

        if (!safeSponsorLink) {
            return `
                <article class="snap-start shrink-0 w-[280px] h-[280px] p-4 rounded-xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-black/35 flex flex-col">
                    ${cardContent}
                </article>
            `;
        }

        return `
                <a href="${safeSponsorLinkAttr}" target="_blank" rel="noopener noreferrer" class="snap-start shrink-0 w-[280px] h-[280px] p-4 rounded-xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-black/35 hover:border-yellow-400/55 transition-colors block flex flex-col">
                ${cardContent}
            </a>
        `;
    }).join("");

    attachImageFallback(track, 'img[data-sponsor-image="1"]', RELEASE_IMAGE_FALLBACK);

    setupSponsorsCarousel();
}

function sponsorCarouselPrev() {
    sponsorCarouselStep(-1);
}

function sponsorCarouselNext() {
    sponsorCarouselStep(1);
}

window.sponsorCarouselPrev = sponsorCarouselPrev;
window.sponsorCarouselNext = sponsorCarouselNext;

function showTicketInfo() {
    alert(tPublic("ticketsSoonMessage"));
}

function loadAbout(settings) {
    const aboutTitleEl = document.getElementById("public-section-title-about");
    if (aboutTitleEl) {
        const aboutTitle = String(settings && settings.title ? settings.title : "").trim();
        aboutTitleEl.textContent = aboutTitle || tPublic("sectionAbout");
    }

    const aboutEl = document.getElementById("about-text");
    if (aboutEl) {
        aboutEl.textContent = String(settings && settings.about ? settings.about : "");
    }

    const missionEl = document.getElementById("about-mission");
    if (missionEl) {
        missionEl.textContent = String(settings && settings.mission ? settings.mission : "");
    }

    const heroSubtitleEl = document.getElementById("public-hero-subtitle");
    if (!heroSubtitleEl || !heroSubtitleEl.isConnected) return;

    const language = getActiveLanguage();
    const heroSubtitle = language === "en"
        ? String(settings.heroSubtitleEn || settings.heroSubtitle || "").trim()
        : String(settings.heroSubtitleUk || settings.heroSubtitle || "").trim();

    heroSubtitleEl.textContent = heroSubtitle || tPublic("heroSubtitleFallback");
}

function decodeHtmlEntities(text) {
    const decodeHtmlEntitiesMethod = getAdapterMethod("decodeHtmlEntities");
    if (decodeHtmlEntitiesMethod) {
        return decodeHtmlEntitiesMethod.call(adapter, text);
    }

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

function normalizeSocialUrl(value, options = {}) {
    const normalizeSettingsUrlMethod = getAdapterMethod("normalizeSettingsUrl");
    if (normalizeSettingsUrlMethod) {
        return normalizeSettingsUrlMethod.call(adapter, value, options);
    }

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

function normalizeBrandLogoUrl(value) {
    const decodedValue = decodeHtmlEntities(value).trim();
    if (!decodedValue || decodedValue === "#") return "";

    const lowered = decodedValue.toLowerCase();
    if (lowered.startsWith("javascript:")) {
        return "";
    }

    if (lowered.startsWith("data:")) {
        const isAllowedImageDataUrl = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(decodedValue);
        return isAllowedImageDataUrl ? decodedValue : "";
    }

    try {
        const parsedUrl = new URL(decodedValue, window.location.origin);
        if (!/^https?:$/i.test(parsedUrl.protocol)) return "";
        return parsedUrl.toString();
    } catch (_error) {
        return "";
    }
}

function normalizeHeroMainLogoDataUrl(value) {
    const decodedValue = decodeHtmlEntities(value).trim();
    if (!decodedValue || decodedValue === "#") return "";

    const isAllowedImageDataUrl = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(decodedValue);
    return isAllowedImageDataUrl ? decodedValue : "";
}

function applyBrandLogoElement(logoEl, fallbackIconEl, sourceUrl) {
    if (!logoEl) return;

    if (!sourceUrl) {
        logoEl.classList.add("hidden");
        logoEl.removeAttribute("src");
        if (fallbackIconEl) fallbackIconEl.classList.remove("hidden");
        return;
    }

    logoEl.onerror = () => {
        if (!logoEl.isConnected) return;
        logoEl.classList.add("hidden");
        if (fallbackIconEl && fallbackIconEl.isConnected) {
            fallbackIconEl.classList.remove("hidden");
        }
    };

    logoEl.src = sourceUrl;
    logoEl.classList.remove("hidden");
    if (fallbackIconEl) fallbackIconEl.classList.add("hidden");
}

function applyBrandLogos(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const headerLogoUrl = normalizeBrandLogoUrl(source.headerLogoUrl);
    const footerLogoUrl = normalizeBrandLogoUrl(source.footerLogoUrl);

    const headerLogoEl = document.getElementById("public-header-logo");
    const headerIconEl = document.getElementById("public-header-icon");
    const footerLogoEl = document.getElementById("public-footer-logo");
    const footerIconEl = document.getElementById("public-footer-icon");

    applyBrandLogoElement(headerLogoEl, headerIconEl, headerLogoUrl);
    applyBrandLogoElement(footerLogoEl, footerIconEl, footerLogoUrl);
}

function applyHeroMainLogo(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const heroMainLogoUrl = normalizeHeroMainLogoDataUrl(source.heroMainLogoDataUrl);

    const heroMainLogoEl = document.getElementById("public-hero-main-logo");
    const heroMainHeadingEl = document.getElementById("public-hero-main-heading");
    if (!heroMainLogoEl || !heroMainHeadingEl) return;

    if (!heroMainLogoUrl) {
        heroMainLogoEl.classList.add("hidden");
        heroMainLogoEl.removeAttribute("src");
        heroMainHeadingEl.classList.remove("hidden");
        return;
    }

    heroMainLogoEl.onerror = () => {
        if (!heroMainLogoEl.isConnected || !heroMainHeadingEl.isConnected) return;
        heroMainLogoEl.classList.add("hidden");
        heroMainHeadingEl.classList.remove("hidden");
    };

    heroMainLogoEl.src = heroMainLogoUrl;
    heroMainLogoEl.classList.remove("hidden");
    heroMainHeadingEl.classList.add("hidden");
}

function applyHeroSocialLinks(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const links = {
        instagram: normalizeSocialUrl(source.instagramUrl, { platform: "instagram" }),
        youtube: normalizeSocialUrl(source.youtubeUrl, { platform: "youtube" }),
        soundcloud: normalizeSocialUrl(source.soundcloudUrl, { platform: "soundcloud" }),
        radio: normalizeSocialUrl(source.radioUrl, { platform: "radio" })
    };

    const targets = {
        instagram: document.getElementById("hero-social-instagram"),
        youtube: document.getElementById("hero-social-youtube"),
        soundcloud: document.getElementById("hero-social-soundcloud"),
        radio: document.getElementById("hero-social-radio")
    };

    Object.entries(targets).forEach(([key, el]) => {
        if (!el) return;
        el.href = links[key];
        el.target = "_blank";
        el.rel = "noopener noreferrer";
    });
}

function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const demoFileInput = form.querySelector('input[name="demoFile"]');
    const demoFileButton = document.getElementById("contact-demo-file-button");
    const demoFileName = document.getElementById("contact-demo-file-name");

    const updateDemoFileName = () => {
        if (!demoFileName) return;
        const selectedFile = demoFileInput && demoFileInput.files && demoFileInput.files.length > 0
            ? demoFileInput.files[0]
            : null;

        if (selectedFile && selectedFile.name) {
            demoFileName.textContent = selectedFile.name;
            demoFileName.classList.remove("text-gray-400");
            demoFileName.classList.add("text-cyan-200");
            return;
        }

        demoFileName.textContent = tPublic("contactFileNoFile");
        demoFileName.classList.remove("text-cyan-200");
        demoFileName.classList.add("text-gray-400");
    };

    if (demoFileButton && demoFileInput) {
        demoFileButton.addEventListener("click", () => {
            demoFileInput.click();
        });
    }

    if (demoFileInput) {
        demoFileInput.addEventListener("change", updateDemoFileName);
    }

    updateDemoFileName();

    initContactCaptcha();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        updateContactStatus(tPublic("sendingMessage"), false);

        const formData = new FormData(form);
        const config = getContactConfig();
        const subject = String(formData.get("subject") || "");
        const subjectSelect = form.querySelector('select[name="subject"]');
        const selectedSubjectOption = subjectSelect && subjectSelect.selectedIndex >= 0
            ? subjectSelect.options[subjectSelect.selectedIndex]
            : null;
        const normalizedSubjectLabel = selectedSubjectOption
            ? String(selectedSubjectOption.textContent || "").trim()
            : "";
        const demoFile = formData.get("demoFile");

        let attachmentName = "";
        let attachmentType = "";
        let attachmentDataUrl = "";

        if (demoFile instanceof File && demoFile.size > 0) {
            if (demoFile.size > config.maxFileBytes) {
                updateContactStatus(`${tPublic("fileTooLargePrefix")} ${formatBytesSize(config.maxFileBytes)}.`, true);
                return;
            }

            try {
                attachmentDataUrl = await readFileAsDataUrl(demoFile);
                attachmentName = demoFile.name || "";
                attachmentType = demoFile.type || "application/octet-stream";
            } catch (_error) {
                updateContactStatus(tPublic("fileReadFailed"), true);
                return;
            }
        }

        if (isDemoSubject(subject) && !attachmentDataUrl) {
            updateContactStatus(tPublic("demoFileRequired"), true);
            return;
        }

        if (contactCaptchaState.enabled && !contactCaptchaState.token) {
            updateContactStatus(config.captchaMissingTokenMessage || tPublic("captchaMissingToken"), true);
            return;
        }

        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: normalizedSubjectLabel || subject,
            subjectCode: subject,
            message: formData.get("message"),
            attachmentName,
            attachmentType,
            attachmentDataUrl,
            captchaToken: contactCaptchaState.token || ""
        };

        try {
            await adapter.submitContactRequest(payload);
            form.reset();
            updateDemoFileName();
            resetContactCaptcha();
            updateContactStatus(tPublic("contactSaved"), false);
        } catch (error) {
            console.error("Contact request failed", error);
            updateContactStatus(resolveContactSubmitErrorMessage(error), true);
        }
    });
}

function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    if (menu) menu.classList.toggle("hidden");
}

function applyFloatingScrollTopRuntimeStyles(button) {
    if (!button || !button.isConnected) return;

    const isMobile = typeof window.matchMedia === "function"
        && window.matchMedia("(max-width: 640px)").matches;

    button.style.position = "fixed";
    button.style.right = isMobile ? "74px" : "86px";
    button.style.bottom = isMobile ? "16px" : "20px";
    button.style.zIndex = "50";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.gap = "6px";
    button.style.padding = isMobile ? "9px 10px" : "10px 12px";
    button.style.border = "1px solid rgba(0, 240, 255, 0.4)";
    button.style.background = "rgba(5, 5, 8, 0.9)";
    button.style.color = "#7dd3fc";
    button.style.textTransform = "uppercase";
    button.style.letterSpacing = "0.08em";
    button.style.fontSize = isMobile ? "10px" : "11px";
}

function ensureFloatingScrollTopButton() {
    let button = document.getElementById("floating-scroll-top");

    if (!button) {
        const legacyLabel = document.querySelector("[data-i18n='footerBackToTop']");
        const legacyButton = legacyLabel ? legacyLabel.closest("button") : null;
        if (legacyButton) button = legacyButton;
    }

    if (!button) {
        button = document.createElement("button");
        button.innerHTML = "<i data-lucide='arrow-up' class='w-4 h-4' aria-hidden='true'></i><span data-i18n='footerBackToTop'>Back to top</span>";
        document.body.appendChild(button);
    }

    if (button.closest("footer")) {
        document.body.appendChild(button);
    }

    button.id = "floating-scroll-top";
    button.type = "button";
    button.classList.add("floating-scroll-top");
    button.setAttribute("data-i18n-aria-label", "footerBackToTopAria");
    button.setAttribute("data-i18n-title", "footerBackToTopAria");
    button.onclick = () => scrollToSection("hero");

    applyFloatingScrollTopRuntimeStyles(button);

    if (!floatingScrollTopResizeListenerBound) {
        window.addEventListener("resize", () => {
            const current = document.getElementById("floating-scroll-top");
            applyFloatingScrollTopRuntimeStyles(current);
        });
        floatingScrollTopResizeListenerBound = true;
    }
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }

    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenu) mobileMenu.classList.add("hidden");
}

async function bootstrap() {
    ensureFloatingScrollTopButton();
    applyLanguageFromQuery();
    document.documentElement.setAttribute("lang", getActiveLanguage());
    applyStaticTranslations();
    bindLanguageSwitcher();
    adapter.ensureLocalDefaults();
    bindReleaseInteractions();
    bindCompactReleasePlayerControls();
    const isProdHost = !["localhost", "127.0.0.1"].includes(window.location.hostname);
    const requireApi = (window.CORE64_CONFIG && typeof window.CORE64_CONFIG.requireApiOnPublic === "boolean")
        ? window.CORE64_CONFIG.requireApiOnPublic
        : isProdHost;
    const isApiAvailableMethod = getAdapterMethod("isApiAvailable");
    const getApiReadinessReportMethod = getAdapterMethod("getApiReadinessReport");
    let readinessReport = null;

    if (requireApi && isApiAvailableMethod) {
        const apiReady = await isApiAvailableMethod.call(adapter);
        if (!apiReady) {
            readinessReport = getApiReadinessReportMethod
                ? getApiReadinessReportMethod.call(adapter)
                : null;
            showPublicApiStatus(resolvePublicApiStatusMessage(readinessReport));
        }
    }

    try {
        const data = await adapter.getSiteData();
        hidePublicApiStatus();
        renderReleases(data);
        renderArtists(data);
        renderEvents(data);
        renderVideos(data);
        renderSponsors(data);
        applyPublicSectionSettings(data.sectionSettings || []);
        contactRuntimeSettings = data.settings || {};
        loadAbout(data.settings || {});
        applyHeroSocialLinks(data.settings || {});
        applyBrandLogos(data.settings || {});
        applyHeroMainLogo(data.settings || {});
    } catch (error) {
        console.error("Failed to load site data", error);
        const fallback = adapter.defaults;
        if (requireApi) {
            showPublicApiStatus(resolvePublicApiStatusMessage(error || readinessReport || {}));
        } else {
            hidePublicApiStatus();
        }

        renderReleases(fallback);
        renderArtists(fallback);
        renderEvents(fallback);
        renderVideos(fallback);
        renderSponsors(fallback);
        applyPublicSectionSettings(fallback.sectionSettings || []);
        contactRuntimeSettings = fallback.settings || {};
        loadAbout(fallback.settings);
        applyHeroSocialLinks(fallback.settings);
        applyBrandLogos(fallback.settings || {});
        applyHeroMainLogo(fallback.settings || {});
    }

    initContactForm();
    if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", bootstrap);
