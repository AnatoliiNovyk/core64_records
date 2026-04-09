#!/usr/bin/env node

import fs from "node:fs";
import { execFileSync } from "node:child_process";

const REQUIRED_SECTION_GROUPS = [
  {
    key: "previous_state",
    description: "previous state",
    aliases: [
      "як було",
      "previous state",
      "before"
    ]
  },
  {
    key: "what_changed",
    description: "what changed",
    aliases: [
      "що зроблено",
      "що було зроблено",
      "what changed",
      "changes applied",
      "added"
    ]
  },
  {
    key: "impact",
    description: "improvement/fix/addition result",
    aliases: [
      "що покращило виправило додало",
      "що покращило",
      "що це покращило виправило додало",
      "що це покращило",
      "що це виправило",
      "what it improved fixed added",
      "impact",
      "result",
      "results"
    ]
  }
];

function parseArgs(argv) {
  const options = {
    base: "HEAD~1",
    head: "HEAD",
    asJson: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--json") {
      options.asJson = true;
      continue;
    }

    if (arg.startsWith("--base=")) {
      options.base = arg.slice("--base=".length).trim();
      continue;
    }

    if (arg === "--base") {
      options.base = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }

    if (arg.startsWith("--head=")) {
      options.head = arg.slice("--head=".length).trim();
      continue;
    }

    if (arg === "--head") {
      options.head = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.base) {
    throw new Error("--base must be a non-empty git ref.");
  }

  if (!options.head) {
    throw new Error("--head must be a non-empty git ref.");
  }

  return options;
}

function runGit(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trimEnd();
}

function resolveCommitRef(refName, optionName) {
  try {
    return runGit(["rev-parse", "--verify", `${refName}^{commit}`]);
  } catch (_error) {
    throw new Error(`${optionName} references an unknown commit: ${refName}`);
  }
}

function toUnixPath(value) {
  return String(value || "").replace(/\\/g, "/").trim();
}

function isChangelogMarkdownPath(filePath) {
  const normalized = toUnixPath(filePath).toLowerCase();
  return normalized.startsWith("changelogs/") && normalized.endsWith(".md");
}

function getChangedChangelogFiles(baseCommit, headCommit) {
  const output = runGit(["diff", "--name-only", "--diff-filter=ACMR", `${baseCommit}..${headCommit}`, "--", "changelogs"]);
  if (!output) {
    return [];
  }

  const unique = new Set(
    output
      .split(/\r?\n/)
      .map((line) => toUnixPath(line))
      .filter(Boolean)
      .filter((filePath) => isChangelogMarkdownPath(filePath))
  );

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

function normalizeHeading(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[`'’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function headingMatchesGroup(normalizedHeading, aliases) {
  return aliases.some((alias) => {
    const normalizedAlias = normalizeHeading(alias);
    return normalizedHeading === normalizedAlias || normalizedHeading.startsWith(`${normalizedAlias} `);
  });
}

function getMarkdownHeadings(content) {
  const headings = [];
  const headingPattern = /^##\s+(.+?)\s*$/gim;

  for (const match of content.matchAll(headingPattern)) {
    headings.push(String(match[1] || "").trim());
  }

  return headings;
}

function evaluateChangelogFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return {
      filePath,
      exists: false,
      headings: [],
      missingGroups: REQUIRED_SECTION_GROUPS.map((group) => group.key),
      matchedGroups: {},
      passed: false,
      error: "File does not exist in the current working tree"
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const headings = getMarkdownHeadings(content);
  const normalizedHeadings = headings.map((heading) => normalizeHeading(heading));

  const matchedGroups = {};
  const missingGroups = [];

  for (const group of REQUIRED_SECTION_GROUPS) {
    const matchedIndex = normalizedHeadings.findIndex((heading) => headingMatchesGroup(heading, group.aliases));
    if (matchedIndex >= 0) {
      matchedGroups[group.key] = headings[matchedIndex];
      continue;
    }

    matchedGroups[group.key] = "";
    missingGroups.push(group.key);
  }

  return {
    filePath,
    exists: true,
    headings,
    missingGroups,
    matchedGroups,
    passed: missingGroups.length === 0,
    error: ""
  };
}

function printHumanReport(report) {
  console.log(`Changelog format verification for range ${report.baseRef}..${report.headRef}`);
  console.log(`Resolved range: ${report.baseCommit}..${report.headCommit}`);
  console.log(`Changed changelog files scanned: ${report.fileCount}`);

  if (report.fileCount === 0) {
    console.log("PASS: no changed changelog markdown files found in selected range.");
    return;
  }

  for (const entry of report.files) {
    if (entry.passed) {
      console.log(`- [PASS] ${entry.filePath}`);
      continue;
    }

    const missingDescriptions = entry.missingGroups.map((groupKey) => {
      const group = REQUIRED_SECTION_GROUPS.find((item) => item.key === groupKey);
      return group ? group.description : groupKey;
    });

    console.log(`- [FAIL] ${entry.filePath}`);
    if (entry.error) {
      console.log(`  reason: ${entry.error}`);
    }
    console.log(`  missing sections: ${missingDescriptions.join(", ")}`);
    if (entry.headings.length > 0) {
      console.log(`  detected headings: ${entry.headings.join(" | ")}`);
    }
  }

  if (report.passed) {
    console.log("Changelog format verification PASSED.");
    return;
  }

  console.log("Changelog format verification FAILED.");
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const baseCommit = resolveCommitRef(options.base, "--base");
  const headCommit = resolveCommitRef(options.head, "--head");

  const changedFiles = getChangedChangelogFiles(baseCommit, headCommit);
  const files = changedFiles.map((filePath) => evaluateChangelogFile(filePath));
  const failedFiles = files.filter((entry) => !entry.passed);

  const report = {
    baseRef: options.base,
    headRef: options.head,
    baseCommit,
    headCommit,
    fileCount: files.length,
    failedCount: failedFiles.length,
    passed: failedFiles.length === 0,
    files,
    failedFiles
  };

  if (options.asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (!report.passed) {
    process.exit(1);
  }
}

try {
  run();
} catch (error) {
  console.error("Changelog format verification failed:", error?.message || error);
  process.exit(1);
}
