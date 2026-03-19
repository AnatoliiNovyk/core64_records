# Changelog - 2026-03-18 - Settings unsaved modal accessibility

## Що зроблено
- Покращено доступність кастомного modal незбережених змін у `settings`:
  - закриття по `Esc`;
  - focus trap по `Tab`/`Shift+Tab` всередині modal;
  - повернення фокусу на попередній елемент після закриття.
- Заблоковано обробку audit shortcut (`Ctrl/Cmd+R`) поки modal відкритий, щоб уникнути конфлікту гарячих клавіш.

## Технічні зміни
- Файл: `admin.js`
  - Додано змінну:
    - `settingsUnsavedModalPreviousFocus`
  - Додано helper-и:
    - `isSettingsUnsavedModalOpen()`
    - `getSettingsUnsavedModalFocusableElements()`
    - `handleSettingsUnsavedModalKeyboard(event)`
  - Оновлено `showSettingsUnsavedNavigationModal()`:
    - зберігає попередній фокус перед відкриттям.
  - Оновлено `resolveSettingsUnsavedNavigation(action)`:
    - відновлює фокус після закриття modal.
  - У `DOMContentLoaded` додано listener:
    - `document.addEventListener("keydown", handleSettingsUnsavedModalKeyboard)`
  - Оновлено `handleAuditKeyboardShortcuts(event)`:
    - ігнорує shortcut, якщо modal відкритий.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Modal незбережених змін став помітно більш дружнім до keyboard-only та assistive-користувачів.
- Зменшено ризик випадкових дій у фоні під час відкритого modal.
