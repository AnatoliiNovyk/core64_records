# Changelog - 2026-03-18 - Settings unsaved toast focus-inside resume guard

## Як було
- `resumeSettingsUnsavedToastAutoClose()` міг відновити таймер після `mouseleave`/`touchend`, навіть якщо фокус клавіатури ще був усередині toast.
- Це могло скорочувати час взаємодії для keyboard-сценарію.

## Що зроблено
- Файл: admin.js
  - У `resumeSettingsUnsavedToastAutoClose()` додано interaction-guard:
    - якщо `document.activeElement` знаходиться всередині `#settings-unsaved-toast`, `resume` не виконується.

## Що покращило
- Hover/touch події більше не перебивають pause, коли користувач ще працює з toast через клавіатуру.
- Узгодженіша поведінка між pointer- і keyboard-взаємодіями.
- Менше шансів передчасного автозакриття під час фокусованого стану toast.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
