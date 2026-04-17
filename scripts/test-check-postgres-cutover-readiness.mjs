#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./check-postgres-cutover-readiness.mjs");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJson(stdout, caseName) {
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`${caseName}: output is not valid JSON: ${stdout}`);
  }
}

function runCase(caseName, databaseUrl, { strict = false, timeoutMs = 1200 } = {}) {
  const args = [targetScript, `--timeout-ms=${timeoutMs}`];
  if (strict) {
    args.push("--strict");
  }

  const result = spawnSync(process.execPath, args, {
    env: {
      ...process.env,
      DATABASE_URL_VALUE: databaseUrl
    },
    encoding: "utf8"
  });

  return {
    caseName,
    code: result.status ?? 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

function openTcpServer() {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.end();
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: Number(address.port) });
    });
  });
}

function closeTcpServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function main() {
  const okEndpoint = await openTcpServer();

  try {
    const okUrl = `postgresql://user:pass@127.0.0.1:${okEndpoint.port}/core64?sslmode=require`;
    const okCase = runCase("ok", okUrl, { strict: true });
    expect(okCase.code === 0, `ok: expected exit 0, got ${okCase.code}`);
    const okJson = parseJson(okCase.stdout, "ok");
    expect(okJson.status === "ok", "ok: expected status ok");
    expect(okJson.preflightPassed === true, "ok: expected preflightPassed true");
    expect(okJson.policy?.valid === true, "ok: expected policy.valid true");
    expect(okJson.checks?.dns?.ok === true, "ok: expected dns check to pass");
    expect(okJson.checks?.tcp?.ok === true, "ok: expected tcp check to pass");

    const invalidCase = runCase("invalid-url", "not-a-url", { strict: true });
    expect(invalidCase.code === 1, `invalid-url: expected exit 1, got ${invalidCase.code}`);
    const invalidJson = parseJson(invalidCase.stdout, "invalid-url");
    expect(invalidJson.status === "failed", "invalid-url: expected status failed");
    expect(invalidJson.policy?.valid === false, "invalid-url: expected policy.valid false");

    const closedEndpoint = await openTcpServer();
    const closedPort = closedEndpoint.port;
    await closeTcpServer(closedEndpoint.server);

    const degradedUrl = `postgresql://user:pass@127.0.0.1:${closedPort}/core64?sslmode=require`;
    const degradedCase = runCase("degraded", degradedUrl, { strict: true, timeoutMs: 800 });
    expect(degradedCase.code === 1, `degraded: expected exit 1, got ${degradedCase.code}`);
    const degradedJson = parseJson(degradedCase.stdout, "degraded");
    expect(degradedJson.status === "degraded", "degraded: expected status degraded");
    expect(degradedJson.policy?.valid === true, "degraded: expected policy.valid true");
    expect(degradedJson.checks?.dns?.ok === true, "degraded: expected dns check to pass");
    expect(degradedJson.checks?.tcp?.ok === false, "degraded: expected tcp check to fail");

    console.log("check-postgres-cutover-readiness self-test PASSED");
  } finally {
    await closeTcpServer(okEndpoint.server);
  }
}

main().catch((error) => {
  console.error("check-postgres-cutover-readiness self-test failed:", error?.message || error);
  process.exit(1);
});
