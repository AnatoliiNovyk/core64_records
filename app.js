// CORE64 Records - Public site logic with API-first data access.

const adapter = window.Core64DataAdapter;

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

function renderReleases(data) {
    const grid = document.getElementById("releases-grid");
    if (!grid) return;

    grid.innerHTML = (data.releases || []).map((release) => {
        const releaseTypeLabel = getReleaseTypeLabel(release.releaseType || release.release_type);

        return `
        <div class="release-card border border-cyan-500/20 rounded-lg overflow-hidden group cursor-pointer">
            <div class="relative aspect-square overflow-hidden bg-gray-900">
                <img src="${release.image}" alt="${release.title}" class="w-full h-full object-cover vinyl-spin">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button class="p-3 bg-cyan-400 rounded-full text-black hover:scale-110 transition-transform" aria-label="Play release">
                        <i data-lucide="play" class="w-6 h-6 fill-current"></i>
                    </button>
                </div>
                <div class="absolute top-2 right-2 genre-tag px-3 py-1 text-xs rounded uppercase tracking-wider">
                    ${releaseTypeLabel}
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">${release.title}</h3>
                <p class="text-gray-400 text-sm mb-2">${release.artist}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
                    <span>${release.year}</span>
                    <span class="text-cyan-400">${release.genre}</span>
                </div>
            </div>
        </div>
    `;
    }).join("");

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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        updateContactStatus("Відправка повідомлення...", false);

        const formData = new FormData(form);
        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message")
        };

        try {
            await adapter.submitContactRequest(payload);
            form.reset();
            updateContactStatus("Дякуємо за повідомлення. Запит успішно збережено.", false);
        } catch (error) {
            console.error("Contact request failed", error);
            updateContactStatus("Не вдалося зберегти запит. Спробуйте пізніше.", true);
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
        loadAbout(fallback.settings);
        applyHeroSocialLinks(fallback.settings);
    }

    initContactForm();
    if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", bootstrap);