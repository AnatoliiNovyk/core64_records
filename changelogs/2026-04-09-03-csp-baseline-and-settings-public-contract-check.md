# 2026-04-09-03 CSP Baseline And Settings Public Contract Check

## Як було

- У backend security middleware не було `Content-Security-Policy`, тому браузер не отримував єдиного policy baseline для публічної та адмін-сторінок.
- Не було окремого standalone контрактного тесту саме для сценарію `save settings -> public readback` по полях `about`/`mission`.
- У root `package.json` не було окремої команди для запуску такого контрактного тесту.
- У контрактному скрипті відновлення (`restore`) не впливало явно на фінальний `passed`-статус у випадку невдалого rollback.

## Що зроблено

- У `backend/src/middleware/security.js` додано `Content-Security-Policy` з сумісним baseline-набором директив для поточного стеку:
  - базові захисні директиви (`default-src`, `base-uri`, `form-action`, `frame-ancestors`, `object-src`);
  - дозволи для поточних CDN/шрифтів (`cdn.tailwindcss.com`, `unpkg.com`, `fonts.googleapis.com`, `fonts.gstatic.com`);
  - сумісність із captcha-сценаріями (`js.hcaptcha.com`, `hcaptcha.com`, `*.hcaptcha.com`, `www.google.com`, `www.gstatic.com`) через `script-src`, `connect-src`, `frame-src`.
- Додано standalone скрипт `scripts/settings-public-contract-check.mjs`:
  - логін адміна;
  - читання поточних settings;
  - запис marker-значень `about`/`mission`;
  - перевірка відображення в `GET /api/public?lang=uk` і `GET /api/public?lang=en`;
  - обов'язкове відновлення початкових settings у `finally`.
- Підсилено надійність контрактного скрипта:
  - `checks.restore` тепер завжди заповнюється (`ok/status` або `skipped`);
  - при невдалому restore скрипт ставить `report.passed = false`.
- У root `package.json` додано npm команду:
  - `contract-check:settings-public` -> `node scripts/settings-public-contract-check.mjs`.
- Проведено валідацію:
  - diagnostics для змінених файлів — без помилок;
  - `npm run contract-check:settings-public` — passed;
  - `node scripts/smoke-check.mjs` — passed;
  - `npm run ui-smoke` — passed.

## Що покращило/виправило/додало

- Додано єдиний CSP baseline для всіх HTTP-відповідей, що підвищує базовий рівень browser-side hardening без великого фронтенд-рефакторингу.
- Закрито окремим автоматизованим тестом критичний контракт `settings -> public` для `about/mission`, що зменшує ризик повторної регресії sync-проблем.
- Додано прямий і швидкий шлях локальної перевірки через npm script, без ручних ad-hoc запитів.
- Посилено гарантію чистого стану після тесту: невдалий rollback більше не проходить тихо і тепер явно фейлить перевірку.
