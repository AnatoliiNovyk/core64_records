# Changelog - 2026-03-18 - Settings unsaved toast key repeat guard

## Як було
- `dismissSettingsUnsavedToast(event)` обробляв `keydown` для Enter/Space/Escape.
- При утриманні клавіші браузер міг генерувати повторні keydown (`event.repeat`), що створювало зайві обробки події.

## Що зроблено
- Файл: `admin.js`
  - У `dismissSettingsUnsavedToast(event)` додано ранній вихід для `event.repeat`.
  - Логіка валідних клавіш (Enter/Space/Escape) лишилась без змін.

## Що покращило
- Стабільніша клавіатурна взаємодія з toast при утриманні клавіш.
- Менше шуму від повторних keydown-подій, без впливу на основний UX.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
