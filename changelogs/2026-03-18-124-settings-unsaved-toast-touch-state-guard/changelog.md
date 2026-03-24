# Changelog - 2026-03-18 - Settings unsaved toast touch-state guard

Touch-події toast напряму викликали pause/resume без окремого стану активного дотику.
Сторонні resume-тригери могли відновити таймер під час активної touch-взаємодії.

Файл: admin.js

- Додано стан `settingsUnsavedToastTouchActive`.
- Додано хендлери:
- `handleSettingsUnsavedToastTouchStart()`
- `handleSettingsUnsavedToastTouchEnd()`
- `handleSettingsUnsavedToastTouchCancel()`
- У `resumeSettingsUnsavedToastAutoClose()` додано guard: поки `settingsUnsavedToastTouchActive === true`, `resume` не виконується.
- У `finalizeSettingsUnsavedToastDisplay()` скидається `settingsUnsavedToastTouchActive`.

Файл: admin.html

- `ontouchstart/ontouchend/ontouchcancel` переведено на нові handler-функції.

Стабільніша pause/resume поведінка для mobile/touch сценаріїв.
Менше передчасних відновлень таймера під час взаємодії пальцем.
Узгодженіша state-модель між pointer/keyboard/touch джерелами.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
