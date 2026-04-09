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

function writeJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, { "content-type": "application/json", ...headers });
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
    includeValidationFieldError = true,
    invalidTokenCode = "AUTH_INVALID_TOKEN",
    authRateLimitCode = "AUTH_RATE_LIMITED",
    includeAuthRateLimitRetryAfter = true,
    authRateLimitThreshold = 6,
    dbHealthMode = "degraded",
    dbUnavailableCode = "DB_UNAVAILABLE",
    includeDbUnavailableDetails = true
  } = options;

  const adminPassword = "test-admin-password";
  const authToken = "test-token";
  const settingsPayload = {
    title: "CORE64",
    email: "hello@example.com"
  };
  let authLoginAttempts = 0;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;

    if (pathname === "/api/health" && req.method === "GET") {
      writeJson(res, 200, { status: "ok" });
      return;
    }

    if (pathname === "/api/health/db" && req.method === "GET") {
      if (dbHealthMode === "healthy") {
        writeJson(res, 200, {
          status: "ok",
          database: "ok",
          service: "core64-api",
          durationMs: 10,
          connectionTimeoutMs: 15000,
          target: {
            parse: "ok",
            host: "db.local",
            port: "5432",
            database: "core64",
            sslmode: "require"
          },
          time: new Date().toISOString()
        });
        return;
      }

      if (dbHealthMode === "unexpected") {
        writeJson(res, 500, {
          status: "error",
          database: "unknown",
          code: "INTERNAL_SERVER_ERROR",
          error: "Unexpected server error"
        });
        return;
      }

      const details = includeDbUnavailableDetails
        ? {
          kind: "timeout",
          dbCode: "ETIMEDOUT",
          durationMs: 25,
          connectionTimeoutMs: 15000,
          target: {
            parse: "ok",
            host: "db.local",
            port: "5432",
            database: "core64",
            sslmode: "require"
          },
          probe: {
            attempted: true,
            dns: { resolved: false, errorCode: "ENOTFOUND", recordsCount: 0 },
            tcp: { reachable: false, errorCode: "ETIMEDOUT", timeoutMs: 1500 },
            durationMs: 5
          }
        }
        : {};

      writeJson(res, 503, {
        status: "degraded",
        database: "unavailable",
        code: dbUnavailableCode,
        error: "Database connectivity check failed",
        details,
        time: new Date().toISOString()
      });
      return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      authLoginAttempts += 1;
      if (authLoginAttempts > authRateLimitThreshold) {
        const rateLimitHeaders = includeAuthRateLimitRetryAfter
          ? { "retry-after": "60" }
          : {};
        writeJson(res, 429, {
          status: 429,
          code: authRateLimitCode,
          error: "Too many login attempts. Please try again later."
        }, rateLimitHeaders);
        return;
      }

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

    if (pathname === "/api/auth/me" && req.method === "GET") {
      const authorization = String(req.headers.authorization || "");
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: invalidTokenCode,
          error: "Invalid token"
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          id: "test-user-id",
          username: "admin"
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

    if (pathname === "/api/releases" && req.method === "POST") {
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
      const title = String(body?.title || "").trim();
      if (!title) {
        writeJson(res, 400, {
          status: 400,
          code: "VALIDATION_FAILED",
          error: "Validation failed",
          details: {
            fieldErrors: {
              title: ["Required"]
            }
          }
        });
        return;
      }

      writeJson(res, 201, {
        data: {
          id: 1,
          ...body
        }
      });
      return;
    }

    const releasesMatch = pathname.match(/^\/api\/releases\/(\d+)$/);
    if (releasesMatch && req.method === "PUT") {
      const authorization = String(req.headers.authorization || "");
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      const id = Number(releasesMatch[1]);
      if (id === 999999) {
        writeJson(res, 404, {
          status: 404,
          code: "COLLECTION_ITEM_NOT_FOUND",
          error: "Item not found",
          meta: {
            type: "releases",
            id
          }
        });
        return;
      }

      writeJson(res, 200, { data: { id } });
      return;
    }

    const contactRequestMatch = pathname.match(/^\/api\/contact-requests\/(\d+)$/);
    if (contactRequestMatch && req.method === "PATCH") {
      const authorization = String(req.headers.authorization || "");
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      const id = Number(contactRequestMatch[1]);
      if (id === 999999) {
        writeJson(res, 404, {
          status: 404,
          code: "CONTACT_REQUEST_NOT_FOUND",
          error: "Contact request not found",
          meta: {
            id
          }
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          id,
          status: "done"
        }
      });
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
        CORE64_CONTRACT_TIMEOUT_MS: "5000",
        CORE64_CONTRACT_AUTH_RATE_LIMIT_ATTEMPTS: "8",
        CORE64_CONTRACT_SKIP_AUTH_RATE_LIMIT_CHECK: "false"
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
    expect(report?.checks?.invalidCredentials?.ok === true, "happy-path: invalidCredentials check should pass");
    expect(report?.checks?.invalidToken?.ok === true, "happy-path: invalidToken check should pass");
    expect(report?.checks?.settingsValidation?.ok === true, "happy-path: settingsValidation check should pass");
    expect(report?.checks?.collectionValidation?.ok === true, "happy-path: collectionValidation check should pass");
    expect(report?.checks?.collectionItemNotFound?.ok === true, "happy-path: collectionItemNotFound check should pass");
    expect(report?.checks?.contactRequestNotFound?.ok === true, "happy-path: contactRequestNotFound check should pass");
    expect(report?.checks?.apiRouteNotFound?.ok === true, "happy-path: apiRouteNotFound check should pass");
    expect(report?.checks?.dbUnavailable?.ok === true, "happy-path: dbUnavailable observer check should pass in degraded mode");
    expect(report?.checks?.dbUnavailable?.skipped === false, "happy-path: dbUnavailable observer should not be skipped in degraded mode");
    expect(report?.checks?.authRateLimited?.ok === true, "happy-path: authRateLimited check should pass");
    expect(report?.checks?.authRateLimited?.retryAfterSeconds >= 1, "happy-path: authRateLimited should include retry-after");
  });

  await runCase("db-healthy-observer", { dbHealthMode: "healthy" }, ({ result, report }) => {
    expect(
      result.code === 0,
      `db-healthy-observer: expected exit 0, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === true, "db-healthy-observer: expected passed=true");
    expect(report?.checks?.dbUnavailable?.ok === true, "db-healthy-observer: observer check should remain ok");
    expect(report?.checks?.dbUnavailable?.skipped === true, "db-healthy-observer: observer check should be skipped for healthy DB");
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

  await runCase("invalid-token-mismatch", { invalidTokenCode: "WRONG_AUTH_INVALID_TOKEN" }, ({ result, report }) => {
    expect(
      result.code === 1,
      `invalid-token-mismatch: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "invalid-token-mismatch: expected passed=false");
    expect(report?.checks?.invalidToken?.ok === false, "invalid-token-mismatch: expected invalidToken check to fail");
  });

  await runCase("auth-rate-limit-mismatch", { authRateLimitCode: "WRONG_AUTH_RATE_LIMITED" }, ({ result, report }) => {
    expect(
      result.code === 1,
      `auth-rate-limit-mismatch: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "auth-rate-limit-mismatch: expected passed=false");
    expect(report?.checks?.authRateLimited?.ok === false, "auth-rate-limit-mismatch: expected authRateLimited check to fail");
  });

  await runCase("db-unavailable-details-missing", { includeDbUnavailableDetails: false }, ({ result, report }) => {
    expect(
      result.code === 1,
      `db-unavailable-details-missing: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "db-unavailable-details-missing: expected passed=false");
    expect(report?.checks?.dbUnavailable?.ok === false, "db-unavailable-details-missing: expected dbUnavailable check to fail");
  });

  console.log("verify-api-error-contract self-test PASSED");
}

main().catch((error) => {
  console.error("verify-api-error-contract self-test failed:", error?.message || error);
  process.exit(1);
});
