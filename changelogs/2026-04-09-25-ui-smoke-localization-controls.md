# 2026-04-09-25 UI Smoke Localization Controls

## Як було

- `scripts/ui-smoke.mjs` перевіряв порядок секцій і settings persistence, але не валідовував language switcher labels.
- Regression на підписах `UK/EN` могла пройти непоміченою в automated UI smoke.
- Кастомний file-picker у contact формі не мав e2e перевірки локалізованих текстів і відображення selected filename.

## Що зроблено

- Розширено `scripts/ui-smoke.mjs`:
  - додано helper `buildPublicUrlWithLanguage` для перевірок `lang=uk` і `lang=en`;
  - додано перевірку language switcher labels (`desktop` і `mobile`) на `UK/EN`;
  - додано перевірку локалізованих текстів кастомного file-picker:
    - `Вибрати файл / Файл не вибрано` для `uk`;
    - `Choose file / No file chosen` для `en`;
  - додано сценарій `setInputFiles` і перевірку, що selected filename (`demo-test.wav`) відображається у кастомному статусі.
- Додано деталізовані fail-діагностики для локалізаційних перевірок у UI smoke report.

## Що покращило/виправило/додало

- UI smoke тепер покриває локалізаційні regression-и у ключовому публічному UX-контурі.
- Знижено ризик повторного повернення багів із неправильними language labels і file-picker текстами.
- Збільшено довіру до release gate за рахунок перевірки не тільки data-flow, а й локалізованих UI контролів.
