#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./print-cloud-run-network-hint.mjs");

function runCase(name, serviceJson) {
  const result = spawnSync(process.execPath, [targetScript], {
    env: {
      ...process.env,
      CLOUD_RUN_SERVICE_JSON: serviceJson
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
  const privateRangesOnly = runCase(
    "private-ranges-only",
    JSON.stringify({
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
    })
  );
  expect(privateRangesOnly.code === 0, `private-ranges-only: expected exit 0, got ${privateRangesOnly.code}`);
  const privateJson = parseJson(privateRangesOnly.stdout, "private-ranges-only");
  expect(privateJson.vpcAccessConnector, "private-ranges-only: connector missing");
  expect(privateJson.vpcAccessEgress === "private-ranges-only", "private-ranges-only: egress mismatch");
  expect(
    String(privateJson.hint || "").includes("private range") || String(privateJson.hint || "").includes("private-ranges-only"),
    "private-ranges-only: hint mismatch"
  );

  const allTraffic = runCase(
    "all-traffic",
    JSON.stringify({
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
    })
  );
  expect(allTraffic.code === 0, `all-traffic: expected exit 0, got ${allTraffic.code}`);
  const allTrafficJson = parseJson(allTraffic.stdout, "all-traffic");
  expect(allTrafficJson.vpcAccessEgress === "all-traffic", "all-traffic: egress mismatch");
  expect(String(allTrafficJson.hint || "").includes("all traffic"), "all-traffic: hint mismatch");

  const noConnector = runCase("no-connector", JSON.stringify({ spec: { template: { metadata: { annotations: {} } } } }));
  expect(noConnector.code === 0, `no-connector: expected exit 0, got ${noConnector.code}`);
  const noConnectorJson = parseJson(noConnector.stdout, "no-connector");
  expect(noConnectorJson.vpcAccessConnector === null, "no-connector: expected null connector");
  expect(
    String(noConnectorJson.hint || "").includes("No VPC connector"),
    "no-connector: hint mismatch"
  );

  const invalidJson = runCase("invalid-json", "{not-json");
  expect(invalidJson.code === 0, `invalid-json: expected exit 0, got ${invalidJson.code}`);
  const invalidJsonPayload = parseJson(invalidJson.stdout, "invalid-json");
  expect(invalidJsonPayload.cloudRunNetworkParse === "failed", "invalid-json: expected parse failed payload");

  console.log("print-cloud-run-network-hint self-test PASSED");
}

main();
