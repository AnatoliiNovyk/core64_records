#!/usr/bin/env node

import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./smoke-check.mjs");

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
  res.writeHead(statusCode, {
    "content-type": "application/json",
    ...headers
  });
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

function buildDefaultSections() {
  return [
    { sectionKey: "releases", isVisible: true, displayOrder: 1 },
    { sectionKey: "artists", isVisible: true, displayOrder: 2 },
    { sectionKey: "events", isVisible: true, displayOrder: 3 },
    { sectionKey: "sponsors", isVisible: true, displayOrder: 4 }
  ];
}

function buildDefaultSettings() {
  return {
    title: "CORE64",
    about: "About CORE64",
    mission: "Mission CORE64",
    email: "hello@core64.local",
    auditLatencyGoodMaxMs: 200,
    auditLatencyWarnMaxMs: 700,
    contactCaptchaEnabled: false,
    contactCaptchaActiveProvider: "none"
  };
}

function buildPublicPayload(settings) {
  return {
    data: {
      releases: [
        {
          id: 1,
          title: "Release One",
          image: "https://cdn.core64.local/release-1.jpg",
          link: "https://core64.local/release/1"
        },
        {
          id: 2,
          title: "Release Two",
          image: "https://cdn.core64.local/release-2.jpg",
          link: "https://core64.local/release/2"
        }
      ],
      artists: [
        {
          id: 1,
          name: "Artist One",
          image: "https://cdn.core64.local/artist-1.jpg"
        }
      ],
      events: [
        {
          id: 1,
          title: "Event One",
          image: "https://cdn.core64.local/event-1.jpg"
        }
      ],
      sponsors: [
        {
          id: 1,
          name: "Sponsor One",
          logo: "https://cdn.core64.local/sponsor-1.jpg"
        }
      ],
      settings: {
        contactCaptchaEnabled: settings.contactCaptchaEnabled,
        contactCaptchaActiveProvider: settings.contactCaptchaActiveProvider
      }
    }
  };
}

