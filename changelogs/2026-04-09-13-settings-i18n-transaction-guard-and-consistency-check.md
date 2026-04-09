# 2026-04-09-13 Settings i18n Transaction Guard And Consistency Check

## Як було
- `saveSettings` виконував `upsertAdminSettings` напряму через `pool` без окремої транзакції, тому при частковій помилці був ризик дрейфу між `settings` та `settings_i18n`.
- `upsertSettingsHeroSubtitles` робив upsert у `settings_i18n`, але без явної post-перевірки, що обидві мови (`uk`, `en`) реально присутні після save.
- У локальному pre-release gate не було окремого кроку швидкої перевірки консистентності полів settings між admin-read і public-read.

## Що зроблено
- У [backend/src/db/repository.js](backend/src/db/repository.js) додано `verifySettingsI18nLanguages(...)` для post-check присутності мовних рядків у `settings_i18n`.
- Оновлено `upsertSettingsHeroSubtitles(...)`:
  - додано перевірку `uk`/`en` після upsert;
  - додано сумісний fallback без `hero_subtitle` для legacy-схеми (коли колонка ще відсутня).
- Оновлено `saveSettings(...)` у [backend/src/db/repository.js](backend/src/db/repository.js):
  - тепер використовує `pool.connect()` + `BEGIN/COMMIT/ROLLBACK`, щоб прибрати ризик часткового запису.
- Додано новий helper-скрипт [scripts/check-settings-i18n-consistency.mjs](scripts/check-settings-i18n-consistency.mjs):
  - логіниться як адмін;
  - порівнює критичні поля `title/about/mission`, captcha-меседжі та hero subtitle між `GET /settings` і `GET /public?lang=uk|en`;
  - формує JSON-звіт і повертає non-zero exit code при розбіжностях.
- Додано npm-скрипт у [package.json](package.json):
  - `consistency-check:settings-i18n`.
- Оновлено [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1):
  - додано крок `[8/9] Running settings i18n consistency check...` перед branch-protection перевіркою.

## Що покращило/виправило/додало
- Посилено інваріант атомарності для `saveSettings`: запис у `settings` та синхронізація `settings_i18n` тепер захищені транзакційним контуром.
- Додано явний guard проти «тихого» дрейфу мовних рядків у `settings_i18n`.
- Локальний release-gate тепер перевіряє консистентність settings/public на окремому кроці, що зменшує ризик непомітних регресій перед релізом.
