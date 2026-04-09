# 2026-04-09-23 Mandatory Contact Smoke CAPTCHA-aware

## Як було

- Contact smoke у `scripts/smoke-check.mjs` був optional і за замовчуванням вимкнений.
- Local/CI pre-release gate не перевіряли contact endpoint у стандартному дефолтному контурі.
- Для середовищ з увімкненою CAPTCHA не було детермінованого auto-очікування `201/400`, що ускладнювало стабільний smoke policy.

## Що зроблено

- Додано helper `scripts/resolve-contact-smoke-expected-status.mjs` для резолву contact expected status:
  - підтримка explicit override через `CORE64_SMOKE_CONTACT_EXPECTED_STATUS`;
  - auto-режим залежно від `contactCaptchaEnabled`, `contactCaptchaActiveProvider` та наявності `CORE64_SMOKE_CONTACT_CAPTCHA_TOKEN`.
- Додано self-test `scripts/test-resolve-contact-smoke-expected-status.mjs`.
- Оновлено `scripts/smoke-check.mjs`:
  - `CORE64_SMOKE_CONTACT` увімкнений за замовчуванням;
  - expected status резолвиться CAPTCHA-aware helper'ом;
  - для expected `400` додано додаткову перевірку наявності `details.fieldErrors.captchaToken`.
- Оновлено local gate `scripts/pre-release-gate-local.ps1`:
  - дефолт `Core64SmokeContact` змінено на `$true`;
  - додано крок self-test `test-resolve-contact-smoke-expected-status.mjs`;
  - оновлено нумерацію кроків gate.
- Оновлено CI gate `.github/workflows/pre-release-gate.yml`:
  - default input `core64_smoke_contact` змінено на `"true"`;
  - додано крок `Validate contact smoke expectation helper`.
- Оновлено `RELEASE_RUNBOOK.md`:
  - contact smoke позначений як mandatory-by-default;
  - описано CAPTCHA-aware expected status policy та emergency opt-out.

## Що покращило/виправило/додало

- Contact endpoint тепер входить у стандартний release smoke контур без ручного вмикання.
- Smoke-поведінка стала детермінованою для CAPTCHA-enabled і CAPTCHA-disabled режимів.
- Local і CI gate синхронізовано по однаковій contact smoke policy та self-test покриттю.
