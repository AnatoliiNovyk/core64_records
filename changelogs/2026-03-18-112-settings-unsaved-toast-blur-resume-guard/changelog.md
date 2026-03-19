# Changelog - 2026-03-18 - Settings unsaved toast blur resume guard

## Як було
- Після додавання `window blur/focus` таймер toast відновлювався на `focus` без перевірки джерела паузи.
- Це могло знімати паузу, яку користувач тримав через hover/focus/touch сценарій.

## Що зроблено
- Файл: admin.js
  - Додано прапорець стану: `settingsUnsavedToastPausedByWindowBlur`.
  - У `handleSettingsUnsavedToastWindowBlur()` фіксується, чи був активний таймер на момент blur.
  - У `handleSettingsUnsavedToastWindowFocus()` відновлення відбувається лише якщо пауза була ініційована саме blur (`settingsUnsavedToastPausedByWindowBlur === true`).
  - У `finalizeSettingsUnsavedToastDisplay()` прапорець скидається.

## Що покращило
- `focus` більше не "примусово" відновлює таймер, якщо пауза була викликана іншим механізмом.
- Сумісна взаємодія між pause-on-hover/focus/touch і pause-on-window-blur.
- Стабільніша поведінка автозакриття в реальних multi-window сценаріях.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
