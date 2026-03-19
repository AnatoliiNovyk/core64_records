# Changelog - 2026-03-18 - Settings unsaved toast touch pause/resume

## Як було
- Пауза автозакриття toast працювала на hover/focus, але не мала окремих touch-хуків.
- На мобільних під час дотику таймер міг продовжуватися без явної touch-синхронізації.

## Що зроблено
- Файл: `admin.html`
  - Для `#settings-unsaved-toast` додано touch-події:
    - `ontouchstart="pauseSettingsUnsavedToastAutoClose()"`
    - `ontouchend="resumeSettingsUnsavedToastAutoClose()"`
    - `ontouchcancel="resumeSettingsUnsavedToastAutoClose()"`

## Що покращило
- Краще мобільне UX: toast не зникає під час активної взаємодії пальцем.
- Поведінка pause/resume стала консистентною між desktop (hover/focus) і mobile (touch).
- Бізнес-логіка queue/timer не змінена, лише розширено канали взаємодії.

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
