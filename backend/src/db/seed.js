import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { config } from "../config.js";

async function seed() {
  const hash = await bcrypt.hash(config.adminPassword, 10);
  await pool.query(
    "INSERT INTO admin_users (username, password_hash) VALUES ('admin', $1) ON CONFLICT (username) DO NOTHING",
    [hash]
  );

  await pool.query(
    "INSERT INTO settings (title, about, mission, email, instagram_url, youtube_url, soundcloud_url, radio_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING",
    [
      "CORE64 Records",
      "CORE64 Records — незалежний музичний лейбл, заснований у 2024 році.",
      "Наша місія — підтримувати андерграунд сцену та розвивати Drum & Bass.",
      "demo@core64.records",
      "#",
      "#",
      "#",
      "#"
    ]
  );

  await pool.query(
    "INSERT INTO releases (title, artist, genre, release_type, release_date, year, image, link, ticket_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING",
    ["Neural Network", "Cybernetic", "Neurofunk", "single", "2024-01-10", "2024", "http://static.photos/technology/640x360/1", "#", ""]
  );

  await pool.query(
    "INSERT INTO artists (name, genre, bio, image, soundcloud, instagram) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
    ["Cybernetic", "Neurofunk", "Піонер української нейрофанк сцени.", "http://static.photos/people/640x360/10", "#", "#"]
  );

  await pool.query(
    "INSERT INTO events (title, date, time, venue, description, image, ticket_link) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING",
    ["CORE64 Label Night", "2024-02-15", "22:00", "Київ, Atlas", "Великий лейбл-ніч з усіма артистами CORE64.", "http://static.photos/nightlife/640x360/20", ""]
  );

  console.log("Seed completed");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
