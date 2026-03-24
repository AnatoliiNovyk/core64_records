# Changelog - 2026-03-18 - Settings unsaved toast visibility pause

Таймер автозакриття `settings-unsaved` toast не реагував на зміну видимості вкладки.
Якщо користувач перемикався на іншу вкладку, toast міг зникнути у фоні.

Файл: `admin.js`

- Додано `handleSettingsUnsavedToastVisibilityChange()`:
- при `document.hidden` викликає `pauseSettingsUnsavedToastAutoClose()`;
- при поверненні у вкладку викликає `resumeSettingsUnsavedToastAutoClose()`.
- Інтегровано виклик цього хелпера в `handleAuditVisibilityChange()` перед audit-логікою, щоб реакція на `visibilitychange` працювала для toast незалежно від секції.

Toast більше не «зникає у фоні» під час переключення вкладок.
Користувач повертається і бачить релевантне повідомлення, яке продовжує життєвий цикл коректно.
Збережено сумісність із попередніми механіками: pause/resume на hover/focus, manual dismiss, queue-priority, dedupe.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
