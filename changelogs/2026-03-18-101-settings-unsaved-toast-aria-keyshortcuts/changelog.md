# Changelog - 2026-03-18 - Settings unsaved toast aria-keyshortcuts

Toast і кнопка закриття підтримували клавіатурні дії, але ці шорткати не були явно задекларовані через `aria-keyshortcuts`.

Файл: `admin.html`

- Для `#settings-unsaved-toast` додано `aria-keyshortcuts="Enter Space Escape"`.
- Для кнопки закриття toast додано `aria-keyshortcuts="Enter Space"`.

Assistive technology отримує явну інформацію про доступні клавіші взаємодії.
Підвищено discoverability keyboard-controls без змін логіки toast.

Статичні перевірки:

- `admin.html`: без помилок
- `admin.js`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
