#!/usr/bin/env node

import { LOG_REDACTED_VALUE, sanitizeForLog } from "../backend/src/utils/logSanitizer.js";

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testSensitiveKeyRedaction() {
  const sanitized = sanitizeForLog({
    password: "my-secret",
    nested: {
      authorization: "Bearer abc123",
      apiToken: "token-value",
      safe: "ok"
    }
  });

  expect(sanitized.password === LOG_REDACTED_VALUE, "password key should be redacted");
  expect(sanitized.nested.authorization === LOG_REDACTED_VALUE, "authorization key should be redacted");
  expect(sanitized.nested.apiToken === LOG_REDACTED_VALUE, "apiToken key should be redacted");
  expect(sanitized.nested.safe === "ok", "non-sensitive keys should stay unchanged");
}

function testDataUrlAndStringTruncation() {
  const sanitized = sanitizeForLog({
    previewImage: `data:image/png;base64,${"a".repeat(120)}`,
    message: "x".repeat(90)
  }, {
    maxStringLength: 40
  });

  expect(
    String(sanitized.previewImage).startsWith("[DATA_URL:image/png;length="),
    "data URL should be summarized"
  );
  expect(String(sanitized.message).includes("[TRUNCATED:"), "long strings should be truncated");
}

function testDepthAndCollectionLimits() {
  const sanitizedDepth = sanitizeForLog({
    l1: {
      l2: {
        l3: {
          l4: {
            value: "too deep"
          }
        }
      }
    }
  }, {
    maxDepth: 3
  });

  expect(sanitizedDepth.l1.l2.l3.l4 === "[TRUNCATED_DEPTH]", "deep nested values should be truncated by depth");

  const sanitizedArray = sanitizeForLog({ items: [1, 2, 3, 4] }, { maxArrayLength: 2 });
  expect(Array.isArray(sanitizedArray.items), "items should stay an array");
  expect(sanitizedArray.items.length === 3, "truncated array should include marker entry");
  expect(sanitizedArray.items[2] === "[TRUNCATED_ARRAY:2]", "array truncation marker should show trimmed count");

  const sanitizedObject = sanitizeForLog({ a: 1, b: 2, c: 3, d: 4 }, { maxObjectKeys: 2 });
  expect(sanitizedObject.__truncatedKeys === 2, "object truncation should report trimmed key count");
}

function testEmbeddedErrorSanitization() {
  const error = new Error("Top secret failure details");
  error.jwtSecret = "should-not-leak";

  const sanitized = sanitizeForLog({ error }, { maxStringLength: 60 });

  expect(sanitized.error.name === "Error", "error name should be preserved");
  expect(String(sanitized.error.message).includes("Top secret failure details"), "error message should be present");
  expect(sanitized.error.jwtSecret === LOG_REDACTED_VALUE, "sensitive error fields should be redacted");
}

function main() {
  testSensitiveKeyRedaction();
  testDataUrlAndStringTruncation();
  testDepthAndCollectionLimits();
  testEmbeddedErrorSanitization();
  console.log("log-sanitizer self-test PASSED");
}

try {
  main();
} catch (error) {
  console.error("log-sanitizer self-test failed:", error?.message || error);
  process.exit(1);
}
