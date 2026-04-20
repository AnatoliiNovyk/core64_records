import { pool } from "../src/db/pool.js";

const DATA_URL_REGEX = "^data:[^;]+;base64,";

const BASE_TARGETS = [
  { table: "releases", column: "image", label: "releases.image" },
  { table: "artists", column: "image", label: "artists.image" },
  { table: "events", column: "image", label: "events.image" },
  { table: "sponsors", column: "logo", label: "sponsors.logo" },
  { table: "settings", column: "hero_main_logo_data_url", label: "settings.hero_main_logo_data_url" }
];

const AUDIO_TARGET = { table: "release_tracks", column: "audio_data_url", label: "release_tracks.audio_data_url" };

function parseArgs(argv) {
  const args = new Set(argv.slice(2).map((value) => String(value || "").trim().toLowerCase()));
  return {
    apply: args.has("--apply"),
    includeAudio: args.has("--include-audio"),
    help: args.has("--help") || args.has("-h")
  };
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

async function collectStats(client, target) {
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE ${target.column} ~* $1) AS affected_rows,
      COALESCE(SUM(octet_length(${target.column})) FILTER (WHERE ${target.column} ~* $1), 0) AS affected_bytes
    FROM ${target.table}
  `;
  const result = await client.query(sql, [DATA_URL_REGEX]);
  const row = result.rows[0] || {};
  return {
    affectedRows: Number(row.affected_rows) || 0,
    affectedBytes: Number(row.affected_bytes) || 0
  };
}

async function applyCleanup(client, target) {
  const sql = `
    UPDATE ${target.table}
    SET ${target.column} = ''
    WHERE ${target.column} ~* $1
  `;
  const result = await client.query(sql, [DATA_URL_REGEX]);
  return Number(result.rowCount) || 0;
}

function printHelp() {
  console.log("Usage: node scripts/cleanup-inline-assets.mjs [--apply] [--include-audio]");
  console.log("");
  console.log("Default mode is dry-run (no data changes).");
  console.log("  --apply          Apply cleanup (replace inline data URLs with empty string).");
  console.log("  --include-audio  Also clean release_tracks.audio_data_url (destructive for inline audio).");
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }

  const targets = options.includeAudio
    ? [...BASE_TARGETS, AUDIO_TARGET]
    : [...BASE_TARGETS];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalRows = 0;
    let totalBytes = 0;

    console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN"}`);
    console.log(`Targets: ${targets.map((target) => target.label).join(", ")}`);

    for (const target of targets) {
      const stats = await collectStats(client, target);
      totalRows += stats.affectedRows;
      totalBytes += stats.affectedBytes;

      console.log(
        `[${target.label}] affected_rows=${stats.affectedRows}, affected_bytes=${stats.affectedBytes} (${formatBytes(stats.affectedBytes)})`
      );

      if (options.apply && stats.affectedRows > 0) {
        const updatedRows = await applyCleanup(client, target);
        console.log(`[${target.label}] updated_rows=${updatedRows}`);
      }
    }

    if (options.apply) {
      await client.query("COMMIT");
      console.log(`Cleanup applied. Total rows updated: ${totalRows}. Estimated bytes cleared: ${formatBytes(totalBytes)}.`);
      return;
    }

    await client.query("ROLLBACK");
    console.log(`Dry-run complete. Potential rows: ${totalRows}. Potential bytes: ${formatBytes(totalBytes)}.`);
    console.log("No data was changed.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  const message = String(error && error.message ? error.message : "").toLowerCase();
  if (message.includes("data transfer quota")) {
    console.error("cleanup-inline-assets blocked: database provider transfer quota exceeded.");
    console.error("Action: increase Neon transfer quota (or wait for quota reset), then rerun dry-run and apply mode.");
    process.exit(2);
  }

  console.error("cleanup-inline-assets failed", error);
  process.exit(1);
});
