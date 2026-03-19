# Changelog - 2026-03-18 - Settings unsaved toast aria-keyshortcuts

## Як було
- Toast і кнопка закриття підтримували клавіатурні дії, але ці шорткати не були явно задекларовані через `aria-keyshortcuts`.

## Що зроблено
- Файл: `admin.html`
  - Для `#settings-unsaved-toast` додано `aria-keyshortcuts="Enter Space Escape"`.
  - Для кнопки закриття toast додано `aria-keyshortcuts="Enter Space"`.

## Що покращило
- Assistive technology отримує явну інформацію про доступні клавіші взаємодії.
- Підвищено discoverability keyboard-controls без змін логіки toast.

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
