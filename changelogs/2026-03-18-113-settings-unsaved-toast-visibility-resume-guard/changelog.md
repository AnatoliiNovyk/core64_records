# Changelog - 2026-03-18 - Settings unsaved toast visibility resume guard

## Як було
- На `visibilitychange` при поверненні у вкладку таймер toast відновлювався без перевірки, чи саме `visibilitychange` поставив його на паузу.
- Це могло знімати паузу, активовану іншими механізмами (hover/focus/touch).

## Що зроблено
- Файл: admin.js
  - Додано прапорець `settingsUnsavedToastPausedByVisibility`.
  - У `handleSettingsUnsavedToastVisibilityChange()`:
    - при `document.hidden` зберігається факт, чи таймер був активний;
    - при поверненні resume виконується лише якщо пауза була ініційована саме visibility-обробником.
  - У `finalizeSettingsUnsavedToastDisplay()` додано скидання `settingsUnsavedToastPausedByVisibility`.

## Що покращило
- `visibilitychange` більше не ламає паузи з інших джерел.
- Узгоджена поведінка між pause-on-hover/focus/touch, window-blur та visibility.
- Менше випадкових автозакриттів після повернення у вкладку.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
