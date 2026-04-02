#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./check-database-url-policy.mjs");

function runCase(name, databaseUrl, options = {}) {
  const { strict = false, args: cliArgs = [], extraEnv = {} } = options;
  const commandArgs = [targetScript];
  if (strict) commandArgs.push("--strict");
  if (Array.isArray(cliArgs) && cliArgs.length > 0) {
    commandArgs.push(...cliArgs);
  }

  const result = spawnSync(process.execPath, commandArgs, {
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
  const okCase = runCase(
    "valid-url",
    "postgresql://user:pass@db.example.com:5432/core64?sslmode=require",
    { strict: true }
  );
  expect(okCase.code === 0, `valid-url: expected exit 0, got ${okCase.code}`);
  const okJson = parseJson(okCase.stdout, "valid-url");
  expect(okJson.valid === true, "valid-url: expected valid true");

  const emptyCase = runCase("empty", "", { strict: true });
  expect(emptyCase.code === 1, `empty: expected exit 1, got ${emptyCase.code}`);
  const emptyJson = parseJson(emptyCase.stdout, "empty");
  expect(emptyJson.reason === "empty", "empty: reason mismatch");

  const invalidProtocolCase = runCase("invalid-protocol", "mysql://user:pass@db.example.com/core64", { strict: true });
  expect(invalidProtocolCase.code === 1, `invalid-protocol: expected exit 1, got ${invalidProtocolCase.code}`);
  const invalidProtocolJson = parseJson(invalidProtocolCase.stdout, "invalid-protocol");
  expect(invalidProtocolJson.reason === "invalid_protocol", "invalid-protocol: reason mismatch");

  const poolerNoSslCase = runCase(
    "pooler-missing-sslmode",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
    { strict: true }
  );
  expect(poolerNoSslCase.code === 1, `pooler-missing-sslmode: expected exit 1, got ${poolerNoSslCase.code}`);
  const poolerNoSslJson = parseJson(poolerNoSslCase.stdout, "pooler-missing-sslmode");
  expect(poolerNoSslJson.reason === "unsupported_sslmode_for_pooler_endpoint", "pooler-missing-sslmode: reason mismatch");
  expect(poolerNoSslJson.remediation?.action === "set_allowed_pooler_sslmode", "pooler-missing-sslmode: remediation action mismatch");
  expect(poolerNoSslJson.remediation?.legacyAction === "append_sslmode_require", "pooler-missing-sslmode: remediation legacy action mismatch");
  expect(poolerNoSslJson.remediation?.operation === "append", "pooler-missing-sslmode: remediation operation mismatch");
  expect(poolerNoSslJson.remediation?.targetSslmode === "require", "pooler-missing-sslmode: remediation target sslmode mismatch");
  expect(poolerNoSslJson.remediation?.append === "?sslmode=require", "pooler-missing-sslmode: remediation append mismatch");

  const poolerNoSslWithQueryCase = runCase(
    "pooler-missing-sslmode-with-query",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    { strict: true }
  );
  expect(poolerNoSslWithQueryCase.code === 1, `pooler-missing-sslmode-with-query: expected exit 1, got ${poolerNoSslWithQueryCase.code}`);
  const poolerNoSslWithQueryJson = parseJson(poolerNoSslWithQueryCase.stdout, "pooler-missing-sslmode-with-query");
  expect(poolerNoSslWithQueryJson.reason === "unsupported_sslmode_for_pooler_endpoint", "pooler-missing-sslmode-with-query: reason mismatch");
  expect(poolerNoSslWithQueryJson.remediation?.action === "set_allowed_pooler_sslmode", "pooler-missing-sslmode-with-query: remediation action mismatch");
  expect(poolerNoSslWithQueryJson.remediation?.legacyAction === "append_sslmode_require", "pooler-missing-sslmode-with-query: remediation legacy action mismatch");
  expect(poolerNoSslWithQueryJson.remediation?.operation === "append", "pooler-missing-sslmode-with-query: remediation operation mismatch");
  expect(poolerNoSslWithQueryJson.remediation?.targetSslmode === "require", "pooler-missing-sslmode-with-query: remediation target sslmode mismatch");
  expect(poolerNoSslWithQueryJson.remediation?.append === "&sslmode=require", "pooler-missing-sslmode-with-query: remediation append mismatch");

  const poolerUnsupportedSslCase = runCase(
    "pooler-unsupported-sslmode",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=disable&pgbouncer=true",
    { strict: true }
  );
  expect(poolerUnsupportedSslCase.code === 1, `pooler-unsupported-sslmode: expected exit 1, got ${poolerUnsupportedSslCase.code}`);
  const poolerUnsupportedSslJson = parseJson(poolerUnsupportedSslCase.stdout, "pooler-unsupported-sslmode");
  expect(poolerUnsupportedSslJson.reason === "unsupported_sslmode_for_pooler_endpoint", "pooler-unsupported-sslmode: reason mismatch");
  expect(poolerUnsupportedSslJson.remediation?.action === "set_allowed_pooler_sslmode", "pooler-unsupported-sslmode: remediation action mismatch");
  expect(poolerUnsupportedSslJson.remediation?.operation === "replace", "pooler-unsupported-sslmode: remediation operation mismatch");
  expect(poolerUnsupportedSslJson.remediation?.targetSslmode === "require", "pooler-unsupported-sslmode: remediation target sslmode mismatch");

  const poolerVerifyCaCase = runCase(
    "pooler-verify-ca",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=verify-ca",
    { strict: true }
  );
  expect(poolerVerifyCaCase.code === 0, `pooler-verify-ca: expected exit 0, got ${poolerVerifyCaCase.code}`);
  const poolerVerifyCaJson = parseJson(poolerVerifyCaCase.stdout, "pooler-verify-ca");
  expect(poolerVerifyCaJson.valid === true, "pooler-verify-ca: expected valid true");

  const poolerVerifyFullCase = runCase(
    "pooler-verify-full",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=verify-full",
    { strict: true }
  );
  expect(poolerVerifyFullCase.code === 0, `pooler-verify-full: expected exit 0, got ${poolerVerifyFullCase.code}`);
  const poolerVerifyFullJson = parseJson(poolerVerifyFullCase.stdout, "pooler-verify-full");
  expect(poolerVerifyFullJson.valid === true, "pooler-verify-full: expected valid true");

  const poolerRemediationHintCase = runCase(
    "pooler-remediation-hint",
    "postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
    {
      strict: true,
      args: ["--emit-remediation-command"],
      extraEnv: {
        GCP_PROJECT_ID: "core64records",
        DATABASE_URL_SECRET_NAME: "DATABASE_URL"
      }
    }
  );
  expect(poolerRemediationHintCase.code === 1, `pooler-remediation-hint: expected exit 1, got ${poolerRemediationHintCase.code}`);
  expect(poolerRemediationHintCase.stderr.includes("Remediation command"), "pooler-remediation-hint: missing remediation heading");
  expect(poolerRemediationHintCase.stderr.includes("gcloud secrets versions add"), "pooler-remediation-hint: missing gcloud add command");
  expect(poolerRemediationHintCase.stderr.includes("scripts/set-database-url-pooler-sslmode.mjs --raw-url --strict"), "pooler-remediation-hint: missing centralized sslmode helper command");

  console.log("check-database-url-policy self-test PASSED");
}

main();
