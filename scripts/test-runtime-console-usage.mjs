#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const routesDir = path.join(repoRoot, "backend", "src", "routes");
const serverFile = path.join(repoRoot, "backend", "src", "server.js");
const CONSOLE_PATTERN = /\bconsole\.(log|warn|error)\s*\(/;

function collectJavaScriptFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function scanForRuntimeConsoleUsage(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (CONSOLE_PATTERN.test(lines[index])) {
      violations.push({
        line: index + 1,
        source: lines[index].trim()
      });
    }
  }

  return violations;
}

function toRepoRelative(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function main() {
  if (!fs.existsSync(routesDir) || !fs.existsSync(serverFile)) {
    throw new Error("Expected backend runtime files were not found.");
  }

  const targetFiles = [
    serverFile,
    ...collectJavaScriptFiles(routesDir)
  ];

  const allViolations = [];
  for (const filePath of targetFiles) {
    const violations = scanForRuntimeConsoleUsage(filePath);
    if (violations.length > 0) {
      allViolations.push({
        file: toRepoRelative(filePath),
        violations
      });
    }
  }

  if (allViolations.length > 0) {
    console.error("runtime console usage test failed:");
    for (const fileResult of allViolations) {
      for (const violation of fileResult.violations) {
        console.error(`- ${fileResult.file}:${violation.line} ${violation.source}`);
      }
    }
    process.exit(1);
  }

  console.log("runtime console usage self-test PASSED");
}

try {
  main();
} catch (error) {
  console.error("runtime console usage self-test failed:", error?.message || error);
  process.exit(1);
}
