// CORE64 Records - Public site logic with API-first data access.

const adapter = window.Core64DataAdapter;
let sponsorCarouselAutoplayTimer = null;
let sponsorCarouselVisibilityListenerBound = false;
let contactRuntimeSettings = {};
let releaseInteractionsBound = false;
let floatingScrollTopResizeListenerBound = false;
const RELEASE_IMAGE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23040b12'/%3E%3Cstop offset='100%25' stop-color='%23111f2f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%2300f0ff' stroke-opacity='0.3'%3E%3Crect x='96' y='96' width='608' height='608' rx='36'/%3E%3Cpath d='M240 560 355 430l88 88 53-64 64 76'/%3E%3Ccircle cx='322' cy='310' r='46'/%3E%3C/g%3E%3Ctext x='50%25' y='88%25' text-anchor='middle' fill='%23bfefff' font-family='Arial,sans-serif' font-size='34'%3ECORE64 RELEASE%3C/text%3E%3C/svg%3E";
const PUBLIC_SECTION_DEFAULTS = [
    { sectionKey: "releases", sortOrder: 1, i18nKey: "sectionLatestReleases", navI18nKey: "navReleases" },
    { sectionKey: "artists", sortOrder: 2, i18nKey: "sectionLabelArtists", navI18nKey: "navArtists" },
    { sectionKey: "events", sortOrder: 3, i18nKey: "sectionEvents", navI18nKey: "navEvents" },
    { sectionKey: "sponsors", sortOrder: 4, i18nKey: "sectionSponsors", navI18nKey: "navSponsors" },
    { sectionKey: "contact", sortOrder: 5, i18nKey: "sectionContact", navI18nKey: "navContact" }
];
const PUBLIC_I18N = {
    uk: {
        navReleases: "Релізи",
        navArtists: "Артисти",
        navEvents: "Події",
        navSponsors: "Спонсори",
        navAbout: "Про нас",
        navContact: "Контакти",
        mobileMenuOpenTitle: "Відкрити меню навігації",
        heroListenReleases: "Слухати Релізи",
        heroOurArtists: "Наші Артисти",
        sectionLatestReleases: "ОСТАННІ РЕЛІЗИ",
        sectionLabelArtists: "АРТИСТИ ЛЕЙБЛУ",
        sectionEvents: "АФІША ПОДІЙ",
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
        sendingMessage: "Відправка повідомлення...",
        fileTooLargePrefix: "Файл завеликий. Максимум:",
        fileReadFailed: "Не вдалося прочитати файл. Спробуйте інший файл.",
        demoFileRequired: "Для теми 'Демо запис' потрібно додати файл.",
        captchaMissingToken: "Підтвердіть, що ви не робот.",
        contactSaved: "Дякуємо за повідомлення. Запит успішно збережено.",
        contactSaveFailedPrefix: "Не вдалося зберегти запит:",
        contactSaveFailedGeneric: "Не вдалося зберегти запит. Спробуйте пізніше.",
        contactSaveFailedDatabaseUnavailable: "База даних тимчасово недоступна. Спробуйте надіслати запит пізніше.",
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
        navSponsors: "Sponsors",
        navAbout: "About",
        navContact: "Contact",
        mobileMenuOpenTitle: "Open navigation menu",
        heroListenReleases: "Listen to Releases",
        heroOurArtists: "Our Artists",
        sectionLatestReleases: "LATEST RELEASES",
        sectionLabelArtists: "LABEL ARTISTS",
        sectionEvents: "EVENT SCHEDULE",
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
        sendingMessage: "Sending message...",
        fileTooLargePrefix: "File is too large. Maximum:",
        fileReadFailed: "Failed to read the file. Please try another file.",
        demoFileRequired: "A file is required for the 'Demo recording' subject.",
        captchaMissingToken: "Please confirm that you are not a robot.",
        contactSaved: "Thank you for your message. Request saved successfully.",
        contactSaveFailedPrefix: "Failed to save request:",
        contactSaveFailedGeneric: "Failed to save request. Please try again later.",
        contactSaveFailedDatabaseUnavailable: "Database is temporarily unavailable. Please try again later.",
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

function resolveContactSubmitErrorMessage(error) {
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

    return {
        maxFileBytes: Number(source.contactMaxFileBytes) > 0 ? Number(source.contactMaxFileBytes) : 15 * 1024 * 1024,
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
    return normalized === "демо запис" || normalized === "demo" || normalized.includes("демо");
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
    if (rawValue === "single" || rawValue === "ep" || rawValue === "album") return rawValue;
    return "single";
}

function getReleaseTypeLabel(value) {
    const normalizedValue = normalizeReleaseTypeValue(value);
    if (normalizedValue === "ep") return "EP";
    if (normalizedValue === "album") return "Альбом";
    return "Сингл";
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

function buildReleaseFallbackUrl(releaseTitle, releaseArtist) {
    const title = String(releaseTitle || "").trim();
    const artist = String(releaseArtist || "").trim();
    const query = [title, artist].filter(Boolean).join(" ").trim() || "CORE64 release";
    return `https://soundcloud.com/search?q=${encodeURIComponent(query)}`;
}

function openReleaseLink(releaseLink, releaseTitle, releaseArtist) {
    const normalizedUrl = normalizeReleaseOutboundUrl(releaseLink);
    const targetUrl = normalizedUrl || buildReleaseFallbackUrl(releaseTitle, releaseArtist);
    const openedWindow = window.open(targetUrl, "_blank");
    if (openedWindow) {
        // Explicitly detach opener for security without relying on feature-string behavior.
        openedWindow.opener = null;
        return;
    }

    // Fallback when popup blockers prevent opening a new tab.
    window.location.assign(targetUrl);
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

    grid.addEventListener("click", (event) => {
        const playButton = event.target instanceof Element
            ? event.target.closest('[data-release-action="play"]')
            : null;

        if (playButton) {
            const releaseLink = playButton.getAttribute("data-release-link") || "";
            const releaseTitle = playButton.getAttribute("data-release-title") || "";
            const releaseArtist = playButton.getAttribute("data-release-artist") || "";
            openReleaseLink(releaseLink, releaseTitle, releaseArtist);
            return;
        }

        const card = event.target instanceof Element ? event.target.closest(".release-card") : null;
        if (!card) return;
        const releaseLink = card.getAttribute("data-release-link") || "";
        const releaseTitle = card.getAttribute("data-release-title") || "";
        const releaseArtist = card.getAttribute("data-release-artist") || "";
        openReleaseLink(releaseLink, releaseTitle, releaseArtist);
    });

    grid.addEventListener("keydown", (event) => {
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
        const releaseLink = card.getAttribute("data-release-link") || "";
        const releaseTitle = card.getAttribute("data-release-title") || "";
        const releaseArtist = card.getAttribute("data-release-artist") || "";
        openReleaseLink(releaseLink, releaseTitle, releaseArtist);
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

    ["releases", "artists", "events", "sponsors", "contact"].forEach((sectionKey) => {
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

    grid.innerHTML = (data.releases || []).map((release) => {
        const releaseTypeLabel = getReleaseTypeLabel(release.releaseType || release.release_type);
        const releaseDateLabel = formatReleaseDateLabel(release);
        const releaseTitle = String(release.title || "Реліз");
        const releaseLink = normalizeReleaseOutboundUrl(release.link || release.releaseLink || "");
        const releaseImage = String(release.image || "").trim() || RELEASE_IMAGE_FALLBACK;
        const releaseArtist = String(release.artist || "");
        const safeReleaseTitle = escapeHtmlAttribute(releaseTitle);
        const safeReleaseLink = escapeHtmlAttribute(releaseLink);
        const safeImage = escapeHtmlAttribute(releaseImage);
        const safeReleaseArtist = escapeHtmlAttribute(releaseArtist);

        return `
        <article class="release-card border border-cyan-500/20 rounded-lg overflow-hidden group cursor-pointer" data-release-link="${safeReleaseLink}" data-release-title="${safeReleaseTitle}" data-release-artist="${safeReleaseArtist}" aria-label="Відкрити реліз ${safeReleaseTitle}" role="button" tabindex="0">
            <div class="relative aspect-square overflow-hidden bg-gray-900">
                <img src="${safeImage}" alt="${safeReleaseTitle}" class="w-full h-full object-cover vinyl-spin" data-release-image="1" loading="lazy">
                <div class="absolute inset-0 bg-black/35 md:bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button class="p-3 bg-cyan-400 rounded-full text-black hover:scale-110 transition-transform" aria-label="Play release" data-release-action="play" data-release-link="${safeReleaseLink}" data-release-title="${safeReleaseTitle}" data-release-artist="${safeReleaseArtist}">
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

    grid.innerHTML = (data.artists || []).map((artist) => `
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
                    <a href="${artist.soundcloud || "#"}" class="p-2 bg-gray-800 rounded hover:bg-cyan-400 hover:text-black transition-colors" aria-label="SoundCloud" title="SoundCloud" target="_blank" rel="noopener noreferrer">
                        ${getSocialBrandIconSvg("soundcloud", "w-4 h-4")}
                    </a>
                    <a href="${artist.instagram || "#"}" class="p-2 bg-gray-800 rounded hover:bg-pink-400 hover:text-black transition-colors" aria-label="Instagram" title="Instagram" target="_blank" rel="noopener noreferrer">
                        ${getSocialBrandIconSvg("instagram", "w-4 h-4")}
                    </a>
                </div>
            </div>
        </div>
    `).join("");

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
        const hasTicketLink = Boolean(resolvedTicketLink && resolvedTicketLink !== "#");

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
                        ? `<a href="${resolvedTicketLink}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">${escapeHtmlAttribute(tPublic("ticketsLabel"))}</a>`
                        : `<button onclick="showTicketInfo()" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">${escapeHtmlAttribute(tPublic("ticketsLabel"))}</button>`}
                </div>
            </div>
        `;
    }).join("");

    attachImageFallback(list, 'img[data-event-image="1"]', RELEASE_IMAGE_FALLBACK);
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
        const cardContent = `
            <div class="h-[75%] rounded-lg border border-yellow-500/20 bg-black/40 flex items-center justify-center p-3 overflow-hidden">
                <img src="${sponsorLogo}" alt="${sponsorName}" class="h-full w-full object-contain" data-sponsor-image="1" loading="lazy">
            </div>
            <div class="h-[25%] pt-3 flex flex-col justify-start overflow-hidden">
                <h3 class="text-lg font-bold text-white truncate">${sponsorName}</h3>
                <p class="text-sm text-gray-300 truncate">${sponsorDescription}</p>
            </div>
        `;

        if (!sponsorLink || sponsorLink === "#") {
            return `
                <article class="snap-start shrink-0 w-[280px] h-[280px] p-4 rounded-xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-black/35 flex flex-col">
                    ${cardContent}
                </article>
            `;
        }

        return `
            <a href="${sponsorLink}" target="_blank" rel="noopener noreferrer" class="snap-start shrink-0 w-[280px] h-[280px] p-4 rounded-xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-black/35 hover:border-yellow-400/55 transition-colors block flex flex-col">
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
            subject,
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
    const isProdHost = !["localhost", "127.0.0.1"].includes(window.location.hostname);
    const requireApi = (window.CORE64_CONFIG && typeof window.CORE64_CONFIG.requireApiOnPublic === "boolean")
        ? window.CORE64_CONFIG.requireApiOnPublic
        : isProdHost;

    try {
        const data = await adapter.getSiteData();
        hidePublicApiStatus();
        renderReleases(data);
        renderArtists(data);
        renderEvents(data);
        renderSponsors(data);
        applyPublicSectionSettings(data.sectionSettings || []);
        contactRuntimeSettings = data.settings || {};
        loadAbout(data.settings || {});
        applyHeroSocialLinks(data.settings || {});
        applyBrandLogos(data.settings || {});
        applyHeroMainLogo(data.settings || {});
    } catch (error) {
        console.error("Failed to load site data", error);
        if (requireApi) {
            showPublicApiStatus(tPublic("apiTemporarilyUnavailable"));
            return;
        }

        const fallback = adapter.defaults;
        renderReleases(fallback);
        renderArtists(fallback);
        renderEvents(fallback);
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