#!/usr/bin/env node

import { execFileSync } from "node:child_process";

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

function toUnixPath(value) {
  return String(value || "").replace(/\\/g, "/").trim();
}

function isChangelogPath(filePath) {
  return toUnixPath(filePath).toLowerCase().startsWith("changelogs/");
}

function isDocumentationPath(filePath) {
  const normalized = toUnixPath(filePath).toLowerCase();
  return isChangelogPath(normalized) || normalized.endsWith(".md");
}

function resolveCommitRef(refName, optionName) {
  try {
    return runGit(["rev-parse", "--verify", `${refName}^{commit}`]);
  } catch (_error) {
    throw new Error(`${optionName} references an unknown commit: ${refName}`);
  }
}

function getCommitsInRange(baseCommit, headCommit) {
  const output = runGit(["rev-list", "--no-merges", "--reverse", `${baseCommit}..${headCommit}`]);
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCommitSubject(commitSha) {
  return runGit(["show", "-s", "--format=%s", commitSha]);
}

function getCommitFiles(commitSha) {
  const output = runGit(["show", "--name-only", "--pretty=format:", commitSha]);
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => toUnixPath(line))
    .filter(Boolean);
}

function evaluateCommit(commitSha) {
  const files = getCommitFiles(commitSha);
  const hasChangelog = files.some((filePath) => isChangelogPath(filePath));
  const hasImplementationChanges = files.some((filePath) => !isDocumentationPath(filePath));
  const needsChangelogCoverage = hasImplementationChanges;
  const covered = !needsChangelogCoverage || hasChangelog;

  return {
    commit: commitSha,
    subject: getCommitSubject(commitSha),
    files,
    hasChangelog,
    hasImplementationChanges,
    needsChangelogCoverage,
    covered
  };
}

function printHumanReport(report) {
  console.log(`Changelog coverage verification for range ${report.baseRef}..${report.headRef}`);
  console.log(`Resolved range: ${report.baseCommit}..${report.headCommit}`);
  console.log(`Commits scanned: ${report.commits.length}`);

  if (report.commits.length === 0) {
    console.log("PASS: no non-merge commits found in the selected range.");
    return;
  }

  for (const entry of report.commits) {
    const shortSha = entry.commit.slice(0, 7);
    const status = entry.covered ? "PASS" : "FAIL";
    const reason = entry.needsChangelogCoverage
      ? (entry.hasChangelog ? "implementation changes + changelog present" : "implementation changes without changelog")
      : "documentation-only commit";

    console.log(`- [${status}] ${shortSha} ${entry.subject} (${reason})`);
  }

  if (report.passed) {
    console.log("Changelog coverage verification PASSED.");
    return;
  }

  console.log("Changelog coverage verification FAILED.");
  console.log("Uncovered commits:");
  for (const entry of report.uncoveredCommits) {
    console.log(`- ${entry.commit.slice(0, 7)} ${entry.subject}`);
  }
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const baseCommit = resolveCommitRef(options.base, "--base");
  const headCommit = resolveCommitRef(options.head, "--head");

  const commits = getCommitsInRange(baseCommit, headCommit).map((commitSha) => evaluateCommit(commitSha));
  const uncoveredCommits = commits.filter((entry) => entry.needsChangelogCoverage && !entry.covered);
  const report = {
    baseRef: options.base,
    headRef: options.head,
    baseCommit,
    headCommit,
    commitCount: commits.length,
    uncoveredCount: uncoveredCommits.length,
    passed: uncoveredCommits.length === 0,
    commits,
    uncoveredCommits
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
  console.error("Changelog coverage verification failed:", error?.message || error);
  process.exit(1);
}
