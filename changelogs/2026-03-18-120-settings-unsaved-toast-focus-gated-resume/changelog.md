# Changelog - 2026-03-18 - Settings unsaved toast focus-gated resume

## Як було
- У сценарії `visibilitychange -> visible` подія могла спрацювати до фактичного фокусу документа.
- Visibility-прапорець скидався завчасно, `resume` не стартував через `document.hasFocus() === false`, і toast міг залишитися без автопродовження.

## Що зроблено
- Файл: admin.js
  - У `handleSettingsUnsavedToastVisibilityChange()` додано фокус-гард перед скиданням `settingsUnsavedToastPausedByVisibility`.
  - У `handleSettingsUnsavedToastWindowFocus()` додано аналогічний фокус-гард перед скиданням `settingsUnsavedToastPausedByWindowBlur`.

## Що покращило
- Pause-прапорці не скидаються передчасно до моменту реального фокусу.
- Відновлення таймера після повернення у вкладку/вікно стало стабільнішим.
- Усунено edge-case "завислого" стану без auto-resume після background.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
