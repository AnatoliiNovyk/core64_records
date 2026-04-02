#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./print-db-runtime-tls-hint.mjs");

function runCase(name, databaseUrl, options = {}) {
  const { strict = false, extraEnv = {} } = options;
  const args = [targetScript];
  if (strict) args.push("--strict");

  const result = spawnSync(process.execPath, args, {
    env: {
      ...process.env,
      ...extraEnv,
      DATABASE_URL_VALUE: databaseUrl
    },
    encoding: "utf8"
  });

  return {
    name,
    code: result.status ?? 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
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
  const compatCase = runCase(
    "self-signed-compat",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
    {
      strict: true,
      extraEnv: {
        DB_SSL: "true",
        DB_SSL_REJECT_UNAUTHORIZED: "false",
        DB_SSL_ALLOW_SELF_SIGNED: "true"
      }
    }
  );
  expect(compatCase.code === 0, `self-signed-compat: expected exit 0, got ${compatCase.code}`);
  const compatJson = parseJson(compatCase.stdout, "self-signed-compat");
  expect(compatJson.databaseUrlParse === "ok", "self-signed-compat: parse mismatch");
  expect(compatJson.snapshot.isPoolerEndpoint === true, "self-signed-compat: pooler mismatch");
  expect(compatJson.runtimeTls.wouldEnableLibpqCompat === true, "self-signed-compat: wouldEnableLibpqCompat mismatch");
  expect(compatJson.runtimeTls.effectiveLibpqCompat === true, "self-signed-compat: effectiveLibpqCompat mismatch");

  const explicitCompatCase = runCase(
    "explicit-compat",
    "postgresql://user:pass@db.example.com:5432/core64?sslmode=require&uselibpqcompat=true",
    {
      strict: true,
      extraEnv: {
        DB_SSL: "true",
        DB_SSL_REJECT_UNAUTHORIZED: "false",
        DB_SSL_ALLOW_SELF_SIGNED: "false"
      }
    }
  );
  expect(explicitCompatCase.code === 0, `explicit-compat: expected exit 0, got ${explicitCompatCase.code}`);
  const explicitCompatJson = parseJson(explicitCompatCase.stdout, "explicit-compat");
  expect(explicitCompatJson.snapshot.uselibpqcompatExplicit === true, "explicit-compat: explicit compat mismatch");
  expect(explicitCompatJson.runtimeTls.effectiveLibpqCompat === true, "explicit-compat: effective compat mismatch");

  const strictFailCase = runCase("invalid-url-strict", "not-a-url", { strict: true });
  expect(strictFailCase.code === 1, `invalid-url-strict: expected exit 1, got ${strictFailCase.code}`);
  const strictFailJson = parseJson(strictFailCase.stdout, "invalid-url-strict");
  expect(strictFailJson.databaseUrlParse === "failed", "invalid-url-strict: parse mismatch");

  console.log("print-db-runtime-tls-hint self-test PASSED");
}

main();
