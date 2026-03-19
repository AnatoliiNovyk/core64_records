# Changelog - 2026-03-18 - Settings unsaved toast manual dismiss

## Як було
- Поточний `settings-unsaved` toast зникав лише по таймеру.
- Якщо в черзі були наступні повідомлення, користувач не міг вручну прискорити їх показ.

## Що зроблено
- Файл: `admin.html`
  - Додано інтерактивність для `#settings-unsaved-toast`:
    - `onclick="dismissSettingsUnsavedToast(event)"`;
    - `onkeydown="dismissSettingsUnsavedToast(event)"`;
    - `tabindex="0"` для клавіатурного доступу;
    - `title` з підказкою про ручне закриття;
    - візуальний курсор `cursor-pointer`.
- Файл: `admin.js`
  - Додано `finalizeSettingsUnsavedToastDisplay()` як єдину точку завершення показу поточного toast.
  - Додано `dismissSettingsUnsavedToast(event)`:
    - підтримка миші (click);
    - підтримка клавіатури (Enter/Space);
    - ігнор інших клавіш.
  - Переведено автозакриття по таймеру на використання `finalizeSettingsUnsavedToastDisplay()`.

## Що покращило
- Користувач може пропустити поточний toast і швидше перейти до наступного в черзі.
- Поведінка закриття уніфікована: ручне та автоматичне закриття йдуть через один кодовий шлях.
- Збережено попередні гарантії: дедуплікація, пріоритет warn, queue-limit, лічильник `+N`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
