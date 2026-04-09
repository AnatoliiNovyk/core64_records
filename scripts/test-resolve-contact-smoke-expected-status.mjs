#!/usr/bin/env node

import { resolveContactSmokeExpectedStatus } from "./resolve-contact-smoke-expected-status.mjs";

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const disabledCase = resolveContactSmokeExpectedStatus({
    explicitExpectedStatus: "",
    settings: {
      contactCaptchaEnabled: false,
      contactCaptchaActiveProvider: "none"
    },
    captchaToken: ""
  });
  expect(disabledCase.expectedStatus === 201, "captcha-disabled: expected 201");
  expect(disabledCase.source === "captcha_disabled", "captcha-disabled: source mismatch");
  expect(disabledCase.captchaMode.active === false, "captcha-disabled: active should be false");

  const enabledMissingTokenCase = resolveContactSmokeExpectedStatus({
    explicitExpectedStatus: null,
    settings: {
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "hcaptcha"
    },
    captchaToken: ""
  });
  expect(enabledMissingTokenCase.expectedStatus === 400, "captcha-enabled-missing-token: expected 400");
  expect(enabledMissingTokenCase.source === "captcha_enabled_missing_token", "captcha-enabled-missing-token: source mismatch");
  expect(enabledMissingTokenCase.captchaMode.active === true, "captcha-enabled-missing-token: active should be true");

  const enabledWithTokenCase = resolveContactSmokeExpectedStatus({
    explicitExpectedStatus: undefined,
    settings: {
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "recaptcha_v2"
    },
    captchaToken: "token-123"
  });
  expect(enabledWithTokenCase.expectedStatus === 201, "captcha-enabled-with-token: expected 201");
  expect(enabledWithTokenCase.source === "captcha_enabled_with_token", "captcha-enabled-with-token: source mismatch");
  expect(enabledWithTokenCase.captchaMode.hasToken === true, "captcha-enabled-with-token: token flag mismatch");

  const explicitOverrideCase = resolveContactSmokeExpectedStatus({
    explicitExpectedStatus: "202",
    settings: {
      contactCaptchaEnabled: true,
      contactCaptchaActiveProvider: "hcaptcha"
    },
    captchaToken: ""
  });
  expect(explicitOverrideCase.expectedStatus === 202, "explicit-override: expected 202");
  expect(explicitOverrideCase.source === "explicit_override", "explicit-override: source mismatch");

  console.log("resolve-contact-smoke-expected-status self-test PASSED");
}

main();
