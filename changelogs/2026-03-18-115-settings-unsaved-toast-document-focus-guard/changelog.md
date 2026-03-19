# Changelog - 2026-03-18 - Settings unsaved toast document focus guard

## Як було
- `resumeSettingsUnsavedToastAutoClose()` уже враховував pause-прапорці від `blur`/`visibilitychange`, але не перевіряв фактичний фокус документа.
- У рідкісних edge-case подіях (наприклад, `mouseleave`/`touchend` під час неактивного вікна) можливе небажане відновлення таймера.

## Що зроблено
- Файл: admin.js
  - У `resumeSettingsUnsavedToastAutoClose()` додано guard:
    - якщо `document.hasFocus()` повертає `false`, `resume` не виконується.

## Що покращило
- Додатковий рівень захисту від передчасного автозакриття, коли вікно/документ неактивний.
- Стабільніша поведінка таймера у cross-window сценаріях.
- Сумісно з уже доданими pause-source guard для `blur` і `visibilitychange`.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
