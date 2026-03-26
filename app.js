// CORE64 Records - Public site logic with API-first data access.

const adapter = window.Core64DataAdapter;
let sponsorCarouselAutoplayTimer = null;
let sponsorCarouselVisibilityListenerBound = false;
let contactRuntimeSettings = {};
let releaseInteractionsBound = false;
const RELEASE_IMAGE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23040b12'/%3E%3Cstop offset='100%25' stop-color='%23111f2f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%2300f0ff' stroke-opacity='0.3'%3E%3Crect x='96' y='96' width='608' height='608' rx='36'/%3E%3Cpath d='M240 560 355 430l88 88 53-64 64 76'/%3E%3Ccircle cx='322' cy='310' r='46'/%3E%3C/g%3E%3Ctext x='50%25' y='88%25' text-anchor='middle' fill='%23bfefff' font-family='Arial,sans-serif' font-size='34'%3ECORE64 RELEASE%3C/text%3E%3C/svg%3E";

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
        captchaErrorMessage: String(settingsSource.contactCaptchaErrorMessage || "Не вдалося пройти перевірку captcha.").trim(),
        captchaMissingTokenMessage: String(settingsSource.contactCaptchaMissingTokenMessage || "Підтвердіть, що ви не робот.").trim()
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
        hint.textContent = "Поточний провайдер капчі не підтримується на фронтенді.";
        hint.classList.remove("hidden");
        return;
    }

    if (!config.captchaSiteKey) {
        hint.textContent = "Captcha увімкнена, але не вказано site key.";
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
        hint.textContent = "Не вдалося завантажити captcha. Оновіть сторінку або спробуйте пізніше.";
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
    window.open(targetUrl, "_blank", "noopener,noreferrer");
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
                <div class="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
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

    const releaseImages = grid.querySelectorAll('img[data-release-image="1"]');
    releaseImages.forEach((imgEl) => {
        imgEl.addEventListener("error", () => {
            if (imgEl.getAttribute("src") === RELEASE_IMAGE_FALLBACK) return;
            imgEl.src = RELEASE_IMAGE_FALLBACK;
        }, { once: true });
    });

    const statEl = document.getElementById("stat-releases");
    if (statEl) statEl.textContent = String((data.releases || []).length);
}

function renderArtists(data) {
    const grid = document.getElementById("artists-grid");
    if (!grid) return;

    grid.innerHTML = (data.artists || []).map((artist) => `
        <div class="card rounded-lg overflow-hidden group">
            <div class="relative aspect-[4/3] overflow-hidden">
                <img src="${artist.image}" alt="${artist.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
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
        const month = eventDate.toLocaleDateString("uk-UA", { month: "short" });
        const resolvedTicketLink = event.ticketLink || event.ticket_link || "";
        const hasTicketLink = Boolean(resolvedTicketLink && resolvedTicketLink !== "#");

        return `
            <div class="flex flex-col md:flex-row gap-6 p-6 border border-green-500/20 rounded-lg hover:border-green-500/50 transition-colors bg-black/30">
                <div class="flex-shrink-0 w-full md:w-48 h-32 overflow-hidden rounded border border-green-500/30">
                    <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover">
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
                        ? `<a href="${resolvedTicketLink}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">Квитки</a>`
                        : `<button onclick="showTicketInfo()" class="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all uppercase tracking-wider text-sm font-bold">Квитки</button>`}
                </div>
            </div>
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
                Партнерська секція оновлюється
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
                <img src="${sponsorLogo}" alt="${sponsorName}" class="h-full w-full object-contain" loading="lazy">
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
    alert("Квитки скоро будуть доступні. Напишіть нам через форму внизу сторінки.");
}

function loadAbout(settings) {
    const aboutEl = document.getElementById("about-text");
    if (aboutEl && settings.about) {
        aboutEl.textContent = settings.about;
    }

    const missionEl = document.getElementById("about-mission");
    if (missionEl && settings.mission) {
        missionEl.textContent = settings.mission;
    }
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

function normalizeSocialUrl(value, options = {}) {
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

    initContactCaptcha();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        updateContactStatus("Відправка повідомлення...", false);

        const formData = new FormData(form);
        const config = getContactConfig();
        const subject = String(formData.get("subject") || "");
        const demoFile = formData.get("demoFile");

        let attachmentName = "";
        let attachmentType = "";
        let attachmentDataUrl = "";

        if (demoFile instanceof File && demoFile.size > 0) {
            if (demoFile.size > config.maxFileBytes) {
                updateContactStatus(`Файл завеликий. Максимум: ${formatBytesSize(config.maxFileBytes)}.`, true);
                return;
            }

            try {
                attachmentDataUrl = await readFileAsDataUrl(demoFile);
                attachmentName = demoFile.name || "";
                attachmentType = demoFile.type || "application/octet-stream";
            } catch (_error) {
                updateContactStatus("Не вдалося прочитати файл. Спробуйте інший файл.", true);
                return;
            }
        }

        if (isDemoSubject(subject) && !attachmentDataUrl) {
            updateContactStatus("Для теми 'Демо запис' потрібно додати файл.", true);
            return;
        }

        if (contactCaptchaState.enabled && !contactCaptchaState.token) {
            updateContactStatus(config.captchaMissingTokenMessage || "Підтвердіть, що ви не робот.", true);
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
            resetContactCaptcha();
            updateContactStatus("Дякуємо за повідомлення. Запит успішно збережено.", false);
        } catch (error) {
            console.error("Contact request failed", error);
            const details = error && typeof error.message === "string" ? error.message.trim() : "";
            updateContactStatus(details ? `Не вдалося зберегти запит: ${details}` : "Не вдалося зберегти запит. Спробуйте пізніше.", true);
        }
    });
}

function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    if (menu) menu.classList.toggle("hidden");
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
        contactRuntimeSettings = data.settings || {};
        loadAbout(data.settings || {});
        applyHeroSocialLinks(data.settings || {});
    } catch (error) {
        console.error("Failed to load site data", error);
        if (requireApi) {
            showPublicApiStatus("Сервіс тимчасово недоступний. Не вдалося отримати дані з API.");
            return;
        }

        const fallback = adapter.defaults;
        renderReleases(fallback);
        renderArtists(fallback);
        renderEvents(fallback);
        renderSponsors(fallback);
        contactRuntimeSettings = fallback.settings || {};
        loadAbout(fallback.settings);
        applyHeroSocialLinks(fallback.settings);
    }

    initContactForm();
    if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", bootstrap);