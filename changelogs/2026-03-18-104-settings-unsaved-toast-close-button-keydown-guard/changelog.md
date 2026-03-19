# Changelog - 2026-03-18 - Settings unsaved toast close button keydown guard

## Як було
- Кнопка закриття toast обробляла `click` з `stopPropagation`, але `keydown` на кнопці міг спливати до контейнера toast.
- Це могло призводити до дубль-обробки клавіатурної взаємодії контейнером.

## Що зроблено
- Файл: `admin.html`
  - Для кнопки закриття в `#settings-unsaved-toast` додано:
    - `onkeydown="event.stopPropagation()"`

## Що покращило
- Усунуто зайве спливання keyboard-подій від кнопки до контейнера toast.
- Клавіатурна взаємодія стала чистішою і передбачуванішою.
- Поточна функціональність закриття не змінена (click/Enter/Space/Escape працюють як і раніше).

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