async function createMockServer(options = {}) {
  const {
    includeReportUriInCspHeader = true,
    forceLoginUnauthorized = false,
    cspReportStatus = 204,
    rateLimitMode = "trigger",
    sectionsMissingRequiredKey = false
  } = options;

  const adminPassword = "test-admin-password";
  const authToken = "test-token";
  const settings = buildDefaultSettings();
  const sections = sectionsMissingRequiredKey
    ? buildDefaultSections().filter((entry) => entry.sectionKey !== "sponsors")
    : buildDefaultSections();

  const publicPayload = buildPublicPayload(settings);
  const releasesPayload = [
    { id: 1, title: "Release One" },
    { id: 2, title: "Release Two" }
  ];

  let settingsSectionsPutCount = 0;
  let releasesPutCount = 0;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;
    const method = String(req.method || "GET").toUpperCase();
    const authorization = String(req.headers.authorization || "");

    if (pathname === "/api/health" && method === "GET") {
      const cspHeaderValue = includeReportUriInCspHeader
        ? "default-src 'self'; report-uri /api/security/csp-report"
        : "default-src 'self'";

      writeJson(
        res,
        200,
        {
          status: "ok",
          service: "core64-api",
          time: new Date().toISOString()
        },
        {
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "referrer-policy": "no-referrer",
          "content-security-policy": cspHeaderValue
        }
      );
      return;
    }

    if (pathname === "/api/security/csp-report" && method === "POST") {
      if (cspReportStatus === 204) {
        res.writeHead(204);
        res.end();
        return;
      }

      writeJson(res, cspReportStatus, {
        status: cspReportStatus,
        error: "CSP report endpoint failed"
      });
      return;
    }

    if (pathname === "/api/health/db" && method === "GET") {
      writeJson(res, 200, {
        status: "ok",
        database: "ok",
        service: "core64-api",
        durationMs: 12,
        connectionTimeoutMs: 15000,
        target: {
          host: "db.core64.local",
          port: 5432,
          database: "core64"
        },
        time: new Date().toISOString()
      });
      return;
    }

    if (pathname === "/api/public" && method === "GET") {
      writeJson(res, 200, publicPayload);
      return;
    }

    if (pathname === "/api/auth/login" && method === "POST") {
      if (forceLoginUnauthorized) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_INVALID_CREDENTIALS",
          error: "Invalid credentials"
        });
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

    if (pathname === "/api/auth/me" && method === "GET") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          id: "1",
          username: "admin"
        }
      });
      return;
    }

    if (pathname === "/api/settings" && method === "GET") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, { data: settings });
      return;
    }

    if (pathname === "/api/settings/sections" && method === "GET") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          sections
        }
      });
      return;
    }

    if (pathname === "/api/settings/sections" && method === "PUT") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      settingsSectionsPutCount += 1;
      if (rateLimitMode === "trigger" && settingsSectionsPutCount >= 3) {
        writeJson(
          res,
          429,
          {
            status: 429,
            code: "SETTINGS_RATE_LIMITED",
            error: "Too many settings mutations"
          },
          { "retry-after": "1" }
        );
        return;
      }

      writeJson(res, 200, {
        data: {
          sections
        }
      });
      return;
    }

    if (pathname === "/api/settings/bundle" && method === "PUT") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, {
        data: {
          settings,
          sections
        }
      });
      return;
    }

    if (pathname === "/api/releases" && method === "GET") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      writeJson(res, 200, { data: releasesPayload });
      return;
    }

    if (pathname.startsWith("/api/releases/") && method === "PUT") {
      if (authorization !== `Bearer ${authToken}`) {
        writeJson(res, 401, {
          status: 401,
          code: "AUTH_REQUIRED",
          error: "Unauthorized"
        });
        return;
      }

      releasesPutCount += 1;
      if (rateLimitMode === "trigger" && releasesPutCount >= 3) {
        writeJson(
          res,
          429,
          {
            status: 429,
            code: "COLLECTIONS_RATE_LIMITED",
            error: "Too many collection mutations"
          },
          { "retry-after": "1" }
        );
        return;
      }

      writeJson(res, 200, {
        data: {
          ok: true
        }
      });
      return;
    }

    if (pathname === "/api/contact-requests" && method === "POST") {
      writeJson(res, 201, {
        data: {
          id: 1,
          status: "new"
        }
      });
      return;
    }

    writeJson(res, 404, {
      status: 404,
      code: "API_ROUTE_NOT_FOUND",
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

function runSmokeCheck(baseUrl, adminPassword, envOverrides = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [targetScript], {
      env: {
        ...process.env,
        CORE64_API_BASE: baseUrl,
        CORE64_ADMIN_PASSWORD: adminPassword,
        CORE64_SMOKE_TIMEOUT_MS: "5000",
        CORE64_SMOKE_RATE_LIMIT_CHECK: "true",
        CORE64_SMOKE_RATE_LIMIT_ATTEMPTS: "3",
        CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_ATTEMPTS: "3",
        CORE64_SMOKE_CONTACT: "true",
        ...envOverrides
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
    const result = await runSmokeCheck(mock.baseUrl, mock.adminPassword);
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
    expect(report?.checks?.admin?.rateLimitCheck?.ok === true, "happy-path: expected settings rate-limit check ok=true");
    expect(report?.checks?.admin?.rateLimitCollectionsCheck?.ok === true, "happy-path: expected collections rate-limit check ok=true");
  });

  await runCase("missing-csp-report-uri", {
    includeReportUriInCspHeader: false
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `missing-csp-report-uri: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "missing-csp-report-uri: expected passed=false");
    expect(report?.checks?.health?.securityHeaders?.cspReportUriPresent === false, "missing-csp-report-uri: expected cspReportUriPresent=false");
  });

  await runCase("auth-login-failure", {
    forceLoginUnauthorized: true
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `auth-login-failure: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "auth-login-failure: expected passed=false");
    expect(report?.checks?.admin?.tokenIssued === false, "auth-login-failure: expected tokenIssued=false");
  });

  await runCase("rate-limit-not-triggered", {
    rateLimitMode: "never"
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `rate-limit-not-triggered: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "rate-limit-not-triggered: expected passed=false");
    expect(report?.checks?.admin?.rateLimitCheck?.ok === false, "rate-limit-not-triggered: expected settings rate-limit failure");
  });

  await runCase("missing-required-section-key", {
    sectionsMissingRequiredKey: true
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `missing-required-section-key: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "missing-required-section-key: expected passed=false");
    expect(report?.checks?.admin?.settingsSectionsRequiredKeysPresent === false, "missing-required-section-key: expected missing required section key");
  });

  await runCase("csp-report-endpoint-failure", {
    cspReportStatus: 500
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `csp-report-endpoint-failure: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "csp-report-endpoint-failure: expected passed=false");
    expect(report?.checks?.health?.securityHeaders?.cspReportEndpointOk === false, "csp-report-endpoint-failure: expected csp report endpoint failure");
  });

  console.log("smoke-check self-test PASSED");
}

main().catch((error) => {
  console.error("smoke-check self-test failed:", error?.message || error);
  process.exit(1);
});
