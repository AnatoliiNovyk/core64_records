# Changelog - 2026-03-18 - Settings unsaved toast resume source guard

Після кроків із `blur` і `visibilitychange` існувала можливість, що загальні події (`mouseleave`, `focusout`, `touchend`) викличуть `resume` під час активної паузи від цих джерел.
Це створювало ризик передчасного відновлення таймера.

Файл: admin.js

- У `resumeSettingsUnsavedToastAutoClose()` додано guard:
- якщо активний `settingsUnsavedToastPausedByWindowBlur` або `settingsUnsavedToastPausedByVisibility`, `resume` не виконується.

Пауза від `blur`/`visibilitychange` стала пріоритетною і не перебивається сторонніми resume-подіями.
Узгоджена багатоджерельна модель pause/resume для toast.
Менше ризику непередбачуваного автозакриття.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
