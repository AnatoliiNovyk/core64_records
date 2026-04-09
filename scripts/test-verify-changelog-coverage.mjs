#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./verify-changelog-coverage.mjs");

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

function runGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });

  if ((result.status ?? 1) !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${String(result.stderr || result.stdout || "").trim()}`);
  }

  return String(result.stdout || "").trim();
}

function writeFile(repoDir, relativePath, content) {
  const filePath = path.join(repoDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function commitAll(repoDir, message) {
  runGit(repoDir, ["add", "."]);
  runGit(repoDir, ["commit", "-m", message]);
  return runGit(repoDir, ["rev-parse", "HEAD"]);
}

function runVerifier(cwd, baseRef, headRef, options = {}) {
  const args = [targetScript, "--base", baseRef, "--head", headRef];
  if (options.asJson) {
    args.push("--json");
  }

  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8"
  });

  return {
    code: result.status ?? 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

function createTemporaryRepository() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "core64-changelog-coverage-test-"));

  runGit(repoDir, ["init", "-q"]);
  runGit(repoDir, ["config", "user.email", "core64-test@example.com"]);
  runGit(repoDir, ["config", "user.name", "CORE64 Test"]);

  writeFile(repoDir, "README.md", "# temp test repo\n");
  const initialCommit = commitAll(repoDir, "chore: init test repo");

  return {
    repoDir,
    initialCommit
  };
}

function runInvalidArgCase(cwd) {
  const result = spawnSync(process.execPath, [targetScript, "--invalid-arg"], {
    cwd,
    encoding: "utf8"
  });

  return {
    code: result.status ?? 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

function main() {
  let repoDir = "";

  try {
    const setup = createTemporaryRepository();
    repoDir = setup.repoDir;

    writeFile(repoDir, "src/feature.js", "export const feature = () => 'ok';\n");
    writeFile(
      repoDir,
      "changelogs/2026-04-09-coverage-valid.md",
      [
        "# Covered Commit",
        "",
        "## Як було",
        "- Не було покриття.",
        "",
        "## Що зроблено",
        "- Додано покритий implementation commit.",
        "",
        "## Що покращило/виправило/додало",
        "- Додало прозорий трекінг змін.",
        ""
      ].join("\n")
    );
    const coveredCommit = commitAll(repoDir, "feat: add covered implementation");

    writeFile(repoDir, "src/uncovered.js", "export const uncovered = () => 'missing';\n");
    const uncoveredCommit = commitAll(repoDir, "fix: implementation without changelog");

    writeFile(repoDir, "docs/guide.md", "# Guide\n\nDocumentation-only update.\n");
    const docsOnlyCommit = commitAll(repoDir, "docs: add guide update");

    const coveredCase = runVerifier(repoDir, setup.initialCommit, coveredCommit);
    expect(coveredCase.code === 0, `covered-case: expected exit 0, got ${coveredCase.code}`);
    expect(coveredCase.stdout.includes("Changelog coverage verification PASSED."), "covered-case: missing PASS message");
    expect(coveredCase.stdout.includes("implementation changes + changelog present"), "covered-case: missing covered reason");

    const uncoveredCase = runVerifier(repoDir, coveredCommit, uncoveredCommit);
    expect(uncoveredCase.code === 1, `uncovered-case: expected exit 1, got ${uncoveredCase.code}`);
    expect(uncoveredCase.stdout.includes("Changelog coverage verification FAILED."), "uncovered-case: missing FAILED message");
    expect(uncoveredCase.stdout.includes("implementation changes without changelog"), "uncovered-case: missing uncovered reason");
    expect(uncoveredCase.stdout.includes("Uncovered commits:"), "uncovered-case: missing uncovered commits list");

    const docsOnlyCase = runVerifier(repoDir, uncoveredCommit, docsOnlyCommit);
    expect(docsOnlyCase.code === 0, `docs-only-case: expected exit 0, got ${docsOnlyCase.code}`);
    expect(docsOnlyCase.stdout.includes("documentation-only commit"), "docs-only-case: missing documentation-only reason");

    const emptyRangeCase = runVerifier(repoDir, docsOnlyCommit, docsOnlyCommit);
    expect(emptyRangeCase.code === 0, `empty-range-case: expected exit 0, got ${emptyRangeCase.code}`);
    expect(
      emptyRangeCase.stdout.includes("PASS: no non-merge commits found in the selected range."),
      "empty-range-case: missing empty-range PASS message"
    );

    const invalidRefCase = runVerifier(repoDir, "nonexistent-ref", "HEAD");
    expect(invalidRefCase.code === 1, `invalid-ref-case: expected exit 1, got ${invalidRefCase.code}`);
    expect(invalidRefCase.stderr.includes("unknown commit"), "invalid-ref-case: missing unknown commit error");

    const invalidArgCase = runInvalidArgCase(repoDir);
    expect(invalidArgCase.code === 1, `invalid-arg-case: expected exit 1, got ${invalidArgCase.code}`);
    expect(invalidArgCase.stderr.includes("Unknown argument"), "invalid-arg-case: missing unknown argument error");

    const jsonCase = runVerifier(repoDir, setup.initialCommit, coveredCommit, { asJson: true });
    expect(jsonCase.code === 0, `json-case: expected exit 0, got ${jsonCase.code}`);
    const report = parseJson(jsonCase.stdout, "json-case");
    expect(report.passed === true, "json-case: expected passed=true");
    expect(report.uncoveredCount === 0, `json-case: expected uncoveredCount=0, got ${report.uncoveredCount}`);
    expect(report.commitCount === 1, `json-case: expected commitCount=1, got ${report.commitCount}`);
    expect(Array.isArray(report.commits) && report.commits.length === 1, "json-case: expected one commit entry");
    expect(report.commits[0].hasChangelog === true, "json-case: expected hasChangelog=true");
    expect(report.commits[0].hasImplementationChanges === true, "json-case: expected hasImplementationChanges=true");
    expect(report.commits[0].covered === true, "json-case: expected covered=true");

    console.log("verify-changelog-coverage self-test PASSED");
  } finally {
    if (repoDir) {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  }
}

try {
  main();
} catch (error) {
  console.error("verify-changelog-coverage self-test failed:", error?.message || error);
  process.exit(1);
}
