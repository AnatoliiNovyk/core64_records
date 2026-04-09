#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetScript = path.resolve(__dirname, "./verify-changelog-format.mjs");

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
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "core64-changelog-format-test-"));

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

function main() {
  let repoDir = "";

  try {
    const setup = createTemporaryRepository();
    repoDir = setup.repoDir;

    writeFile(
      repoDir,
      "changelogs/2026-04-09-test-valid.md",
      [
        "# Test Valid Changelog",
        "",
        "## Як було",
        "- Було старе правило.",
        "",
        "## Що зроблено",
        "- Додано нову перевірку.",
        "",
        "## Що покращило/виправило/додало",
        "- Покращило якість gate.",
        ""
      ].join("\n")
    );
    const validCommit = commitAll(repoDir, "docs: add valid changelog");

    writeFile(
      repoDir,
      "changelogs/2026-04-09-test-invalid.md",
      [
        "# Test Invalid Changelog",
        "",
        "## Як було",
        "- Було старе правило.",
        "",
        "## Що зроблено",
        "- Зроблено часткову зміну.",
        ""
      ].join("\n")
    );
    const invalidCommit = commitAll(repoDir, "docs: add invalid changelog");

    writeFile(repoDir, "README.md", "# temp test repo\n\nminor docs update\n");
    const noChangelogCommit = commitAll(repoDir, "docs: update readme only");

    const validCase = runVerifier(repoDir, setup.initialCommit, validCommit);
    expect(validCase.code === 0, `valid-case: expected exit 0, got ${validCase.code}`);
    expect(validCase.stdout.includes("Changelog format verification PASSED."), "valid-case: missing PASS message");

    const invalidCase = runVerifier(repoDir, validCommit, invalidCommit);
    expect(invalidCase.code === 1, `invalid-case: expected exit 1, got ${invalidCase.code}`);
    expect(invalidCase.stdout.includes("Changelog format verification FAILED."), "invalid-case: missing FAILED message");
    expect(invalidCase.stdout.includes("missing sections:"), "invalid-case: missing missing-sections details");

    const emptyRangeCase = runVerifier(repoDir, invalidCommit, noChangelogCommit);
    expect(emptyRangeCase.code === 0, `empty-range: expected exit 0, got ${emptyRangeCase.code}`);
    expect(
      emptyRangeCase.stdout.includes("PASS: no changed changelog markdown files found in selected range."),
      "empty-range: expected no-changes PASS message"
    );

    const jsonCase = runVerifier(repoDir, setup.initialCommit, validCommit, { asJson: true });
    expect(jsonCase.code === 0, `json-case: expected exit 0, got ${jsonCase.code}`);
    const jsonReport = parseJson(jsonCase.stdout, "json-case");
    expect(jsonReport.passed === true, "json-case: expected passed=true");
    expect(jsonReport.fileCount === 1, `json-case: expected fileCount=1, got ${jsonReport.fileCount}`);
    expect(Array.isArray(jsonReport.files) && jsonReport.files.length === 1, "json-case: expected one file entry");
    expect(jsonReport.files[0].passed === true, "json-case: expected file passed=true");

    console.log("verify-changelog-format self-test PASSED");
  } finally {
    if (repoDir) {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  }
}

try {
  main();
} catch (error) {
  console.error("verify-changelog-format self-test failed:", error?.message || error);
  process.exit(1);
}
