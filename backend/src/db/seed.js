import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { config } from "../config.js";

async function seed() {
  const hash = await bcrypt.hash(config.adminPassword, 10);
  await pool.query(
    "INSERT INTO admin_users (username, password_hash) VALUES ('admin', $1) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash",
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
    "INSERT INTO releases (title, artist, genre, release_type, release_date, year, image, link, ticket_link) SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9 WHERE NOT EXISTS (SELECT 1 FROM releases WHERE title = $1 AND artist = $2)",
    ["Neural Network", "Cybernetic", "Neurofunk", "single", "2024-01-10", "2024", "http://static.photos/technology/640x360/1", "#", ""]
  );

  await pool.query(
    "INSERT INTO artists (name, genre, bio, image, soundcloud, instagram) SELECT $1, $2, $3, $4, $5, $6 WHERE NOT EXISTS (SELECT 1 FROM artists WHERE name = $1)",
    ["Cybernetic", "Neurofunk", "Піонер української нейрофанк сцени.", "http://static.photos/people/640x360/10", "#", "#"]
  );

  await pool.query(
    "INSERT INTO events (title, date, time, venue, description, image, ticket_link) SELECT $1, $2, $3, $4, $5, $6, $7 WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = $1 AND date = $2)",
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

  // Keep seed idempotent and normalize legacy demo placeholders that break smoke checks.
  await pool.query(
    "UPDATE releases SET image = '/images/Screenshot_1.png' WHERE image LIKE 'http://static.photos/%'"
  );
  await pool.query(
    "UPDATE artists SET image = '/images/Screenshot_9.png' WHERE image LIKE 'http://static.photos/%'"
  );
  await pool.query(
    "UPDATE events SET image = '/images/Screenshot_6.png' WHERE image LIKE 'http://static.photos/%'"
  );
  await pool.query(
    "UPDATE sponsors SET logo = '/images/Screenshot_8.png' WHERE logo LIKE 'http://static.photos/%'"
  );
  await pool.query(
    "UPDATE releases SET link = 'https://soundcloud.com/core64records' WHERE link IN ('https://soundcloud.com/', 'https://www.youtube.com/', 'https://open.spotify.com/', 'https://music.apple.com/', '#', '')"
  );

  console.log("Seed completed");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
