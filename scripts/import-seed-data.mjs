#!/usr/bin/env node
/**
 * import-seed-data.mjs
 * Imports seed data (releases, artists, events, sponsors) via the API.
 *
 * Usage:
 *   CORE64_API_BASE=https://<cloud-run-url>/api ADMIN_PASSWORD=<password> node scripts/import-seed-data.mjs
 *
 * Defaults to http://localhost:3000/api if CORE64_API_BASE is not set.
 * Reads ADMIN_PASSWORD from env or falls back to backend/.env file.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = (process.env.CORE64_API_BASE || "http://localhost:3000/api").replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// Read ADMIN_PASSWORD from env or backend/.env
// ---------------------------------------------------------------------------
function readPasswordFromBackendEnv() {
  try {
    const envPath = path.resolve(__dirname, "../backend/.env");
    if (!fs.existsSync(envPath)) return "";
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^ADMIN_PASSWORD\s*=\s*(.*)$/);
      if (!match) continue;
      const val = match[1].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        return val.slice(1, -1);
      }
      return val.split("#")[0].trim();
    }
    return "";
  } catch {
    return "";
  }
}

const password = process.env.ADMIN_PASSWORD || readPasswordFromBackendEnv();
if (!password) {
  console.error("ERROR: ADMIN_PASSWORD not set and not found in backend/.env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Seed data (mirrors backend/src/db/seed.js, using camelCase API fields)
// ---------------------------------------------------------------------------
const SEED_RELEASES = [
  {
    title: "Neural Network",
    artist: "Cybernetic",
    genre: "Neurofunk",
    releaseType: "single",
    releaseDate: "2024-01-10",
    year: "2024",
    image: "/images/Screenshot_1.png",
    link: "https://soundcloud.com/core64records",
    ticketLink: ""
  }
];

const SEED_ARTISTS = [
  {
    name: "Cybernetic",
    genre: "Neurofunk",
    bio: "Піонер української нейрофанк сцени.",
    image: "/images/Screenshot_9.png",
    soundcloud: "#",
    instagram: "#"
  }
];

const SEED_EVENTS = [
  {
    title: "CORE64 Label Night",
    date: "2024-02-15",
    time: "22:00",
    venue: "Київ, Atlas",
    description: "Великий лейбл-ніч з усіма артистами CORE64.",
    image: "/images/Screenshot_6.png",
    ticketLink: ""
  }
];

const SEED_SPONSORS = [
  { name: "BassLab Audio",      shortDescription: "Студія мастерингу лейблу", logo: "/images/Screenshot_8.png", link: "#", sortOrder: 1 },
  { name: "NightPulse Agency",  shortDescription: "Подієвий партнер сцени",   logo: "/images/Screenshot_8.png", link: "#", sortOrder: 2 },
  { name: "DnB Family UA",      shortDescription: "Друзі з комʼюніті",        logo: "/images/Screenshot_8.png", link: "#", sortOrder: 3 }
];

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function login() {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password })
  });
  if (!res.ok) {
    console.error("Login failed:", res.status, JSON.stringify(res.json));
    process.exit(1);
  }
  const token = (res.json.data && res.json.data.token) || res.json.token;
  if (!token) {
    console.error("Login response missing token:", JSON.stringify(res.json));
    process.exit(1);
  }
  console.log("✓ Logged in successfully");
  return token;
}

async function getExisting(type, token) {
  const res = await apiFetch(`/${type}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`GET /${type} failed:`, res.status, JSON.stringify(res.json));
    return [];
  }
  return res.json.data || [];
}

async function postItem(type, item, token) {
  const res = await apiFetch(`/${type}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(item)
  });
  return res;
}

// ---------------------------------------------------------------------------
// Import logic
// ---------------------------------------------------------------------------
async function importCollection(type, seedItems, token, identityKey) {
  const existing = await getExisting(type, token);
  const existingKeys = new Set(existing.map(e => String(e[identityKey] || "").toLowerCase()));

  let created = 0;
  let skipped = 0;

  for (const item of seedItems) {
    const key = String(item[identityKey] || "").toLowerCase();
    if (existingKeys.has(key)) {
      console.log(`  skip  [${type}] "${item[identityKey]}" — already exists`);
      skipped++;
      continue;
    }
    const res = await postItem(type, item, token);
    if (res.ok) {
      console.log(`  ✓ created [${type}] "${item[identityKey]}"`);
      created++;
    } else {
      console.error(`  ✗ FAILED  [${type}] "${item[identityKey]}" — ${res.status} ${JSON.stringify(res.json)}`);
    }
  }

  console.log(`  → ${type}: ${created} created, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nTarget API: ${baseUrl}`);
  console.log("Starting seed data import...\n");

  const token = await login();

  await importCollection("releases", SEED_RELEASES, token, "title");
  await importCollection("artists",  SEED_ARTISTS,  token, "name");
  await importCollection("events",   SEED_EVENTS,   token, "title");
  await importCollection("sponsors", SEED_SPONSORS, token, "name");

  console.log("\nImport complete.");
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
