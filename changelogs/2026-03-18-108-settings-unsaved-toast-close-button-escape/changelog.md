# Changelog - 2026-03-18 - Settings unsaved toast close button Escape support

Кнопка закриття toast мала `onkeydown="event.stopPropagation()"`.
Коли фокус був на кнопці, клавіша Escape не доходила до логіки dismiss у контейнері toast.

Файл: admin.js

- Додано `handleSettingsUnsavedToastCloseButtonKeydown(event)`:
- Escape: викликає `dismissSettingsUnsavedToast(event)`.
- Enter/Space: лишає stopPropagation для уникнення дублюючого bubbling.

Файл: admin.html

- Кнопка закриття toast переведена на новий обробник:
- `onkeydown="handleSettingsUnsavedToastCloseButtonKeydown(event)"`
- Оновлено `aria-keyshortcuts` кнопки до `Enter Space Escape`.

Escape працює передбачувано навіть коли фокус стоїть на кнопці закриття toast.
Збережено попередній анти-дублюючий захист для Enter/Space.
Узгоджено клавіатурну модель контейнера і внутрішньої кнопки.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
