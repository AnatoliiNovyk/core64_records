#!/usr/bin/env node

import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./check-settings-i18n-consistency.mjs");

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

async function createMockServer(options = {}) {
  const {
    publicUkOverrides = {},
    publicEnOverrides = {}
  } = options;

  const adminPassword = "test-admin-password";
  const authToken = "test-token";

  const sharedAdminSettings = {
    headerLogoUrl: "https://cdn.example.com/header-logo.png",
    footerLogoUrl: "/images/footer-logo.png",
    contactCaptchaErrorMessage: "Captcha error",
    contactCaptchaMissingTokenMessage: "Captcha required",
    contactCaptchaInvalidDomainMessage: "Captcha domain invalid",
    heroSubtitleUk: "UA subtitle",
    heroSubtitleEn: "EN subtitle"
  };

  const adminUkSettings = {
    ...sharedAdminSettings,
    title: "CORE64 Title UK",
    about: "CORE64 About UK",
    mission: "CORE64 Mission UK"
  };

  const adminEnSettings = {
    ...sharedAdminSettings,
    title: "CORE64 Title EN",
    about: "CORE64 About EN",
    mission: "CORE64 Mission EN"
  };

  const publicUkSettings = {
    title: adminUkSettings.title,
    about: adminUkSettings.about,
    mission: adminUkSettings.mission,
    headerLogoUrl: adminUkSettings.headerLogoUrl,
    footerLogoUrl: adminUkSettings.footerLogoUrl,
    contactCaptchaErrorMessage: adminUkSettings.contactCaptchaErrorMessage,
    contactCaptchaMissingTokenMessage: adminUkSettings.contactCaptchaMissingTokenMessage,
    contactCaptchaInvalidDomainMessage: adminUkSettings.contactCaptchaInvalidDomainMessage,
    heroSubtitle: adminUkSettings.heroSubtitleUk,
    ...publicUkOverrides
  };

  const publicEnSettings = {
    title: adminEnSettings.title,
    about: adminEnSettings.about,
    mission: adminEnSettings.mission,
    headerLogoUrl: adminEnSettings.headerLogoUrl,
    footerLogoUrl: adminEnSettings.footerLogoUrl,
    contactCaptchaErrorMessage: adminEnSettings.contactCaptchaErrorMessage,
    contactCaptchaMissingTokenMessage: adminEnSettings.contactCaptchaMissingTokenMessage,
    contactCaptchaInvalidDomainMessage: adminEnSettings.contactCaptchaInvalidDomainMessage,
    heroSubtitle: adminEnSettings.heroSubtitleEn,
    ...publicEnOverrides
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;

    if (pathname === "/api/auth/login" && req.method === "POST") {
      let body = null;
      try {
        body = await new Promise((resolve) => {
          let raw = "";
          req.on("data", (chunk) => {
            raw += chunk;
          });
          req.on("end", () => {
            resolve(raw ? JSON.parse(raw) : null);
          });
        });
      } catch {
        body = null;
      }

      const password = String(body?.password || "");
      if (password !== adminPassword) {
        writeJson(res, 401, { error: "Invalid credentials" });
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

      const lang = String(url.searchParams.get("lang") || "uk").trim().toLowerCase();
      const settings = lang === "en" ? adminEnSettings : adminUkSettings;

      writeJson(res, 200, {
        data: settings
      });
      return;
    }

    if (pathname === "/api/public" && req.method === "GET") {
      const lang = String(url.searchParams.get("lang") || "uk").trim().toLowerCase();
      const settings = lang === "en" ? publicEnSettings : publicUkSettings;

      writeJson(res, 200, {
        data: {
          settings
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

function runChecker(baseUrl, adminPassword) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [targetScript], {
      env: {
        ...process.env,
        CORE64_API_BASE: baseUrl,
        CORE64_ADMIN_PASSWORD: adminPassword,
        CORE64_CONSISTENCY_TIMEOUT_MS: "5000"
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
    const result = await runChecker(mock.baseUrl, mock.adminPassword);
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
    expect(Array.isArray(report?.mismatches) && report.mismatches.length === 0, "happy-path: expected no mismatches");
  });

  await runCase("hero-subtitle-mismatch", {
    publicEnOverrides: {
      heroSubtitle: "DIFFERENT HERO"
    }
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `hero-subtitle-mismatch: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "hero-subtitle-mismatch: expected passed=false");
    const hasHeroMismatch = Array.isArray(report?.mismatches)
      && report.mismatches.some((entry) => entry.field === "heroSubtitle");
    expect(hasHeroMismatch, "hero-subtitle-mismatch: expected heroSubtitle mismatch entry");
  });

  await runCase("cross-language-title-bleed", {
    publicEnOverrides: {
      title: "CORE64 Title UK"
    }
  }, ({ result, report }) => {
    expect(
      result.code === 1,
      `cross-language-title-bleed: expected exit 1, got ${result.code}; stderr=${result.stderr}; stdout=${result.stdout}`
    );
    expect(report?.passed === false, "cross-language-title-bleed: expected passed=false");
    const hasTitleMismatch = Array.isArray(report?.mismatches)
      && report.mismatches.some((entry) => entry.field === "title" && entry.actual === "CORE64 Title UK");
    expect(hasTitleMismatch, "cross-language-title-bleed: expected title mismatch entry with UK bleed value");
  });

  console.log("check-settings-i18n-consistency self-test PASSED");
}

main().catch((error) => {
  console.error("check-settings-i18n-consistency self-test failed:", error?.message || error);
  process.exit(1);
});
