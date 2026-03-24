# Changelog - 2026-03-18 - Settings unsaved toast tabindex lifecycle

Toast мав постійний `tabindex="0"`, незалежно від того, прихований він чи показаний.
Це не ідеально узгоджувалось із hidden/a11y-lifecycle у сценаріях клавіатурної навігації.

Файл: admin.html

- Початковий стан toast змінено на `tabindex="-1"` (разом із `aria-hidden="true"`).

Файл: admin.js

- У `processSettingsUnsavedToastQueue()` при показі toast встановлюється `tabindex="0"`.
- У `finalizeSettingsUnsavedToastDisplay()` при приховуванні toast встановлюється `tabindex="-1"`.

Фокусованість toast тепер синхронізована з видимістю.
Прихований toast не бере участь у фокус-циклі, видимий лишається доступним з клавіатури.
Поведінка сумісна з попередніми змінами aria-hidden і dismiss-логікою.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
