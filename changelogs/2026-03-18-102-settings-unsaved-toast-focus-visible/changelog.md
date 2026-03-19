# Changelog - 2026-03-18 - Settings unsaved toast focus-visible

## Як було
- `settings-unsaved` toast і кнопка закриття були фокусовані, але без виразного `focus-visible` індикатора.
- При клавіатурній навігації межі фокусу були менш помітні.

## Що зроблено
- Файл: `admin.html`
  - Для контейнера `#settings-unsaved-toast` додано `focus-visible`-стилі (ring + offset).
  - Для кнопки закриття toast додано `focus-visible`-стилі (ring + offset).

## Що покращило
- Клавіатурна навігація стала наочнішою.
- Підвищено a11y без змін у бізнес-логіці toast/черги.

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
