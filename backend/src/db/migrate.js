import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const dir = path.join(__dirname, "migrations");
  const files = (await fs.readdir(dir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sqlPath = path.join(dir, file);
    const sql = await fs.readFile(sqlPath, "utf8");
    await pool.query(sql);
    console.log(`Migration applied: ${file}`);
  }

  await pool.end();
}

migrate().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
