# 2026-04-09-16 Settings Normalization Centralization And Escape Drift Fix

## Як було
- Нормалізація settings URL-полів була дубльована окремо в [admin.js](admin.js) та [app.js](app.js), що створювало ризик дрейфу логіки.
- У [admin.js](admin.js) `saveSettings(...)` відправляв `title/about/mission/email` через `sanitizeInput(...)`, тобто HTML-escape застосовувався до payload до API-збереження.
- Через це текстові поля могли накопичувати HTML entities (`&amp;...`) у даних, замість зберігання нормалізованого plain text.

## Що зроблено
- У [data-adapter.js](data-adapter.js) додано та експортовано shared helpers:
  - `decodeHtmlEntities(...)`;
  - `normalizeSettingsPlainText(...)`;
  - `normalizeSettingsUrl(...)`;
  - `normalizeSettingsHostname(...)`.
- У [admin.js](admin.js):
  - `decodeHtmlEntities`, `normalizeSettingsUrlInput`, `normalizeSettingsPlainText`, `normalizeSettingsHostname` тепер пріоритетно використовують відповідні adapter-методи з fallback на локальну логіку;
  - `loadSettings(...)` для `title/about/mission/email` тепер декодує entities при заповненні input'ів;
  - у `saveSettings(...)` для `title/about/mission/email` прибрано `sanitizeInput(...)` і замінено на `normalizeSettingsPlainText(...)`.
- У [app.js](app.js):
  - додано `getAdapterMethod(...)`;
  - `decodeHtmlEntities(...)` та `normalizeSocialUrl(...)` переведено на shared adapter normalizers з fallback.

## Що покращило/виправило/додало
- Прибрано ключове джерело escape-дрейфу для текстових settings-полів на шляху admin -> API.
- Нормалізація social URL стала централізованою між admin/public, що знижує ризик майбутніх розходжень.
- Дані settings у формах admin тепер стабільно показуються у декодованому вигляді, а збереження відбувається як plain text без зайвого HTML-escape.
