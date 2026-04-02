#!/usr/bin/env node

const raw = String(process.env.CLOUD_RUN_SERVICE_JSON || "").trim();

function printFailed() {
  console.log('{"cloudRunNetworkParse":"failed"}');
}

if (!raw) {
  printFailed();
  process.exit(0);
}

try {
  const service = JSON.parse(raw);
  const annotations = service?.spec?.template?.metadata?.annotations || {};

  const vpcAccessConnector = typeof annotations["run.googleapis.com/vpc-access-connector"] === "string"
    ? annotations["run.googleapis.com/vpc-access-connector"]
    : null;

  const vpcAccessEgress = typeof annotations["run.googleapis.com/vpc-access-egress"] === "string"
    ? annotations["run.googleapis.com/vpc-access-egress"]
    : null;

  let hint = "VPC connector is configured. Verify connector network route/firewall and DB host reachability.";

  if (!vpcAccessConnector) {
    hint = "No VPC connector configured. If DB endpoint is private, configure connector/egress routing.";
  } else if (vpcAccessEgress === "private-ranges-only") {
    hint = "VPC egress is private-ranges-only. Ensure DB host resolves to private range or switch to all-traffic.";
  } else if (vpcAccessEgress === "all-traffic") {
    hint = "VPC egress routes all traffic through connector. Verify connector network/firewall/NAT to DB host:port.";
  }

  console.log(
    JSON.stringify(
      {
        vpcAccessConnector,
        vpcAccessEgress,
        hint
      },
      null,
      2
    )
  );
} catch {
  printFailed();
}
