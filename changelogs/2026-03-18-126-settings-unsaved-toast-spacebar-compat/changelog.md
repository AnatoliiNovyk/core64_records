# Changelog - 2026-03-18 - Settings unsaved toast Spacebar compatibility

## Як було
- Dismiss-логіка toast перевіряла пробіл лише як `event.key === " "`.
- У частині старіших браузерів/движків пробіл приходить як `"Spacebar"`, що могло ламати keyboard-dismiss сценарій.

## Що зроблено
- Файл: admin.js
  - У `dismissSettingsUnsavedToast(event)` додано `isSpace` з підтримкою обох варіантів: `" "` і `"Spacebar"`.
  - У `handleSettingsUnsavedToastCloseButtonKeydown(event)` додано аналогічний `isSpace` для сумісної обробки.

## Що покращило
- Клавіатурне закриття toast пробілом стало більш сумісним між браузерами.
- Зменшено ризик edge-case, коли Space не спрацьовував через відмінність key-значення.
- Логіка Enter/Escape лишилась без змін.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
