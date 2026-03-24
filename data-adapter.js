// CORE64 data adapter: API-first with localStorage fallback
(function () {
    const DEFAULT_DATA = {
        releases: [
            {
                id: 1,
                title: "Neural Network",
                artist: "Cybernetic",
                genre: "Neurofunk",
                year: "2024",
                image: "http://static.photos/technology/640x360/1",
                link: "#",
                ticketLink: ""
            },
            {
                id: 2,
                title: "Dark Matter",
                artist: "Synapse",
                genre: "Techstep",
                year: "2024",
                image: "http://static.photos/abstract/640x360/2",
                link: "#",
                ticketLink: ""
            },
            {
                id: 3,
                title: "System Shock",
                artist: "Binary Soul",
                genre: "Breakbeat",
                year: "2023",
                image: "http://static.photos/industry/640x360/3",
                link: "#",
                ticketLink: ""
            },
            {
                id: 4,
                title: "Core Dump",
                artist: "Null Pointer",
                genre: "DnB",
                year: "2024",
                image: "http://static.photos/technology/640x360/4",
                link: "#",
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
        settings: {
            title: "CORE64 Records",
            about: "CORE64 Records — незалежний музичний лейбл, заснований у 2024 році. Ми спеціалізуємося на найважчих жанрах електронної музики: Neurofunk, Techstep, Darkstep та Breakbeat.",
            mission: "Наша місія — підтримувати андерграунд сцену та виводити Drum & Bass на новий рівень. Кожен реліз — це унікальна історія, закодована в звуках синтезаторів та ритмах барабанів.",
            email: "demo@core64.records",
            instagramUrl: "#",
            youtubeUrl: "#",
            soundcloudUrl: "#",
            radioUrl: "#"
        },
        contactRequests: []
    };

    const STORAGE_KEY = "core64_data";
    const STORAGE_AUTH_KEY = "core64_admin_auth";
    const STORAGE_TOKEN_KEY = "core64_admin_token";
    const STORAGE_MODE_KEY = "core64_data_mode";

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getDataMode() {
        const configuredMode = (window.CORE64_CONFIG && window.CORE64_CONFIG.dataMode) || localStorage.getItem(STORAGE_MODE_KEY) || "auto";
        return configuredMode;
    }

    function getApiBaseUrl() {
        return (window.CORE64_CONFIG && window.CORE64_CONFIG.apiBaseUrl) || "http://localhost:3000/api";
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
                settings: {
                    ...deepClone(DEFAULT_DATA.settings),
                    ...(parsed.settings || {})
                },
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

    async function apiRequest(path, options) {
        const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
        const headers = Object.assign({ "Content-Type": "application/json" }, options && options.headers ? options.headers : {});
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${getApiBaseUrl()}${path}`, {
            method: (options && options.method) || "GET",
            headers,
            body: options && options.body ? JSON.stringify(options.body) : undefined,
            signal: options && options.signal ? options.signal : undefined
        });

        if (!response.ok) {
            let details = `HTTP ${response.status}`;
            try {
                const payload = await response.json();
                details = payload.error || payload.message || details;
            } catch (_err) {
                // No-op: use fallback message.
            }
            throw new Error(details);
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

    const adapter = {
        defaults: deepClone(DEFAULT_DATA),

        sanitizeText,

        async isApiAvailable() {
            try {
                await apiRequest("/health");
                return true;
            } catch (_error) {
                return false;
            }
        },

        async getSiteData() {
            if (await shouldUseApi()) {
                const response = await apiRequest("/public");
                return response.data;
            }
            return getLocalData();
        },

        async getCollection(type) {
            const collection = normalizeCollectionName(type);
            if (await shouldUseApi()) {
                if (collection === "settings") {
                    const response = await apiRequest("/settings");
                    return response.data;
                }
                const response = await apiRequest(`/${collection}`);
                return response.data;
            }

            const data = getLocalData();
            return data[collection];
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
                message: sanitizeText(payload.message)
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
                const response = await apiRequest("/auth/login", {
                    method: "POST",
                    body: { password }
                });
                sessionStorage.setItem(STORAGE_TOKEN_KEY, response.data.token);
                sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
                return true;
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
        }
    };

    window.Core64DataAdapter = adapter;
})();
