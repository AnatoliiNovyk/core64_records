# Changelog #171: Primary-click guard for unsaved modal backdrop handler

`handleSettingsUnsavedBackdropClick(event)` закривав модалку на click по backdrop без перевірки `defaultPrevented` та типу кнопки.
Теоретично це допускало небажаний cancel при non-primary/службових кліках.

У `handleSettingsUnsavedBackdropClick(event)` додано early-return guard-и:

- `if (!event || event.defaultPrevented) return;`
- `if (typeof event.button === "number" && event.button !== 0) return;`

Основна логіка закриття по кліку на backdrop (`id === "settings-unsaved-modal"`) лишилась без змін.

Надійніше й передбачуваніше закриття модалки тільки на первинний клік по фону.
Менше ризику випадкового cancel через вторинні/нетипові click-сценарії.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function handleSettingsUnsavedBackdropClick(event)` присутня
- guard-и `event.defaultPrevented` та `event.button !== 0` присутні в обробнику

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
