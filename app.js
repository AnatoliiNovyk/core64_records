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

function renderReleases(data) {
    const grid = document.getElementById("releases-grid");
    if (!grid) return;

    grid.innerHTML = (data.releases || []).map((release) => `
        <div class="release-card border border-cyan-500/20 rounded-lg overflow-hidden group cursor-pointer">
            <div class="relative aspect-square overflow-hidden bg-gray-900">
                <img src="${release.image}" alt="${release.title}" class="w-full h-full object-cover vinyl-spin">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button class="p-3 bg-cyan-400 rounded-full text-black hover:scale-110 transition-transform" aria-label="Play release">
                        <i data-lucide="play" class="w-6 h-6 fill-current"></i>
                    </button>
                </div>
                <div class="absolute top-2 right-2 genre-tag px-3 py-1 text-xs rounded uppercase tracking-wider">
                    ${release.genre}
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">${release.title}</h3>
                <p class="text-gray-400 text-sm mb-2">${release.artist}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
                    <span>${release.year}</span>
                    <span class="text-cyan-400">CORE64</span>
                </div>
            </div>
        </div>
    `).join("");

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
                    <a href="${artist.soundcloud || "#"}" class="p-2 bg-gray-800 rounded hover:bg-cyan-400 hover:text-black transition-colors">
                        <i data-lucide="music" class="w-4 h-4"></i>
                    </a>
                    <a href="${artist.instagram || "#"}" class="p-2 bg-gray-800 rounded hover:bg-pink-400 hover:text-black transition-colors">
                        <i data-lucide="instagram" class="w-4 h-4"></i>
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
    }

    initContactForm();
    if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", bootstrap);