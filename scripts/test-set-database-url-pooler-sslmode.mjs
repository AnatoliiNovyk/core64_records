#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./set-database-url-pooler-sslmode.mjs");

function runCase(name, databaseUrl, options = {}) {
  const { strict = false, rawUrl = false, extraEnv = {} } = options;
  const args = [targetScript];
  if (strict) args.push("--strict");
  if (rawUrl) args.push("--raw-url");

  const result = spawnSync(process.execPath, args, {
    env: {
      ...process.env,
      DATABASE_URL_VALUE: databaseUrl,
      DB_POOLER_SSLMODE: "require",
      ...extraEnv
    },
    encoding: "utf8"
  });

  return {
    name,
    code: result.status ?? 1,
    stdout: String(result.stdout || "").trim()
  };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function parseJson(output, caseName) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${caseName}: output is not valid JSON: ${output}`);
  }
}

function main() {
  const appendCase = runCase(
    "pooler-append",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
  );
  expect(appendCase.code === 0, `pooler-append: expected exit 0, got ${appendCase.code}`);
  const appendJson = parseJson(appendCase.stdout, "pooler-append");
  expect(appendJson.ok === true, "pooler-append: expected ok true");
  expect(appendJson.changed === true, "pooler-append: expected changed true");
  expect(appendJson.reason === "appended_sslmode", "pooler-append: reason mismatch");
  expect(appendJson.updatedDatabaseUrl.includes("sslmode=require"), "pooler-append: missing sslmode=require");

  const replaceCase = runCase(
    "pooler-replace",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=disable&pgbouncer=true"
  );
  expect(replaceCase.code === 0, `pooler-replace: expected exit 0, got ${replaceCase.code}`);
  const replaceJson = parseJson(replaceCase.stdout, "pooler-replace");
  expect(replaceJson.ok === true, "pooler-replace: expected ok true");
  expect(replaceJson.changed === true, "pooler-replace: expected changed true");
  expect(replaceJson.reason === "replaced_sslmode", "pooler-replace: reason mismatch");
  expect(replaceJson.previousSslmode === "disable", "pooler-replace: previous sslmode mismatch");
  expect(replaceJson.updatedDatabaseUrl.includes("sslmode=require"), "pooler-replace: missing sslmode=require");

  const unchangedCase = runCase(
    "pooler-unchanged",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
  );
  expect(unchangedCase.code === 0, `pooler-unchanged: expected exit 0, got ${unchangedCase.code}`);
  const unchangedJson = parseJson(unchangedCase.stdout, "pooler-unchanged");
  expect(unchangedJson.ok === true, "pooler-unchanged: expected ok true");
  expect(unchangedJson.changed === false, "pooler-unchanged: expected changed false");
  expect(unchangedJson.reason === "already_target_sslmode", "pooler-unchanged: reason mismatch");

  const nonPoolerCase = runCase(
    "non-pooler-unchanged",
    "postgresql://user:pass@db.example.com:5432/core64?sslmode=require"
  );
  expect(nonPoolerCase.code === 0, `non-pooler-unchanged: expected exit 0, got ${nonPoolerCase.code}`);
  const nonPoolerJson = parseJson(nonPoolerCase.stdout, "non-pooler-unchanged");
  expect(nonPoolerJson.ok === true, "non-pooler-unchanged: expected ok true");
  expect(nonPoolerJson.changed === false, "non-pooler-unchanged: expected changed false");
  expect(nonPoolerJson.reason === "not_pooler_endpoint", "non-pooler-unchanged: reason mismatch");

  const strictInvalidCase = runCase("strict-invalid", "not-a-url", { strict: true });
  expect(strictInvalidCase.code === 1, `strict-invalid: expected exit 1, got ${strictInvalidCase.code}`);

  const invalidTargetSslmodeCase = runCase(
    "invalid-target-sslmode",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
    {
      strict: true,
      extraEnv: {
        DB_POOLER_SSLMODE: "disable"
      }
    }
  );
  expect(invalidTargetSslmodeCase.code === 1, `invalid-target-sslmode: expected exit 1, got ${invalidTargetSslmodeCase.code}`);
  const invalidTargetSslmodeJson = parseJson(invalidTargetSslmodeCase.stdout, "invalid-target-sslmode");
  expect(invalidTargetSslmodeJson.reason === "invalid_target_sslmode", "invalid-target-sslmode: reason mismatch");
  expect(Array.isArray(invalidTargetSslmodeJson.allowedSslModes), "invalid-target-sslmode: missing allowed sslmode list");

  const rawUrlCase = runCase(
    "raw-url-output",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
    { rawUrl: true }
  );
  expect(rawUrlCase.code === 0, `raw-url-output: expected exit 0, got ${rawUrlCase.code}`);
  expect(rawUrlCase.stdout.includes("sslmode=require"), "raw-url-output: missing sslmode=require");

  console.log("set-database-url-pooler-sslmode self-test PASSED");
}

main();
