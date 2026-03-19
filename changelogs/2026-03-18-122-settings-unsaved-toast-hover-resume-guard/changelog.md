# Changelog - 2026-03-18 - Settings unsaved toast hover resume guard

## Як було
- `resumeSettingsUnsavedToastAutoClose()` міг відновити таймер через непрямі resume-тригери, навіть коли курсор ще був над toast.
- Це створювало ризик передчасного автозакриття у змішаних pointer/focus сценаріях.

## Що зроблено
- Файл: admin.js
  - У `resumeSettingsUnsavedToastAutoClose()` додано hover-guard:
    - якщо `#settings-unsaved-toast` у стані `:hover`, `resume` не виконується.

## Що покращило
- Поки користувач тримає курсор над toast, таймер стабільно лишається на паузі.
- Менше передчасних resume при комбінації hover + інші події (`focusout`, `touchend`, тощо).
- Узгодженіша поведінка pause/resume для pointer-взаємодії.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
