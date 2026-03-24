# Changelog - 2026-03-18 - Settings unsaved toast ARIA reset on finalize

Під час показу `warn`-toast елемент переходив у `role="alert"` та `aria-live="assertive"`.
Після закриття toast ці ARIA-атрибути могли залишатись у «підвищеному» режимі до наступного показу.

Файл: `admin.js`

- У `finalizeSettingsUnsavedToastDisplay()` додано нормалізацію ARIA-стану прихованого toast:
- `role` скидається на `status`;
- `aria-live` скидається на `polite`.

Прихований toast повертається у базовий, менш агресивний ARIA-режим.
Зменшено ризик небажаного «stale semantics» між послідовними повідомленнями.
Поточна поведінка видимих повідомлень не змінена (адаптивний пріоритет за тоном зберігається).

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
