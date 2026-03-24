# Changelog - 2026-03-18 - Settings unsaved toast deferred schedule guard

`scheduleSettingsUnsavedToastAutoClose()` одразу стартував таймер після показу toast.
Якщо toast показувався під час неактивного документа (hidden/unfocused), таймер міг почати спливати до повернення користувача.

Файл: admin.js

- У `scheduleSettingsUnsavedToastAutoClose()` додано deferred-guard:
- якщо `document.hidden`, таймер не запускається, зберігається remaining і виставляється pause-state для visibility;
- якщо документ не у фокусі (`document.hasFocus() === false`), таймер не запускається, зберігається remaining і виставляється pause-state для window blur.
- У нормальному активному стані таймер стартує як раніше.

Toast не "старіє" у фоні, коли користувач не бачить сторінку.
Більш передбачуваний час відображення після повернення у вкладку/вікно.
Узгоджено з поточними pause-source guard (`blur`/`visibilitychange`).

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
