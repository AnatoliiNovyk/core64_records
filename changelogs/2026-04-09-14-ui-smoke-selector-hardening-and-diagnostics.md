# 2026-04-09-14 UI Smoke Selector Hardening And Diagnostics

## Як було
- У [scripts/ui-smoke.mjs](scripts/ui-smoke.mjs) переміщення секції `events` до початку списку використовувало хардкод на два кроки, що створювало крихкість при зміні початкового порядку.
- Перевірка порядку секцій/навігації на public-сторінці спиралась на менш стійкі припущення про структуру DOM (зокрема префіксний підхід для nav), через що було складніше уникати false-negative при валідному reorder.
- Повідомлення про падіння не завжди містили повний контекст expected/actual, що уповільнювало root-cause аналіз.

## Що зроблено
- Оновлено [scripts/ui-smoke.mjs](scripts/ui-smoke.mjs):
  - додано константу `MANAGED_SECTION_KEYS` і централізовані helper-и `failWithDetails`/`assertListEquals` для детермінованих перевірок з контекстом;
  - `openSettingsSection(...)` тепер чекає на наявність саме `events` і `sponsors` рядків, а не лише на мінімальну кількість дочірніх елементів;
  - `applyMutationViaUi(...)` переведено на динамічне переміщення `events` вгору на потрібну кількість кроків замість хардкоду;
  - `verifyPublicUi(...)` переписано на більш стійку перевірку:
    - фіксується фактичний state секцій (`exists/hidden/aria-hidden`),
    - порядок видимих керованих секцій порівнюється exact-match,
    - desktop/mobile nav порівнюються за видимим порядком саме керованих секцій,
    - для sponsors nav-link перевіряються `hidden`, `aria-hidden`, `tabindex` з деталізованими expected/actual в помилці.
- Проведено локальну валідацію після змін:
  - `node scripts/smoke-check.mjs`;
  - `npm run contract-check:settings-public`;
  - `npm run consistency-check:settings-i18n`;
  - `npm run ui-smoke`.

## Що покращило/виправило/додало
- UI smoke став менш залежним від випадкових змін стартового порядку секцій у формі налаштувань.
- Зменшено ризик false-negative у перевірках public/nav reorder за рахунок exact-порівняння релевантних даних замість крихких префіксних евристик.
- При падінні smoke тепер надається суттєво краща діагностика (structured details), що скорочує час на відтворення і виправлення регресій.
