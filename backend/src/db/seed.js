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
    "INSERT INTO settings (title, about, mission, email, instagram_url, youtube_url, soundcloud_url, radio_url) SELECT $1, $2, $3, $4, $5, $6, $7, $8 WHERE NOT EXISTS (SELECT 1 FROM settings)",
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

  await pool.query(
    "INSERT INTO sponsors (name, short_description, logo, link, sort_order) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM sponsors WHERE name = $1)",
    ["BassLab Audio", "Студія мастерингу лейблу", "http://static.photos/technology/640x360/31", "#", 1]
  );
  await pool.query(
    "INSERT INTO sponsors (name, short_description, logo, link, sort_order) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM sponsors WHERE name = $1)",
    ["NightPulse Agency", "Подієвий партнер сцени", "http://static.photos/nightlife/640x360/32", "#", 2]
  );
  await pool.query(
    "INSERT INTO sponsors (name, short_description, logo, link, sort_order) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM sponsors WHERE name = $1)",
    ["DnB Family UA", "Друзі з комʼюніті", "http://static.photos/people/640x360/33", "#", 3]
  );

  console.log("Seed completed");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
