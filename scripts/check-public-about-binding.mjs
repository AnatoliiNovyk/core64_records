#!/usr/bin/env node

function parseArgs(argv) {
  const args = { publicUrl: "" };

  for (let i = 2; i < argv.length; i += 1) {
    const current = String(argv[i] || "").trim();
    if (!current) continue;

    if (current.startsWith("--public-url=")) {
      args.publicUrl = current.slice("--public-url=".length).trim();
      continue;
    }

    if (current === "--public-url") {
      const next = String(argv[i + 1] || "").trim();
      if (next) {
        args.publicUrl = next;
        i += 1;
      }
    }
  }

  return args;
}

function pickFirstHttpUrl(raw) {
  const tokens = String(raw || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (/^https?:\/\//i.test(token)) {
      return token;
    }
  }

  return "";
}

function toOrigin(rawUrl) {
  const candidate = pickFirstHttpUrl(rawUrl);
  if (!candidate) return "";

  try {
    return new URL(candidate).origin;
  } catch {
    return "";
  }
}

async function getText(url) {
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache"
    }
  });

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    text
  };
}

function done(payload, exitCode = 0) {
  console.log(JSON.stringify(payload, null, 2));
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

const args = parseArgs(process.argv);
const sourceRaw = args.publicUrl || process.env.CORE64_PUBLIC_URL || process.env.CORS_ORIGIN || "";
const targetOrigin = toOrigin(sourceRaw);

if (!targetOrigin) {
  done(
    {
      ok: false,
      reason: "invalid_or_missing_public_url",
      hint: "Pass --public-url=https://example.com or CORE64_PUBLIC_URL/CORS_ORIGIN env with an http(s) URL."
    },
    1
  );
}

const indexUrl = `${targetOrigin}/`;
const appJsUrl = `${targetOrigin}/app.js`;

let indexResponse;
let appJsResponse;

try {
  [indexResponse, appJsResponse] = await Promise.all([getText(indexUrl), getText(appJsUrl)]);
} catch (error) {
  done(
    {
      ok: false,
      reason: "network_error",
      targetOrigin,
      error: String(error?.message || error || "unknown_error")
    },
    1
  );
}

const indexHasAboutMarker = /id=["']public-section-title-about["']/i.test(indexResponse.text);
const appJsHasAboutSelector = /public-section-title-about/.test(appJsResponse.text);
const appJsHasSettingsTitleBinding = /settings\.title/.test(appJsResponse.text);

const ok = indexResponse.ok
  && appJsResponse.ok
  && indexHasAboutMarker
  && appJsHasAboutSelector
  && appJsHasSettingsTitleBinding;

done(
  {
    ok,
    targetOrigin,
    urls: {
      indexUrl,
      appJsUrl
    },
    http: {
      indexStatus: indexResponse.status,
      appJsStatus: appJsResponse.status
    },
    checks: {
      indexHasAboutMarker,
      appJsHasAboutSelector,
      appJsHasSettingsTitleBinding
    }
  },
  ok ? 0 : 1
);
