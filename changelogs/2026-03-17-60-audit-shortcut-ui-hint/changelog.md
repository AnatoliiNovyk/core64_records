# Changelog - 2026-03-17 - Audit shortcut UI hint

## Що зроблено
- Додано видиму UI-підказку про гарячу клавішу швидкого оновлення в секції аудиту.
- Підказка тепер платформо-залежна:
  - macOS: `Cmd+R`
  - Windows/Linux: `Ctrl+R`

## Технічні зміни
- Файл: `admin.html`
  - Додано елемент `#audit-shortcut-hint` у блоці статусів аудиту.

- Файл: `admin.js`
  - Додано функцію `updateAuditShortcutHint()` для визначення платформи і підстановки правильного модифікатора (`Cmd` або `Ctrl`).
  - Виклик `updateAuditShortcutHint()` додано в `DOMContentLoaded`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Гаряча клавіша оновлення аудиту стала більш discoverable для користувача прямо в UI без додаткових пояснень.