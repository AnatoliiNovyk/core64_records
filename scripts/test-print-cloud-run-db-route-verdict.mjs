#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./print-cloud-run-db-route-verdict.mjs");

function runCase(name, serviceJson, databaseUrl, strict = false) {
  const args = [targetScript];
  if (strict) args.push("--strict");

  const result = spawnSync(process.execPath, args, {
    env: {
      ...process.env,
      CLOUD_RUN_SERVICE_JSON: serviceJson,
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

const withConnectorAllTraffic = JSON.stringify({
  spec: {
    template: {
      metadata: {
        annotations: {
          "run.googleapis.com/vpc-access-connector": "projects/demo/locations/us-central1/connectors/core64",
          "run.googleapis.com/vpc-access-egress": "all-traffic"
        }
      }
    }
  }
});

const withoutConnector = JSON.stringify({ spec: { template: { metadata: { annotations: {} } } } });

const withConnectorPrivateRanges = JSON.stringify({
  spec: {
    template: {
      metadata: {
        annotations: {
          "run.googleapis.com/vpc-access-connector": "projects/demo/locations/us-central1/connectors/core64",
          "run.googleapis.com/vpc-access-egress": "private-ranges-only"
        }
      }
    }
  }
});

function main() {
  const compatibleCase = runCase(
    "compatible-all-traffic-public-host",
    withConnectorAllTraffic,
    "postgresql://user:pass@db.example.com:5432/core64?sslmode=require",
    true
  );
  expect(compatibleCase.code === 0, `compatible-all-traffic-public-host: expected exit 0, got ${compatibleCase.code}`);
  const compatibleJson = parseJson(compatibleCase.stdout, "compatible-all-traffic-public-host");
  expect(compatibleJson.routeVerdict === "compatible", "compatible-all-traffic-public-host: verdict mismatch");

  const missingConnectorForPrivateIp = runCase(
    "missing-connector-private-ip",
    withoutConnector,
    "postgresql://user:pass@10.20.30.40:5432/core64?sslmode=require",
    true
  );
  expect(missingConnectorForPrivateIp.code === 1, `missing-connector-private-ip: expected exit 1, got ${missingConnectorForPrivateIp.code}`);
  const missingConnectorJson = parseJson(missingConnectorForPrivateIp.stdout, "missing-connector-private-ip");
  expect(missingConnectorJson.routeVerdict === "incompatible", "missing-connector-private-ip: verdict mismatch");

  const privateRangesWithPublicIp = runCase(
    "private-ranges-public-ip",
    withConnectorPrivateRanges,
    "postgresql://user:pass@35.201.1.2:5432/core64?sslmode=require",
    true
  );
  expect(privateRangesWithPublicIp.code === 1, `private-ranges-public-ip: expected exit 1, got ${privateRangesWithPublicIp.code}`);
  const privateRangesJson = parseJson(privateRangesWithPublicIp.stdout, "private-ranges-public-ip");
  expect(privateRangesJson.routeVerdict === "incompatible", "private-ranges-public-ip: verdict mismatch");

  const invalidInput = runCase("invalid-service-json", "{broken-json", "postgresql://user:pass@db.example.com:5432/core64", true);
  expect(invalidInput.code === 1, `invalid-service-json: expected exit 1, got ${invalidInput.code}`);
  const invalidJson = parseJson(invalidInput.stdout, "invalid-service-json");
  expect(invalidJson.routeVerdict === "unknown", "invalid-service-json: expected unknown verdict");

  console.log("print-cloud-run-db-route-verdict self-test PASSED");
}

main();
