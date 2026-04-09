#!/usr/bin/env node

import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./verify-api-error-contract.mjs");

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

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

async function createMockServer(options = {}) {
  const {
    routeNotFoundCode = "API_ROUTE_NOT_FOUND",
    includeValidationFieldError = true
  } = options;

  const adminPassword = "test-admin-password";
  const authToken = "test-token";
  const settingsPayload = {
    title: "CORE64",
    email: "hello@example.com"
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;

    if (pathname === "/api/health" && req.method === "GET") {
      writeJson(res, 200, { status: "ok" });
      return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readRequestBody(req);
      const password = String(body?.password || "");

      if (password !== adminPassword) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_INVALID_CREDENTIALS",
          error: "Invalid credentials"
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          token: authToken
        }
      });
      return;
    }

    if (pathname === "/api/settings" && req.method === "GET") {
      const authorization = String(req.headers.authorization || "");
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, { data: settingsPayload });
      return;
    }

    if (pathname === "/api/settings" && req.method === "PUT") {
      const authorization = String(req.headers.authorization || "");
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      const body = await readRequestBody(req);
      const email = String(body?.data?.email || "");
      if (email === "not-an-email") {
        const details = includeValidationFieldError
          ? {
            fieldErrors: {
              email: ["Invalid email"]
            }
          }
          : {
            fieldErrors: {}
          };

        writeJson(res, 400, {
          status: 400,
          code: "VALIDATION_FAILED",
          error: "Validation failed",
          details
        });
        return;
      }

      writeJson(res, 200, { data: body?.data || settingsPayload });
      return;
    }

    writeJson(res, 404, {
      status: 404,
      code: routeNotFoundCode,
      error: "API route not found"
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to resolve mock server address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}/api`,
    adminPassword,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

function runVerifier(baseUrl, adminPassword) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [targetScript], {
      env: {
        ...process.env,
        CORE64_API_BASE: baseUrl,
        CORE64_ADMIN_PASSWORD: adminPassword,
        CORE64_CONTRACT_TIMEOUT_MS: "5000"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
    });

    child.once("error", (error) => {
      reject(error);
    });

    child.once("close", (code) => {
      resolve({
        code: Number.isInteger(code) ? code : 1,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

async function runCase(caseName, serverOptions, assertions) {
  const mock = await createMockServer(serverOptions);
  try {
    const result = await runVerifier(mock.baseUrl, mock.adminPassword);
    const report = result.stdout ? parseJson(result.stdout, caseName) : null;
    assertions({ result, report });
  } finally {
    await mock.close();
  }
}

async function main() {
  await runCase("happy-path", {}, ({ result, report }) => {
    expect(
      result.code === 0,
      `happy-path: expected exit 0, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === true, "happy-path: expected passed=true");
    expect(report?.checks?.authRequired?.ok === true, "happy-path: authRequired check should pass");
    expect(report?.checks?.settingsValidation?.ok === true, "happy-path: settingsValidation check should pass");
    expect(report?.checks?.apiRouteNotFound?.ok === true, "happy-path: apiRouteNotFound check should pass");
  });

  await runCase("route-not-found-mismatch", { routeNotFoundCode: "WRONG_ROUTE_CODE" }, ({ result, report }) => {
    expect(
      result.code === 1,
      `route-not-found-mismatch: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "route-not-found-mismatch: expected passed=false");
    expect(report?.checks?.apiRouteNotFound?.ok === false, "route-not-found-mismatch: expected failing 404 shape check");
  });

  await runCase("validation-field-error-missing", { includeValidationFieldError: false }, ({ result, report }) => {
    expect(
      result.code === 1,
      `validation-field-error-missing: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "validation-field-error-missing: expected passed=false");
    expect(report?.checks?.settingsValidation?.ok === false, "validation-field-error-missing: expected failing validation details check");
    expect(report?.checks?.settingsValidation?.emailFieldErrorPresent === false, "validation-field-error-missing: expected missing email field error marker");
  });

  console.log("verify-api-error-contract self-test PASSED");
}

main().catch((error) => {
  console.error("verify-api-error-contract self-test failed:", error?.message || error);
  process.exit(1);
});
