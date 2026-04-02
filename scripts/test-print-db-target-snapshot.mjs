#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./print-db-target-snapshot.mjs");

function runCase(name, envValue, strict = false) {
  const args = [targetScript];
  if (strict) args.push("--strict");

  const result = spawnSync(process.execPath, args, {
    env: {
      ...process.env,
      DATABASE_URL_VALUE: envValue
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
  if (!condition) {
    throw new Error(message);
  }
}

function parseJson(output, caseName) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${caseName}: output is not valid JSON: ${output}`);
  }
}

function main() {
  const okCase = runCase(
    "valid-url",
    "postgresql://user:pass@db.example.com:5432/core64?sslmode=require"
  );
  expect(okCase.code === 0, `valid-url: expected exit 0, got ${okCase.code}`);
  const okJson = parseJson(okCase.stdout, "valid-url");
  expect(okJson.protocol === "postgresql", "valid-url: protocol mismatch");
  expect(okJson.host === "db.example.com", "valid-url: host mismatch");
  expect(okJson.port === "5432", "valid-url: port mismatch");
  expect(okJson.database === "core64", "valid-url: database mismatch");
  expect(okJson.sslmode === "require", "valid-url: sslmode mismatch");

  const relaxedFailCase = runCase("invalid-url-relaxed", "not-a-url", false);
  expect(relaxedFailCase.code === 0, `invalid-url-relaxed: expected exit 0, got ${relaxedFailCase.code}`);
  const relaxedJson = parseJson(relaxedFailCase.stdout, "invalid-url-relaxed");
  expect(relaxedJson.databaseUrlParse === "failed", "invalid-url-relaxed: expected parse failed payload");

  const strictFailCase = runCase("invalid-url-strict", "not-a-url", true);
  expect(strictFailCase.code === 1, `invalid-url-strict: expected exit 1, got ${strictFailCase.code}`);
  const strictJson = parseJson(strictFailCase.stdout, "invalid-url-strict");
  expect(strictJson.databaseUrlParse === "failed", "invalid-url-strict: expected parse failed payload");

  console.log("print-db-target-snapshot self-test PASSED");
}

main();
