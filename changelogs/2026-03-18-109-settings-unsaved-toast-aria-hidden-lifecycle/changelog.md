# Changelog - 2026-03-18 - Settings unsaved toast aria-hidden lifecycle

Toast керувався класом hidden, але без явного перемикання aria-hidden під час show/hide.
У прихованому стані семантика для assistive tech була менш однозначною.

Файл: admin.html

- Для контейнера toast додано початковий `aria-hidden="true"`.

Файл: admin.js

- У `processSettingsUnsavedToastQueue()` при показі toast додається `aria-hidden="false"`.
- У `finalizeSettingsUnsavedToastDisplay()` при приховуванні toast встановлюється `aria-hidden="true"`.

Видимий і прихований стани toast тепер узгоджені не лише візуально, а й семантично.
Краще очікувана поведінка для скрінрідерів при динамічному показі/приховуванні повідомлень.
Без змін у черзі, таймерах і клавіатурних сценаріях.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
